console.log("Welcome to BlogSpace");
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const message = document.getElementById("registerMessage");

        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match!";
            message.style.color = "red";
            return;
        }

        message.textContent = "Registration form validated successfully!";
        message.style.color = "green";
    });
}

const createBlogForm = document.getElementById("createBlogForm");

if (createBlogForm) {
    createBlogForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const title = document.getElementById("blogTitle").value.trim();
        const category = document.getElementById("blogCategory").value;
        const content = document.getElementById("blogContent").value.trim();
        const message = document.getElementById("createBlogMessage");

        if (!title || !category || !content) {
            message.textContent = "Please fill in all fields.";
            message.style.color = "red";
            return;
        }

        const blog = {
            id: Date.now(),
            title: title,
            category: category,
            content: content,
            createdAt: new Date().toLocaleDateString()
        };

        const blogs = JSON.parse(localStorage.getItem("blogs") || "[]");
        blogs.push(blog);

        localStorage.setItem("blogs", JSON.stringify(blogs));

        message.textContent = "Blog saved successfully!";
        message.style.color = "green";

        createBlogForm.reset();
    });
}

// Display saved blogs on the dashboard
const blogList = document.getElementById("blogList");

if (blogList) {
    const blogs = JSON.parse(localStorage.getItem("blogs") || "[]");

    const totalBlogs = document.getElementById("totalBlogs");
    const emptyMessage = document.getElementById("emptyMessage");

    if (totalBlogs) {
        totalBlogs.textContent = blogs.length;
    }

    blogList.innerHTML = "";

    if (blogs.length === 0) {
        blogList.innerHTML = "<p>No blog posts yet. Create your first blog!</p>";
    } else {
        blogs.forEach(function (blog) {
            const card = document.createElement("article");
            card.className = "blog-card";

            const title = document.createElement("h3");
            title.textContent = blog.title;

            const category = document.createElement("p");
            category.textContent = "Category: " + blog.category;

            const content = document.createElement("p");
            content.textContent = blog.content;

            const date = document.createElement("small");
            date.textContent = "Created: " + blog.createdAt;

            card.append(title, category, content, date);
            blogList.appendChild(card);
        });
    }
}