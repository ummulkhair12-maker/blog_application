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

                
                // Edit button
const editButton = document.createElement("button");
editButton.textContent = "Edit";
editButton.className = "edit-button";

editButton.addEventListener("click", function (event) {
    event.stopPropagation();

    window.location.href =
        `edit_blog.html?id=${encodeURIComponent(blog._id)}`;
});

// Delete button
const deleteButton = document.createElement("button");
deleteButton.textContent = "Delete";
deleteButton.className = "delete-button";

deleteButton.addEventListener("click", async function (event) {
    event.stopPropagation();

    const confirmed = confirm(
        `Are you sure you want to delete "${blog.title}"?`
    );

    if (!confirmed) return;

    try {
        const deleteURL = `${API_URL}/blogs/${blog._id}`;

        console.log("DELETE URL:", deleteURL);

        const response = await fetch(deleteURL, {
            method: "DELETE"
        });

        console.log("DELETE status:", response.status);

        const responseText = await response.text();
        console.log("DELETE response:", responseText);

        let data;

        try {
            data = JSON.parse(responseText);
        } catch {
            throw new Error("Server returned HTML instead of JSON.");
        }

        if (!response.ok) {
            throw new Error(data.message || "Could not delete blog");
        }

        alert(data.message);
        displayBlogs();

    } catch (error) {
        console.error("Delete error:", error);
        alert(error.message || "Unable to connect to the backend.");
    }
});

const buttonContainer = document.createElement("div");
buttonContainer.className = "blog-actions";
buttonContainer.append(editButton, deleteButton);

card.append(title, category, content, buttonContainer);
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

// EDIT BLOG FUNCTIONALITY

const editBlogForm = document.getElementById("editBlogForm");

if (editBlogForm) {
    const params = new URLSearchParams(window.location.search);
    const blogId = params.get("id");

    const titleInput = document.getElementById("editBlogTitle");
    const categoryInput = document.getElementById("editBlogCategory");
    const contentInput = document.getElementById("editBlogContent");
    const message = document.getElementById("editBlogMessage");

    // Load existing blog details
    async function loadBlog() {
        try {
            if (!blogId) {
                throw new Error("Blog ID is missing.");
            }

            const response = await fetch(`${API_URL}/blogs/${blogId}`);
            const blog = await response.json();

            if (!response.ok) {
                throw new Error(blog.message || "Could not load blog.");
            }

            titleInput.value = blog.title;
            categoryInput.value = blog.category || "General";
            contentInput.value = blog.content;
        } catch (error) {
            message.textContent = error.message;
        }
    }

    loadBlog();

    // Save updated blog
    editBlogForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        try {
            const response = await fetch(`${API_URL}/blogs/${blogId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: titleInput.value.trim(),
                    category: categoryInput.value.trim(),
                    content: contentInput.value.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not update blog.");
            }

            message.textContent = "Blog updated successfully!";

            setTimeout(function () {
                window.location.href = "dashboard.html";
            }, 1000);

        } catch (error) {
            message.textContent = error.message;
        }
    });
}