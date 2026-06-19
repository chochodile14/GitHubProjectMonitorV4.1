const Database = require('better-sqlite3');

const db = new Database('monitor.db');

db.exec(`
CREATE TABLE IF NOT EXISTS commits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT,
    branch TEXT,
    repository TEXT,
    message TEXT,
    url TEXT,
    date TEXT
)
`);

module.exports = db;
