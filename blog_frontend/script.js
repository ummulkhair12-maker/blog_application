console.log("Welcome to BlogSpace");

const API_URL = "http://localhost:5000/api";

// ==================== REGISTER ====================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const message = document.getElementById("registerMessage");

        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match!";
            message.style.color = "red";
            return;
        }

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            message.textContent = data.message;
            message.style.color = response.ok ? "green" : "red";

            if (response.ok) {
                registerForm.reset();
            }
        } catch (error) {
            message.textContent = "Unable to connect to the backend!";
            message.style.color = "red";
        }
    });
}

// ==================== CREATE BLOG ====================

const createBlogForm = document.getElementById("createBlogForm");

if (createBlogForm) {
    createBlogForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const title = document.getElementById("blogTitle").value.trim();
        const category = document.getElementById("blogCategory").value;
        const content = document.getElementById("blogContent").value.trim();
        const message = document.getElementById("createBlogMessage");
        const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
);

if (!loggedInUser || !loggedInUser.email) {
    message.textContent = "Please log in first!";
    message.style.color = "red";
    return;
}

        if (!title || !category || !content) {
            message.textContent = "Please fill in all fields.";
            message.style.color = "red";
            return;
        }

        try {
            const response = await fetch(`${API_URL}/blogs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ title, category, content,authorEmail:loggedInUser.email })
            });

            const data = await response.json();

            message.textContent = data.message;
            message.style.color = response.ok ? "green" : "red";

            if (response.ok) {
                createBlogForm.reset();
            }
        } catch (error) {
            message.textContent = "Unable to connect to the backend!";
            message.style.color = "red";
        }
    });
}

// ==================== DISPLAY BLOGS ====================

const blogList = document.getElementById("blogList");

if (blogList) {
    async function displayBlogs() {
        const totalBlogs = document.getElementById("totalBlogs");

        try {
            const response = await fetch(`${API_URL}/blogs`);

            if (!response.ok) {
                throw new Error("Failed to fetch blogs");
            }

            const blogs = await response.json();

            if (totalBlogs) {
                totalBlogs.textContent = blogs.length;
            }

            blogList.innerHTML = "";

            if (blogs.length === 0) {
                blogList.innerHTML =
                    "<p>No blog posts yet. Create your first blog!</p>";
                return;
            }

            blogs.forEach(function (blog) {
                const card = document.createElement("article");
                card.className = "blog-card";
                card.style.cursor = "pointer";

card.addEventListener("click", function () {
    window.location.href =
        `blog_details.html?id=${encodeURIComponent(blog._id)}`;
});
                const title = document.createElement("h3");
                title.textContent = blog.title;

                const category = document.createElement("p");
                category.textContent = "Category: " + blog.category;

                const content = document.createElement("p");
                content.textContent = blog.content;

                card.append(title, category, content);
                blogList.appendChild(card);
            });
        } catch (error) {
            blogList.innerHTML =
                "<p>Unable to load blogs. Please check the backend server.</p>";
        }
    }

    displayBlogs();
}
// ==================== LOGIN API ====================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const message = document.getElementById("loginMessage");

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            message.textContent = data.message;
            message.style.color = response.ok ? "green" : "red";

            if (response.ok) {
                localStorage.setItem(
                    "loggedInUser",
                    JSON.stringify(data.user)
                );

                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 1000);
            }
        } catch (error) {
            message.textContent = "Cannot connect to backend!";
            message.style.color = "red";
        }
    });
}

// ==================== BLOG DETAILS ====================

const detailTitle = document.getElementById("detailTitle");

if (detailTitle) {
    async function loadBlogDetails() {
        const params = new URLSearchParams(window.location.search);
        const blogId = params.get("id");

        if (!blogId) {
            detailTitle.textContent = "Blog not found";
            return;
        }

        try {
            const response = await fetch(`${API_URL}/blogs/${blogId}`);

            if (!response.ok) {
                throw new Error("Unable to load blog");
            }

            const blog = await response.json();

            document.getElementById("detailTitle").textContent = blog.title;
            document.getElementById("detailCategory").textContent =
                blog.category || "Uncategorized";

            document.getElementById("detailAuthor").textContent =
                "By " + (blog.author?.name || "Unknown author");

            document.getElementById("detailDate").textContent =
                blog.createdAt
                    ? new Date(blog.createdAt).toLocaleDateString()
                    : "Date unavailable";

            document.getElementById("detailContent").textContent =
                blog.content;
        } catch (error) {
            detailTitle.textContent = "Unable to load blog";
            console.error(error);
        }
    }

    loadBlogDetails();
}