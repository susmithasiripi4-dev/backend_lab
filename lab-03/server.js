const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { getDatabaseConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Whitelist for sorting to prevent SQL injection
const ALLOWED_ORDER_BY = ['id', 'title', 'author', 'price', 'created_at'];
const ALLOWED_ORDER = ['ASC', 'DESC'];

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Lab 3 Books REST API',
    documentation: '/books'
  });
});

/**
 * GET /books
 * Query parameters:
 *  - search_q: partial title match (default: "")
 *  - order_by: sort column (default: "id")
 *  - order: sort direction "ASC" or "DESC" (default: "ASC")
 *  - limit: pagination limit (default: 10)
 *  - offset: pagination offset (default: 0)
 *  - min_price: minimum price filter
 *  - max_price: maximum price filter
 */
app.get('/books', async (req, res) => {
  try {
    const db = await getDatabaseConnection();

    const {
      search_q = '',
      order_by = 'id',
      order = 'ASC',
      limit = '10',
      offset = '0',
      min_price,
      max_price
    } = req.query;

    // Validate order_by against whitelist
    const normalizedOrderBy = String(order_by).toLowerCase();
    if (!ALLOWED_ORDER_BY.includes(normalizedOrderBy)) {
      return res.status(400).json({
        message: `Invalid order_by column. Allowed values: ${ALLOWED_ORDER_BY.join(', ')}`
      });
    }

    // Validate order direction against whitelist
    const normalizedOrder = String(order).toUpperCase();
    if (!ALLOWED_ORDER.includes(normalizedOrder)) {
      return res.status(400).json({
        message: 'Invalid order direction. Allowed values: ASC, DESC'
      });
    }

    // Validate pagination params
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        message: 'limit must be a positive integer greater than 0'
      });
    }

    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        message: 'offset must be a non-negative integer (0 or greater)'
      });
    }

    // Build parameterized query conditions
    const conditions = [];
    const params = [];

    // Search query filter (title LIKE %search_q%)
    conditions.push('title LIKE ?');
    params.push(`%${search_q}%`);

    // Price range filters
    let parsedMin = null;
    let parsedMax = null;

    if (min_price !== undefined) {
      parsedMin = parseFloat(min_price);
      if (isNaN(parsedMin) || parsedMin < 0) {
        return res.status(400).json({
          message: 'min_price must be a valid non-negative number'
        });
      }
    }

    if (max_price !== undefined) {
      parsedMax = parseFloat(max_price);
      if (isNaN(parsedMax) || parsedMax < 0) {
        return res.status(400).json({
          message: 'max_price must be a valid non-negative number'
        });
      }
    }

    if (parsedMin !== null && parsedMax !== null) {
      if (parsedMin > parsedMax) {
        return res.status(400).json({
          message: 'min_price cannot be greater than max_price'
        });
      }
      // Using BETWEEN condition as requested
      conditions.push('price BETWEEN ? AND ?');
      params.push(parsedMin, parsedMax);
    } else if (parsedMin !== null) {
      conditions.push('price >= ?');
      params.push(parsedMin);
    } else if (parsedMax !== null) {
      conditions.push('price <= ?');
      params.push(parsedMax);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT id, title, author, price, created_at
      FROM books
      ${whereClause}
      ORDER BY ${normalizedOrderBy} ${normalizedOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(parsedLimit, parsedOffset);

    const books = await db.all(sql, params);
    return res.status(200).json(books);
  } catch (error) {
    console.error('Error in GET /books:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /books/:id
 * Retrieve a single book by ID
 */
app.get('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bookId = parseInt(id, 10);

    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({ message: 'Book id must be a positive integer' });
    }

    const db = await getDatabaseConnection();
    const book = await db.get('SELECT id, title, author, price, created_at FROM books WHERE id = ?', [bookId]);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error('Error in GET /books/:id:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /books
 * Create a new book
 * Body validation:
 *  - title (required non-empty string)
 *  - author (required non-empty string)
 *  - price (required numeric, non-negative)
 */
app.post('/books', async (req, res) => {
  try {
    const { title, author, price } = req.body;

    // Validate title
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        message: 'title is required and must be a non-empty string'
      });
    }

    // Validate author
    if (!author || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({
        message: 'author is required and must be a non-empty string'
      });
    }

    // Validate price
    const numPrice = Number(price);
    if (
      price === undefined ||
      price === null ||
      typeof price === 'boolean' ||
      isNaN(numPrice) ||
      numPrice < 0
    ) {
      return res.status(400).json({
        message: 'price is required and must be a valid non-negative number'
      });
    }

    const db = await getDatabaseConnection();
    const result = await db.run(
      'INSERT INTO books (title, author, price) VALUES (?, ?, ?)',
      [title.trim(), author.trim(), numPrice]
    );

    return res.status(201).json({
      message: 'Book created successfully',
      bookId: result.lastID
    });
  } catch (error) {
    console.error('Error in POST /books:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /books/:id
 * Update an existing book by ID
 */
app.put('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bookId = parseInt(id, 10);

    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({ message: 'Book id must be a positive integer' });
    }

    const db = await getDatabaseConnection();

    // Check if the book exists
    const existingBook = await db.get('SELECT * FROM books WHERE id = ?', [bookId]);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const { title, author, price } = req.body;

    // Validate fields if provided
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({
        message: 'title must be a non-empty string'
      });
    }

    if (author !== undefined && (typeof author !== 'string' || author.trim() === '')) {
      return res.status(400).json({
        message: 'author must be a non-empty string'
      });
    }

    if (price !== undefined) {
      const numPrice = Number(price);
      if (typeof price === 'boolean' || isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({
          message: 'price must be a valid non-negative number'
        });
      }
    }

    const updatedTitle = title !== undefined ? title.trim() : existingBook.title;
    const updatedAuthor = author !== undefined ? author.trim() : existingBook.author;
    const updatedPrice = price !== undefined ? Number(price) : existingBook.price;

    await db.run(
      'UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?',
      [updatedTitle, updatedAuthor, updatedPrice, bookId]
    );

    return res.status(200).json({
      message: 'Book updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /books/:id:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /books/:id
 * Delete a book by ID
 */
app.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bookId = parseInt(id, 10);

    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({ message: 'Book id must be a positive integer' });
    }

    const db = await getDatabaseConnection();

    // Check if the book exists
    const existingBook = await db.get('SELECT id FROM books WHERE id = ?', [bookId]);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    await db.run('DELETE FROM books WHERE id = ?', [bookId]);

    return res.status(200).json({
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /books/:id:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
