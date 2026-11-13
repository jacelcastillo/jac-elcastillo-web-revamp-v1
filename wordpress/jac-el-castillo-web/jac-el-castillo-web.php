<?php
/**
 * Plugin Name: JAC El Castillo · Sitio web
 * Description: Contenido del sitio web de la JAC El Castillo que se edita en wp-admin, como los dignatarios de cada período, los proyectos y las comisiones, publicado por rutas REST de solo lectura.
 * Version: 0.7.0
 * Requires PHP: 8.1
 * Text Domain: jac-el-castillo-web
 */

defined('ABSPATH') || exit;

const JW_VERSION = '0.7.0';
const JW_MENU = 'jac-el-castillo';

require_once __DIR__ . '/includes/sanitizar.php';
require_once __DIR__ . '/includes/dignatarios.php';
require_once __DIR__ . '/includes/comisiones.php';
require_once __DIR__ . '/includes/proyectos.php';
require_once __DIR__ . '/includes/rest.php';

add_action('after_setup_theme', 'jw_soportar_fotos');

function jw_soportar_fotos(): void {
    add_theme_support('post-thumbnails', ['jw_dignatario', 'jw_proyecto']);
}

add_action('admin_menu', 'jw_agregar_menu', 9);
add_action('admin_menu', 'jw_ordenar_menu', 11);
add_filter('parent_file', 'jw_resaltar_menu');

// Prioridad 9 y 11: core agrega los submenús de los tipos en 10 y crea un duplicado del maestro.
function jw_agregar_menu(): void {
    $nombre = get_bloginfo('name');
    $nombre = $nombre !== '' ? $nombre : 'JAC El Castillo';
    add_menu_page($nombre, $nombre, 'edit_posts', JW_MENU, '', 'dashicons-groups', 26);
}

function jw_ordenar_menu(): void {
    remove_submenu_page(JW_MENU, JW_MENU);
    add_submenu_page(JW_MENU, 'Categorías de proyecto', 'Categorías de proyecto', 'manage_categories', 'edit-tags.php?taxonomy=jw_proyecto_categoria&amp;post_type=jw_proyecto');
}

function jw_resaltar_menu(string $parent_file): string {
    return get_current_screen()?->taxonomy === 'jw_proyecto_categoria' ? JW_MENU : $parent_file;
}
