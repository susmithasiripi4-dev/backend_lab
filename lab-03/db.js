const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(__dirname, process.env.DATABASE_PATH)
  : path.resolve(__dirname, 'database.db');

let dbPromise = null;

async function getDatabaseConnection() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });

      // Enable foreign key constraints
      await db.run('PRAGMA foreign_keys = ON;');

      // Create books table if not exists
      await db.exec(`
        CREATE TABLE IF NOT EXISTS books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          price REAL NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed initial data if table is empty
      const countRow = await db.get('SELECT COUNT(*) as count FROM books');
      if (countRow.count === 0) {
        const seedBooks = [
          ['Clean Code', 'Robert C. Martin', 450.0],
          ['The Pragmatic Programmer', 'Andrew Hunt & David Thomas', 550.0],
          ['JavaScript: The Good Parts', 'Douglas Crockford', 300.0],
          ['Introduction to Algorithms', 'Thomas H. Cormen', 890.0],
          ['Design Patterns', 'Erich Gamma et al.', 620.0],
          ['You Don\'t Know JS Yet', 'Kyle Simpson', 350.0],
          ['Database System Concepts', 'Abraham Silberschatz', 750.0],
          ['Computer Networks', 'Andrew S. Tanenbaum', 680.0]
        ];

        for (const [title, author, price] of seedBooks) {
          await db.run(
            'INSERT INTO books (title, author, price) VALUES (?, ?, ?)',
            [title, author, price]
          );
        }
      }

      return db;
    })();
  }

  return dbPromise;
}

module.exports = {
  getDatabaseConnection,
  dbPath
};
