<?php
defined('ABSPATH') || exit;

const JW_ESTADOS = [
    'planificacion' => 'En planificación',
    'progreso' => 'En progreso',
    'completado' => 'Completado',
    'suspendido' => 'Suspendido',
];

const JW_PRESUPUESTO_MAX = 9999999999999;

add_action('init', 'jw_registrar_proyectos');
add_action('add_meta_boxes', 'jw_agregar_caja_proyecto');
add_action('save_post_jw_proyecto', 'jw_guardar_proyecto');
add_action('save_post_jw_proyecto', 'jw_crear_categoria_avances', 10, 2);
add_filter('manage_jw_proyecto_posts_columns', 'jw_columnas_proyecto');
add_action('manage_jw_proyecto_posts_custom_column', 'jw_pintar_columna_proyecto', 10, 2);
add_filter('register_post_type_args', 'jw_ocultar_project_divi', 10, 2);

function jw_ocultar_project_divi(array $args, string $tipo): array {
    if ($tipo !== 'project') {
        return $args;
    }
    return array_merge($args, [
        'show_ui' => false,
        'show_in_menu' => false,
        'show_in_nav_menus' => false,
        'show_in_rest' => false,
    ]);
}

function jw_registrar_proyectos(): void {
    register_post_type('jw_proyecto', [
        'labels' => [
            'name' => 'Proyectos',
            'singular_name' => 'Proyecto',
            'add_new' => 'Añadir nuevo',
            'add_new_item' => 'Añadir nuevo proyecto',
            'edit_item' => 'Editar proyecto',
            'new_item' => 'Nuevo proyecto',
            'view_item' => 'Ver proyecto',
            'search_items' => 'Buscar proyectos',
            'not_found' => 'No se encontraron proyectos.',
            'not_found_in_trash' => 'No hay proyectos en la papelera.',
            'all_items' => 'Todos los proyectos',
            'featured_image' => 'Portada',
            'set_featured_image' => 'Elegir la portada',
            'remove_featured_image' => 'Quitar la portada',
            'use_featured_image' => 'Usar como portada',
        ],
        'public' => false,
        'publicly_queryable' => false,
        'exclude_from_search' => true,
        'show_ui' => true,
        'show_in_nav_menus' => false,
        'show_in_rest' => true,
        'rewrite' => false,
        'query_var' => false,
        'has_archive' => false,
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'page-attributes', 'custom-fields'],
        'taxonomies' => ['jw_proyecto_categoria'],
        'capability_type' => 'post',
        'menu_icon' => 'dashicons-portfolio',
    ]);

    register_taxonomy('jw_proyecto_categoria', 'jw_proyecto', [
        'labels' => [
            'name' => 'Categorías de proyecto',
            'singular_name' => 'Categoría de proyecto',
            'menu_name' => 'Categorías',
            'all_items' => 'Todas las categorías',
            'edit_item' => 'Editar categoría',
            'add_new_item' => 'Añadir nueva categoría',
            'new_item_name' => 'Nombre de la nueva categoría',
            'search_items' => 'Buscar categorías',
            'not_found' => 'No se encontraron categorías.',
        ],
        'hierarchical' => true,
        'public' => false,
        'show_ui' => true,
        'show_admin_column' => true,
        'show_in_rest' => true,
        'rewrite' => false,
        'query_var' => false,
    ]);

    $meta = [
        'object_subtype' => 'jw_proyecto',
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'default' => '',
        'auth_callback' => static fn(bool $ok, string $clave, int $id): bool => current_user_can('edit_post', $id),
    ];
    register_post_meta('jw_proyecto', 'jw_estado', [
        'default' => 'planificacion',
        'sanitize_callback' => static fn($v): string => jw_enum($v, array_keys(JW_ESTADOS), 'planificacion'),
    ] + $meta);
    register_post_meta('jw_proyecto', 'jw_avance', [
        'type' => 'integer',
        'default' => 0,
        'sanitize_callback' => static fn($v): int => jw_entero($v, 0, 100),
    ] + $meta);
    register_post_meta('jw_proyecto', 'jw_inicio', $meta + ['sanitize_callback' => 'jw_fecha']);
    register_post_meta('jw_proyecto', 'jw_fin', $meta + ['sanitize_callback' => 'jw_fecha']);
    foreach (['jw_presupuesto_total', 'jw_presupuesto_ejecutado'] as $clave) {
        register_post_meta('jw_proyecto', $clave, [
            'type' => 'integer',
            'default' => 0,
            'sanitize_callback' => static fn($v): int => jw_entero($v, 0, JW_PRESUPUESTO_MAX),
        ] + $meta);
    }
    register_post_meta('jw_proyecto', 'jw_ubicacion', $meta + [
        'sanitize_callback' => static fn($v): string => jw_texto($v, 80),
    ]);
    register_post_meta('jw_proyecto', 'jw_participantes', [
        'type' => 'integer',
        'default' => 0,
        'sanitize_callback' => static fn($v): int => jw_entero($v, 0, 1000000),
    ] + $meta);
    register_post_meta('jw_proyecto', 'jw_aliados', $meta + [
        'sanitize_callback' => static fn($v): string => jw_parrafo($v, 300),
    ]);
}

function jw_agregar_caja_proyecto(): void {
    remove_meta_box('postcustom', 'jw_proyecto', 'normal');
    add_meta_box('jw_proyecto_datos', 'Datos del proyecto', 'jw_pintar_caja_proyecto', 'jw_proyecto', 'normal', 'high');
}

