<?php
// Datos de prueba solo para desarrollo local, todos ficticios. Se ejecuta con: wp eval-file datos-prueba.php

require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

function jw_prueba_pagina(string $slug, string $titulo, string $contenido, int $padre = 0, int $orden = 0): int {
    $ruta = $padre ? get_page_uri($padre) . '/' . $slug : $slug;
    $existente = get_page_by_path($ruta, OBJECT, 'page');
    if ($existente) {
        return $existente->ID;
    }
    $id = wp_insert_post([
        'post_type' => 'page',
        'post_status' => 'publish',
        'post_name' => $slug,
        'post_title' => $titulo,
        'post_content' => $contenido,
        'post_parent' => $padre,
        'menu_order' => $orden,
    ], true);
    if (is_wp_error($id)) {
        WP_CLI::error($id->get_error_message());
    }
    return $id;
}

function jw_prueba_foto(): int {
    $existente = get_posts([
        'post_type' => 'attachment',
        'post_status' => 'inherit',
        'meta_key' => 'jw_prueba',
        'meta_value' => 'foto',
        'fields' => 'ids',
        'posts_per_page' => 1,
    ]);
    if ($existente) {
        return (int) $existente[0];
    }
    $subida = wp_upload_bits('persona-de-prueba.webp', null, (string) file_get_contents('/dev-assets/cropped-favicon.webp'));
    if ($subida['error']) {
        WP_CLI::error($subida['error']);
    }
    $id = wp_insert_attachment([
        'post_mime_type' => 'image/webp',
        'post_title' => 'Foto de prueba',
        'post_status' => 'inherit',
    ], $subida['file']);
    wp_update_attachment_metadata($id, wp_generate_attachment_metadata($id, $subida['file']));
    update_post_meta($id, 'jw_prueba', 'foto');
    return $id;
}

function jw_prueba_dignatario(string $nombre, string $periodo, string $cargo, string $detalle = '', int $orden = 0, array $extra = []): void {
    $existe = get_posts([
        'post_type' => 'jw_dignatario',
        'post_status' => 'any',
        'meta_key' => 'jw_prueba',
        'meta_value' => $nombre,
        'fields' => 'ids',
        'posts_per_page' => 1,
    ]);
    if ($existe) {
        return;
    }
    $id = wp_insert_post($extra + [
        'post_type' => 'jw_dignatario',
        'post_status' => 'publish',
        'post_title' => $nombre,
        'menu_order' => $orden,
    ], true);
    if (is_wp_error($id)) {
        WP_CLI::error($id->get_error_message());
    }
    update_post_meta($id, 'jw_prueba', $nombre);
    if ($periodo !== '') {
        update_post_meta($id, 'jw_periodo', $periodo);
    }
    update_post_meta($id, 'jw_cargo', $cargo);
    update_post_meta($id, 'jw_detalle', $detalle);
}

function jw_prueba_termino(string $nombre, string $taxonomia): int {
    $existente = get_term_by('slug', sanitize_title($nombre), $taxonomia);
    if ($existente) {
        return $existente->term_id;
    }
    $nuevo = wp_insert_term($nombre, $taxonomia);
    if (is_wp_error($nuevo)) {
        WP_CLI::error($nuevo->get_error_message());
    }
    return (int) $nuevo['term_id'];
}

function jw_prueba_proyecto(string $titulo, array $categorias, array $meta, array $extra = []): int {
    $existe = get_posts([
        'post_type' => 'jw_proyecto',
        'post_status' => 'any',
        'meta_key' => 'jw_prueba',
        'meta_value' => $titulo,
        'fields' => 'ids',
        'posts_per_page' => 1,
    ]);
    if ($existe) {
        foreach ($meta as $clave => $valor) {
            update_post_meta($existe[0], $clave, $valor);
        }
        return $existe[0];
    }
    $id = wp_insert_post($extra + [
        'post_type' => 'jw_proyecto',
        'post_status' => 'publish',
        'post_title' => $titulo,
        'post_excerpt' => 'Resumen de prueba de ' . $titulo . '.',
        'post_content' => '<p>Texto de prueba de la ficha de ' . $titulo . '.</p>',
        'meta_input' => ['jw_prueba' => $titulo] + $meta,
    ], true);
    if (is_wp_error($id)) {
        WP_CLI::error($id->get_error_message());
    }
    wp_set_object_terms($id, array_map(static fn(string $c): int => jw_prueba_termino($c, 'jw_proyecto_categoria'), $categorias), 'jw_proyecto_categoria');
    return $id;
}

