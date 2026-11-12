import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const prod = args.includes('--prod')
const base = (args.find((a) => !a.startsWith('--')) ?? '').replace(/\/$/, '')
if (!base) {
  console.error('Uso: node scripts/check-wp.mjs <baseUrl> [--prod]')
  process.exit(2)
}

const CARGOS = ['presidencia', 'vicepresidencia', 'tesoreria', 'secretaria', 'fiscalia', 'conciliacion', 'delegacion', 'coordinacion', 'otro']
const ESTADOS = [
  { valor: 'planificacion', nombre: 'En planificación' },
  { valor: 'progreso', nombre: 'En progreso' },
  { valor: 'completado', nombre: 'Completado' },
  { valor: 'suspendido', nombre: 'Suspendido' },
]
const TIPOS = [
  { valor: 'ordinaria', nombre: 'Comisiones de trabajo' },
  { valor: 'accidental', nombre: 'Comisiones accidentales' },
  { valor: 'iniciativa', nombre: 'Nuevas iniciativas' },
  { valor: 'organo', nombre: 'Órganos de la Junta' },
]
const ESTADOS_COMISION = [
  { valor: 'activa', nombre: 'Activa' },
  { valor: 'sin-coordinacion', nombre: 'Sin coordinación' },
  { valor: 'conformacion', nombre: 'En conformación' },
  { valor: 'verificar', nombre: 'Pendiente de verificar' },
]
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
let fallos = 0

