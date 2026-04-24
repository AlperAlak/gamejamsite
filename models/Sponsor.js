/**
 * ═══════════════════════════════════════════════════════════════════
 *  Sponsor Model — Manages sponsor logos and categories
 *  Categories: 'main' (Ana Sponsor) | 'extra' (Ekstra Sponsor)
 * ═══════════════════════════════════════════════════════════════════
 */

const { getDb } = require('../config/db');

const Sponsor = {
  /**
   * Return all sponsors ordered by category (main first) then by display_order.
   * @returns {Promise<Array>}
   */
  async findAll() {
    const db = await getDb();
    return db.prepare(`
      SELECT * FROM sponsors
      ORDER BY
        CASE category WHEN 'main' THEN 0 ELSE 1 END,
        display_order ASC,
        id ASC
    `).all([]);
  },

  /**
   * Return only sponsors of a given category.
   * @param {'main'|'extra'} category
   * @returns {Promise<Array>}
   */
  async findByCategory(category) {
    const db = await getDb();
    return db.prepare(
      `SELECT * FROM sponsors WHERE category = $1 ORDER BY display_order ASC, id ASC`
    ).all([category]);
  },

  /**
   * Create a new sponsor entry.
   * @param {{ name: string, logo_url: string, website_url: string, category: string }} data
   * @returns {Promise<object>} inserted row
   */
  async create({ name, logo_url, website_url = null, category = 'main', display_order = 0 }) {
    const db = await getDb();
    const result = await db.prepare(`
      INSERT INTO sponsors (name, logo_url, website_url, category, display_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `).get([name, logo_url, website_url, category, display_order]);
    return result;
  },

  /**
   * Delete a sponsor by id.
   * @param {number} id
   */
  async delete(id) {
    const db = await getDb();
    await db.prepare('DELETE FROM sponsors WHERE id = $1').run([id]);
  },

  /**
   * Count all sponsors.
   * @returns {Promise<number>}
   */
  async count() {
    const db = await getDb();
    const row = await db.prepare('SELECT COUNT(*)::int AS count FROM sponsors').get([]);
    return row ? row.count : 0;
  }
};

module.exports = Sponsor;