function jw_prueba_comision(string $titulo, string $corto, string $tipo, string $estado, string $fundamento, int $orden, array $extra = []): int {
    $existe = get_posts([
        'post_type' => 'jw_comision',
        'post_status' => 'any',
        'meta_key' => 'jw_prueba',
        'meta_value' => $titulo,
        'fields' => 'ids',
        'posts_per_page' => 1,
    ]);
    if ($existe) {
        return $existe[0];
    }
    $id = wp_insert_post($extra + [
        'post_type' => 'jw_comision',
        'post_status' => 'publish',
        'post_title' => $titulo,
        'post_excerpt' => 'Resumen de prueba de ' . $titulo . '.',
        'post_content' => '<p>Funciones de prueba de ' . $titulo . '.</p>',
        'menu_order' => $orden,
        'meta_input' => [
            'jw_prueba' => $titulo,
            'jw_nombre_corto' => $corto,
            'jw_tipo' => $tipo,
            'jw_estado' => $estado,
            'jw_fundamento' => $fundamento,
        ],
    ], true);
    if (is_wp_error($id)) {
        WP_CLI::error($id->get_error_message());
    }
    return $id;
}

function jw_prueba_pdf(): int {
    $existente = get_posts([
        'post_type' => 'attachment',
        'post_status' => 'inherit',
        'meta_key' => 'jw_prueba',
        'meta_value' => 'pdf',
        'fields' => 'ids',
        'posts_per_page' => 1,
    ]);
    if ($existente) {
        return (int) $existente[0];
    }
    $pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%EOF\n";
    $subida = wp_upload_bits('documento-de-prueba.pdf', null, $pdf);
    if ($subida['error']) {
        WP_CLI::error($subida['error']);
    }
    $id = wp_insert_attachment([
        'post_mime_type' => 'application/pdf',
        'post_title' => 'Documento de prueba',
        'post_status' => 'inherit',
    ], $subida['file']);
    update_post_meta($id, 'jw_prueba', 'pdf');
    return $id;
}

function jw_prueba_documento(string $titulo, array $meta, array $extra = []): void {
    $existe = get_posts([
        'post_type' => 'jw_documento',
        'post_status' => 'any',
        'meta_key' => 'jw_prueba',
        'meta_value' => $titulo,
        'fields' => 'ids',
        'posts_per_page' => 1,
    ]);
    if ($existe) {
        return;
    }
    $id = wp_insert_post($extra + [
        'post_type' => 'jw_documento',
        'post_status' => 'publish',
        'post_title' => $titulo,
        'meta_input' => ['jw_prueba' => $titulo] + $meta,
    ], true);
    if (is_wp_error($id)) {
        WP_CLI::error($id->get_error_message());
    }
}

function jw_prueba_vigencia(string $clave, int $anio, array $meta, array $extra = [], string $modificada = ''): void {
    $existe = get_posts([
        'post_type' => 'jw_vigencia',
        'post_status' => 'any',
        'meta_key' => 'jw_prueba',
        'meta_value' => $clave,
        'fields' => 'ids',
        'posts_per_page' => 1,
    ]);
    if ($existe) {
        return;
    }
    $id = wp_insert_post($extra + [
        'post_type' => 'jw_vigencia',
        'post_status' => 'publish',
        'meta_input' => ['jw_prueba' => $clave, 'jw_anio' => $anio] + $meta,
    ], true);
    if (is_wp_error($id)) {
        WP_CLI::error($id->get_error_message());
    }
    if ($modificada !== '') {
        global $wpdb;
        $wpdb->update($wpdb->posts, ['post_modified' => $modificada, 'post_modified_gmt' => $modificada], ['ID' => $id]);
        clean_post_cache($id);
    }
}

$historia = jw_prueba_pagina(
    'historia',
    'Nuestra historia',
    '<p>Texto de prueba. Gracias a quienes han servido a la comunidad en cada período de la Junta.</p>'
);
jw_prueba_pagina('2026-2030', 'Junta directiva 2026-2030', '<p>Texto de prueba del período 2026-2030.</p>', $historia, 0);
jw_prueba_pagina('2022-2026', 'Junta directiva 2022-2026', '<p>Texto de prueba del período 2022-2026.</p>', $historia, 1);
jw_prueba_pagina('2018-2022', 'Junta directiva 2018-2022', '<p>Texto de prueba del período 2018-2022, sin dignatarios cargados.</p>', $historia, 2);

