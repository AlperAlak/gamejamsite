/**
 * ═══════════════════════════════════════════════════════════════════
 *  Team Model — CRUD operations for team registrations
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Team creation is wrapped in a transaction to atomically insert
 *  both the team record and all team member records.
 * ═══════════════════════════════════════════════════════════════════
 */

const { getDb } = require('../config/db');

const Team = {
  async create(data) {
    const db = await getDb();

    // Since our wrapper's transaction implementation is async and expects the logic inside,
    // we'll handle the insertion logic here. The wrapper handles BEGIN/COMMIT.
    return db.transaction(async (client) => {
      // Create Team
      const teamResult = await db.prepare(`
        INSERT INTO teams (team_name, captain_name, captain_email, captain_phone, university, member_count, ip_address)
        VALUES (@team_name, @captain_name, @captain_email, @captain_phone, @university, @member_count, @ip_address)
      `).run(data);

      const teamId = teamResult.lastInsertRowid;

      // Create Members
      if (data.members && data.members.length > 0) {
        for (const member of data.members) {
          await db.prepare(`
            INSERT INTO team_members (team_id, full_name, email)
            VALUES (@team_id, @full_name, @email)
          `).run({
            team_id:   teamId,
            full_name: member.fullName,
            email:     member.email
          });
        }
      }

      return teamId;
    });
  },

  /** Retrieve all teams, newest first. */
  async findAll() {
    const db = await getDb();
    return db.prepare('SELECT * FROM teams ORDER BY created_at DESC').all();
  },

  /** Find a single team by ID (includes member list). */
  async findById(id) {
    const db = await getDb();
    const team = db.prepare('SELECT * FROM teams WHERE id = $1').get([id]);
    if (team) {
      team.members = db.prepare('SELECT * FROM team_members WHERE team_id = $1').all([id]);
    }
    return team;
  },

  /** Find a team by its name (for duplicate detection). */
  async findByName(name) {
    const db = await getDb();
    return db.prepare('SELECT * FROM teams WHERE team_name = $1').get([name]);
  },

  /** Find a team by captain email (for duplicate detection). */
  async findByCaptainEmail(email) {
    const db = await getDb();
    return db.prepare('SELECT * FROM teams WHERE captain_email = $1').get([email]);
  },

  /** Update team status (pending → approved | rejected). */
  async updateStatus(id, status) {
    const db = await getDb();
    return db.prepare(`
      UPDATE teams SET status = $1, updated_at = NOW() WHERE id = $2
    `).run([status, id]);
  },

  /** Total team count. */
  async count() {
    const db = await getDb();
    return db.prepare('SELECT COUNT(*) as count FROM teams').get().count;
  },

  /** Count teams by status. */
  async countByStatus(status) {
    const db = await getDb();
    return db.prepare('SELECT COUNT(*) as count FROM teams WHERE status = $1').get([status]).count;
  }
};

module.exports = Team;
