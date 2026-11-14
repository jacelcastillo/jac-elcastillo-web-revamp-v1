<?php
defined('ABSPATH') || exit;

const JW_CAPS_TESORERIA = [
    'edit_jw_tesorerias', 'edit_others_jw_tesorerias', 'edit_published_jw_tesorerias', 'edit_private_jw_tesorerias',
    'publish_jw_tesorerias', 'read_private_jw_tesorerias',
    'delete_jw_tesorerias', 'delete_others_jw_tesorerias', 'delete_published_jw_tesorerias', 'delete_private_jw_tesorerias',
];

const JW_TABLA_MAX = 20000;

const JW_MESES = [
    1 => ['ene', 'enero'], 2 => ['feb', 'febrero'], 3 => ['mar', 'marzo'], 4 => ['abr', 'abril'],
    5 => ['may', 'mayo'], 6 => ['jun', 'junio'], 7 => ['jul', 'julio'], 8 => ['ago', 'agosto'],
    9 => ['sep', 'septiembre'], 10 => ['oct', 'octubre'], 11 => ['nov', 'noviembre'], 12 => ['dic', 'diciembre'],
];

add_action('init', 'jw_registrar_vigencias');
add_action('add_meta_boxes', 'jw_agregar_caja_vigencia');
add_action('save_post_jw_vigencia', 'jw_guardar_vigencia');
add_action('save_post_jw_vigencia', 'jw_titular_vigencia', 20);
add_action('rest_after_insert_jw_vigencia', static fn(WP_Post $post) => jw_titular_vigencia($post->ID));
add_filter('manage_jw_vigencia_posts_columns', 'jw_columnas_vigencia');
add_action('manage_jw_vigencia_posts_custom_column', 'jw_pintar_columna_vigencia', 10, 2);