jw_prueba_dignatario('Persona de prueba Siete', '2026-2030', 'tesoreria');
jw_prueba_dignatario('Persona de prueba Uno', '2026-2030', 'presidencia');
jw_prueba_dignatario('Persona de prueba Cuatro', '2026-2030', 'conciliacion', '', 2);
jw_prueba_dignatario('Persona de prueba Tres', '2026-2030', 'secretaria');
jw_prueba_dignatario('Persona de prueba Cinco', '2026-2030', 'conciliacion', '', 1);
jw_prueba_dignatario('Persona de prueba Dos', '2026-2030', 'vicepresidencia', 'Suplente');
jw_prueba_dignatario('Persona de prueba Seis', '2026-2030', 'otro', 'Comisión de salud');
jw_prueba_dignatario('Persona de prueba Ocho', '2026-2030', 'fiscalia');
jw_prueba_dignatario('Persona de prueba Doce', '2026-2030', 'coordinacion', '', 0, ['meta_input' => ['jw_comision' => 'comision-de-prueba-ordinaria']]);
jw_prueba_dignatario('Persona de prueba Trece', '2026-2030', 'integrante', '', 0, ['meta_input' => [
    'jw_comision' => 'comision-de-prueba-ordinaria',
    'jw_situacion' => 'ad-hoc',
    'jw_desde' => '2027-03-01',
]]);
jw_prueba_dignatario('Persona de prueba Catorce', '2026-2030', 'integrante', '', 1, ['meta_input' => [
    'jw_comision' => 'comision-de-prueba-ordinaria',
    'jw_situacion' => 'renuncia',
    'jw_desde' => '2027-02-01',
]]);
jw_prueba_dignatario('Persona de prueba Quince', '2026-2030', 'fiscalia', '', 1, ['meta_input' => ['jw_comision' => 'organo-de-prueba']]);
jw_prueba_dignatario('Persona de prueba Dieciséis', '2026-2030', 'coordinacion', '', 1, ['meta_input' => ['jw_comision' => 'no-existe']]);

jw_prueba_dignatario('Persona de prueba Diez', '2022-2026', 'tesoreria');
jw_prueba_dignatario('Persona de prueba Nueve', '2022-2026', 'presidencia');
jw_prueba_dignatario('Persona de prueba Once', '2022-2026', 'secretaria');

jw_prueba_dignatario('Persona de prueba Borrador', '2026-2030', 'presidencia', '', 0, ['post_status' => 'draft']);
jw_prueba_dignatario('Persona de prueba Sin período', '', 'presidencia');
jw_prueba_dignatario('Persona de prueba Protegida', '2026-2030', 'presidencia', '', 0, ['post_password' => 'clave-de-prueba']);

$ocho = get_posts([
    'post_type' => 'jw_dignatario',
    'post_status' => 'any',
    'meta_key' => 'jw_prueba',
    'meta_value' => 'Persona de prueba Ocho',
    'fields' => 'ids',
    'posts_per_page' => 1,
]);
if ($ocho && !has_post_thumbnail($ocho[0])) {
    set_post_thumbnail($ocho[0], jw_prueba_foto());
}

jw_prueba_termino('Proyectos', 'category');

$parque = jw_prueba_proyecto('Proyecto de prueba Parque', ['Obras de prueba'], [
    'jw_estado' => 'progreso',
    'jw_avance' => 60,
    'jw_inicio' => '2024-03-01',
    'jw_fin' => '2024-12-31',
    'jw_presupuesto_total' => 120000000,
    'jw_presupuesto_ejecutado' => 72000000,
    'jw_ubicacion' => 'Vereda de prueba',
    'jw_participantes' => 45,
    'jw_aliados' => 'Aliado de prueba Uno, Aliado de prueba Dos',
    'jw_comision' => 'comision-de-prueba-ordinaria',
]);
jw_prueba_proyecto('Proyecto de prueba Huerta', ['Ambiente de prueba'], [
    'jw_estado' => 'planificacion',
    'jw_avance' => 10,
    'jw_inicio' => '2025-06-15',
    'jw_ubicacion' => 'Salón comunal de prueba',
    'jw_participantes' => 1,
    'jw_aliados' => 'Aliado de prueba Tres',
    'jw_comision' => 'no-existe',
], ['menu_order' => 1]);
jw_prueba_proyecto('Proyecto de prueba Cancha', ['Obras de prueba', 'Ambiente de prueba'], [
    'jw_estado' => 'completado',
    'jw_avance' => 100,
    'jw_inicio' => '2023-01-10',
    'jw_fin' => '2023-09-30',
    'jw_presupuesto_total' => 45000000,
    'jw_presupuesto_ejecutado' => 45000000,
    'jw_comision' => 'comision-de-prueba-borrador',
], ['menu_order' => 2]);
jw_prueba_proyecto('Proyecto de prueba Borrador', ['Obras de prueba'], ['jw_estado' => 'suspendido'], ['post_status' => 'draft']);

