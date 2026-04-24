/**
 * ═══════════════════════════════════════════════════════════════════
 *  Submission Model — CRUD operations for game submissions
 * ═══════════════════════════════════════════════════════════════════
 */

const { getDb } = require('../config/db');

const Submission = {
  /**
   * Create a new game submission.
   * @param {Object} data - Submission fields
   * @returns {Object} - { changes, lastInsertRowid }
   */
  async create(data) {
    const db = await getDb();
    return db.prepare(`
      INSERT INTO submissions (title, description, game_url, source_url, team_id, participant_id)
      VALUES (@title, @description, @game_url, @source_url, @team_id, @participant_id)
    `).run(data);
  },

  /** Retrieve all submissions with team/participant names, newest first. */
  async findAll() {
    const db = await getDb();
    return db.prepare(`
      SELECT s.*,
             t.team_name,
             p.full_name as participant_name
      FROM submissions s
      LEFT JOIN teams t ON s.team_id = t.id
      LEFT JOIN participants p ON s.participant_id = p.id
      ORDER BY s.created_at DESC
    `).all();
  },

  /** Find a single submission by ID. */
  async findById(id) {
    const db = await getDb();
    return db.prepare(`
      SELECT s.*,
             t.team_name,
             p.full_name as participant_name
      FROM submissions s
      LEFT JOIN teams t ON s.team_id = t.id
      LEFT JOIN participants p ON s.participant_id = p.id
      WHERE s.id = $1
    `).get([id]);
  },

  /** Update submission status (pending → approved | featured | rejected). */
  async updateStatus(id, status) {
    const db = await getDb();
    return db.prepare(`
      UPDATE submissions SET status = $1, updated_at = NOW() WHERE id = $2
    `).run([status, id]);
  },

  /** Total submission count. */
  async count() {
    const db = await getDb();
    return db.prepare('SELECT COUNT(*) as count FROM submissions').get().count;
  },

  /** Count submissions by status. */
  async countByStatus(status) {
    const db = await getDb();
    return db.prepare('SELECT COUNT(*) as count FROM submissions WHERE status = $1').get([status]).count;
  }
};

module.exports = Submission;