function jw_registrar_vigencias(): void {
    register_post_type('jw_vigencia', [
        'labels' => [
            'name' => 'Vigencias de tesorería',
            'singular_name' => 'Vigencia de tesorería',
            'add_new' => 'Añadir nueva',
            'add_new_item' => 'Añadir nueva vigencia',
            'edit_item' => 'Editar vigencia',
            'new_item' => 'Nueva vigencia',
            'view_item' => 'Ver vigencia',
            'search_items' => 'Buscar vigencias',
            'not_found' => 'No se encontraron vigencias.',
            'not_found_in_trash' => 'No hay vigencias en la papelera.',
            'all_items' => 'Vigencias',
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
        'supports' => ['custom-fields'],
        'capability_type' => ['jw_tesoreria', 'jw_tesorerias'],
        'map_meta_cap' => true,
        'menu_icon' => 'dashicons-chart-bar',
    ]);

    $meta = [
        'object_subtype' => 'jw_vigencia',
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'default' => '',
        'auth_callback' => static fn(bool $ok, string $clave, int $id): bool => current_user_can('edit_post', $id),
    ];
    register_post_meta('jw_vigencia', 'jw_anio', [
        'type' => 'integer',
        'default' => 0,
        'sanitize_callback' => 'jw_anio_vigencia',
    ] + $meta);
    foreach (['jw_presupuesto', 'jw_meses'] as $clave) {
        register_post_meta('jw_vigencia', $clave, [
            'sanitize_callback' => static fn($v): string => jw_parrafo($v, JW_TABLA_MAX),
        ] + $meta);
    }
    register_post_meta('jw_vigencia', 'jw_nota', $meta + [
        'sanitize_callback' => static fn($v): string => jw_parrafo($v, 300),
    ]);
}

function jw_anio_vigencia(mixed $valor): int {
    return is_numeric($valor) && $valor >= 2000 && $valor <= 2100 ? (int) $valor : 0;
}

function jw_titular_vigencia(int $id): void {
    if (get_post_status($id) === 'auto-draft') {
        return;
    }
    $anio = jw_anio_vigencia(get_post_meta($id, 'jw_anio', true));
    $titulo = $anio > 0 ? "Vigencia $anio" : 'Vigencia sin año';
    if (get_post_field('post_title', $id) !== $titulo) {
        wp_update_post(['ID' => $id, 'post_title' => $titulo]);
    }
}

/** @return array<int, list<string>> celdas de cada línea no vacía, por número de línea */
function jw_filas_pegadas(string $texto, string $titulo): array {
    $filas = [];
    foreach (preg_split('/\r\n|\r|\n/', $texto) as $i => $linea) {
        $celdas = array_map('trim', explode("\t", $linea));
        if (implode('', $celdas) !== '') {
            $filas[$i + 1] = $celdas;
        }
    }
    $primera = array_key_first($filas);
    if ($primera !== null && jw_minuscula($filas[$primera][0]) === $titulo) {
        unset($filas[$primera]);
    }
    return $filas;
}

function jw_minuscula(string $texto): string {
    return mb_strtolower(remove_accents(trim($texto)));
}

function jw_celda_pesos(string $celda): int {
    // Excel con formato contable copia el cero como "$ -" o "-".
    return preg_match('/^[\s$\x{00A0}-]*$/u', $celda) ? 0 : jw_pesos($celda);
}

/** @return array{filas: list<array{clase: string, grupo: string, nombre: string, presupuestado: int, ejecutado: int}>, errores: list<string>} */
function jw_tabla_presupuesto(string $texto): array {
    $clases = ['ingreso' => 'ingreso', 'ingresos' => 'ingreso', 'egreso' => 'egreso', 'egresos' => 'egreso', 'gasto' => 'egreso', 'gastos' => 'egreso'];
    $filas = [];
    $errores = [];
    foreach (jw_filas_pegadas($texto, 'clase') as $numero => $celdas) {
        $celdas = array_pad($celdas, 5, '');
        $clase = $clases[jw_minuscula($celdas[0])] ?? '';
        $grupo = jw_texto($celdas[1], 80);
        $nombre = jw_texto($celdas[2], 80);
        $presupuestado = jw_celda_pesos($celdas[3]);
        $ejecutado = jw_celda_pesos($celdas[4]);
        $falla = match (true) {
            $clase === '' => 'Clase debe ser Ingreso o Egreso',
            $grupo === '' => 'falta el Grupo',
            $nombre === '' => 'falta el Rubro',
            $presupuestado < 0 => 'Presupuestado no es un número',
            $ejecutado < 0 => 'Ejecutado no es un número',
            default => '',
        };
        if ($falla !== '') {
            $errores[] = "Fila $numero: $falla";
            continue;
        }
        $filas[] = ['clase' => $clase, 'grupo' => $grupo, 'nombre' => $nombre, 'presupuestado' => $presupuestado, 'ejecutado' => $ejecutado];
    }
    return ['filas' => $filas, 'errores' => $errores];
}

function jw_numero_mes(string $celda): int {
    $texto = jw_minuscula($celda);
    if (preg_match('/^(0?[1-9]|1[0-2])$/', $texto)) {
        return (int) $texto;
    }
    foreach (JW_MESES as $numero => $nombres) {
        if (in_array($texto, $nombres, true)) {
            return $numero;
        }
    }
    return 0;
}

/**
 * Un mes repetido conserva su última fila.
 *
 * @return array{filas: list<array{mes: int, ingresos: int, egresos: int}>, errores: list<string>}
 */
function jw_tabla_meses(string $texto): array {
    $porMes = [];
    $errores = [];
    foreach (jw_filas_pegadas($texto, 'mes') as $numero => $celdas) {
        $celdas = array_pad($celdas, 3, '');
        $mes = jw_numero_mes($celdas[0]);
        $ingresos = jw_celda_pesos($celdas[1]);
        $egresos = jw_celda_pesos($celdas[2]);
        $falla = match (true) {
            $mes === 0 => 'Mes debe ser un número de 1 a 12 o el nombre del mes',
            $ingresos < 0 => 'Ingresos no es un número',
            $egresos < 0 => 'Egresos no es un número',
            default => '',
        };
        if ($falla !== '') {
            $errores[] = "Fila $numero: $falla";
            continue;
        }
        $porMes[$mes] = ['mes' => $mes, 'ingresos' => $ingresos, 'egresos' => $egresos];
    }
    ksort($porMes);
    return ['filas' => array_values($porMes), 'errores' => $errores];
}

function jw_agregar_caja_vigencia(): void {
    remove_meta_box('postcustom', 'jw_vigencia', 'normal');
    add_meta_box('jw_vigencia_datos', 'Datos de la vigencia', 'jw_pintar_caja_vigencia', 'jw_vigencia', 'normal', 'high');
}

function jw_pesos_texto(int $valor): string {
    return '$ ' . number_format($valor, 0, ',', '.');
}

function jw_pintar_errores(array $errores): void {
    if ($errores === []) {
        return;
    }
    echo '<div class="notice notice-error inline"><p><strong>No se pudieron leer estas filas, corrígelas y guarda de nuevo:</strong></p><ul>';
    foreach ($errores as $error) {
        echo '<li>' . esc_html($error) . '</li>';
    }
    echo '</ul></div>';
}

function jw_pintar_vista_presupuesto(string $texto): void {
    $tabla = jw_tabla_presupuesto($texto);
    jw_pintar_errores($tabla['errores']);
    if ($tabla['filas'] === []) {
        return;
    }
    $totales = ['ingreso' => [0, 0], 'egreso' => [0, 0]];
    echo '<p><strong>Esto es lo que entendió el sitio:</strong></p>';
    echo '<table class="widefat striped"><thead><tr><th>Clase</th><th>Grupo</th><th>Rubro</th><th>Presupuestado</th><th>Ejecutado</th></tr></thead><tbody>';
    foreach ($tabla['filas'] as $fila) {
        $totales[$fila['clase']][0] += $fila['presupuestado'];
        $totales[$fila['clase']][1] += $fila['ejecutado'];
        printf(
            '<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
            esc_html($fila['clase'] === 'ingreso' ? 'Ingreso' : 'Egreso'),
            esc_html($fila['grupo']),
            esc_html($fila['nombre']),
            esc_html(jw_pesos_texto($fila['presupuestado'])),
            esc_html(jw_pesos_texto($fila['ejecutado']))
        );
    }
    echo '</tbody><tfoot>';
    foreach (['ingreso' => 'Total ingresos', 'egreso' => 'Total egresos'] as $clase => $etiqueta) {
        printf(
            '<tr><th colspan="3">%s</th><th>%s</th><th>%s</th></tr>',
            esc_html($etiqueta),
            esc_html(jw_pesos_texto($totales[$clase][0])),
            esc_html(jw_pesos_texto($totales[$clase][1]))
        );
    }
    echo '</tfoot></table>';
}

function jw_pintar_vista_meses(string $texto): void {
    $tabla = jw_tabla_meses($texto);
    jw_pintar_errores($tabla['errores']);
    if ($tabla['filas'] === []) {
        return;
    }
    echo '<p><strong>Esto es lo que entendió el sitio:</strong></p>';
    echo '<table class="widefat striped"><thead><tr><th>Mes</th><th>Ingresos</th><th>Egresos</th></tr></thead><tbody>';
    foreach ($tabla['filas'] as $fila) {
        printf(
            '<tr><td>%s</td><td>%s</td><td>%s</td></tr>',
            esc_html(JW_MESES[$fila['mes']][1]),
            esc_html(jw_pesos_texto($fila['ingresos'])),
            esc_html(jw_pesos_texto($fila['egresos']))
        );
    }
    printf(
        '</tbody><tfoot><tr><th>Total</th><th>%s</th><th>%s</th></tr></tfoot></table>',
        esc_html(jw_pesos_texto(array_sum(array_column($tabla['filas'], 'ingresos')))),
        esc_html(jw_pesos_texto(array_sum(array_column($tabla['filas'], 'egresos'))))
    );
}

function jw_pintar_caja_vigencia(WP_Post $post): void {
    wp_nonce_field('jw_vigencia_guardar', 'jw_vigencia_nonce');
    $meta = static fn(string $clave): string => (string) get_post_meta($post->ID, $clave, true);
    $anio = jw_anio_vigencia($meta('jw_anio'));
    $modelo = plugins_url('assets/modelo-presupuesto.xlsx', dirname(__DIR__) . '/jac-el-castillo-web.php');
    ?>
    <p class="description">Una vigencia es un año de enero a diciembre. Si el año ya existe, edita esa misma vigencia en vez de crear otra. Las tablas se pegan desde Excel, con las celdas copiadas tal cual. El título se pone solo.</p>
    <p>
        <label for="jw_anio"><strong>Año</strong></label>
        <input type="number" id="jw_anio" name="jw_anio" min="2000" max="2100" step="1" required value="<?php echo $anio > 0 ? esc_attr((string) $anio) : ''; ?>">
    </p>
    <p>
        <label for="jw_presupuesto"><strong>Presupuesto</strong></label><br>
        <textarea id="jw_presupuesto" name="jw_presupuesto" class="large-text code" rows="10" maxlength="<?php echo esc_attr((string) JW_TABLA_MAX); ?>"><?php echo esc_textarea($meta('jw_presupuesto')); ?></textarea><br>
        <span class="description">Cinco columnas: Clase (Ingreso o Egreso), Grupo, Rubro, Presupuestado y Ejecutado. La fila de títulos es opcional. Los valores aceptan "$", puntos y espacios, y los decimales se ignoran. En el sitio no salen las filas con presupuestado y ejecutado en 0. <a href="<?php echo esc_url($modelo); ?>" download>Descargar el modelo de Excel</a>.</span>
    </p>
    <?php jw_pintar_vista_presupuesto($meta('jw_presupuesto')); ?>
    <p>
        <label for="jw_meses"><strong>Meses</strong></label><br>
        <textarea id="jw_meses" name="jw_meses" class="large-text code" rows="6" maxlength="<?php echo esc_attr((string) JW_TABLA_MAX); ?>"><?php echo esc_textarea($meta('jw_meses')); ?></textarea><br>
        <span class="description">Tres columnas: Mes, Ingresos y Egresos. El mes va como número (7) o como nombre (julio o jul), nunca como fecha porque Excel la cambia. El año es el de la vigencia. Al cerrar cada mes, agrega la fila con los totales de ingresos y egresos del Excel.</span>
    </p>
    <?php jw_pintar_vista_meses($meta('jw_meses')); ?>
    <p>
        <label for="jw_nota"><strong>Nota</strong></label><br>
        <textarea id="jw_nota" name="jw_nota" class="large-text" rows="2" maxlength="300"><?php echo esc_textarea($meta('jw_nota')); ?></textarea><br>
        <span class="description">Hasta 300 caracteres, por ejemplo la fuente de las cifras o una aclaración. Sale debajo del presupuesto.</span>
    </p>
    <p class="description">Cuando la asamblea aprueba el presupuesto, crea la vigencia y pega el Presupuesto desde el modelo (estatutos, art. 140). Con cada informe aprobado por la Junta, pega de nuevo el Presupuesto con el Ejecutado al día y sube el PDF del informe como Documento de tipo Financiero.</p>
    <?php
}

function jw_guardar_vigencia(int $id): void {
    if (!jw_guardar_caja($id, 'jw_vigencia_guardar', 'jw_vigencia_nonce')) {
        return;
    }
    foreach (['jw_anio', 'jw_presupuesto', 'jw_meses', 'jw_nota'] as $clave) {
        $valor = isset($_POST[$clave]) ? wp_unslash($_POST[$clave]) : '';
        update_post_meta($id, $clave, $valor);
    }
}

function jw_columnas_vigencia(array $columnas): array {
    $nuevas = [];
    foreach ($columnas as $clave => $titulo) {
        $nuevas[$clave] = $titulo;
        if ($clave === 'title') {
            $nuevas['jw_anio'] = 'Año';
            $nuevas['jw_rubros'] = 'Rubros';
            $nuevas['jw_meses'] = 'Meses';
        }
    }
    return $nuevas;
}

function jw_pintar_columna_vigencia(string $columna, int $id): void {
    $meta = static fn(string $clave): string => (string) get_post_meta($id, $clave, true);
    if ($columna === 'jw_anio') {
        $anio = jw_anio_vigencia($meta('jw_anio'));
        echo esc_html($anio > 0 ? (string) $anio : 'Sin año');
    } elseif ($columna === 'jw_rubros') {
        echo esc_html((string) count(jw_tabla_presupuesto($meta('jw_presupuesto'))['filas']));
    } elseif ($columna === 'jw_meses') {
        echo esc_html((string) count(jw_tabla_meses($meta('jw_meses'))['filas']));
    }
}
