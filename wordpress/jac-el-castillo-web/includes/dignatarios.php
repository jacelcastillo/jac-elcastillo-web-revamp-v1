<?php
defined('ABSPATH') || exit;

const JW_CARGOS = [
    'presidencia' => 'Presidencia',
    'vicepresidencia' => 'Vicepresidencia',
    'tesoreria' => 'Tesorería',
    'secretaria' => 'Secretaría',
    'fiscalia' => 'Fiscalía',
    'conciliacion' => 'Comisión de convivencia y conciliación',
    'delegacion' => 'Delegación ante Asocomunal',
    'coordinacion' => 'Coordinación de comisión de trabajo',
    'otro' => 'Otro cargo',
];

add_action('init', 'jw_registrar_dignatarios');
add_action('add_meta_boxes', 'jw_agregar_caja_dignatario');
add_action('save_post_jw_dignatario', 'jw_guardar_dignatario');
add_filter('manage_jw_dignatario_posts_columns', 'jw_columnas_dignatario');
add_action('manage_jw_dignatario_posts_custom_column', 'jw_pintar_columna_dignatario', 10, 2);

function jw_periodo(mixed $valor): string {
    $texto = is_string($valor) ? trim($valor) : '';
    if (!preg_match('/^(\d{4})-(\d{4})$/', $texto, $m) || (int) $m[2] <= (int) $m[1]) {
        return '';
    }
    return $texto;
}

function jw_registrar_dignatarios(): void {
    register_post_type('jw_dignatario', [
        'labels' => [
            'name' => 'Dignatarios',
            'singular_name' => 'Dignatario',
            'add_new' => 'Añadir nuevo',
            'add_new_item' => 'Añadir nuevo dignatario',
            'edit_item' => 'Editar dignatario',
            'new_item' => 'Nuevo dignatario',
            'view_item' => 'Ver dignatario',
            'search_items' => 'Buscar dignatarios',
            'not_found' => 'No se encontraron dignatarios.',
            'not_found_in_trash' => 'No hay dignatarios en la papelera.',
            'all_items' => 'Todos los dignatarios',
            'featured_image' => 'Foto',
            'set_featured_image' => 'Elegir la foto',
            'remove_featured_image' => 'Quitar la foto',
            'use_featured_image' => 'Usar como foto',
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
        'supports' => ['title', 'thumbnail', 'page-attributes', 'custom-fields'],
        'capability_type' => 'post',
        'menu_icon' => 'dashicons-groups',
    ]);

    $meta = [
        'object_subtype' => 'jw_dignatario',
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'default' => '',
        'auth_callback' => static fn(bool $ok, string $clave, int $id): bool => current_user_can('edit_post', $id),
    ];
    register_post_meta('jw_dignatario', 'jw_periodo', $meta + ['sanitize_callback' => 'jw_periodo']);
    register_post_meta('jw_dignatario', 'jw_cargo', [
        'default' => 'otro',
        'sanitize_callback' => static fn($v): string => jw_enum($v, array_keys(JW_CARGOS), 'otro'),
    ] + $meta);
    register_post_meta('jw_dignatario', 'jw_detalle', $meta + [
        'sanitize_callback' => static fn($v): string => jw_texto($v, 80),
    ]);
}

/** @return list<string> */
function jw_periodos_usados(): array {
    global $wpdb;
    $periodos = $wpdb->get_col($wpdb->prepare(
        "SELECT DISTINCT pm.meta_value FROM {$wpdb->postmeta} pm
         INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
         WHERE pm.meta_key = %s AND p.post_type = %s AND p.post_status <> 'trash'
         ORDER BY pm.meta_value DESC",
        'jw_periodo',
        'jw_dignatario'
    ));
    return array_values(array_filter(array_map('jw_periodo', $periodos ?: [])));
}

function jw_agregar_caja_dignatario(): void {
    remove_meta_box('postcustom', 'jw_dignatario', 'normal');
    add_meta_box('jw_dignatario_datos', 'Datos del dignatario', 'jw_pintar_caja_dignatario', 'jw_dignatario', 'normal', 'high');
}

function jw_pintar_caja_dignatario(WP_Post $post): void {
    wp_nonce_field('jw_dignatario_guardar', 'jw_dignatario_nonce');
    $periodo = (string) get_post_meta($post->ID, 'jw_periodo', true);
    $cargo = (string) get_post_meta($post->ID, 'jw_cargo', true);
    ?>
    <p class="description">El título es el nombre completo. La foto es la imagen destacada: súbela solo con autorización de la persona; sin foto se muestra el logo de la Junta. Para que el período se vea en el sitio nuevo, debe existir una página hija de Nuestra historia con el período como slug. Orden solo desempata a personas con el mismo cargo.</p>
    <p>
        <label for="jw_periodo"><strong>Período</strong></label><br>
        <input type="text" id="jw_periodo" name="jw_periodo" list="jw_periodos" pattern="\d{4}-\d{4}" maxlength="9" placeholder="2026-2030" value="<?php echo esc_attr($periodo); ?>">
        <datalist id="jw_periodos">
            <?php foreach (jw_periodos_usados() as $usado) : ?>
                <option value="<?php echo esc_attr($usado); ?>"></option>
            <?php endforeach; ?>
        </datalist>
        <span class="description">Formato AAAA-AAAA, por ejemplo 2026-2030. Sin un período válido, la persona no se publica.</span>
    </p>
    <p>
        <label for="jw_cargo"><strong>Cargo</strong></label><br>
        <select id="jw_cargo" name="jw_cargo">
            <?php foreach (JW_CARGOS as $valor => $etiqueta) : ?>
                <option value="<?php echo esc_attr($valor); ?>" <?php selected($cargo, $valor); ?>><?php echo esc_html($etiqueta); ?></option>
            <?php endforeach; ?>
        </select>
    </p>
    <p>
        <label for="jw_detalle"><strong>Detalle</strong></label><br>
        <input type="text" id="jw_detalle" name="jw_detalle" class="regular-text" maxlength="80" value="<?php echo esc_attr((string) get_post_meta($post->ID, 'jw_detalle', true)); ?>">
        <span class="description">Opcional, por ejemplo Suplente o Comisión de salud. Con el cargo Otro cargo, el detalle es el cargo que se muestra.</span>
    </p>
    <?php
}

function jw_guardar_dignatario(int $id): void {
    if (!jw_guardar_caja($id, 'jw_dignatario_guardar', 'jw_dignatario_nonce')) {
        return;
    }
    foreach (['jw_periodo', 'jw_cargo', 'jw_detalle'] as $clave) {
        $valor = isset($_POST[$clave]) ? wp_unslash($_POST[$clave]) : '';
        update_post_meta($id, $clave, $valor);
    }
}

function jw_columnas_dignatario(array $columnas): array {
    $nuevas = [];
    foreach ($columnas as $clave => $titulo) {
        $nuevas[$clave] = $titulo;
        if ($clave === 'title') {
            $nuevas['jw_periodo'] = 'Período';
            $nuevas['jw_cargo'] = 'Cargo';
        }
    }
    return $nuevas;
}

function jw_pintar_columna_dignatario(string $columna, int $id): void {
    if ($columna === 'jw_periodo') {
        echo esc_html((string) get_post_meta($id, 'jw_periodo', true));
    } elseif ($columna === 'jw_cargo') {
        $cargo = (string) get_post_meta($id, 'jw_cargo', true);
        echo esc_html(JW_CARGOS[$cargo] ?? JW_CARGOS['otro']);
    }
}
