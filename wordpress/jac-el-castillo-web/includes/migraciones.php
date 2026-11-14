<?php
defined('ABSPATH') || exit;

add_action('init', 'jw_migrar');

// "Reemplazar el actual" al subir el zip no corre la activación, por eso se compara la versión guardada en cada carga.
function jw_migrar(): void {
    $guardada = (string) get_option('jw_version', '0');
    if (version_compare($guardada, JW_VERSION, '>=')) {
        return;
    }

    if (version_compare($guardada, '0.8.0', '<')) {
        jw_migrar_0_8_0();
    }

    update_option('jw_version', JW_VERSION);
}

function jw_migrar_0_8_0(): void {
    add_role('jw_tesoreria', 'Tesorería y documentos', ['read' => true, 'upload_files' => true]);
    foreach (['jw_tesoreria', 'administrator', 'editor'] as $rol) {
        foreach (JW_CAPS_TESORERIA as $cap) {
            get_role($rol)?->add_cap($cap);
        }
    }
}
