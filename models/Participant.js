/**
 * ═══════════════════════════════════════════════════════════════════
 *  Participant Model — CRUD operations for individual registrations
 * ═══════════════════════════════════════════════════════════════════
 */

const { getDb } = require('../config/db');

const Participant = {
  /**
   * Create a new participant record.
   * @param {Object} data - Participant fields
   * @returns {Object} - { changes, lastInsertRowid }
   */
  async create(data) {
    const db = await getDb();
    const stmt = db.prepare(`
      INSERT INTO participants (full_name, email, phone, university, experience_level, motivation, ip_address)
      VALUES (@full_name, @email, @phone, @university, @experience_level, @motivation, @ip_address)
    `);
    return stmt.run(data);
  },

  /** Retrieve all participants, newest first. */
  async findAll() {
    const db = await getDb();
    return db.prepare('SELECT * FROM participants ORDER BY created_at DESC').all();
  },

  /** Find a single participant by ID. */
  async findById(id) {
    const db = await getDb();
    return db.prepare('SELECT * FROM participants WHERE id = $1').get([id]);
  },

  /** Find a participant by email (for duplicate detection). */
  async findByEmail(email) {
    const db = await getDb();
    return db.prepare('SELECT * FROM participants WHERE email = $1').get([email]);
  },

  /** Update participant status (pending → approved | rejected). */
  async updateStatus(id, status) {
    const db = await getDb();
    return db.prepare(`
      UPDATE participants SET status = $1, updated_at = NOW() WHERE id = $2
    `).run([status, id]);
  },

  /** Total participant count. */
  async count() {
    const db = await getDb();
    return db.prepare('SELECT COUNT(*) as count FROM participants').get().count;
  },

  /** Count participants by status. */
  async countByStatus(status) {
    const db = await getDb();
    return db.prepare('SELECT COUNT(*) as count FROM participants WHERE status = $1').get([status]).count;
  }
};

module.exports = Participant;
