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

if (prod) {
  console.log(`${fallos ? 'FAIL' : 'OK'} producción: ${fallos} fallos`)
  process.exit(fallos ? 1 : 0)
}

check('Cache-Control con max-age=300', /max-age=300/.test(res.headers.get('cache-control') ?? ''), res.headers.get('cache-control') ?? '')

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

const fotoPrueba = wp('post', 'list', '--post_type=attachment', '--meta_key=jw_prueba', '--meta_value=foto', '--field=ID')
const fotoId = Number(fotoPrueba.stdout?.trim().split('\n')[0])
const clave = wp('user', 'application-password', 'create', 'admin', 'jw-check', '--porcelain')
const contrasena = clave.stdout?.trim()
check('contraseña de aplicación creada para el admin local', clave.status === 0 && Boolean(contrasena), clave.stderr ?? '')
check('existe la foto de prueba', Number.isInteger(fotoId) && fotoId > 0, fotoPrueba.stdout ?? '')

let creadoId = 0
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
} finally {
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
