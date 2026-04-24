/**
 * ═══════════════════════════════════════════════════════════════════
 *  SystemSetting Model — Key-value runtime configuration store
 * ═══════════════════════════════════════════════════════════════════
 */

const { getDb } = require('../config/db');

const SystemSetting = {
  /**
   * Retrieve the value of a setting by key.
   * Returns the string value, or `null` if the key doesn't exist.
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  async get(key) {
    const db  = await getDb();
    const row = await db.prepare('SELECT value FROM system_settings WHERE key = $1').get([key]);
    return row ? row.value : null;
  },

  /**
   * Upsert a setting value.
   * @param {string} key
   * @param {string} value
   */
  async set(key, value) {
    const db = await getDb();
    await db.prepare(
      'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value'
    ).run([key, String(value)]);
  },

  /**
   * Convenience: check whether registrations are currently open.
   * @returns {Promise<boolean>}
   */
  async isRegistrationOpen() {
    const val = await SystemSetting.get('registration_open');
    return val !== 'false'; // default to open if the row is missing
  }
};

module.exports = SystemSetting;
