const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt=require("jsonwebtoken")
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
// ================= JWT AUTHENTICATION =================

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];

    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Access denied. Please log in."
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) {
            return res.status(403).json({
                message: "Invalid or expired token."
            });
        }

        req.user = user;
        next();
    });
}

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

        const token = jwt.sign(
    {
        id: user._id,
        email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
);

res.json({
    message: "Login successful",
    token,
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

// ================= CREATE BLOG =================

app.post("/api/blogs", authenticateToken, async (req, res) => {
    try {
        const { title, content, category } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                message: "Title and content are required"
            });
        }

        const blog = await Blog.create({
            title: title.trim(),
            content: content.trim(),
            category: category || "General",
            author: req.user.id
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

app.get("/api/blogs", authenticateToken, async (req, res) => {
    try {
        const blogs = await Blog.find({
            author: req.user.id
        })
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

// ================= GET ALL BLOGS =================

// ================= UPDATE BLOG =================

app.put("/api/blogs/:id", authenticateToken,async (req, res) => {
    try {
        const { title, content, category } = req.body;
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid blog ID"
            });
        }

        if (!title || !content) {
            return res.status(400).json({
                message: "Title and content are required"
            });
        }

      const blog = await Blog.findOneAndUpdate(
    { _id: id, author: req.user.id },
    {
        title: title.trim(),
        content: content.trim(),
        category: category || "General"
    },
    {
        new: true,
        runValidators: true
    }
).populate("author", "name");

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        res.json({
            message: "Blog updated successfully",
            blog
        });
    } catch (error) {
        console.error("Update blog error:", error.message);

        res.status(500).json({
            message: "Could not update blog"
        });
    }
});
// ================= DELETE BLOG =================

app.delete("/api/blogs/:id",authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid blog ID"
            });
        }

        const blog = await Blog.findByIdAndDelete({_id:id,author:req.user.id})

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        res.json({
            message: "Blog deleted successfully"
        });
    } catch (error) {
        console.error("Delete blog error:", error.message);

        res.status(500).json({
            message: "Could not delete blog"
        });
    }
});

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

app.get("/api/blogs/:id",authenticateToken, async (req, res) => {
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