if (!has_post_thumbnail($parque)) {
    set_post_thumbnail($parque, jw_prueba_foto());
}

if (!get_page_by_path('avance-de-prueba-del-parque', OBJECT, 'post')) {
    $avance = wp_insert_post([
        'post_type' => 'post',
        'post_status' => 'publish',
        'post_name' => 'avance-de-prueba-del-parque',
        'post_title' => 'Avance de prueba del parque',
        'post_content' => '<p>Texto de prueba de un avance del proyecto.</p>',
    ], true);
    if (is_wp_error($avance)) {
        WP_CLI::error($avance->get_error_message());
    }
    wp_set_post_categories($avance, [get_term_by('slug', 'proyecto-de-prueba-parque', 'category')->term_id]);
}

jw_prueba_termino('Comisiones', 'category');

jw_prueba_comision('Comisión de prueba Ordinaria', 'Ordinaria de prueba', 'ordinaria', 'activa', 'Estatutos de prueba, art. 1', 0);
jw_prueba_comision('Comisión de prueba Accidental', 'Accidental de prueba', 'accidental', 'sin-coordinacion', '', 0);
jw_prueba_comision('Comisión de prueba Iniciativa', 'Iniciativa de prueba', 'iniciativa', 'conformacion', 'Propuesta de prueba', 0);
jw_prueba_comision('Órgano de prueba', 'Órgano de prueba', 'organo', 'verificar', 'Estatutos de prueba, art. 2', 0);
jw_prueba_comision('Comisión de prueba Borrador', 'Borrador de prueba', 'ordinaria', 'activa', '', 1, ['post_status' => 'draft']);

if (!get_page_by_path('rendicion-de-prueba-de-la-comision', OBJECT, 'post')) {
    $rendicion = wp_insert_post([
        'post_type' => 'post',
        'post_status' => 'publish',
        'post_name' => 'rendicion-de-prueba-de-la-comision',
        'post_title' => 'Rendición de prueba de la comisión',
        'post_content' => '<p>Texto de prueba de una rendición de cuentas.</p>',
    ], true);
    if (is_wp_error($rendicion)) {
        WP_CLI::error($rendicion->get_error_message());
    }
    wp_set_post_categories($rendicion, [get_term_by('slug', 'comision-de-prueba-ordinaria', 'category')->term_id]);
}

$pdf = jw_prueba_pdf();
jw_prueba_documento('Informe de prueba', ['jw_tipo' => 'informe', 'jw_fecha' => '2025-05-10', 'jw_archivo' => $pdf]);
jw_prueba_documento('Acta de prueba', ['jw_tipo' => 'acta', 'jw_archivo' => $pdf]);
jw_prueba_documento('Documento de prueba Borrador', ['jw_tipo' => 'plan', 'jw_archivo' => $pdf], ['post_status' => 'draft']);
jw_prueba_documento('Documento de prueba Sin archivo', ['jw_tipo' => 'otro']);

$fila = static fn(string ...$celdas): string => implode("\t", $celdas);
jw_prueba_vigencia('2025-vieja', 2025, ['jw_presupuesto' => $fila('Ingreso', 'Ingresos', 'Rubro viejo', '1', '1')], [], '2020-01-01 00:00:00');
jw_prueba_vigencia('2025', 2025, [
    'jw_presupuesto' => implode("\n", [
        $fila('Clase', 'Grupo', 'Rubro', 'Presupuestado', 'Ejecutado'),
        $fila('Ingreso', 'Ingresos', 'Cuotas de prueba', '$ 1.234,56', '$ -'),
        $fila('Gastos', 'Funcionamiento', 'Oficina de prueba', '600000', '80.300'),
        $fila('Egreso', 'Operacionales', 'Rubro con error', 'abc', '0'),
        $fila('Egreso', 'Reservas', 'Rubro en cero', '0', '0'),
    ]),
    'jw_meses' => implode("\n", [
        $fila('Mes', 'Ingresos', 'Egresos'),
        $fila('julio', '1.000', '500'),
        $fila('8', '2000', '1000'),
        $fila('13', '5', '5'),
    ]),
    'jw_nota' => 'Nota de prueba de la vigencia 2025.',
]);
jw_prueba_vigencia('2026', 2026, ['jw_meses' => implode("\n", [$fila('7', '100', '50'), $fila('9', '300', '150')])]);
jw_prueba_vigencia('2027-borrador', 2027, ['jw_nota' => 'Borrador de prueba.'], ['post_status' => 'draft']);

WP_CLI::success('Datos de prueba listos.');
