<?php
/**
 * Plugin Name: JAC El Castillo · Sitio web
 * Description: Contenido del sitio web de la JAC El Castillo que se edita en wp-admin, como los dignatarios de cada período, publicado por una ruta REST de solo lectura.
 * Version: 0.2.0
 * Requires PHP: 8.1
 * Text Domain: jac-el-castillo-web
 */

defined('ABSPATH') || exit;

const JW_VERSION = '0.2.0';

require_once __DIR__ . '/includes/sanitizar.php';
require_once __DIR__ . '/includes/dignatarios.php';
require_once __DIR__ . '/includes/rest.php';