function jw_pintar_caja_proyecto(WP_Post $post): void {
    wp_nonce_field('jw_proyecto_guardar', 'jw_proyecto_nonce');
    $estado = jw_enum(get_post_meta($post->ID, 'jw_estado', true), array_keys(JW_ESTADOS), 'planificacion');
    $numero = static fn(string $clave): int => (int) get_post_meta($post->ID, $clave, true);
    ?>
    <p class="description">El título es el nombre del proyecto y el resumen es el extracto. La portada es la imagen destacada. Las categorías se eligen en la caja Categorías de proyecto. Al publicar se crea la categoría de entradas con el mismo enlace que el proyecto: las entradas que se publiquen en ella salen como avances en la ficha.</p>
    <p>
        <label for="jw_estado"><strong>Estado</strong></label><br>
        <select id="jw_estado" name="jw_estado">
            <?php foreach (JW_ESTADOS as $valor => $etiqueta) : ?>
                <option value="<?php echo esc_attr($valor); ?>" <?php selected($estado, $valor); ?>><?php echo esc_html($etiqueta); ?></option>
            <?php endforeach; ?>
        </select>
    </p>
    <p>
        <label for="jw_avance"><strong>Avance (%)</strong></label><br>
        <input type="number" id="jw_avance" name="jw_avance" min="0" max="100" step="1" value="<?php echo esc_attr((string) $numero('jw_avance')); ?>">
    </p>
    <p>
        <label for="jw_inicio"><strong>Inicio</strong></label>
        <input type="date" id="jw_inicio" name="jw_inicio" value="<?php echo esc_attr((string) get_post_meta($post->ID, 'jw_inicio', true)); ?>">
        <label for="jw_fin"><strong>Fin</strong></label>
        <input type="date" id="jw_fin" name="jw_fin" value="<?php echo esc_attr((string) get_post_meta($post->ID, 'jw_fin', true)); ?>">
        <span class="description">Opcionales.</span>
    </p>
    <p>
        <label for="jw_presupuesto_total"><strong>Presupuesto total (COP)</strong></label>
        <input type="number" id="jw_presupuesto_total" name="jw_presupuesto_total" min="0" max="<?php echo esc_attr((string) JW_PRESUPUESTO_MAX); ?>" step="1" value="<?php echo esc_attr((string) $numero('jw_presupuesto_total')); ?>">
        <label for="jw_presupuesto_ejecutado"><strong>Ejecutado (COP)</strong></label>
        <input type="number" id="jw_presupuesto_ejecutado" name="jw_presupuesto_ejecutado" min="0" max="<?php echo esc_attr((string) JW_PRESUPUESTO_MAX); ?>" step="1" value="<?php echo esc_attr((string) $numero('jw_presupuesto_ejecutado')); ?>">
        <span class="description">Pesos enteros, sin puntos. Con total 0 la tarjeta dice "Por definir".</span>
    </p>
    <p>
        <label for="jw_ubicacion"><strong>Ubicación</strong></label>
        <input type="text" id="jw_ubicacion" name="jw_ubicacion" class="regular-text" maxlength="80" value="<?php echo esc_attr((string) get_post_meta($post->ID, 'jw_ubicacion', true)); ?>">
        <label for="jw_participantes"><strong>Participantes</strong></label>
        <input type="number" id="jw_participantes" name="jw_participantes" min="0" max="1000000" step="1" value="<?php echo esc_attr((string) $numero('jw_participantes')); ?>">
        <span class="description">Sin dato, la tarjeta dice "Por definir". Con participantes 0 también.</span>
    </p>
    <p>
        <label for="jw_aliados"><strong>Aliados y fuentes</strong></label><br>
        <textarea id="jw_aliados" name="jw_aliados" class="large-text" rows="3" maxlength="300"><?php echo esc_textarea((string) get_post_meta($post->ID, 'jw_aliados', true)); ?></textarea>
        <span class="description">Hasta 300 caracteres, por ejemplo entidades que financian o apoyan el proyecto.</span>
    </p>
    <?php
}

function jw_guardar_proyecto(int $id): void {
    if (!jw_guardar_caja($id, 'jw_proyecto_guardar', 'jw_proyecto_nonce')) {
        return;
    }
    foreach (['jw_estado', 'jw_avance', 'jw_inicio', 'jw_fin', 'jw_presupuesto_total', 'jw_presupuesto_ejecutado', 'jw_ubicacion', 'jw_participantes', 'jw_aliados'] as $clave) {
        $valor = isset($_POST[$clave]) ? wp_unslash($_POST[$clave]) : '';
        update_post_meta($id, $clave, $valor);
    }
}

function jw_crear_categoria_avances(int $id, WP_Post $post): void {
    if ($post->post_status !== 'publish' || $post->post_name === '' || get_term_by('slug', $post->post_name, 'category')) {
        return;
    }
    $padre = get_term_by('slug', 'proyectos', 'category');
    wp_insert_term(jw_plano($post->post_title), 'category', [
        'slug' => $post->post_name,
        'parent' => $padre ? $padre->term_id : 0,
    ]);
}

function jw_columnas_proyecto(array $columnas): array {
    $nuevas = [];
    foreach ($columnas as $clave => $titulo) {
        $nuevas[$clave] = $titulo;
        if ($clave === 'title') {
            $nuevas['jw_estado'] = 'Estado';
            $nuevas['jw_avance'] = 'Avance';
        }
    }
    return $nuevas;
}

function jw_pintar_columna_proyecto(string $columna, int $id): void {
    if ($columna === 'jw_estado') {
        $estado = jw_enum(get_post_meta($id, 'jw_estado', true), array_keys(JW_ESTADOS), 'planificacion');
        echo esc_html(JW_ESTADOS[$estado]);
    } elseif ($columna === 'jw_avance') {
        echo esc_html(jw_entero(get_post_meta($id, 'jw_avance', true), 0, 100) . ' %');
    }
}
