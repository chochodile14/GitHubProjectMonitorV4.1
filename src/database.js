const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initDatabase() {

    await pool.query(`
        CREATE TABLE IF NOT EXISTS commits (
            id SERIAL PRIMARY KEY,
            author TEXT,
            branch TEXT,
            repository TEXT,
            message TEXT,
            url TEXT,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✅ PostgreSQL connecté');
}

module.exports = {
    pool,
    initDatabase
};