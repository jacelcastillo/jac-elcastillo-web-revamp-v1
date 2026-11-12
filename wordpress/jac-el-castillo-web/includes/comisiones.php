<?php
defined('ABSPATH') || exit;

const JW_TIPOS = [
    'ordinaria' => 'Comisiones de trabajo',
    'accidental' => 'Comisiones accidentales',
    'iniciativa' => 'Nuevas iniciativas',
    'organo' => 'Órganos de la Junta',
];

const JW_ESTADOS_COMISION = [
    'activa' => 'Activa',
    'sin-coordinacion' => 'Sin coordinación',
    'conformacion' => 'En conformación',
    'verificar' => 'Pendiente de verificar',
];

add_action('init', 'jw_registrar_comisiones');
add_action('add_meta_boxes', 'jw_agregar_caja_comision');
add_action('save_post_jw_comision', 'jw_guardar_comision');
add_action('save_post_jw_comision', static fn(int $id, WP_Post $post) => jw_crear_categoria($post, 'comisiones'), 10, 2);
add_filter('manage_jw_comision_posts_columns', 'jw_columnas_comision');
add_action('manage_jw_comision_posts_custom_column', 'jw_pintar_columna_comision', 10, 2);

function jw_registrar_comisiones(): void {
    register_post_type('jw_comision', [
        'labels' => [
            'name' => 'Comisiones',
            'singular_name' => 'Comisión',
            'add_new' => 'Añadir nueva',
            'add_new_item' => 'Añadir nueva comisión',
            'edit_item' => 'Editar comisión',
            'new_item' => 'Nueva comisión',
            'view_item' => 'Ver comisión',
            'search_items' => 'Buscar comisiones',
            'not_found' => 'No se encontraron comisiones.',
            'not_found_in_trash' => 'No hay comisiones en la papelera.',
            'all_items' => 'Comisiones',
        ],
        'show_in_menu' => JW_MENU,
        'public' => false,
        'publicly_queryable' => false,
        'exclude_from_search' => true,
        'show_ui' => true,
        'show_in_nav_menus' => false,
        'show_in_rest' => true,
        'rewrite' => false,
        'query_var' => false,
        'has_archive' => false,
        'supports' => ['title', 'editor', 'excerpt', 'page-attributes', 'custom-fields'],
        'capability_type' => 'post',
        'menu_icon' => 'dashicons-networking',
    ]);

    $meta = [
        'object_subtype' => 'jw_comision',
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'default' => '',
        'auth_callback' => static fn(bool $ok, string $clave, int $id): bool => current_user_can('edit_post', $id),
    ];
    register_post_meta('jw_comision', 'jw_nombre_corto', $meta + [
        'sanitize_callback' => static fn($v): string => jw_texto($v, 40),
    ]);
    register_post_meta('jw_comision', 'jw_tipo', [
        'default' => 'ordinaria',
        'sanitize_callback' => static fn($v): string => jw_enum($v, array_keys(JW_TIPOS), 'ordinaria'),
    ] + $meta);
    register_post_meta('jw_comision', 'jw_estado', [
        'default' => 'verificar',
        'sanitize_callback' => static fn($v): string => jw_enum($v, array_keys(JW_ESTADOS_COMISION), 'verificar'),
    ] + $meta);
    register_post_meta('jw_comision', 'jw_fundamento', $meta + [
        'sanitize_callback' => static fn($v): string => jw_texto($v, 80),
    ]);
}

/** @return array<string, array{corto: string, tipo: string}> */
function jw_comisiones_mapa(): array {
    $posts = get_posts([
        'post_type' => 'jw_comision',
        'post_status' => 'publish',
        'has_password' => false,
        'posts_per_page' => -1,
        'no_found_rows' => true,
        'orderby' => ['menu_order' => 'ASC', 'title' => 'ASC'],
    ]);
    $mapa = [];
    foreach ($posts as $post) {
        $corto = jw_texto(jw_plano(get_post_meta($post->ID, 'jw_nombre_corto', true)), 40);
        $mapa[$post->post_name] = [
            'corto' => $corto !== '' ? $corto : jw_plano($post->post_title),
            'tipo' => jw_enum(get_post_meta($post->ID, 'jw_tipo', true), array_keys(JW_TIPOS), 'ordinaria'),
        ];
    }
    return $mapa;
}

