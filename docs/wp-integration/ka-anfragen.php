<?php
/**
 * KS-1: Koch Aufforstung ForstManager Integration
 * 
 * WordPress MU-Plugin für bidirektionale Synchronisation mit dem ForstManager.
 * 
 * Installieren:
 * 1. Diese Datei nach /wp-content/mu-plugins/ka-anfragen.php kopieren
 * 2. WP-Admin → Einstellungen → KA ForstManager für Token-Konfiguration
 * 
 * @package Koch_Aufforstung
 * @version 1.0.0
 */

if (!defined('ABSPATH')) exit;

// ============================================================================
// KONFIGURATION
// ============================================================================

define('KA_FM_API_URL', 'https://ka-forstmanager.vercel.app/api/anfragen/wp-webhook');
define('KA_FM_WEBHOOK_TOKEN', get_option('ka_fm_webhook_token', 'KochAufforstungWebhook2026'));

// ============================================================================
// KS-1: ANFRAGEN AN FORSTMANAGER SENDEN
// ============================================================================

/**
 * Sendet eine neue Wizard-Anfrage an den ForstManager
 * Fire-and-Forget: Keine Blockierung bei Fehlern
 * 
 * @param int   $anfrage_id   Post-ID der Anfrage in WP
 * @param array $anfrage_data Daten aus dem Wizard
 * @return void
 */
function ka_sync_anfrage_to_fm($anfrage_id, $anfrage_data) {
    // Daten für ForstManager aufbereiten
    $fm_data = array(
        'id'            => $anfrage_id,
        'titel'         => isset($anfrage_data['titel']) ? $anfrage_data['titel'] : get_the_title($anfrage_id),
        'waldbesitzer'  => isset($anfrage_data['waldbesitzer']) ? $anfrage_data['waldbesitzer'] : '',
        'email'         => isset($anfrage_data['email']) ? $anfrage_data['email'] : '',
        'telefon'       => isset($anfrage_data['telefon']) ? $anfrage_data['telefon'] : '',
        'flaeche'       => isset($anfrage_data['flaeche']) ? $anfrage_data['flaeche'] : '',
        'standort'      => isset($anfrage_data['standort']) ? $anfrage_data['standort'] : '',
        'bundesland'    => isset($anfrage_data['bundesland']) ? $anfrage_data['bundesland'] : '',
        'angelegt'      => time(),
        'wizard_typ'    => isset($anfrage_data['wizard_typ']) ? $anfrage_data['wizard_typ'] : 'anfrage',
        'wizard_daten'  => isset($anfrage_data['wizard_daten']) ? $anfrage_data['wizard_daten'] : array(),
        'status'        => 'anfrage',
        'kommentar'     => isset($anfrage_data['kommentar']) ? $anfrage_data['kommentar'] : '',
    );

    // Fire-and-forget Request
    wp_remote_post(KA_FM_API_URL, array(
        'headers'  => array(
            'Authorization' => 'Bearer ' . KA_FM_WEBHOOK_TOKEN,
            'Content-Type'  => 'application/json',
        ),
        'body'     => json_encode($fm_data),
        'timeout'  => 10,
        'blocking' => false, // Non-blocking!
    ));
    
    // Sync-Timestamp speichern
    update_post_meta($anfrage_id, 'ka_fm_synced_at', current_time('mysql'));
}

/**
 * Hook: Nach Contact Form 7 Submission
 */
add_action('wpcf7_mail_sent', function($contact_form) {
    $submission = WPCF7_Submission::get_instance();
    if (!$submission) return;
    
    $data = $submission->get_posted_data();
    
    // Nur für Wizard-Formulare
    if (empty($data['wizard_typ'])) return;
    
    // Als WP-Post speichern (falls gewünscht)
    $post_id = wp_insert_post(array(
        'post_type'   => 'ka_anfrage',
        'post_status' => 'publish',
        'post_title'  => sprintf('Anfrage von %s', $data['name'] ?? 'Unbekannt'),
        'meta_input'  => $data,
    ));
    
    if ($post_id && !is_wp_error($post_id)) {
        ka_sync_anfrage_to_fm($post_id, $data);
    }
});

/**
 * Hook: Manueller Sync-Button im Admin
 */
add_action('admin_post_ka_sync_to_fm', function() {
    if (!current_user_can('edit_posts')) wp_die('Unauthorized');
    check_admin_referer('ka_sync_to_fm');
    
    $post_id = intval($_GET['post_id'] ?? 0);
    if (!$post_id) wp_die('Invalid Post ID');
    
    $meta = get_post_meta($post_id);
    $data = array();
    foreach ($meta as $key => $value) {
        $data[$key] = maybe_unserialize($value[0]);
    }
    
    ka_sync_anfrage_to_fm($post_id, $data);
    
    wp_redirect(add_query_arg('ka_synced', '1', admin_url('post.php?post=' . $post_id . '&action=edit')));
    exit;
});

// ============================================================================
// KT-1: STATUS-EMPFÄNGER VON FORSTMANAGER
// ============================================================================

