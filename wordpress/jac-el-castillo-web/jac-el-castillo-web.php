<?php
/**
 * Plugin Name: JAC El Castillo · Sitio web
 * Description: Contenido del sitio web de la JAC El Castillo que se edita en wp-admin, como los dignatarios de cada período, los proyectos y las comisiones, publicado por rutas REST de solo lectura.
 * Version: 0.5.0
 * Requires PHP: 8.1
 * Text Domain: jac-el-castillo-web
 */

defined('ABSPATH') || exit;

const JW_VERSION = '0.5.0';

require_once __DIR__ . '/includes/sanitizar.php';
require_once __DIR__ . '/includes/dignatarios.php';
require_once __DIR__ . '/includes/proyectos.php';
require_once __DIR__ . '/includes/comisiones.php';
require_once __DIR__ . '/includes/rest.php';

add_action('after_setup_theme', 'jw_soportar_fotos');

function jw_soportar_fotos(): void {
    add_theme_support('post-thumbnails', ['jw_dignatario', 'jw_proyecto']);
}
