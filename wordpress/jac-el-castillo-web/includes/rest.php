<?php
defined('ABSPATH') || exit;

add_action('rest_api_init', 'jw_registrar_ruta');

function jw_registrar_ruta(): void {
    register_rest_route('jac-web/v1', '/dignatarios', [
        'methods' => 'GET',
        'callback' => 'jw_dignatarios',
        'permission_callback' => '__return_true',
    ]);
    register_rest_route('jac-web/v1', '/proyectos', [
        'methods' => 'GET',
        'callback' => 'jw_proyectos',
        'permission_callback' => '__return_true',
    ]);
    register_rest_route('jac-web/v1', '/comisiones', [
        'methods' => 'GET',
        'callback' => 'jw_comisiones',
        'permission_callback' => '__return_true',
    ]);
}

function jw_dignatarios(): WP_REST_Response {
    $respuesta = new WP_REST_Response(['periodos' => jw_periodos_publicos()]);
    $respuesta->header('Cache-Control', 'public, max-age=300');
    return $respuesta;
}

function jw_opciones(array $opciones): array {
    $filas = [];
    foreach ($opciones as $valor => $nombre) {
        $filas[] = ['valor' => $valor, 'nombre' => $nombre];
    }
    return $filas;
}

function jw_proyectos(): WP_REST_Response {
    $respuesta = new WP_REST_Response(['estados' => jw_opciones(JW_ESTADOS), 'proyectos' => jw_proyectos_publicos()]);
    $respuesta->header('Cache-Control', 'public, max-age=300');
    return $respuesta;
}

function jw_comisiones(): WP_REST_Response {
    $respuesta = new WP_REST_Response([
        'tipos' => jw_opciones(JW_TIPOS),
        'estados' => jw_opciones(JW_ESTADOS_COMISION),
        'comisiones' => jw_comisiones_publicas(),
    ]);
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

function jw_proyectos_publicos(): array {
    $posts = get_posts([
        'post_type' => 'jw_proyecto',
        'post_status' => 'publish',
        'has_password' => false,
        'posts_per_page' => -1,
        'no_found_rows' => true,
        'orderby' => ['menu_order' => 'ASC', 'title' => 'ASC'],
    ]);

    return array_map(static function (WP_Post $post): array {
        $meta = static fn(string $clave): mixed => get_post_meta($post->ID, $clave, true);
        $categorias = wp_get_object_terms($post->ID, 'jw_proyecto_categoria');
        return [
            'slug' => $post->post_name,
            'titulo' => jw_plano($post->post_title),
            'resumen' => jw_plano($post->post_excerpt),
            'estado' => jw_enum($meta('jw_estado'), array_keys(JW_ESTADOS), 'planificacion'),
            'avance' => jw_entero($meta('jw_avance'), 0, 100),
            'inicio' => jw_fecha($meta('jw_inicio')),
            'fin' => jw_fecha($meta('jw_fin')),
            'presupuesto' => [
                'total' => jw_entero($meta('jw_presupuesto_total'), 0, JW_PRESUPUESTO_MAX),
                'ejecutado' => jw_entero($meta('jw_presupuesto_ejecutado'), 0, JW_PRESUPUESTO_MAX),
            ],
            'ubicacion' => jw_texto(jw_plano($meta('jw_ubicacion')), 80),
            'participantes' => jw_entero($meta('jw_participantes'), 0, 1000000),
            'aliados' => jw_parrafo(jw_plano($meta('jw_aliados')), 300),
            'categorias' => is_wp_error($categorias) ? [] : array_map(
                static fn(WP_Term $t): array => ['slug' => $t->slug, 'nombre' => jw_plano($t->name)],
                $categorias
            ),
            'imagen' => jw_foto($post->ID),
            'contenido' => apply_filters('the_content', $post->post_content),
        ];
    }, $posts);
}

function jw_comisiones_publicas(): array {
    $posts = get_posts([
        'post_type' => 'jw_comision',
        'post_status' => 'publish',
        'has_password' => false,
        'posts_per_page' => -1,
        'no_found_rows' => true,
        'orderby' => ['menu_order' => 'ASC', 'title' => 'ASC'],
    ]);

    return array_map(static function (WP_Post $post): array {
        $meta = static fn(string $clave): mixed => get_post_meta($post->ID, $clave, true);
        return [
            'slug' => $post->post_name,
            'nombre' => jw_plano($post->post_title),
            'nombre_corto' => jw_texto(jw_plano($meta('jw_nombre_corto')), 40),
            'tipo' => jw_enum($meta('jw_tipo'), array_keys(JW_TIPOS), 'ordinaria'),
            'estado' => jw_enum($meta('jw_estado'), array_keys(JW_ESTADOS_COMISION), 'verificar'),
            'fundamento' => jw_texto(jw_plano($meta('jw_fundamento')), 80),
            'resumen' => jw_plano($post->post_excerpt),
            'contenido' => apply_filters('the_content', $post->post_content),
        ];
    }, $posts);
}