function check(nombre, ok, detalle = '') {
  if (!ok) fallos++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${nombre}${!ok && detalle ? `: ${detalle}` : ''}`)
}

const mismasLlaves = (obj, llaves) =>
  obj !== null &&
  typeof obj === 'object' &&
  JSON.stringify(Object.keys(obj).sort()) === JSON.stringify([...llaves].sort())

function llavesProhibidas(valor, ruta = '$') {
  if (Array.isArray(valor)) return valor.flatMap((v, i) => llavesProhibidas(v, `${ruta}[${i}]`))
  if (valor && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([k, v]) => [
      ...(/author|autor|email|correo|user|usuario|telefono|phone/i.test(k) ? [`${ruta}.${k}`] : []),
      ...llavesProhibidas(v, `${ruta}.${k}`),
    ])
  }
  return []
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

async function pedir(ruta, opciones = {}) {
  for (let intento = 1; intento <= 3; intento++) {
    let res
    try {
      res = await fetch(`${base}${ruta}`, opciones)
    } catch (e) {
      // Apache cierra la conexión reutilizada durante las pausas de wp-cli; se reintenta con una nueva.
      if (e.cause?.code === 'UND_ERR_SOCKET' && intento < 3) continue
      throw e
    }
    const texto = await res.text()
    const reto =
      (res.headers.get('content-type') ?? '').includes('text/html') &&
      (texto.includes('One moment, please') || texto.includes('Un momento'))
    if (!reto) return { res, texto }
    if (intento < 3) await espera(10_000)
  }
  console.error(`Reto anti-bot del hosting en ${base}${ruta}. Reintenta más tarde o desde otra red.`)
  process.exit(3)
}

const { res, texto: cuerpo } = await pedir('/wp-json/jac-web/v1/dignatarios')
check('status 200', res.status === 200, String(res.status))
check('content type JSON', (res.headers.get('content-type') ?? '').includes('application/json'))

let data = {}
try {
  data = JSON.parse(cuerpo)
} catch {}
check('una sola llave de primer nivel: periodos', mismasLlaves(data, ['periodos']), Object.keys(data).join(','))

const periodos = Array.isArray(data.periodos) ? data.periodos : []
const prohibidas = llavesProhibidas(data)
check('ninguna llave de autor, correo, usuario o teléfono', prohibidas.length === 0, prohibidas.join(','))

const inicio = (p) => Number(String(p.periodo).slice(0, 4))
check(
  'períodos del más nuevo al más antiguo',
  periodos.every((p, i) => /^\d{4}-\d{4}$/.test(p.periodo) && (i === 0 || inicio(periodos[i - 1]) > inicio(p))),
  periodos.map((p) => p.periodo).join(','),
)

const todos = periodos.flatMap((p) => (Array.isArray(p.dignatarios) ? p.dignatarios : []))
check(
  'cada dignatario tiene exactamente las llaves del contrato',
  todos.every((d) => mismasLlaves(d, ['id', 'nombre', 'cargo', 'cargo_nombre', 'detalle', 'foto']) && CARGOS.includes(d.cargo)),
)
check(
  'cargos en el orden de la lista dentro de cada período',
  periodos.every((p) => p.dignatarios.every((d, i) => i === 0 || CARGOS.indexOf(p.dignatarios[i - 1].cargo) <= CARGOS.indexOf(d.cargo))),
)
check(
  'cada foto es null o tiene url, ancho y alto',
  todos.every(
    (d) =>
      d.foto === null ||
      (mismasLlaves(d.foto, ['url', 'ancho', 'alto']) &&
        typeof d.foto.url === 'string' &&
        d.foto.url.startsWith('http') &&
        d.foto.ancho > 0 &&
        d.foto.alto > 0),
  ),
)

const { res: tipoRest, texto: tipoCuerpo } = await pedir('/wp-json/wp/v2/jw_dignatario')
check('/wp-json/wp/v2/jw_dignatario anónimo: 200 JSON', tipoRest.status === 200 && (tipoRest.headers.get('content-type') ?? '').includes('application/json'), String(tipoRest.status))
let tipoDatos = null
try {
  tipoDatos = JSON.parse(tipoCuerpo)
} catch {}
const prohibidasRest = llavesProhibidas(tipoDatos)
check('/wp-json/wp/v2/jw_dignatario anónimo: ninguna llave de autor, correo, usuario o teléfono', tipoDatos !== null && prohibidasRest.length === 0, prohibidasRest.join(','))

const { res: crearAnonimo } = await pedir('/wp-json/wp/v2/jw_dignatario', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Anónimo', status: 'publish' }),
})
check('/wp-json/wp/v2/jw_dignatario anónimo: POST da 401', crearAnonimo.status === 401, String(crearAnonimo.status))

const { res: resProyectos, texto: cuerpoProyectos } = await pedir('/wp-json/jac-web/v1/proyectos')
check('proyectos: status 200', resProyectos.status === 200, String(resProyectos.status))
let datosProyectos = {}
try {
  datosProyectos = JSON.parse(cuerpoProyectos)
} catch {}
check('proyectos: llaves de primer nivel estados y proyectos', mismasLlaves(datosProyectos, ['estados', 'proyectos']), Object.keys(datosProyectos).join(','))
check('proyectos: lista de estados exacta', JSON.stringify(datosProyectos.estados) === JSON.stringify(ESTADOS), JSON.stringify(datosProyectos.estados))
const proyectos = Array.isArray(datosProyectos.proyectos) ? datosProyectos.proyectos : []
const prohibidasProyectos = llavesProhibidas(datosProyectos)
check('proyectos: ninguna llave de autor, correo, usuario o teléfono', prohibidasProyectos.length === 0, prohibidasProyectos.join(','))
const LLAVES_PROYECTO = ['slug', 'titulo', 'resumen', 'estado', 'avance', 'inicio', 'fin', 'presupuesto', 'ubicacion', 'participantes', 'aliados', 'categorias', 'imagen', 'contenido']
check(
  'proyectos: cada proyecto tiene exactamente las llaves del contrato',
  proyectos.every(
    (p) =>
      mismasLlaves(p, LLAVES_PROYECTO) &&
      mismasLlaves(p.presupuesto, ['total', 'ejecutado']) &&
      Array.isArray(p.categorias) &&
      p.categorias.every((c) => mismasLlaves(c, ['slug', 'nombre'])) &&
      (p.imagen === null || mismasLlaves(p.imagen, ['url', 'ancho', 'alto'])),
  ),
)
check(
  'proyectos: estado válido, avance de 0 a 100 y fechas vacías o AAAA-MM-DD',
  proyectos.every(
    (p) =>
      ESTADOS.some((e) => e.valor === p.estado) &&
      typeof p.ubicacion === 'string' &&
      Number.isInteger(p.participantes) &&
      p.participantes >= 0 &&
      Number.isInteger(p.avance) &&
      p.avance >= 0 &&
      p.avance <= 100 &&
      [p.inicio, p.fin].every((f) => f === '' || /^\d{4}-\d{2}-\d{2}$/.test(f)),
  ),
)

const { res: crearProyectoAnonimo } = await pedir('/wp-json/wp/v2/jw_proyecto', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Anónimo', status: 'publish' }),
})
check('/wp-json/wp/v2/jw_proyecto anónimo: POST da 401', crearProyectoAnonimo.status === 401, String(crearProyectoAnonimo.status))

const { res: resComisiones, texto: cuerpoComisiones } = await pedir('/wp-json/jac-web/v1/comisiones')
check('comisiones: status 200', resComisiones.status === 200, String(resComisiones.status))
let datosComisiones = {}
try {
  datosComisiones = JSON.parse(cuerpoComisiones)
} catch {}
check('comisiones: llaves de primer nivel tipos, estados y comisiones', mismasLlaves(datosComisiones, ['tipos', 'estados', 'comisiones']), Object.keys(datosComisiones).join(','))
check('comisiones: lista de tipos exacta', JSON.stringify(datosComisiones.tipos) === JSON.stringify(TIPOS), JSON.stringify(datosComisiones.tipos))
check('comisiones: lista de estados exacta', JSON.stringify(datosComisiones.estados) === JSON.stringify(ESTADOS_COMISION), JSON.stringify(datosComisiones.estados))
const comisiones = Array.isArray(datosComisiones.comisiones) ? datosComisiones.comisiones : []
const prohibidasComisiones = llavesProhibidas(datosComisiones)
check('comisiones: ninguna llave de autor, correo, usuario o teléfono', prohibidasComisiones.length === 0, prohibidasComisiones.join(','))
check(
  'comisiones: cada comisión tiene exactamente las llaves del contrato, con tipo y estado válidos',
  comisiones.every(
    (c) =>
      mismasLlaves(c, ['slug', 'nombre', 'nombre_corto', 'tipo', 'estado', 'fundamento', 'resumen', 'contenido']) &&
      TIPOS.some((t) => t.valor === c.tipo) &&
      ESTADOS_COMISION.some((e) => e.valor === c.estado),
  ),
)

const { res: crearComisionAnonimo } = await pedir('/wp-json/wp/v2/jw_comision', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Anónimo', status: 'publish' }),
})
check('/wp-json/wp/v2/jw_comision anónimo: POST da 401', crearComisionAnonimo.status === 401, String(crearComisionAnonimo.status))

if (prod) {
  console.log(`${fallos ? 'FAIL' : 'OK'} producción: ${fallos} fallos`)
  process.exit(fallos ? 1 : 0)
}

check('Cache-Control con max-age=300', /max-age=300/.test(res.headers.get('cache-control') ?? ''), res.headers.get('cache-control') ?? '')

check('proyectos: Cache-Control con max-age=300', /max-age=300/.test(resProyectos.headers.get('cache-control') ?? ''), resProyectos.headers.get('cache-control') ?? '')
check('proyectos: no aparece el borrador', !proyectos.some((p) => p.titulo === 'Proyecto de prueba Borrador'))
check(
  'proyectos: orden por Orden y título',
  proyectos.map((p) => p.titulo.replace('Proyecto de prueba ', '')).join(',') === 'Parque,Huerta,Cancha',
  proyectos.map((p) => p.titulo).join(','),
)
const parque = proyectos.find((p) => p.slug === 'proyecto-de-prueba-parque')
check(
  'proyectos: el parque trae sus campos, categoría, imagen y contenido',
  parque?.estado === 'progreso' &&
    parque.avance === 60 &&
    parque.inicio === '2024-03-01' &&
    parque.fin === '2024-12-31' &&
    parque.presupuesto.total === 120000000 &&
    parque.presupuesto.ejecutado === 72000000 &&
    parque.ubicacion === 'Vereda de prueba' &&
    parque.participantes === 45 &&
    parque.aliados === 'Aliado de prueba Uno, Aliado de prueba Dos' &&
    JSON.stringify(parque.categorias) === JSON.stringify([{ slug: 'obras-de-prueba', nombre: 'Obras de prueba' }]) &&
    parque.imagen !== null &&
    parque.contenido.includes('<p>'),
  JSON.stringify(parque),
)
const sinDatos = proyectos.find((p) => p.slug === 'proyecto-de-prueba-huerta')
check('proyectos: la huerta no tiene fin ni presupuesto', sinDatos?.fin === '' && sinDatos.presupuesto.total === 0 && sinDatos.imagen === null, JSON.stringify(sinDatos))
const cancha = proyectos.find((p) => p.slug === 'proyecto-de-prueba-cancha')
check('proyectos: la cancha no tiene ubicación ni participantes', cancha?.ubicacion === '' && cancha.participantes === 0, JSON.stringify(cancha))
check('proyectos: tres proyectos en tres estados', proyectos.length === 3 && new Set(proyectos.map((p) => p.estado)).size === 3, String(proyectos.length))

check('comisiones: Cache-Control con max-age=300', /max-age=300/.test(resComisiones.headers.get('cache-control') ?? ''), resComisiones.headers.get('cache-control') ?? '')
check('comisiones: no aparece el borrador', !comisiones.some((c) => c.nombre === 'Comisión de prueba Borrador'))
check(
  'comisiones: orden por Orden y título',
  comisiones.map((c) => c.slug).join(',') === 'comision-de-prueba-accidental,comision-de-prueba-iniciativa,comision-de-prueba-ordinaria,organo-de-prueba',
  comisiones.map((c) => c.slug).join(','),
)
check(
  'comisiones: cuatro comisiones, cada una de un tipo y un estado distinto',
  comisiones.length === 4 && new Set(comisiones.map((c) => c.tipo)).size === 4 && new Set(comisiones.map((c) => c.estado)).size === 4,
  String(comisiones.length),
)
const ordinaria = comisiones.find((c) => c.slug === 'comision-de-prueba-ordinaria')
check(
  'comisiones: la ordinaria trae sus campos y contenido',
  ordinaria?.nombre === 'Comisión de prueba Ordinaria' &&
    ordinaria.nombre_corto === 'Ordinaria de prueba' &&
    ordinaria.tipo === 'ordinaria' &&
    ordinaria.estado === 'activa' &&
    ordinaria.fundamento === 'Estatutos de prueba, art. 1' &&
    ordinaria.resumen === 'Resumen de prueba de Comisión de prueba Ordinaria.' &&
    ordinaria.contenido.includes('<p>'),
  JSON.stringify(ordinaria),
)
const sinFundamento = comisiones.find((c) => c.slug === 'comision-de-prueba-accidental')
check('comisiones: la accidental no tiene fundamento', sinFundamento?.fundamento === '', JSON.stringify(sinFundamento))

const nombres = todos.map((d) => d.nombre)
for (const excluido of ['Borrador', 'Sin período', 'Protegida']) {
  check(`no aparece "Persona de prueba ${excluido}"`, !nombres.includes(`Persona de prueba ${excluido}`))
}
check('2018-2022 no aparece en periodos', !periodos.some((p) => p.periodo === '2018-2022'))
check('2026-2030 va primero y 2022-2026 después', periodos.map((p) => p.periodo).join(',') === '2026-2030,2022-2026', periodos.map((p) => p.periodo).join(','))

const vigente = periodos.find((p) => p.periodo === '2026-2030')?.dignatarios ?? []
check(
  'orden de 2026-2030 por cargo, Orden y nombre',
  vigente.map((d) => d.nombre.replace('Persona de prueba ', '')).join(',') === 'Uno,Dos,Siete,Tres,Ocho,Cinco,Cuatro,Seis',
  vigente.map((d) => d.nombre).join(','),
)
const otro = vigente.find((d) => d.cargo === 'otro')
check('otro: el detalle pasa a cargo_nombre y detalle queda vacío', otro?.cargo_nombre === 'Comisión de salud' && otro?.detalle === '', JSON.stringify(otro))
const suplente = vigente.find((d) => d.nombre.endsWith('Dos'))
check('detalle Suplente se conserva junto al cargo', suplente?.cargo_nombre === 'Vicepresidencia' && suplente?.detalle === 'Suplente', JSON.stringify(suplente))
const conFoto = todos.filter((d) => d.foto !== null)
check('exactamente una foto no nula', conFoto.length === 1, String(conFoto.length))

const { res: frente, texto: htmlFrente } = await pedir('/?post_type=jw_dignatario')
check('?post_type=jw_dignatario no lista dignatarios', !/Persona de prueba/.test(htmlFrente), String(frente.status))

const wp = (...argv) =>
  spawnSync('docker', ['compose', '-f', 'wordpress/compose.yml', 'run', '--rm', '-T', 'wpcli', 'wp', ...argv], {
    cwd: raiz,
    encoding: 'utf8',
  })

const editor = wp('eval', "echo use_block_editor_for_post_type('jw_dignatario') ? 'si' : 'no';")
check('jw_dignatario usa el editor clásico', editor.stdout?.trim() === 'no', (editor.stdout ?? '') + (editor.stderr ?? ''))

const divi = wp(
  'eval',
  "echo wp_json_encode([jw_ocultar_project_divi(['show_ui' => true, 'show_in_menu' => true, 'show_in_nav_menus' => true, 'show_in_rest' => true, 'public' => true], 'project'), jw_ocultar_project_divi(['show_ui' => true], 'post')]);",
)
let hechos = []
try {
  hechos = JSON.parse(divi.stdout)
} catch {}
check(
  'el filtro oculta el project de Divi y no toca otros tipos',
  hechos[0]?.show_ui === false &&
    hechos[0].show_in_menu === false &&
    hechos[0].show_in_nav_menus === false &&
    hechos[0].show_in_rest === false &&
    hechos[0].public === true &&
    hechos[1]?.show_ui === true,
  divi.stdout ?? '',
)

const categoriaAvances = (slug, raizSlug = 'proyectos') => {
  const salida = wp(
    'eval',
    `$t = get_terms(['taxonomy' => 'category', 'slug' => '${slug}', 'hide_empty' => false]); $p = get_term_by('slug', '${raizSlug}', 'category'); echo wp_json_encode(['n' => count($t), 'padre' => $t ? $t[0]->parent : -1, 'raiz' => $p ? $p->term_id : -2]);`,
  )
  try {
    return JSON.parse(salida.stdout)
  } catch {
    return { n: -1, padre: -1, raiz: -2 }
  }
}
const avancesParque = categoriaAvances('proyecto-de-prueba-parque')
check('categoría de avances del parque: una sola, hija de proyectos', avancesParque.n === 1 && avancesParque.padre === avancesParque.raiz, JSON.stringify(avancesParque))
check('el borrador no crea categoría de avances', categoriaAvances('proyecto-de-prueba-borrador').n === 0)
const categoriaComision = categoriaAvances('comision-de-prueba-ordinaria', 'comisiones')
check('categoría de la comisión ordinaria: una sola, hija de comisiones', categoriaComision.n === 1 && categoriaComision.padre === categoriaComision.raiz, JSON.stringify(categoriaComision))
check('el borrador de comisión no crea categoría', categoriaAvances('comision-de-prueba-borrador', 'comisiones').n === 0)

const fotoPrueba = wp('post', 'list', '--post_type=attachment', '--meta_key=jw_prueba', '--meta_value=foto', '--field=ID')
const fotoId = Number(fotoPrueba.stdout?.trim().split('\n')[0])
const clave = wp('user', 'application-password', 'create', 'admin', 'jw-check', '--porcelain')
const contrasena = clave.stdout?.trim()
check('contraseña de aplicación creada para el admin local', clave.status === 0 && Boolean(contrasena), clave.stderr ?? '')
check('existe la foto de prueba', Number.isInteger(fotoId) && fotoId > 0, fotoPrueba.stdout ?? '')

let creadoId = 0
let proyectoId = 0
let comisionId = 0
try {
  const auth = { Authorization: `Basic ${Buffer.from(`admin:${contrasena}`).toString('base64')}`, 'Content-Type': 'application/json' }
  const { res: creado, texto: cuerpoCreado } = await pedir('/wp-json/wp/v2/jw_dignatario', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      title: 'Persona de prueba REST',
      status: 'publish',
      menu_order: 5,
      featured_media: fotoId,
      meta: { jw_periodo: '2026-2030', jw_cargo: 'tesoreria', jw_detalle: 'Prueba REST' },
    }),
  })
  check('autenticado: POST crea el dignatario (201)', creado.status === 201, `${creado.status} ${cuerpoCreado.slice(0, 200)}`)
  try {
    creadoId = JSON.parse(cuerpoCreado).id ?? 0
  } catch {}

  const { texto: cuerpoPublico } = await pedir('/wp-json/jac-web/v1/dignatarios')
  let publico = []
  try {
    publico = JSON.parse(cuerpoPublico).periodos
  } catch {}
  const creadoPublico = publico.flatMap((p) => p.dignatarios).find((d) => d.id === creadoId)
  check(
    'el dignatario creado por REST sale en jac-web/v1/dignatarios con sus campos y foto',
    creadoPublico?.nombre === 'Persona de prueba REST' &&
      creadoPublico.cargo === 'tesoreria' &&
      creadoPublico.detalle === 'Prueba REST' &&
      creadoPublico.foto !== null &&
      publico.find((p) => p.dignatarios.some((d) => d.id === creadoId))?.periodo === '2026-2030',
    JSON.stringify(creadoPublico),
  )

  const { res: proyectoCreado, texto: cuerpoProyecto } = await pedir('/wp-json/wp/v2/jw_proyecto', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      title: 'Proyecto de prueba REST',
      status: 'publish',
      excerpt: 'Resumen REST',
      content: '<p>Ficha REST</p>',
      menu_order: 9,
      featured_media: fotoId,
      meta: { jw_estado: 'completado', jw_avance: 150, jw_inicio: '2025-02-30', jw_presupuesto_total: 1000 },
    }),
  })
  check('autenticado: POST crea el proyecto (201)', proyectoCreado.status === 201, `${proyectoCreado.status} ${cuerpoProyecto.slice(0, 200)}`)
  try {
    proyectoId = JSON.parse(cuerpoProyecto).id ?? 0
  } catch {}

  const { texto: cuerpoProyectosNuevo } = await pedir('/wp-json/jac-web/v1/proyectos')
  let nuevos = []
  try {
    nuevos = JSON.parse(cuerpoProyectosNuevo).proyectos
  } catch {}
  const proyectoPublico = nuevos.find((p) => p.slug === 'proyecto-de-prueba-rest')
  check(
    'el proyecto creado por REST sale en jac-web/v1/proyectos, con avance acotado y fecha inválida vacía',
    proyectoPublico?.estado === 'completado' &&
      proyectoPublico.avance === 100 &&
      proyectoPublico.inicio === '' &&
      proyectoPublico.presupuesto.total === 1000 &&
      proyectoPublico.resumen === 'Resumen REST' &&
      proyectoPublico.imagen !== null,
    JSON.stringify(proyectoPublico),
  )
  // WordPress rechaza con 400 un texto en un campo entero, y el valor guardado no cambia.
  for (const [invalido, estadoEsperado, guardado] of [[-5, 200, 0], ['abc', 400, 7]]) {
    await pedir(`/wp-json/wp/v2/jw_proyecto/${proyectoId}`, { method: 'POST', headers: auth, body: JSON.stringify({ meta: { jw_participantes: 7 } }) })
    const { res: escrito, texto: cuerpoEscrito } = await pedir(`/wp-json/wp/v2/jw_proyecto/${proyectoId}`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ meta: { jw_participantes: invalido } }),
    })
    const { texto: cuerpoLeido } = await pedir('/wp-json/jac-web/v1/proyectos')
    let leido
    try {
      leido = JSON.parse(cuerpoLeido).proyectos.find((p) => p.slug === 'proyecto-de-prueba-rest')
    } catch {}
    check(`participantes ${JSON.stringify(invalido)} por REST: ${estadoEsperado} y queda en ${guardado}`, escrito.status === estadoEsperado && leido?.participantes === guardado, `${escrito.status} ${cuerpoEscrito.slice(0, 200)}`)
  }
  const avancesRest = categoriaAvances('proyecto-de-prueba-rest')
  check('publicar por REST crea la categoría de avances, hija de proyectos', avancesRest.n === 1 && avancesRest.padre === avancesRest.raiz, JSON.stringify(avancesRest))

  const { res: comisionCreada, texto: cuerpoComision } = await pedir('/wp-json/wp/v2/jw_comision', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      title: 'Comisión de prueba REST',
      status: 'publish',
      excerpt: 'Resumen REST',
      content: '<p>Funciones REST</p>',
      meta: { jw_tipo: 'inventado', jw_estado: 'inventado', jw_nombre_corto: 'x'.repeat(60), jw_fundamento: 'y'.repeat(100) },
    }),
  })
  check('autenticado: POST crea la comisión (201)', comisionCreada.status === 201, `${comisionCreada.status} ${cuerpoComision.slice(0, 200)}`)
  try {
    comisionId = JSON.parse(cuerpoComision).id ?? 0
  } catch {}
  const { texto: cuerpoComisionesNuevo } = await pedir('/wp-json/jac-web/v1/comisiones')
  let comisionesNuevas = []
  try {
    comisionesNuevas = JSON.parse(cuerpoComisionesNuevo).comisiones
  } catch {}
  const comisionPublica = comisionesNuevas.find((c) => c.slug === 'comision-de-prueba-rest')
  check(
    'la comisión creada por REST guarda tipo y estado por defecto y acota los textos',
    comisionPublica?.tipo === 'ordinaria' &&
      comisionPublica.estado === 'verificar' &&
      comisionPublica.nombre_corto.length === 40 &&
      comisionPublica.fundamento.length === 80 &&
      comisionPublica.resumen === 'Resumen REST',
    JSON.stringify(comisionPublica),
  )
  const categoriaRest = categoriaAvances('comision-de-prueba-rest', 'comisiones')
  check('publicar por REST crea la categoría de la comisión, hija de comisiones', categoriaRest.n === 1 && categoriaRest.padre === categoriaRest.raiz, JSON.stringify(categoriaRest))
} finally {
  if (comisionId) {
    const { res: borradaComision } = await pedir(`/wp-json/wp/v2/jw_comision/${comisionId}?force=true`, {
      method: 'DELETE',
      headers: { Authorization: `Basic ${Buffer.from(`admin:${contrasena}`).toString('base64')}` },
    })
    check('autenticado: DELETE ?force=true borra la comisión', borradaComision.status === 200, String(borradaComision.status))
  }
  wp('eval', "$t = get_term_by('slug', 'comision-de-prueba-rest', 'category'); if ($t) { wp_delete_term($t->term_id, 'category'); }")
  if (proyectoId) {
    const { res: borradoProyecto } = await pedir(`/wp-json/wp/v2/jw_proyecto/${proyectoId}?force=true`, {
      method: 'DELETE',
      headers: { Authorization: `Basic ${Buffer.from(`admin:${contrasena}`).toString('base64')}` },
    })
    check('autenticado: DELETE ?force=true borra el proyecto', borradoProyecto.status === 200, String(borradoProyecto.status))
  }
  wp('eval', "$t = get_term_by('slug', 'proyecto-de-prueba-rest', 'category'); if ($t) { wp_delete_term($t->term_id, 'category'); }")
  if (creadoId) {
    const { res: borrado } = await pedir(`/wp-json/wp/v2/jw_dignatario/${creadoId}?force=true`, {
      method: 'DELETE',
      headers: { Authorization: `Basic ${Buffer.from(`admin:${contrasena}`).toString('base64')}` },
    })
    check('autenticado: DELETE ?force=true borra el dignatario', borrado.status === 200, String(borrado.status))
  }
  const claves = JSON.parse(wp('user', 'application-password', 'list', 'admin', '--fields=uuid,name', '--format=json').stdout || '[]')
  for (const { uuid } of claves.filter((c) => c.name === 'jw-check')) wp('user', 'application-password', 'delete', 'admin', uuid)
}

const log = spawnSync('docker', ['compose', '-f', 'wordpress/compose.yml', 'exec', '-T', 'wordpress', 'cat', 'wp-content/debug.log'], {
  cwd: raiz,
  encoding: 'utf8',
})
const lineas = log.status === 0 ? (log.stdout ?? '').split('\n') : []
const delPlugin = lineas.filter((l) => /jac-el-castillo-web/.test(l))
check('debug.log sin líneas del plugin', delPlugin.length === 0, delPlugin.slice(0, 3).join(' | '))

console.log(`${fallos ? 'FAIL' : 'OK'} local: ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
