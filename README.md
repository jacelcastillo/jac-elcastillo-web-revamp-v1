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

## Estructura

```
app/                    rutas (App Router)
  layout.tsx            html, fuentes, header, footer, noindex
  page.tsx              inicio
  noticias/page.tsx     listado de entradas con filtro y paginación
  comites/page.tsx      listado de comités
  contacto/page.tsx     contacto (estática)
  [slug]/page.tsx       cualquier entrada o página de WordPress
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
  html.ts               clean(), text(), isSlug(), truncate()
  images.ts             optimizeImages(): imágenes del contenido por /_next/image
  listing.ts            validación de ?categoria y ?page
  site.ts               datos fijos: nombre, contacto, menú, comités
  types.ts              tipos de dominio (Summary, Entry, SafeHtml...)
  *.test.ts             tests de lib/
public/brand/           copia local de la marca 2x2 (cropped-favicon.webp)
scripts/check-urls.mjs  verificación de URLs de punta a punta
```

## Rutas

| Ruta | Qué muestra | Cómo se genera |
|---|---|---|
| `/` | Hero con accesos a noticias y contacto, últimas 3 noticias, "Quiénes somos" (página `nosotros`) y "Rendición de cuentas" | En cada visita (`force-dynamic`), con los datos de WordPress en caché |
| `/noticias/` | Entradas, 9 por página. `?categoria=<slug>` filtra y `?page=<n>` pagina | En cada visita (lee `searchParams`), con datos en caché |
| `/comites/` | Las páginas listadas en `COMMITTEES` de `lib/site.ts` | En cada visita (`force-dynamic`), con datos en caché |
| `/contacto/` | Datos de contacto de `lib/site.ts` | Estática, en el build |
| `/<slug>/` | La entrada o página de WordPress con ese slug | ISR: se genera en la primera visita y se renueva cada 5 minutos |
| `/robots.txt` | `Disallow: /` mientras sea prototipo | Estática |

Las URLs terminan en `/` (`trailingSlash: true`), igual que en WordPress, para que las direcciones no cambien el día del cambio de dominio.

Si una entrada y una página tienen el mismo slug, `getEntry` muestra la entrada.

## El backend: WordPress como CMS headless

### Qué se lee

| Endpoint | Parámetros que usa la app | Para qué |
|---|---|---|
| `/wp-json/wp/v2/posts` | `slug`, `page`, `per_page`, `categories`, `_fields`, `_embed=wp:featuredmedia,wp:term` | Noticias y entradas sueltas |
| `/wp-json/wp/v2/pages` | `slug` (uno o varios separados por coma), `per_page`, `_fields`, `_embed` | Páginas, comités, "Quiénes somos" |
| `/wp-json/wp/v2/categories` | `per_page=100`, `_fields=id,slug,name,count` | Filtro de noticias |

La app pide siempre `_fields` explícitos y nunca pide el autor, así no expone usuarios de WordPress.

### El cliente: `wp()` en `lib/cms/client.ts`

- Arma la URL con `URL` y `URLSearchParams`, nunca concatenando texto del visitante.
- Corta la petición a los 15 segundos (`AbortSignal.timeout`).
- Cachea la respuesta 300 segundos con la etiqueta `wordpress` (`next: { revalidate: 300, tags: ["wordpress"] }`).
- Devuelve `null` si WordPress responde 404, o 400 con `rest_post_invalid_page_number` (una página de resultados que no existe). La ruta lo convierte en un 404 propio.
- Cualquier otro error lanza una excepción. Con ISR, si WordPress falla al renovar una página, el visitante sigue viendo la última versión buena.
- Lee el total de páginas de la cabecera `X-WP-TotalPages`.

### Del JSON de WordPress a tipos de dominio: `lib/cms/content.ts`

| Función | Devuelve |
|---|---|
| `getEntry(slug)` | `Entry` (título, extracto, imagen, fecha, categoría y HTML limpio), buscando en entradas y páginas a la vez |
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
- **Páginas** también se ven en `/<slug>/`. "Quiénes somos" en el inicio lee la página con slug `nosotros`.
- **Comités:** la lista de páginas está en `COMMITTEES` de `lib/site.ts`. Un comité nuevo necesita su página en WordPress y su slug en esa lista.
- **Menú:** el menú de WordPress no se lee, porque su endpoint REST exige iniciar sesión. El menú de la app vive en `NAV` de `lib/site.ts`.
- **Constructores visuales:** el texto y las imágenes de Divi y Elementor se ven bien. Los widgets interactivos (formularios, carruseles, botones del tema) no pasan la limpieza. Para contenido nuevo conviene el editor de bloques de WordPress.

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
- **WordPress** tiene un plugin propio, fuera de este repo, que oculta los usuarios en la API REST, redirige los archivos de autor y los quita del sitemap.

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

`check-urls` pide a WordPress la lista de todas las entradas y páginas, y comprueba que cada una responda 200 en la app. También comprueba que las rutas inválidas respondan 404 y que el optimizador rechace imágenes de otros dominios.

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
