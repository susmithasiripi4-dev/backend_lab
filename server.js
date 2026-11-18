
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
    initializeDatabase,
    runQuery,
    getQuery
} = require("./database");

const app = express();

const PORT = 3000;
const JWT_SECRET = "my_lab4_secret_key";

// Middleware
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.send("Lab 4 Registration and Login API is running");
});

// REGISTER API
app.post("/register", async (req, res) => {
    try {
        const { username, name, password } = req.body;

        if (
            typeof username !== "string" ||
            typeof name !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !name.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Please provide username, name and password"
            });
        }

        // Check existing username
        const existingUser = await getQuery(
            "SELECT * FROM users WHERE username = ?",
            [username.trim()]
        );

        if (existingUser) {
            return res.status(400).json({
                message: "Username already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user
        await runQuery(
            `INSERT INTO users (username, name, password)
             VALUES (?, ?, ?)`,
            [username.trim(), name.trim(), hashedPassword]
        );

        return res.status(201).json({
            message: "User registered successfully"
        });

    } catch (error) {
        console.log(error.message);

        if (error.code === "SQLITE_CONSTRAINT") {
            return res.status(400).json({
                message: "Username already exists"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

// LOGIN API
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Please provide username and password"
            });
        }

        // Find user
        const user = await getQuery(
            "SELECT * FROM users WHERE username = ?",
            [username.trim()]
        );

        if (!user) {
            return res.status(400).json({
                message: "Invalid username"
            });
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Incorrect password"
            });
        }

        // Generate JWT
        const token = jwt.sign(
            { username: user.username },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            jwt_token: token
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

// Start server
initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.log("Database error:", error.message);
    });
