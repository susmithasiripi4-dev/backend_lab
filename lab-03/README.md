# Lab 3: REST API, query parameters, validation, debugging

**Sushmitha** · **[Registration Number]** · **Section [Section]**  
*Backend Development Fundamentals · Year II Term II · Aurora · Faculty: Joel Prashanth D*

---

## Live Link
- **Deployed URL:** `https://your-deployment-url.onrender.com`  
  *(Replace with your live URL on Render / Railway / NxtWave Cloud IDE, or note: "Local deployment tested via Postman as documented below")*

---

## How to Run

### Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)
- Postman (for API testing)

### Installation & Execution Commands

1. **Clone the repository and navigate into the `lab-03` directory:**
   ```bash
   cd lab-03
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Required Environment Variables (see `.env.example`):*
   - `PORT`: Port number on which the server listens (e.g. `3000`)
   - `DATABASE_PATH`: Relative or absolute path to the SQLite database file (e.g. `./database.db`)

4. **Initialize / Seed the Database (Optional):**
   ```bash
   npm run init-db
   ```
   *(Note: The server will also automatically create the `books` table and seed initial books on startup if the database is empty.)*

5. **Start the Server:**
   - **Production mode:**
     ```bash
     npm start
     ```
   - **Development mode (with auto-reload):**
     ```bash
     npm run dev
     ```

The server will start at: `http://localhost:3000`

---

## Endpoints / Scripts Table

### Available Scripts
| Command | Description |
| :--- | :--- |
| `npm start` | Starts the Express server using `node server.js` |
| `npm run dev` | Starts the Express server with live reload using `nodemon` |
| `npm run init-db` | Resets and seeds the SQLite `database.db` file with 8 sample books |

### API Endpoints
All endpoints use the plural noun resource `/books` and map HTTP verbs directly to CRUD actions.

| HTTP Method | Endpoint Path | Description | Query / Body Parameters | Success Status | Failure Status Codes |
| :---: | :--- | :--- | :--- | :---: | :---: |
| `GET` | `/` | API status and root greeting | None | `200 OK` | `500` |
| `GET` | `/books` | Retrieve books with optional search, sorting, price filter & pagination | **Query Parameters:**<br>• `search_q` (string, partial title match, default: `""`)<br>• `order_by` (`id` \| `title` \| `author` \| `price`, default: `id`)<br>• `order` (`ASC` \| `DESC`, default: `ASC`)<br>• `limit` (integer > 0, default: `10`)<br>• `offset` (integer >= 0, default: `0`)<br>• `min_price` (numeric >= 0)<br>• `max_price` (numeric >= 0) | `200 OK` | `400 Bad Request`<br>`500 Internal Error` |
| `GET` | `/books/:id` | Retrieve a single book by primary key ID | **Path Parameter:**<br>• `id` (positive integer) | `200 OK` | `400 Bad Request`<br>`404 Not Found`<br>`500 Internal Error` |
| `POST` | `/books` | Create a new book record | **JSON Body:**<br>• `title` (required, non-empty string)<br>• `author` (required, non-empty string)<br>• `price` (required, valid non-negative number) | `201 Created` | `400 Bad Request`<br>`500 Internal Error` |
| `PUT` | `/books/:id` | Update an existing book's details | **Path Parameter:** `id`<br>**JSON Body:** Optional fields to update (`title`, `author`, `price`) | `200 OK` | `400 Bad Request`<br>`404 Not Found`<br>`500 Internal Error` |
| `DELETE` | `/books/:id` | Delete a book record by ID | **Path Parameter:** `id` (positive integer) | `200 OK` | `400 Bad Request`<br>`404 Not Found`<br>`500 Internal Error` |

---

## Screenshots

Screenshots of Postman requests proving successful and failure responses are stored in [`screenshots/`](screenshots/):

### 1. GET /books (Default & Query Filters)
- **Get all books with default params:**  
  ![GET all books](screenshots/01_get_all_books.png)
- **Search books by title (`?search_q=Clean`):**  
  ![GET search books](screenshots/02_get_books_search_filter.png)
- **Sort books by price descending (`?order_by=price&order=DESC`):**  
  ![GET sort books](screenshots/03_get_books_sort_price.png)
- **Price range filter (`?min_price=300&max_price=600`):**  
  ![GET price filter](screenshots/04_get_books_price_range.png)

### 2. Single Record & 404 Not Found
- **GET existing book by ID (`/books/1` - 200 OK):**  
  ![GET single book](screenshots/05_get_book_by_id_200.png)
- **GET non-existent book (`/books/9999` - 404 Not Found):**  
  ![GET 404 Not Found](screenshots/06_get_book_not_found_404.png)

### 3. POST /books & Input Validation
- **POST create book successfully (201 Created):**  
  ![POST book success](screenshots/07_post_book_created_201.png)
- **POST validation rejection on missing/invalid fields (400 Bad Request):**  
  ![POST book validation error](screenshots/08_post_book_validation_400.png)

### 4. PUT & DELETE
- **PUT update existing book (200 OK):**  
  ![PUT book success](screenshots/09_put_book_updated_200.png)
- **DELETE existing book (200 OK):**  
  ![DELETE book success](screenshots/10_delete_book_200.png)

