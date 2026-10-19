const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ================= DATABASE MODELS =================

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            default: "General"
        },
        content: {
            type: String,
            required: true
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Blog = mongoose.model("Blog", blogSchema);

// ================= HOME =================

app.get("/", (req, res) => {
    res.json({
        message: "BlogSpace Backend API is running!"
    });
});

// ================= REGISTER =================

app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        console.error("Registration error:", error.message);

        res.status(500).json({
            message: "Registration failed"
        });
    }
});

// ================= LOGIN =================

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        res.status(500).json({
            message: "Login failed"
        });
    }
});

// ================= CREATE BLOG =================

app.post("/api/blogs", async (req, res) => {
    try {
        const { title, content, category, authorEmail } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                message: "Title and content are required"
            });
        }

        // Temporary author lookup until proper authentication is added.
        if (!authorEmail) {
            return res.status(400).json({
                message: "Author email is required"
            });
        }

        const author = await User.findOne({
            email: authorEmail.trim().toLowerCase()
        });

        if (!author) {
            return res.status(401).json({
                message: "Please log in with a registered account"
            });
        }

        const blog = await Blog.create({
            title: title.trim(),
            content: content.trim(),
            category: category || "General",
            author: author._id
        });

        res.status(201).json({
            message: "Blog created successfully",
            blog
        });
    } catch (error) {
        console.error("Create blog error:", error.message);

        res.status(500).json({
            message: "Could not create blog"
        });
    }
});

// ================= GET ALL BLOGS =================

app.get("/api/blogs", async (req, res) => {
    try {
        const blogs = await Blog.find()
            .populate("author", "name")
            .sort({ createdAt: -1 });

        res.json(blogs);
    } catch (error) {
        console.error("Fetch blogs error:", error.message);

        res.status(500).json({
            message: "Could not retrieve blogs"
        });
    }
});

// ================= GET SINGLE BLOG =================

app.get("/api/blogs/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid blog ID"
            });
        }

        const blog = await Blog.findById(req.params.id)
            .populate("author", "name");

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        res.json(blog);
    } catch (error) {
        console.error("Fetch blog error:", error.message);

        res.status(500).json({
            message: "Could not retrieve blog"
        });
    }
});

// ================= START SERVER =================

const PORT = process.env.PORT || 5000;

async function startServer() {
    if (process.env.MONGODB_URI) {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log("MongoDB connected successfully!");
        } catch (error) {
            console.error("MongoDB connection failed:", error.message);
            process.exit(1);
        }
    } else {
        console.log("MongoDB not connected yet. Set MONGODB_URI in .env.");
    }

    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

startServer();