# Sitio web JAC El Castillo

Nueva interfaz del sitio de la Junta de Acción Comunal Ciudad Campestre El Castillo (Jamundí), hecha en Next.js. WordPress sigue siendo el CMS: la Junta publica en wp-admin como siempre, y esta app lee ese contenido por la API REST pública de WordPress y lo muestra con un diseño propio, más liviano y accesible.

**Estado:** prototipo para presentar a la Junta Directiva. Está publicado en https://web.jacelcastillo.com.co/ con `noindex`, así que no aparece en buscadores. El dominio `jacelcastillo.com.co` sigue sirviendo el WordPress actual.

## Cómo funciona

```
 Visitante
    │
    ▼
 Vercel: app Next.js (este repo)
    │  lee con fetch, sin credenciales, con caché de 5 minutos
    ▼
 WordPress en jacelcastillo.com.co
    ├─ /wp-json/wp/v2/posts        entradas (noticias)
    ├─ /wp-json/wp/v2/pages        páginas
    ├─ /wp-json/wp/v2/categories   categorías
    ├─ /wp-json/jac-web/v1/dignatarios   dignatarios de cada período (plugin propio)
    ├─ /wp-json/jac-web/v1/proyectos     proyectos con estado y categorías (plugin propio)
    ├─ /wp-json/jac-web/v1/comisiones    comisiones y órganos de la Junta (plugin propio)
    └─ /wp-content/uploads/...     imágenes (pasan por /_next/image)
```

