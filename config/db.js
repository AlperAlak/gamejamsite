/**
 * ═══════════════════════════════════════════════════════════════════
 *  Database Configuration — PostgreSQL (Enterprise Upgrade)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Uses the `pg` driver for Dockerized PostgreSQL.
 *  Maintains a backwards-compatible wrapper for our existing Models
 *  to avoid massive controllers/models rewriting during migration.
 * ═══════════════════════════════════════════════════════════════════
 */

const { Pool } = require('pg');

// Parse environment variables mapped from standard PG_ envs or string
const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || 'kgj_admin',
  password: process.env.PG_PASSWORD || 'kgj_secure_pass_2026',
  database: process.env.PG_DATABASE || 'gamejam',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

/**
 * ═══════════════════════════════════════════════════════════════════
 *  COMPATIBILITY WRAPPER
 * ═══════════════════════════════════════════════════════════════════
 * Previously we used:
 * db.prepare('SELECT * FROM users WHERE email = @email').get({email: '...'})
 * 
 * We now translate to PostgreSQL parameterized queries:
 * db.query({ sql: '...', values: { email: '...' } })
 */

const dbWrapper = {
  
  /**
   * Translates Named parameters (@param) to Postgres parameters ($1, $2)
   */
  _translateQuery(sql, data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        // Assume positional or no params (rare in our previous codebase)
        return { text: sql, values: Array.isArray(data) ? data : [] };
    }

    let text = sql;
    const values = [];
    let counter = 1;

    for (const [key, value] of Object.entries(data)) {
        // Replace all @key with $counter
        const regex = new RegExp(`@${key}\\b`, 'g');
        if (text.match(regex)) {
            text = text.replace(regex, `$${counter}`);
            values.push(value);
            counter++;
        }
    }
    
    // Convert SQLite AUTOINCREMENT syntax mapping if we have raw SQL left over
    // Mostly handled by init.sql now.
    return { text, values };
  },

  prepare(sql) {
    return {
      async run(data) {
        const { text, values } = dbWrapper._translateQuery(sql, data);
        // Only append RETURNING id for plain INSERTs (tables with serial id column).
        // Upserts using ON CONFLICT may target tables without an id column (e.g. system_settings),
        // so we must NOT append RETURNING id in that case.
        const upperText = text.trim().toUpperCase();
        const isPlainInsert = upperText.startsWith('INSERT') && !upperText.includes('ON CONFLICT');
        const queryToRun = isPlainInsert ? `${text} RETURNING id` : text;

        try {
            const res = await pool.query(queryToRun, values);
            return {
                lastInsertRowid: res.rows[0]?.id || 0,
                changes: res.rowCount
            };
        } catch (err) {
            console.error('DB Run Error:', err.message, '\nSQL:', text);
            throw err;
        }
      },
      async get(data) {
        const { text, values } = dbWrapper._translateQuery(sql, data);
        try {
            const res = await pool.query(text, values);
            return res.rows[0]; // Object or undefined
        } catch (err) {
            console.error('DB Get Error:', err.message, '\nSQL:', text);
            throw err;
        }
      },
      async all(data) {
        const { text, values } = dbWrapper._translateQuery(sql, data);
        try {
            const res = await pool.query(text, values);
            return res.rows; // Array of objects
        } catch (err) {
            console.error('DB All Error:', err.message, '\nSQL:', text);
            throw err;
        }
      }
    };
  },

  async transaction(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};

// ─── Export wrapper exactly like the old sql.js one ───────────────
let dbReady = pool.connect()
    .then(client => {
        console.log('✅ PostgreSQL database connection established');
        client.release();
        return dbWrapper;
    })
    .catch(err => {
        console.error('❌ Failed to connect to PostgreSQL:', err.message);
        process.exit(-1);
    });

module.exports = {
  getDb: async () => {
    await dbReady;
    return dbWrapper;
  },
  ready: dbReady // Promise for server.js to wait on
};
