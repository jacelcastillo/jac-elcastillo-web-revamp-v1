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

WP_CLI::success('Datos de prueba listos.');
