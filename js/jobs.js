// JOB HUNTERS NG - JOB LISTING SYSTEM

document.addEventListener("DOMContentLoaded", async function () {

    const supabase = window.jhnSupabase;

    if (!supabase) {
        console.error("Database connection not found.");
        return;
    }

    const jobsContainer = document.getElementById("remoteJobsList");
    const jobCount = document.getElementById("jobCount");
    const searchInput = document.getElementById("jobSearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const experienceFilter = document.getElementById("experienceFilter");
    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    let allJobs = [];

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[character];
        });
    }

    async function loadCategories() {
        const { data, error } = await supabase
            .from("categories")
            .select("name")
            .eq("is_active", true)
            .order("name");

        if (error) {
            console.error("Category error:", error.message);
            return;
        }

        data.forEach(category => {
            const option = document.createElement("option");
            option.value = category.name;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }

    async function loadJobs() {
        jobsContainer.innerHTML = "<p>Loading remote jobs...</p>";

        const { data, error } = await supabase
            .from("jobs")
            .select(`
                id,
                title,
                company_name,
                category_id,
                job_type,
                employment_type,
                location,
                state,
                salary,
                experience,
                description,
                application_url,
                application_email,
                deadline,
                is_featured,
                is_verified,
                created_at,
                categories(name)
            `)
            .eq("status", "published")
            .eq("job_type", "remote")
            .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
            .order("is_featured", { ascending: false })
            .order("created_at", { ascending: false });

        if (error
