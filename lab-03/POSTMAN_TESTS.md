# Postman Test List: Lab 3 Books REST API

This document provides a comprehensive test suite for evaluating all endpoints, query parameters, validation rules, and error handling in `lab-03`.

---

## Environment Configuration
- **Base URL Variable (`{{baseUrl}}`)**: `http://localhost:3000`
- **Default Headers**:
  - `Content-Type: application/json`

---

## Test Cases Summary Table

| Test # | Test Case Description | Method | Endpoint / URL | Request Body | Expected Status | Expected Response Body Summary |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| **TC-01** | Get all books with defaults | `GET` | `/books` | *None* | `200 OK` | Array of books (default limit 10, ordered by id ASC) |
| **TC-02** | Search books by partial title | `GET` | `/books?search_q=Clean` | *None* | `200 OK` | Array of books whose title contains "Clean" |
| **TC-03** | Sort books by price descending | `GET` | `/books?order_by=price&order=DESC` | *None* | `200 OK` | Array of books ordered from highest to lowest price |
| **TC-04** | Pagination (limit and offset) | `GET` | `/books?limit=3&offset=0` | *None* | `200 OK` | Array containing first 3 books |
| **TC-05** | Price range filter (BETWEEN) | `GET` | `/books?min_price=300&max_price=600` | *None* | `200 OK` | Array of books with `300 <= price <= 600` |
| **TC-06** | Combined search, sort, and price filter | `GET` | `/books?search_q=Programmer&min_price=500&max_price=600&order_by=price&order=ASC` | *None* | `200 OK` | Array with matched filtered books |
| **TC-07** | Invalid `order_by` column | `GET` | `/books?order_by=invalid_column` | *None* | `400 Bad Request` | `{"message": "Invalid order_by column. Allowed values: id, title, author, price, created_at"}` |
| **TC-08** | Invalid `order` direction | `GET` | `/books?order=SIDEWAYS` | *None* | `400 Bad Request` | `{"message": "Invalid order direction. Allowed values: ASC, DESC"}` |
| **TC-09** | Invalid pagination (`limit <= 0`) | `GET` | `/books?limit=-1` | *None* | `400 Bad Request` | `{"message": "limit must be a positive integer greater than 0"}` |
| **TC-10** | Inverted price filter (`min > max`) | `GET` | `/books?min_price=800&max_price=200` | *None* | `400 Bad Request` | `{"message": "min_price cannot be greater than max_price"}` |
| **TC-11** | Get book by existing ID | `GET` | `/books/1` | *None* | `200 OK` | Book object: `{"id": 1, "title": "Clean Code", ...}` |
| **TC-12** | Get book by non-existent ID | `GET` | `/books/9999` | *None* | `404 Not Found` | `{"message": "Book not found"}` |
| **TC-13** | Create book successfully | `POST` | `/books` | `{"title": "Refactoring", "author": "Martin Fowler", "price": 580.0}` | `201 Created` | `{"message": "Book created successfully", "bookId": 9}` |
| **TC-14** | Create book missing title | `POST` | `/books` | `{"author": "Martin Fowler", "price": 580.0}` | `400 Bad Request` | `{"message": "title is required and must be a non-empty string"}` |
| **TC-15** | Create book missing author | `POST` | `/books` | `{"title": "Refactoring", "price": 580.0}` | `400 Bad Request` | `{"message": "author is required and must be a non-empty string"}` |
| **TC-16** | Create book with non-numeric price | `POST` | `/books` | `{"title": "Refactoring", "author": "Martin Fowler", "price": "expensive"}` | `400 Bad Request` | `{"message": "price is required and must be a valid non-negative number"}` |
| **TC-17** | Update existing book | `PUT` | `/books/1` | `{"title": "Clean Code (2nd Ed)", "price": 520.0}` | `200 OK` | `{"message": "Book updated successfully"}` |
| **TC-18** | Update non-existent book | `PUT` | `/books/9999` | `{"title": "Clean Code", "price": 520.0}` | `404 Not Found` | `{"message": "Book not found"}` |
| **TC-19** | Delete existing book | `DELETE` | `/books/8` | *None* | `200 OK` | `{"message": "Book deleted successfully"}` |
| **TC-20** | Delete non-existent book | `DELETE` | `/books/9999` | *None* | `404 Not Found` | `{"message": "Book not found"}` |

---

## How to Import into Postman
1. Open the Postman desktop app or web agent.
2. Click **Import** in the top left workspace header.
3. Drag and drop the `postman_collection.json` file from the `lab-03/` folder.
4. Set the `baseUrl` variable to your running server (e.g. `http://localhost:3000` or deployed URL).
5. Click **Run collection** to run all tests automatically.
