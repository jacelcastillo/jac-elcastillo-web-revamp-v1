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
    const res = await fetch(`${base}${ruta}`, opciones)
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

const { res: tipoRest } = await pedir('/wp-json/wp/v2/jw_dignatario')
check('/wp-json/wp/v2/jw_dignatario: 404', tipoRest.status === 404, String(tipoRest.status))

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

const log = spawnSync('docker', ['compose', '-f', 'wordpress/compose.yml', 'exec', '-T', 'wordpress', 'cat', 'wp-content/debug.log'], {
  cwd: raiz,
  encoding: 'utf8',
})
const lineas = log.status === 0 ? (log.stdout ?? '').split('\n') : []
const delPlugin = lineas.filter((l) => /jac-el-castillo-web/.test(l))
check('debug.log sin líneas del plugin', delPlugin.length === 0, delPlugin.slice(0, 3).join(' | '))

console.log(`${fallos ? 'FAIL' : 'OK'} local: ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
