<?php
defined('ABSPATH') || exit;

const JW_TIPOS_DOCUMENTO = [
    'informe' => 'Informe de gestión',
    'financiero' => 'Financiero',
    'acta' => 'Acta',
    'resolucion' => 'Resolución',
    'plan' => 'Plan',
    'otro' => 'Otro',
];

add_action('init', 'jw_registrar_documentos');
add_action('add_meta_boxes', 'jw_agregar_caja_documento');
add_action('save_post_jw_documento', 'jw_guardar_documento');
add_action('post_edit_form_tag', 'jw_formulario_con_archivos');
add_action('admin_notices', 'jw_mostrar_aviso_documento');

function jw_registrar_documentos(): void {
    register_post_type('jw_documento', [
        'labels' => [
            'name' => 'Documentos',
            'singular_name' => 'Documento',
            'add_new' => 'Añadir nuevo',
            'add_new_item' => 'Añadir nuevo documento',
            'edit_item' => 'Editar documento',
            'new_item' => 'Nuevo documento',
            'view_item' => 'Ver documento',
            'search_items' => 'Buscar documentos',
            'not_found' => 'No se encontraron documentos.',
            'not_found_in_trash' => 'No hay documentos en la papelera.',
            'all_items' => 'Documentos',
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
        'supports' => ['title', 'custom-fields'],
        'capability_type' => ['jw_tesoreria', 'jw_tesorerias'],
        'map_meta_cap' => true,
        'menu_icon' => 'dashicons-media-document',
    ]);

    $meta = [
        'object_subtype' => 'jw_documento',
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'default' => '',
        'auth_callback' => static fn(bool $ok, string $clave, int $id): bool => current_user_can('edit_post', $id),
    ];
    register_post_meta('jw_documento', 'jw_tipo', [
        'default' => 'otro',
        'sanitize_callback' => static fn($v): string => jw_enum($v, array_keys(JW_TIPOS_DOCUMENTO), 'otro'),
    ] + $meta);
    register_post_meta('jw_documento', 'jw_fecha', $meta + ['sanitize_callback' => 'jw_fecha']);
    register_post_meta('jw_documento', 'jw_archivo', [
        'type' => 'integer',
        'default' => 0,
        'sanitize_callback' => static fn($v): int => is_numeric($v) && get_post_type((int) $v) === 'attachment' ? (int) $v : 0,
    ] + $meta);
}

function jw_agregar_caja_documento(): void {
    remove_meta_box('postcustom', 'jw_documento', 'normal');
    add_meta_box('jw_documento_datos', 'Datos del documento', 'jw_pintar_caja_documento', 'jw_documento', 'normal', 'high');
}

function jw_formulario_con_archivos(WP_Post $post): void {
    if ($post->post_type === 'jw_documento') {
        echo ' enctype="multipart/form-data"';
    }
}

function jw_pintar_caja_documento(WP_Post $post): void {
    wp_nonce_field('jw_documento_guardar', 'jw_documento_nonce');
    $tipo = jw_enum(get_post_meta($post->ID, 'jw_tipo', true), array_keys(JW_TIPOS_DOCUMENTO), 'otro');
    $adjunto = (int) get_post_meta($post->ID, 'jw_archivo', true);
    $url = $adjunto > 0 ? wp_get_attachment_url($adjunto) : false;
    ?>
    <p class="description">El título es el nombre que ven los visitantes. Las actas y resoluciones se publican solo cuando están aprobadas y revisadas, sin cédulas, teléfonos ni correos personales.</p>
    <p>
        <label for="jw_tipo"><strong>Tipo</strong></label>
        <select id="jw_tipo" name="jw_tipo">
            <?php foreach (JW_TIPOS_DOCUMENTO as $valor => $etiqueta) : ?>
                <option value="<?php echo esc_attr($valor); ?>" <?php selected($tipo, $valor); ?>><?php echo esc_html($etiqueta); ?></option>
            <?php endforeach; ?>
        </select>
        <label for="jw_fecha"><strong>Fecha</strong></label>
        <input type="date" id="jw_fecha" name="jw_fecha" value="<?php echo esc_attr((string) get_post_meta($post->ID, 'jw_fecha', true)); ?>">
        <span class="description">Opcional. Es la fecha de aprobación o de emisión.</span>
    </p>
    <p>
        <strong>Archivo actual</strong><br>
        <?php if ($url) : ?>
            <a href="<?php echo esc_url($url); ?>" target="_blank" rel="noopener"><?php echo esc_html(wp_basename($url)); ?></a>
        <?php else : ?>
            Todavía no tiene archivo. Sin archivo, el documento no se publica en el sitio.
        <?php endif; ?>
    </p>
    <p>
        <label for="jw_archivo"><strong>Subir un archivo</strong></label><br>
        <input type="file" id="jw_archivo" name="jw_archivo">
        <span class="description">PDF, Word, Excel o PowerPoint. Si subes otro, reemplaza al actual.</span>
    </p>
    <?php
}

function jw_guardar_documento(int $id): void {
    if (!jw_guardar_caja($id, 'jw_documento_guardar', 'jw_documento_nonce')) {
        return;
    }
    foreach (['jw_tipo', 'jw_fecha'] as $clave) {
        $valor = isset($_POST[$clave]) ? wp_unslash($_POST[$clave]) : '';
        update_post_meta($id, $clave, $valor);
    }
    if (empty($_FILES['jw_archivo']['name']) || !current_user_can('upload_files')) {
        return;
    }
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    $adjunto = media_handle_upload('jw_archivo', $id);
    if (is_wp_error($adjunto)) {
        set_transient('jw_aviso_documento_' . get_current_user_id(), $adjunto->get_error_message(), 60);
        return;
    }
    update_post_meta($id, 'jw_archivo', $adjunto);
}

function jw_mostrar_aviso_documento(): void {
    $clave = 'jw_aviso_documento_' . get_current_user_id();
    $mensaje = get_transient($clave);
    if (!is_string($mensaje)) {
        return;
    }
    delete_transient($clave);
    printf('<div class="notice notice-error"><p>No se pudo subir el archivo: %s</p></div>', esc_html($mensaje));
}