- WordPress es la única fuente de contenido. La app nunca escribe en WordPress y no guarda ningún secreto: solo necesita la URL del sitio.
- Todo el HTML que llega de WordPress se limpia antes de mostrarse (ver [Limpieza del HTML](#limpieza-del-html)).
- Las imágenes de WordPress pasan por el optimizador de Next (`/_next/image`), que las convierte a WebP y las redimensiona según la pantalla.
- El build no llama a WordPress. Las páginas se generan en la primera visita y quedan en caché, así un WordPress lento no puede romper un despliegue.

## Stack

| Pieza | Versión | Para qué |
|---|---|---|
| Next.js (App Router) | 16.4 | Rutas, renderizado en servidor, caché e imágenes |
| React | 19.3 | Componentes |
| TypeScript | 5, modo estricto | Tipos de dominio, incluido el tipo `SafeHtml` |
| Tailwind CSS | 4, vía PostCSS | Estilos y tokens de diseño |
| sanitize-html | 2.18 | Lista blanca del HTML que llega de WordPress |
| pnpm | 10.28 | Gestor de paquetes (fijado en `packageManager`) |
| Node.js | 24 | Versión usada en desarrollo |

`sanitize-html` es la única dependencia de runtime además de Next y React. No hay librería de componentes, estado global ni GraphQL.

> Next.js 16 cambia APIs y convenciones respecto a versiones anteriores. Antes de escribir código, lee `AGENTS.md` y la guía correspondiente en `node_modules/next/dist/docs/`.

## Arranque local

```bash
corepack enable                 # activa la versión de pnpm fijada en package.json
pnpm install
echo 'WP_URL=https://jacelcastillo.com.co' > .env.local
pnpm dev                        # http://localhost:3000
```

Para probar como en producción:

```bash
pnpm build
pnpm start
```

### Variables de entorno

| Variable | Obligatoria | Ejemplo | Uso |
|---|---|---|---|
| `WP_URL` | Sí | `https://jacelcastillo.com.co` | Base de la API REST de WordPress. Sin ella, cualquier página que lea contenido falla con `WP_URL is not set`. |

Los archivos `.env*` están en `.gitignore`. En Vercel la variable se define en Settings → Environment Variables.

### Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build de producción |
| `pnpm lint` | ESLint, incluidas las reglas de capas de atomic design |
| `pnpm test` | Tests de `lib/` con `node --test`, sin framework |
| `pnpm check-urls <base>` | Recorre todas las URLs de WordPress contra la app y comprueba los códigos esperados |
| `pnpm exec tsc --noEmit` | Chequeo de tipos |
| `pnpm wp:up` | Levanta el WordPress local del plugin (http://localhost:8081) |
| `pnpm wp:setup` | Instala WordPress local, activa el plugin y carga datos de prueba ficticios (se puede repetir) |
| `pnpm wp:check` | Comprueba las rutas de dignatarios, proyectos y comisiones contra el WordPress local. Con `node scripts/check-wp.mjs <url> --prod` solo lee |
| `pnpm wp:zip` | Genera `dist/jac-el-castillo-web.zip` |

## Estructura

```
app/                    rutas (App Router)
  layout.tsx            html, fuentes, header, footer, noindex
  page.tsx              inicio
  noticias/page.tsx     listado de entradas con filtro y paginación
  comisiones/page.tsx   comisiones y órganos de la Junta, en 4 secciones
  comisiones/[slug]/    ficha de la comisión con su rendición de cuentas
  proyectos/page.tsx    proyectos con filtros por categoría y estado
  proyectos/[slug]/     ficha del proyecto con sus avances
  contacto/page.tsx     contacto (estática)
  [...path]/page.tsx    cualquier entrada o página de WordPress, incluidas las páginas hijas
  robots.ts             Disallow: /
  globals.css           Tailwind, tokens (@theme) y utilidades propias
  favicon.ico, icon.png, apple-icon.png
components/
  atoms/                piezas mínimas: Button, Link, Logo, Tiles, Spinner, Prose...
  molecules/            NavLink, ContentCard, CategoryFilter, Pagination...
  organisms/            SiteHeader, SiteFooter, Hero, CardGrid, FeatureSplit...
  templates/            ContentTemplate, ListingTemplate, HomeTemplate
lib/
  cms/client.ts         wp(): la única función que habla HTTP con WordPress
  cms/content.ts        consultas y mapeo del JSON de WordPress a tipos de dominio
  cms/board.ts          getBoardMembers() y getCommissionTerms(): dignatarios de un período y de una comisión
  board.ts              toBoardTerms(), groupMembers() y commissionTerms(): validan y agrupan el JSON de dignatarios
  html.ts               clean(), text(), isSlug(), truncate()
  images.ts             optimizeImages(): imágenes del contenido por /_next/image
  listing.ts            validación de ?categoria, ?estado y ?page
  projects.ts           toProjectsPage(), filterProjects(), categoriesOf(), periodText(), participantsText(), formatCOP()
  cms/projects.ts       getProjectsPage(): proyectos y estados
  commissions.ts        toCommissionsPage(), commissionSections(), COMMISSION_TONES
  cms/commissions.ts    getCommissionsPage(): comisiones, tipos y estados
  redirects.ts          LEGACY_PATHS: rutas viejas de WordPress y su destino (next.config.ts y check-urls)
  paths.ts              pathOf(), pickByPath() y sortChildren(): rutas anidadas de páginas hijas
  site.ts               datos fijos: nombre, contacto, menú
  types.ts              tipos de dominio (Summary, Entry, SafeHtml...)
  *.test.ts             tests de lib/
public/brand/           copia local de la marca 2x2 (cropped-favicon.webp)
scripts/check-urls.mjs  verificación de URLs de punta a punta
scripts/check-wp.mjs    verificación de las rutas de dignatarios, proyectos y comisiones (local y --prod)
scripts/zip-plugin.sh   empaqueta el plugin en dist/
wordpress/              plugin jac-el-castillo-web, WordPress local y datos de prueba
```

## Rutas

| Ruta | Qué muestra | Cómo se genera |
|---|---|---|
| `/` | Hero con accesos a noticias y contacto, últimas 3 noticias, "Quiénes somos" (página `nosotros`) y "Rendición de cuentas" | En cada visita (`force-dynamic`), con los datos de WordPress en caché |
| `/noticias/` | Entradas, 9 por página. `?categoria=<slug>` filtra y `?page=<n>` pagina | En cada visita (lee `searchParams`), con datos en caché |
| `/comisiones/` | Comisiones y órganos de la Junta en 4 secciones, en el orden de `tipos`. Sin comisiones dice "No hay comisiones publicadas." | En cada visita (`force-dynamic`), con datos en caché |
| `/comisiones/<slug>/` | Ficha de la comisión: estado, fundamento, funciones, proyectos a su cargo (debajo de los integrantes) y rendición de cuentas (hasta 6 entradas de la categoría con el mismo slug) | ISR |
| `/proyectos/` | Proyectos con filtros `?categoria=<slug>` y `?estado=<valor>`. Un valor que no existe da 404 | En cada visita (`force-dynamic`), con datos en caché |
| `/proyectos/<slug>/` | Ficha del proyecto, con sus avances (hasta 6 entradas de la categoría con el mismo slug) | ISR |
| `/contacto/` | Datos de contacto de `lib/site.ts` | Estática, en el build |
| `/<ruta>/` | Cualquier entrada o página de WordPress en la ruta de su enlace (`link`), incluidas las páginas hijas (`/historia/2022-2026/`). Una página con páginas hijas las lista como tarjetas bajo su contenido. Una página cuyo slug es un período (`AAAA-AAAA`) muestra además sus Dignatarios, con un título por sección. Entrar a una página hija por su ruta plana redirige (308) a la anidada | ISR: se genera en la primera visita y se renueva cada 5 minutos |
| `/robots.txt` | `Disallow: /` mientras sea prototipo | Estática |

Las URLs terminan en `/` (`trailingSlash: true`), igual que en WordPress, para que las direcciones no cambien el día del cambio de dominio.

Si una entrada y una página tienen la misma ruta, `getEntryByPath` muestra la entrada. Las entradas siempre tienen una sola parte (`/<slug>/`); solo las páginas pueden anidarse, hasta 3 niveles.

## El backend: WordPress como CMS headless

### Qué se lee

| Endpoint | Parámetros que usa la app | Para qué |
|---|---|---|
| `/wp-json/wp/v2/posts` | `slug`, `page`, `per_page`, `categories`, `_fields`, `_embed=wp:featuredmedia,wp:term` | Noticias y entradas sueltas |
| `/wp-json/wp/v2/pages` | `slug` (uno o varios separados por coma), `per_page`, `_fields`, `_embed` | Páginas y "Quiénes somos" |
| `/wp-json/wp/v2/categories` | `per_page=100`, `_fields=id,slug,name,count` | Filtro de noticias |

La app pide siempre `_fields` explícitos y nunca pide el autor, así no expone usuarios de WordPress.

### El cliente: `wp()` en `lib/cms/client.ts`

- Arma la URL con `URL` y `URLSearchParams`, nunca concatenando texto del visitante.
- Corta la petición a los 15 segundos (`AbortSignal.timeout`).
- Cachea la respuesta 300 segundos con la etiqueta `wordpress` (`next: { revalidate: 300, tags: ["wordpress"] }`).
- Devuelve `null` si WordPress responde 404, o 400 con `rest_post_invalid_page_number` (una página de resultados que no existe). La ruta lo convierte en un 404 propio.
- Cualquier otro error lanza una excepción. Con ISR, si WordPress falla al renovar una página, el visitante sigue viendo la última versión buena.
- Lee el total de páginas de la cabecera `X-WP-TotalPages`.
- `wpRoute(ruta)` lee una ruta propia (`/wp-json/<ruta>`) con el mismo tiempo límite y caché. Un 404 da `null` (plugin sin instalar). Una respuesta que no es OK o no es JSON, como el reto anti-bot del hosting, lanza un error para que ISR conserve la última versión buena.

### Del JSON de WordPress a tipos de dominio: `lib/cms/content.ts`

| Función | Devuelve |
|---|---|
| `getEntryByPath(segmentos)` | `{ entry }` (título, extracto, imagen, fecha, categoría, HTML limpio y las páginas hijas), `{ redirect }` si la ruta plana corresponde a una única página hija, o `null` |
| `getPosts({ page, categoria, perPage })` | Una página de `Summary` y el total de páginas, o `null` si la categoría o la página no existen |
| `getLatest(count)` | Las últimas entradas |
| `getPagesBySlugs(slugs)` | Páginas en el orden pedido (WordPress no respeta el orden de la lista) |
| `getCategories()` | Categorías con entradas, ordenadas en español, sin "Sin categoría" (id 1) |

Los componentes nunca importan `lib/cms/` (lo prohíbe ESLint). Reciben tipos de dominio (`Summary`, `Entry`), así que cambiar de CMS solo toca esta carpeta.

Detalles que vienen de cómo guarda las cosas WordPress:

- La imagen de las tarjetas es la **imagen destacada**. Si una entrada no la tiene, la tarjeta muestra la marca 2x2.
- El extracto de las entradas es el de WordPress. El de las páginas se arma con los párrafos del HTML ya limpio, porque el extracto de WordPress trae textos de botones del tema.
- La categoría que se muestra es la primera que no sea "Sin categoría".

### Limpieza del HTML

`clean()` en `lib/html.ts` es la barrera contra contenido roto o malicioso. Es la única función que produce el tipo `SafeHtml`, y el átomo `Prose` solo acepta `SafeHtml`: el compilador impide pintar HTML de WordPress sin limpiar.

En orden, `clean()`:

1. Expande los módulos de Divi que guardan contenido en atributos de shortcode (miembros del equipo, imágenes y videos) y quita el resto de shortcodes `[et_pb_...]`, dejando su texto.
2. Pasa el resultado por `sanitize-html` con una lista blanca: texto, títulos `h2` a `h6` (los `h1` bajan a `h2`), listas, tablas, enlaces, imágenes, `figure`, `video` e `iframe`. Solo se permiten los esquemas `http`, `https`, `mailto` y `tel`.
3. Deja solo los `iframe` de Google Maps, con carga diferida. Los enlaces con `target="_blank"` reciben `rel="noopener noreferrer"`.
4. Quita párrafos y enlaces vacíos que dejan los constructores visuales.
5. Saca el enlace de las imágenes que enlazan a otra página, y deja los que enlazan a un archivo (por ejemplo, un PDF).
6. Quita el primer título si repite el título de la página.

Después, `optimizeImages()` en `lib/images.ts` reescribe las `<img>` que vienen de `/wp-content/uploads/` para que pasen por `/_next/image` con `srcset` y `sizes`. Todas menos la primera cargan en diferido, porque la primera puede ser el elemento principal de la página.

### Caché y tiempos de actualización

- Un cambio publicado en wp-admin aparece en la app unos 5 minutos después: la primera visita pasada esa ventana dispara la actualización y las siguientes ya ven el contenido nuevo.
- Todavía no hay revalidación inmediata por webhook (ver [Después del prototipo](#después-del-prototipo)).
- Ninguna ruta llama a WordPress durante el build. Para comprobarlo, el build tiene que pasar con un WordPress inexistente:

  ```bash
  WP_URL=http://127.0.0.1:9 pnpm build
  ```

### Qué tiene que saber quien publica en wp-admin

- **Noticias** son las entradas. Su slug es su URL (`/<slug>/`) y su imagen destacada es la de la tarjeta.
- **Páginas** se ven en la ruta de su enlace de WordPress (`/<slug>/`, o `/<padre>/<slug>/` si tienen página superior). "Quiénes somos" en el inicio lee la página con slug `nosotros`.
- **Páginas hijas:** se crean eligiendo la página superior en Atributos de página → Superior. La página superior las muestra como tarjetas bajo su contenido, ordenadas por el campo "Orden" (menor primero). Con el mismo orden, gana el slug mayor.
- **Nuestra historia** es la página `historia`. Cada período de la Junta es una página hija con slug `AAAA-AAAA` (por ejemplo `2026-2030`). La página lleva solo el texto de agradecimiento y su imagen destacada, que es la de la tarjeta. Las personas no van en el contenido de la página: se cargan en Dignatarios (ver [El plugin de WordPress](#el-plugin-de-wordpress)). El ítem "Dignatarios" del menú de la app apunta al período vigente y se cambia en `NAV` de `lib/site.ts` en cada período.
- **Comisiones:** son registros del plugin, no páginas (ver [Comisiones](#comisiones)). Las 9 páginas viejas de comités siguen en WordPress, pero la app las redirige (308) a su comisión según `LEGACY_PATHS` de `lib/redirects.ts`.
- **Menú:** el menú de WordPress no se lee, porque su endpoint REST exige iniciar sesión. El menú de la app vive en `NAV` de `lib/site.ts`.
- **Constructores visuales:** el texto y las imágenes de Divi y Elementor se ven bien. Los widgets interactivos (formularios, carruseles, botones del tema) no pasan la limpieza. Para contenido nuevo conviene el editor de bloques de WordPress.

## El plugin de WordPress

`wordpress/jac-el-castillo-web/` (en wp-admin: "JAC El Castillo · Sitio web") guarda el contenido del sitio que necesita campos propios, hoy los dignatarios de cada período, los proyectos y las comisiones, y lo publica por rutas REST de solo lectura. Es un plugin aparte del de gestión del riesgo porque ese es del micrositio de emergencias y tiene datos vivos.

### Instalarlo

1. Ejecuta `pnpm wp:zip`.
2. En wp-admin: Plugins → Añadir nuevo → Subir plugin → `dist/jac-el-castillo-web.zip` → Activar.
3. LiteSpeed Cache → Purgar todo.

Sin el plugin, la app no se rompe: la ruta da 404 y la página del período sale sin la grilla.

### Cómo carga la Junta los dignatarios

En <nombre del sitio> → Dignatarios → Añadir nuevo, una entrada por persona y período:

- **Título:** el nombre completo.
- **Imagen destacada:** la foto. Súbela solo con autorización de la persona. Sin foto se muestra la marca 2x2.
- **Período:** `AAAA-AAAA`, con el año final mayor que el inicial (por ejemplo `2026-2030`). Sin un período válido, la persona no se publica.
- **Cargo:** de una lista fija. El orden de la grilla es el de la lista: Presidencia, Vicepresidencia, Tesorería, Secretaría, Fiscalía, Comisión de convivencia y conciliación, Delegación ante Asocomunal, Coordinación de comisión de trabajo, Integrante de comisión de trabajo y Otro cargo.
- **Detalle:** texto opcional de hasta 80 caracteres, como "Suplente". Con Otro cargo, el detalle es el cargo que se muestra. Vacío y con una comisión que no es un órgano de la Junta, se muestra el nombre corto de la comisión (por ejemplo "Cultura").
- **Comisión u órgano:** la comisión o el órgano al que pertenece la persona, o Ninguna. Con eso sale en la ficha de la comisión, en "Integrantes AAAA-AAAA". Junta Directiva, Fiscalía y Convivencia muestran a sus integrantes porque se enlazan al órgano. Si la comisión no está publicada, el enlace no sale en el sitio.
- **Situación:** cómo ocupa el cargo. Por defecto es Elección del período. En el sitio solo salen Elección del período (sin nota), Ad hoc ("Ad hoc, desde mar 2027") y Elección en asamblea ("Elección en asamblea, desde jun 2027"). No aceptó el cargo, Renuncia y Reemplazo en asamblea sacan a la persona del sitio, y su historial queda solo en wp-admin.
- **Desde:** la fecha desde la que rige la situación: la resolución, el acta ad hoc, el acta de asamblea o la renuncia.
- **Orden** (caja Atributos): solo desempata a personas con el mismo cargo.

Cómo registra la Junta cada caso:

| Caso | Qué se hace |
|---|---|
| No acepta o renuncia | Situación "No aceptó el cargo" o "Renuncia", con Desde en la fecha. Si se nombra a alguien ad hoc, va en un registro nuevo con "Ad hoc", su Desde y el mismo Orden. |
| La asamblea ratifica al ad hoc | Su situación pasa a "Elección en asamblea" y Desde, a la fecha de la asamblea. |
| La asamblea cambia al ad hoc | El ad hoc pasa a "Reemplazo en asamblea". La persona elegida va en un registro nuevo con "Elección en asamblea". |

Cuando alguien sale, cambia también el estado de la comisión: el estado no se calcula.

**Secciones.** `/historia/<período>/` pinta un título por sección, en este orden y solo para las que tienen personas:

| Sección | Cargos |
|---|---|
| Junta directiva | Presidencia, Vicepresidencia, Tesorería, Secretaría |
| Órgano de control | Fiscalía |
| Convivencia y conciliación | Comisión de convivencia y conciliación |
| Delegación ante Asocomunal | Delegación ante Asocomunal (las suplencias llevan el detalle "Suplente") |
| Comisiones de trabajo | Coordinación e Integrante |
| Otros cargos | Otro cargo |

En la ficha de cada comisión, "Integrantes 2026-2030" y, debajo, "Integrantes 2022-2026" salen antes del texto de las funciones, solo para los períodos que tienen personas.

Los editores también pueden crear y editar dignatarios por la API REST de WordPress, en `/wp-json/wp/v2/jw_dignatario` (con sesión o contraseña de aplicación). Período, Cargo, Detalle, Comisión, Situación y Desde van dentro de `meta`: `jw_periodo`, `jw_cargo`, `jw_detalle`, `jw_comision` (slug), `jw_situacion` y `jw_desde`.

Para que un período se vea en el sitio nuevo, debe existir su página como hija de Nuestra historia, con el período como slug (por ejemplo `2026-2030`). Un borrador o una entrada con contraseña no se publica.

### Proyectos

Regla editorial: un **proyecto** lleva ficha, un **avance** es una entrada en la categoría del proyecto y una **actividad suelta** es solo una entrada.

En <nombre del sitio> → Proyectos → Añadir nuevo:

- **Título y contenido:** el nombre y la ficha (Editor clásico). El **resumen** es el extracto y la **portada** es la imagen destacada.
- **Categorías de proyecto:** casillas propias de los proyectos, que alimentan el filtro.
- **Datos del proyecto:** estado (En planificación, En progreso, Completado o Suspendido), avance de 0 a 100, fechas de inicio y fin opcionales, ubicación (hasta 80 caracteres), participantes (entero desde 0), presupuesto total y ejecutado en pesos enteros, aliados de hasta 300 caracteres y la **comisión responsable** (una de las comisiones publicadas, o Ninguna). La ficha del proyecto la muestra como "Responsable: <comisión>" con un enlace a la comisión, y la página de cada comisión lista sus proyectos con las mismas tarjetas de `/proyectos/`. Toda tarjeta muestra siempre las mismas filas: lo que no tiene dato dice "Por definir" (ubicación vacía, participantes 0, presupuesto total 0, aliados vacío), y el período se escribe según el estado, por ejemplo "Inicio por definir" o "En curso hasta dic 2024".
- **Orden:** menor primero, y luego por título.
- **Avances:** al publicar un proyecto se crea la categoría de entradas con su mismo slug, hija de la categoría `proyectos` si existe. Las entradas publicadas en ella salen como avances en la ficha.

El tipo `project` de Divi queda oculto. Un borrador o un proyecto con contraseña no se publica.

`GET /wp-json/jac-web/v1/proyectos`: pública, de solo lectura y con `Cache-Control: public, max-age=300`.

```json
{ "estados": [ { "valor": "planificacion", "nombre": "En planificación" } ],
  "proyectos": [ { "slug": "...", "titulo": "...", "resumen": "...", "estado": "progreso", "avance": 60,
    "inicio": "2024-03-01", "fin": "", "presupuesto": { "total": 0, "ejecutado": 0 },
    "ubicacion": "", "participantes": 0, "aliados": "",
    "categorias": [ { "slug": "obras", "nombre": "Obras" } ],
    "comision": { "slug": "cultura", "nombre": "Cultura" },
    "imagen": { "url": "...", "ancho": 800, "alto": 500 }, "contenido": "<p>...</p>" } ] }
```

`comision` es `null` si el proyecto no tiene comisión o la que eligió no está publicada. `nombre` es el nombre corto de la comisión.

### Comisiones

Una **comisión** es una comisión de trabajo, una comisión accidental, una nueva iniciativa o un órgano de la Junta. Todas comparten los mismos campos y se agrupan en secciones por su tipo.

En <nombre del sitio> → Comisiones → Añadir nueva:

- **Título:** el nombre estatutario. El **contenido** son las funciones (Editor clásico) y el **resumen** es el extracto.
- **Datos de la comisión:** nombre corto (hasta 40 caracteres, es el título de la tarjeta), sección, estado y fundamento (hasta 80 caracteres, por ejemplo "Estatutos, art. 58"; vacío, la ficha dice "Por verificar").
- **Secciones (tipos), en este orden:** Comisiones de trabajo, Comisiones accidentales, Nuevas iniciativas y Órganos de la Junta. Una sección sin comisiones no se muestra.
- **Estados:** Activa, Sin coordinación, En conformación y Pendiente de verificar. Se elige a mano y no se calcula. Cuando alguien sale, cambia también el estado de la comisión. Un valor inválido se guarda como `ordinaria` y `verificar`.
- **Orden** (caja Atributos): la posición dentro de su sección, menor primero y luego por título.
- **Rendición de cuentas:** al publicar una comisión se crea la categoría de entradas con su mismo slug, hija de la categoría `comisiones` si existe (si la categoría ya existe, se reutiliza). Las entradas publicadas en ella salen como "Rendición de cuentas" en la ficha, con el enlace "Ver todos" a Noticias.

Un borrador o una comisión con contraseña no se publica. El tipo no tiene URL propia en WordPress.

`GET /wp-json/jac-web/v1/comisiones`: pública, de solo lectura y con `Cache-Control: public, max-age=300`.

```json
{ "tipos": [ { "valor": "ordinaria", "nombre": "Comisiones de trabajo" } ],
  "estados": [ { "valor": "activa", "nombre": "Activa" } ],
  "comisiones": [ { "slug": "...", "nombre": "...", "nombre_corto": "...", "tipo": "ordinaria", "estado": "verificar",
    "fundamento": "Estatutos, art. 58", "resumen": "...", "contenido": "<p>...</p>" } ] }
```

#### Carga por script

Las 21 comisiones y órganos de los estatutos (junio de 2024) se cargan con `cargas/cargar-comisiones.js`. Esa carpeta no está en git, porque los scripts traen nombres reales. Flujo:

1. Subir el zip del plugin 0.6.0 (Reemplazar el actual) y purgar LiteSpeed.
2. En una página de wp-admin con la sesión iniciada, pegar el script en la consola del navegador. Con `APLICAR = false` solo lee y muestra una tabla con lo que haría.
3. Revisar la tabla y los estados de la lista `COMISIONES` del script. Con `APLICAR = true` crea la categoría Comisiones y las comisiones que falten. Es idempotente por slug: lo que ya existe se reutiliza.
4. Con `ACTUALIZAR = true` y `APLICAR = true`, las comisiones que ya existen reciben los campos que difieran (título, resumen, funciones, orden, nombre corto, sección y fundamento). El estado se fija solo al crear: después lo maneja la Junta en wp-admin. En simulación lista qué campos cambiarían en cada una.

Los dignatarios (2026-2030 y los coordinadores de 2022-2026) se cargan con `cargas/cargar-historia.js`, con el mismo flujo: simulación con `APLICAR = false`, y después `APLICAR = true`. Busca cada registro por período, cargo y título (el nombre o el nombre anterior), así que renombra los que ya existen sin duplicarlos. Con `ACTUALIZAR = true` corrige título, Orden, comisión y detalle. La situación, Desde y la foto se fijan solo al crear. Antes de aplicar, verifica que el plugin 0.6.0 esté activo y que existan las comisiones. Si falta alguna foto, no crea nada.

#### Qué dicen los estatutos

- El artículo 53 lista las funciones generales de los coordinadores de todas las comisiones de trabajo (convocar y presidir las reuniones, nombrar al secretario de la comisión, rendir informes a la Directiva y a la Asamblea, presentar el reglamento interno, hacer el empalme, entre otras). Valen para todas, así que no se repiten en cada ficha.
- El artículo 52 lista la Comisión de Derechos Humanos entre las comisiones posibles, pero ningún artículo define sus funciones. Por eso su ficha lo dice y queda como "Pendiente de verificar".
- El mismo artículo dice que el número, nombre y funciones de las comisiones los determina la asamblea general. Las comisiones que no están en los estatutos van en "Nuevas iniciativas", como Gestión del Riesgo.

### Probarlo en local

```bash
pnpm wp:up       # WordPress en http://localhost:8081 (admin / admin-local)
pnpm wp:setup    # instala, activa el plugin y carga datos de prueba ficticios
pnpm wp:check    # verifica la ruta y los casos borde
pnpm wp:zip      # genera dist/jac-el-castillo-web.zip
```

Para ver la app contra ese WordPress: `pnpm build` y `WP_URL=http://localhost:8081 pnpm start`. En local las fotos vienen de `localhost:8081`, que la app no admite como origen de imágenes, así que se ve la marca 2x2. La foto real se comprueba en producción.

### La ruta

`GET /wp-json/jac-web/v1/dignatarios`: pública, de solo lectura y con `Cache-Control: public, max-age=300`. Los períodos van del más nuevo al más antiguo, y dentro de cada uno, por cargo, después por Orden y después por nombre. Solo salen las situaciones Elección del período, Ad hoc y Elección en asamblea. Nunca salen autor, correo ni teléfono.

```json
{ "periodos": [ { "periodo": "2026-2030", "dignatarios": [
  { "id": 12, "nombre": "Persona de prueba Uno", "cargo": "coordinacion", "cargo_nombre": "Coordinación de comisión de trabajo",
    "detalle": "Cultura", "grupo": "Comisiones de trabajo", "comision": "cultura",
    "situacion": "ad-hoc", "situacion_nombre": "Ad hoc", "desde": "2027-03-01",
    "foto": { "url": "https://jacelcastillo.com.co/wp-content/uploads/...", "ancho": 683, "alto": 1024 } }
] } ] }
```

`grupo` es la sección del cargo. `comision` es el slug de la comisión u órgano, o vacío si no hay enlace o la comisión no está publicada. `situacion_nombre` va vacío para `eleccion`. `desde` va vacío o como AAAA-MM-DD.

`foto` es `null` si la persona no tiene imagen destacada. La app solo acepta fotos de `/wp-content/uploads/` del dominio de WordPress.

## Frontend

### Atomic design

Los componentes se importan en una sola dirección: `atoms ← molecules ← organisms ← templates ← app`. ESLint (`eslint.config.mjs`) falla si un nivel importa uno superior, si un componente importa `lib/cms/` o si importa algo de `app/`.

Cada página de `app/` hace tres cosas y nada más: valida la entrada, pide los datos y renderiza un template.

### Diseño

- Los colores salen de la marca de la Junta y viven como tokens en `@theme` de `app/globals.css` (`brand`, `leaf`, `sky`, `sun`, `flag-blue`, `flag-red`...). Ningún componente escribe un color en hexadecimal.
- Fuentes con `next/font`: Bricolage Grotesque para títulos y Atkinson Hyperlegible Next para texto.
- El logo (`atoms/Logo.tsx`) es la marca 2x2 en imagen más el texto del logo oficial escrito en HTML, para que se lea a cualquier tamaño.
- `atoms/Tiles.tsx` es la marca 2x2 abstracta: decora el hero y reemplaza las imágenes que faltan.

### Componentes cliente

Solo dos componentes corren en el navegador:

- `molecules/NavLink.tsx` marca la página actual y cierra el menú, que es un `popover` nativo.
- `atoms/Link.tsx` envuelve el `Link` de Next y, si una navegación tarda más de 200 ms, muestra un spinner con la marca 2x2. Todos los enlaces internos deben usar este átomo, no `next/link`.

> No agregues `loading.tsx`. Con un `loading.tsx`, Next empieza a responder con 200 antes de saber si la página existe, y los slugs inexistentes dejarían de dar 404.

### Tailwind

Tailwind va por `@tailwindcss/postcss` (`postcss.config.mjs`). El loader de Turbopack para Tailwind sirvió CSS viejo con la caché de build de Next 16, así que no se usa.

## Seguridad

- **Sin secretos.** La app solo conoce `WP_URL` y lee la API pública. No hay usuario, contraseña de aplicación ni token de WordPress, y ninguna variable usa `NEXT_PUBLIC_`.
- **Entrada validada antes de pedir datos.** `isSlug()` solo acepta `[a-z0-9-]`, y `parseListingQuery()` valida `?categoria` y `?page`. Una entrada mal formada da 404 sin llamar a WordPress.
- **HTML limpio y tipado** con `clean()` y `SafeHtml`.
- **Cabeceras** (`next.config.ts`): Content Security Policy, `X-Content-Type-Options: nosniff` y `Referrer-Policy`. `X-Powered-By` está apagado y Vercel agrega HSTS. La CSP solo permite imágenes y videos del dominio de WordPress y mapas de Google.
- **Optimizador de imágenes cerrado:** `remotePatterns` solo admite `https://jacelcastillo.com.co/wp-content/uploads/**`, así `/_next/image` no sirve de proxy abierto.
- **Fuera de buscadores** mientras sea prototipo: `noindex` en el layout y `Disallow: /` en `robots.txt`.
- **WordPress** tiene un plugin propio de seguridad, fuera de este repo, que oculta los usuarios en la API REST, redirige los archivos de autor y los quita del sitemap.

## Calidad y verificación

Antes de publicar un cambio:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
WP_URL=http://127.0.0.1:9 pnpm build   # el build no depende de WordPress
pnpm start                              # en otra terminal
pnpm check-urls http://localhost:3000
```

`check-urls` pide a WordPress la lista de todas las entradas, páginas, proyectos y comisiones, y comprueba que cada una responda 200 en la app, salvo las rutas de `LEGACY_PATHS`, que deben responder 308 hacia su destino. También comprueba que las rutas inválidas respondan 404 y que el optimizador rechace imágenes de otros dominios.

## Despliegue

- Vercel despliega solo con cada push a `main`. La única variable es `WP_URL`.
- El estado de un despliegue se puede ver sin la CLI de Vercel:

  ```bash
  gh api repos/<dueño>/<repo>/commits/<sha>/status --jq .state
  ```

- Para pasar el proyecto a una cuenta de la Junta: transferir el repo en GitHub, importarlo desde la cuenta de Vercel de la Junta con el mismo `WP_URL` y borrar el proyecto anterior. No hay datos que migrar.

## Limitaciones conocidas

- Los enlaces escritos dentro del contenido de WordPress apuntan a `jacelcastillo.com.co`, así que hoy abren el sitio viejo. Se resuelve con el cambio de dominio.
- El dominio de WordPress está escrito en `next.config.ts` (CSP y `remotePatterns`) y en `lib/images.ts`. Si WordPress cambia de dirección, hay que actualizar esos lugares además de `WP_URL`.
- No hay buscador ni formulario de contacto. El contacto es por correo, teléfono y WhatsApp.

## Después del prototipo

Cuando la Junta apruebe el cambio:

1. Pasar WordPress a un subdominio (por ejemplo `cms.`) con `WP_HOME` y `WP_SITEURL`, y apuntar el dominio principal a Vercel.
2. Actualizar `WP_URL` y el dominio en `next.config.ts` y `lib/images.ts`.
3. Redirigir las URLs viejas que ya no existen (`/enterate/`, `/category/...`).
4. Quitar `noindex` y `Disallow: /`, y agregar `sitemap.ts`, URL canónica y Open Graph.
5. Revalidación inmediata: un endpoint que reciba un aviso de WordPress al publicar y llame a `revalidateTag("wordpress")`.
6. Ocultar el frontend viejo de WordPress.

## Para quien mantenga el repo

- El repo es público: nunca subas secretos, contraseñas ni datos personales. Los secretos van solo en las variables de entorno de Vercel.
- Los tests usan datos ficticios.
- Mensajes de commit en el formato `tipo: descripción` (`feat:`, `fix:`, `perf:`, `docs:`).
