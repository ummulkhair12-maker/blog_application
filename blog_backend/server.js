const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Temporary in-memory data
const users = [];
const blogs = [];

// Home API
app.get("/", (req, res) => {
    res.json({
        message: "Blog Backend API is running!"
    });
});

// User Registration API
app.post("/api/register", (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const existingUser = users.find(
        user => user.email === email
    );

    if (existingUser) {
        return res.status(409).json({
            message: "Email already registered"
        });
    }

    users.push({ name, email, password });

    res.status(201).json({
        message: "Registration successful"
    });
});

// User Login API
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    const user = users.find(
        user => user.email === email &&
                user.password === password
    );

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    res.json({
        message: "Login successful",
        user: {
            name: user.name,
            email: user.email
        }
    });
});

// Create Blog API
app.post("/api/blogs", (req, res) => {
    const { title, content, category } = req.body;

    if (!title || !content) {
        return res.status(400).json({
            message: "Title and content are required"
        });
    }

    const blog = {
        id: blogs.length + 1,
        title,
        content,
        category: category || "General"
    };

    blogs.push(blog);

    res.status(201).json({
        message: "Blog created successfully",
        blog
    });
});

// Get Blogs API — useful for displaying blogs
app.get("/api/blogs", (req, res) => {
    res.json(blogs);
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});