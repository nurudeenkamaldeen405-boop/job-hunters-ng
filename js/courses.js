// JOB HUNTERS NG - FREE COURSES SYSTEM

document.addEventListener("DOMContentLoaded", async function () {

    const db = window.jhnSupabase;

    const coursesList = document.getElementById("coursesList");
    const courseCount = document.getElementById("courseCount");
    const searchInput = document.getElementById("courseSearch");
    const categoryFilter = document.getElementById("courseCategory");
    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    if (!db || !coursesList) {
        console.error("Database connection or courses container not found.");
        return;
    }

    let allCourses = [];

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    function safeURL(value) {
        try {
            const url = new URL(value);

            return ["https:", "http:"].includes(url.protocol)
                ? url.href
                : "";
        } catch {
            return "";
        }
    }

    // Load available course categories
    function loadCategories() {

        const categories = [
            ...new Set(
                allCourses
                    .map(course => course.category)
                    .filter(Boolean)
            )
        ];

        categories.sort();

        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    // Load courses from Supabase
    async function loadCourses() {

        coursesList.innerHTML = "<p>Loading courses...</p>";

        const { data, error } = await db
            .from("courses")
            .select("*")
            .eq("status", "published")
            .eq("is_free", true)
            .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Course loading error:", error.message);

            coursesList.innerHTML =
                "<p>Unable to load courses. Please try again later.</p>";

            return;
        }

        allCourses = data || [];

        loadCategories();
        displayCourses(allCourses);
    }

    // Display courses
    function displayCourses(courses) {

        courseCount.textContent = courses.length + " free course(s) found";

        if (courses.length === 0) {
            coursesList.innerHTML =
                "<p>No free courses available right now. Please check again later.</p>";
            return;
        }

        coursesList.innerHTML = courses.map(course => {

            const courseURL = safeURL(course.course_url);

            return `
                <article class="job-card">

                    <h3>${escapeHTML(course.title)}</h3>

                    <p>
                        <strong>Platform:</strong>
                        ${escapeHTML(course.platform || "Not specified")}
                    </p>

                    <p>
                        <strong>Category:</strong>
                        ${escapeHTML(course.category || "General")}
                    </p>

                    <p>
                        <strong>Instructor:</strong>
                        ${escapeHTML(course.instructor || "Not specified")}
                    </p>

                    <p>
                        ${escapeHTML(course.description || "No description available.")}
                    </p>

                    <p class="job-badge verified
