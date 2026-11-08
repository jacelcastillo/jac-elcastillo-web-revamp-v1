<?php
defined('ABSPATH') || exit;

function jw_texto(mixed $valor, int $max): string {
    $texto = sanitize_text_field(is_scalar($valor) ? (string) $valor : '');
    return mb_substr($texto, 0, $max);
}

function jw_enum(mixed $valor, array $permitidos, string $defecto): string {
    return is_string($valor) && in_array($valor, $permitidos, true) ? $valor : $defecto;
}

function jw_plano(mixed $valor): string {
    $texto = is_scalar($valor) ? html_entity_decode((string) $valor, ENT_QUOTES | ENT_HTML5, 'UTF-8') : '';
    return trim(wp_strip_all_tags($texto));
}

function jw_guardar_caja(int $id, string $nonce_accion, string $nonce_campo): bool {
    if (!isset($_POST[$nonce_campo]) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST[$nonce_campo])), $nonce_accion)) {
        return false;
    }
    if (wp_is_post_autosave($id) || wp_is_post_revision($id)) {
        return false;
    }
    return current_user_can('edit_post', $id);
}
