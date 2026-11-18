const { getDatabaseConnection } = require('./db');

async function initializeDatabase() {
  try {
    const db = await getDatabaseConnection();

    // Drop table to reset clean state if run directly
    await db.exec('DROP TABLE IF EXISTS books;');

    await db.exec(`
      CREATE TABLE books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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

    console.log('Database initialized and seeded successfully with 8 books.');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
