// JOB HUNTERS NG - HOMEPAGE FUNCTIONALITY

document.addEventListener("DOMContentLoaded", () => {

    // MOBILE NAVIGATION
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }

    // CURRENT YEAR
    const year = document.getElementById("currentYear");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    // CHECK SUPABASE CONNECTION
    const db = window.jhnSupabase;

    if (!db) {
        console.error("Supabase is not connected.");
        return;
    }

    // LOAD JOB CATEGORIES
    async function loadCategories() {

        const container = document.getElementById("categoryContainer");

        if (!container) return;

        const { data, error } = await db
            .from("categories")
            .select("name, slug, description")
            .eq("is_active", true)
            .order("name");

        if (error) {
            console.error("Category error:", error);
            container.innerHTML = "<p>Unable to load categories.</p>";
            return;
        }

        if (!data.length) {
            container.innerHTML = "<p>No categories available yet.</p>";
            return;
        }

        container.innerHTML = data.map(category => `
            <a href="remote-jobs.html?category=${encodeURIComponent(category.slug)}"
               class="category-card">
                <h3>${escapeHTML(category.name)}</h3>
                <p>${escapeHTML(category.description || "Explore opportunities")}</p>
            </a>
        `).join("");
    }

    // LOAD HOMEPAGE STATISTICS
    async function loadStatistics() {

        const [allJobs, remote, onsite, courses] = await Promise.all([

            db.from("jobs")
                .select("id", { count: "exact", head: true })
                .eq("status", "published"),

            db.from("jobs")
                .select("id", { count: "exact", head: true })
                .eq("status", "published")
                .eq("job_type", "remote"),

            db.from("jobs")
                .select("id", { count: "exact", head: true })
                .eq("status", "published")
                .eq("job_type", "onsite"),

            db.from("courses")
                .select("id", { count: "exact", head: true })
                .eq("status", "published")
                .eq("is_free", true)

        ]);

        if (allJobs.error || remote.error || onsite.error || courses.error) {
            console.error("Statistics loading error.");
            return;
        }

        document.getElementById("totalJobs").textContent = allJobs.count || 0;
        document.getElementById("remoteJobs").textContent = remote.count || 0;
        document.getElementById("onsiteJobs").textContent = onsite.count || 0;
        document.getElementById("totalCourses").textContent = courses.count || 0;
    }

    // LOAD FEATURED JOBS
    async function loadFeaturedJobs() {

        const container = document.getElementById("featuredJobs");

        if (!container) return;

        const { data, error } = await db
            .from("jobs")
            .select(`
                id,
                title,
                company_name,
                job_type,
                location,
                salary_currency,
                salary_min,
                salary_max,
                is_verified
            `)
            .eq("status", "published")
            .eq("is_featured", true)
            .order("created_at", { ascending: false })
            .limit(6);

        if (error) {
            console.error("Featured jobs error:", error);
            container.innerHTML = "<p>Unable to load jobs.</p>";
            return;
        }

        if (!data.length) {
            container.innerHTML = `
                <p>No featured jobs available right now.
                Please check back soon.</p>
            `;
            return;
        }

        container.innerHTML = data