/**
 * REST API Endpoint für Status-Updates vom ForstManager
 */
add_action('rest_api_init', function() {
    register_rest_route('koch/v1', '/anfrage/(?P<id>\d+)/status', array(
        'methods'             => 'PATCH',
        'callback'            => 'ka_update_anfrage_status',
        'permission_callback' => 'ka_verify_fm_auth',
        'args'                => array(
            'id'     => array('required' => true, 'type' => 'integer'),
            'status' => array('required' => true, 'type' => 'string'),
        ),
    ));
});

/**
 * Authentifizierung für ForstManager-Requests
 */
function ka_verify_fm_auth($request) {
    $auth_header = $request->get_header('Authorization');
    if (!$auth_header) return false;
    
    // Basic Auth prüfen
    if (strpos($auth_header, 'Basic ') === 0) {
        $credentials = base64_decode(substr($auth_header, 6));
        list($user, $pass) = explode(':', $credentials, 2);
        return wp_authenticate($user, $pass) instanceof WP_User;
    }
    
    return false;
}

/**
 * Status-Update vom ForstManager verarbeiten
 */
function ka_update_anfrage_status($request) {
    $post_id = $request['id'];
    $status  = sanitize_text_field($request['status']);
    $nummer  = isset($request['nummer']) ? sanitize_text_field($request['nummer']) : null;
    
    // Post prüfen
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'ka_anfrage') {
        return new WP_Error('not_found', 'Anfrage nicht gefunden', array('status' => 404));
    }
    
    // Status aktualisieren
    update_post_meta($post_id, 'auftrag_status', $status);
    update_post_meta($post_id, 'ka_fm_status', $status);
    update_post_meta($post_id, 'ka_fm_updated_at', current_time('mysql'));
    
    if ($nummer) {
        update_post_meta($post_id, 'auftrag_nummer', $nummer);
    }
    
    // Hook für weitere Aktionen (z.B. Kunden-Benachrichtigung)
    do_action('ka_anfrage_status_updated', $post_id, $status, $nummer);
    
    return array(
        'success' => true,
        'post_id' => $post_id,
        'status'  => $status,
    );
}

// ============================================================================
// ADMIN-EINSTELLUNGEN
// ============================================================================

add_action('admin_menu', function() {
    add_options_page(
        'KA ForstManager',
        'KA ForstManager',
        'manage_options',
        'ka-forstmanager',
        'ka_settings_page'
    );
});

function ka_settings_page() {
    if (isset($_POST['ka_fm_webhook_token']) && check_admin_referer('ka_settings')) {
        update_option('ka_fm_webhook_token', sanitize_text_field($_POST['ka_fm_webhook_token']));
        echo '<div class="notice notice-success"><p>Einstellungen gespeichert.</p></div>';
    }
    
    $token = get_option('ka_fm_webhook_token', 'KochAufforstungWebhook2026');
    ?>
    <div class="wrap">
        <h1>Koch Aufforstung ForstManager Integration</h1>
        <form method="post">
            <?php wp_nonce_field('ka_settings'); ?>
            <table class="form-table">
                <tr>
                    <th>Webhook Token</th>
                    <td>
                        <input type="text" name="ka_fm_webhook_token" value="<?php echo esc_attr($token); ?>" class="regular-text">
                        <p class="description">Token für die Authentifizierung mit dem ForstManager</p>
                    </td>
                </tr>
                <tr>
                    <th>API Endpoint</th>
                    <td>
                        <code><?php echo KA_FM_API_URL; ?></code>
                    </td>
                </tr>
            </table>
            <?php submit_button('Speichern'); ?>
        </form>
    </div>
    <?php
}

// ============================================================================
// STATUS-ANZEIGE IM ADMIN
// ============================================================================

add_action('add_meta_boxes', function() {
    add_meta_box(
        'ka_fm_status',
        'ForstManager Status',
        'ka_fm_status_metabox',
        'ka_anfrage',
        'side',
        'high'
    );
});

function ka_fm_status_metabox($post) {
    $status    = get_post_meta($post->ID, 'ka_fm_status', true);
    $synced_at = get_post_meta($post->ID, 'ka_fm_synced_at', true);
    $nummer    = get_post_meta($post->ID, 'auftrag_nummer', true);
    
    echo '<p><strong>Status:</strong> ' . esc_html($status ?: 'Nicht synchronisiert') . '</p>';
    if ($nummer) {
        echo '<p><strong>Auftragsnummer:</strong> ' . esc_html($nummer) . '</p>';
    }
    if ($synced_at) {
        echo '<p><small>Letzte Sync: ' . esc_html($synced_at) . '</small></p>';
    }
    
    $sync_url = wp_nonce_url(
        admin_url('admin-post.php?action=ka_sync_to_fm&post_id=' . $post->ID),
        'ka_sync_to_fm'
    );
    echo '<p><a href="' . esc_url($sync_url) . '" class="button">An ForstManager senden</a></p>';
}
