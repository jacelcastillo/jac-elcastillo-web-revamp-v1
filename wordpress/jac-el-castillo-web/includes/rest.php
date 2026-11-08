<?php
defined('ABSPATH') || exit;

add_action('rest_api_init', 'jw_registrar_ruta');

function jw_registrar_ruta(): void {
    register_rest_route('jac-web/v1', '/dignatarios', [
        'methods' => 'GET',
        'callback' => 'jw_dignatarios',
        'permission_callback' => '__return_true',
    ]);
}

function jw_dignatarios(): WP_REST_Response {
    $respuesta = new WP_REST_Response(['periodos' => jw_periodos_publicos()]);
    $respuesta->header('Cache-Control', 'public, max-age=300');
    return $respuesta;
}

function jw_foto(int $post_id): ?array {
    $adjunto = (int) get_post_thumbnail_id($post_id);
    if ($adjunto === 0 || !str_starts_with((string) get_post_mime_type($adjunto), 'image/')) {
        return null;
    }
    $imagen = wp_get_attachment_image_src($adjunto, 'large');
    if (!$imagen) {
        return null;
    }
    return ['url' => $imagen[0], 'ancho' => (int) $imagen[1], 'alto' => (int) $imagen[2]];
}

function jw_periodos_publicos(): array {
    $posts = get_posts([
        'post_type' => 'jw_dignatario',
        'post_status' => 'publish',
        'has_password' => false,
        'posts_per_page' => -1,
        'no_found_rows' => true,
        'orderby' => ['menu_order' => 'ASC', 'title' => 'ASC'],
    ]);

    $cargos = array_keys(JW_CARGOS);
    $porPeriodo = [];
    foreach ($posts as $post) {
        $periodo = jw_periodo(get_post_meta($post->ID, 'jw_periodo', true));
        if ($periodo === '') {
            continue;
        }
        $cargo = jw_enum(get_post_meta($post->ID, 'jw_cargo', true), $cargos, 'otro');
        $detalle = jw_texto(jw_plano(get_post_meta($post->ID, 'jw_detalle', true)), 80);
        $esOtro = $cargo === 'otro' && $detalle !== '';
        $porPeriodo[$periodo][] = [
            'posicion' => array_search($cargo, $cargos, true),
            'dignatario' => [
                'id' => $post->ID,
                'nombre' => jw_plano($post->post_title),
                'cargo' => $cargo,
                'cargo_nombre' => $esOtro ? $detalle : JW_CARGOS[$cargo],
                'detalle' => $esOtro ? '' : $detalle,
                'foto' => jw_foto($post->ID),
            ],
        ];
    }

    krsort($porPeriodo, SORT_STRING);
    $periodos = [];
    foreach ($porPeriodo as $periodo => $filas) {
        // usort es estable desde PHP 8.0: dentro de un cargo se conserva el orden por Orden y título.
        usort($filas, static fn(array $a, array $b): int => $a['posicion'] <=> $b['posicion']);
        $periodos[] = [
            'periodo' => (string) $periodo,
            'dignatarios' => array_column($filas, 'dignatario'),
        ];
    }
    return $periodos;
}
