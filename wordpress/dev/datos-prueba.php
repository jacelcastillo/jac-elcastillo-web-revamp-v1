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
    'jw_aliados' => 'Aliado de prueba Uno, Aliado de prueba Dos',
]);
jw_prueba_proyecto('Proyecto de prueba Huerta', ['Ambiente de prueba'], [
    'jw_estado' => 'planificacion',
    'jw_avance' => 10,
    'jw_inicio' => '2025-06-15',
    'jw_aliados' => 'Aliado de prueba Tres',
], ['menu_order' => 1]);
jw_prueba_proyecto('Proyecto de prueba Cancha', ['Obras de prueba', 'Ambiente de prueba'], [
    'jw_estado' => 'completado',
    'jw_avance' => 100,
    'jw_inicio' => '2023-01-10',
    'jw_fin' => '2023-09-30',
    'jw_presupuesto_total' => 45000000,
    'jw_presupuesto_ejecutado' => 45000000,
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

WP_CLI::success('Datos de prueba listos.');