### 5. Database Verification
- **SQLite records view in database viewer or terminal:**  
  ![SQLite DB View](screenshots/11_database_sqlite_view.png)

---

## Notes: Problems Faced and How You Solved Them

During the debugging exercise and lab implementation, four primary bugs and development challenges were encountered and resolved:

### 1. Port Conflict (`EADDRINUSE`)
- **Problem:** The server crashed on startup with `Error: listen EADDRINUSE: address already in use :::3000`. This occurred because port `3000` was hardcoded (`const PORT = 3000;`) and another background process or previous failed instance was still listening on that port.
- **Solution:** 
  1. Updated `server.js` to read dynamically from environment variables: `const PORT = process.env.PORT || 3000;`.
  2. Terminated the existing process bound to port 3000 using PowerShell (`Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force`) or `npx kill-port 3000`.

### 2. Wrong Import Path (`MODULE_NOT_FOUND`)
- **Problem:** The starter code crashed with `Cannot find module './database/db'`.
- **Solution:** Checked the directory structure. The database connection file was named `db.js` located in the root directory. Changed the import statement in `server.js` from `require('./database/db')` to `require('./db')`.

### 3. Table-Name Typo (`no such table: book`)
- **Problem:** When sending a `GET /books` request, SQLite threw `SQLITE_ERROR: no such table: book`.
- **Solution:** Inspected the database creation schema and noticed the table was created using plural `CREATE TABLE books (...)`. The SQL queries in the route handlers erroneously queried `FROM book` (singular). Standardized all SQL queries across the project to target `FROM books`.

### 4. Missing `await` in Database Operations
- **Problem:** The API returned empty JSON objects `{}` or responded before the database query completed.
- **Solution:** Database methods from the `sqlite` driver (`db.all()`, `db.get()`, `db.run()`) return Promises. In the buggy code, `const books = db.all(...)` lacked `await`, causing Express to serialize a pending Promise object (`{}`) instead of the actual data rows. Fixed this by declaring route handlers as `async (req, res)` and awaiting every asynchronous database call: `const books = await db.all(...)`.

### 5. Preventing SQL Injection with Parameterized Queries and Whitelisting
- **Problem:** Dynamic query parameters like `order_by` cannot be directly bound via SQLite `?` parameter placeholders, whereas filters like `search_q`, `min_price`, and `max_price` could lead to SQL injection if concatenated directly.
- **Solution:** 
  - Validated `order_by` and `order` against strict in-memory whitelists (`['id', 'title', 'author', 'price']` and `['ASC', 'DESC']`).
  - Used strict parameter binding (`?`) for all user-supplied filter values: `title LIKE ?`, `price BETWEEN ? AND ?`, `LIMIT ? OFFSET ?`.

---

## Viva Questions & Answers

### 1. Query parameter vs Path parameter?
- **Path Parameter (e.g., `/books/:id` $\rightarrow$ `/books/5`):**
  - **Purpose:** Used to identify a specific, unique resource or entity in the hierarchy.
  - **Requirement:** Typically mandatory because without it the route points to a completely different endpoint (e.g. `/books` vs `/books/5`).
  - **Access in Express:** Accessed via `req.params.id`.
- **Query Parameter (e.g., `/books?search_q=Clean&min_price=200&limit=5`):**
  - **Purpose:** Used to filter, sort, search, or paginate a collection of resources without altering the identity of the endpoint.
  - **Requirement:** Almost always optional; default fallback values should be applied if omitted.
  - **Access in Express:** Accessed via `req.query.search_q`.

### 2. What does stateless mean?
- In REST architecture, **statelessness** means that the server does not store any client session context between requests.
- Every HTTP request from a client to the server must contain **all** the information necessary for the server to understand and process the request (including authentication credentials, query filters, and data payload).
- **Benefits:**
  - **Scalability:** Any server instance in a load-balanced cluster can handle any request independently.
  - **Reliability:** Server restarts or crashes do not lose client session state.
  - **Simplicity:** Server logic is decoupled from tracking connection lifecycles.

### 3. Which status code for bad input vs a missing record?
- **Bad Input $\rightarrow$ `400 Bad Request`:**
  - Used when the client sends malformed JSON, missing required fields (e.g., missing `title` or `author` in `POST /books`), invalid data types (e.g., passing a string for `price`), or out-of-range parameters (e.g., `min_price > max_price`).
  - The response should include a clear error message explaining what was wrong with the payload (e.g., `{ "message": "price is required and must be a valid non-negative number" }`).
- **Missing Record $\rightarrow$ `404 Not Found`:**
  - Used when the client request is syntactically valid, but the target resource identified by the URI does not exist in the database (e.g., `GET /books/9999` or `DELETE /books/9999`).
  - The response should return a uniform error object: `{ "message": "Book not found" }`.

---

## Compliance with Course Rules
- [x] **No `.env` or `node_modules` committed:** `.gitignore` configured properly.
- [x] **No plain-text credentials:** Environment variables configured via `.env.example`.
- [x] **Correct HTTP Status Codes:** `200` (success/update/delete), `201` (created), `400` (bad request/validation), `404` (not found), `500` (server error).
- [x] **Parameterized Queries:** All SQL statements use `?` parameter placeholders; sorting columns use strict whitelists.
- [x] **Uniform JSON Response:** Consistent `{ "message": "..." }` format across all errors and status responses.