function jw_agregar_caja_comision(): void {
    remove_meta_box('postcustom', 'jw_comision', 'normal');
    add_meta_box('jw_comision_datos', 'Datos de la comisión', 'jw_pintar_caja_comision', 'jw_comision', 'normal', 'high');
}

function jw_pintar_caja_comision(WP_Post $post): void {
    wp_nonce_field('jw_comision_guardar', 'jw_comision_nonce');
    $tipo = jw_enum(get_post_meta($post->ID, 'jw_tipo', true), array_keys(JW_TIPOS), 'ordinaria');
    $estado = jw_enum(get_post_meta($post->ID, 'jw_estado', true), array_keys(JW_ESTADOS_COMISION), 'verificar');
    ?>
    <p class="description">El título es el nombre estatutario y el contenido son las funciones (Editor clásico). El resumen es el extracto. El orden dentro de su sección es el campo Orden de Atributos: menor primero. Al publicar se crea la categoría de entradas con el mismo enlace que la comisión, bajo Comisiones: las entradas que se publiquen en ella salen como rendición de cuentas en la ficha.</p>
    <p>
        <label for="jw_nombre_corto"><strong>Nombre corto</strong></label>
        <input type="text" id="jw_nombre_corto" name="jw_nombre_corto" class="regular-text" maxlength="40" value="<?php echo esc_attr((string) get_post_meta($post->ID, 'jw_nombre_corto', true)); ?>">
        <span class="description">Hasta 40 caracteres. Es el título de la tarjeta.</span>
    </p>
    <p>
        <label for="jw_tipo"><strong>Sección</strong></label>
        <select id="jw_tipo" name="jw_tipo">
            <?php foreach (JW_TIPOS as $valor => $etiqueta) : ?>
                <option value="<?php echo esc_attr($valor); ?>" <?php selected($tipo, $valor); ?>><?php echo esc_html($etiqueta); ?></option>
            <?php endforeach; ?>
        </select>
        <label for="jw_estado"><strong>Estado</strong></label>
        <select id="jw_estado" name="jw_estado">
            <?php foreach (JW_ESTADOS_COMISION as $valor => $etiqueta) : ?>
                <option value="<?php echo esc_attr($valor); ?>" <?php selected($estado, $valor); ?>><?php echo esc_html($etiqueta); ?></option>
            <?php endforeach; ?>
        </select>
    </p>
    <p>
        <label for="jw_fundamento"><strong>Fundamento</strong></label>
        <input type="text" id="jw_fundamento" name="jw_fundamento" class="regular-text" maxlength="80" value="<?php echo esc_attr((string) get_post_meta($post->ID, 'jw_fundamento', true)); ?>">
        <span class="description">Hasta 80 caracteres, por ejemplo "Estatutos, art. 58". Vacío, la ficha dice "Por verificar".</span>
    </p>
    <?php
}

function jw_guardar_comision(int $id): void {
    if (!jw_guardar_caja($id, 'jw_comision_guardar', 'jw_comision_nonce')) {
        return;
    }
    foreach (['jw_nombre_corto', 'jw_tipo', 'jw_estado', 'jw_fundamento'] as $clave) {
        $valor = isset($_POST[$clave]) ? wp_unslash($_POST[$clave]) : '';
        update_post_meta($id, $clave, $valor);
    }
}

function jw_columnas_comision(array $columnas): array {
    $nuevas = [];
    foreach ($columnas as $clave => $titulo) {
        $nuevas[$clave] = $titulo;
        if ($clave === 'title') {
            $nuevas['jw_tipo'] = 'Sección';
            $nuevas['jw_estado'] = 'Estado';
        }
    }
    return $nuevas;
}

function jw_pintar_columna_comision(string $columna, int $id): void {
    if ($columna === 'jw_tipo') {
        $tipo = jw_enum(get_post_meta($id, 'jw_tipo', true), array_keys(JW_TIPOS), 'ordinaria');
        echo esc_html(JW_TIPOS[$tipo]);
    } elseif ($columna === 'jw_estado') {
        $estado = jw_enum(get_post_meta($id, 'jw_estado', true), array_keys(JW_ESTADOS_COMISION), 'verificar');
        echo esc_html(JW_ESTADOS_COMISION[$estado]);
    }
}
