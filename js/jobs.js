// JOB HUNTERS NG - REMOTE AND ON-SITE JOB SYSTEM

document.addEventListener("DOMContentLoaded", async function () {

    const db = window.jhnSupabase;

    const jobsContainer =
        document.getElementById("remoteJobsList") ||
        document.getElementById("jobsList");

    const jobCount = document.getElementById("jobCount");
    const searchInput = document.getElementById("jobSearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const experienceFilter = document.getElementById("experienceFilter");

    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    if (!db || !jobsContainer) {
        console.error("Database or jobs container not found.");
        return;
    }

    // Identify the current page
    const jobType = document.getElementById("remoteJobsList")
        ? "remote"
        : "onsite";

    let allJobs = [];

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    // Load categories
    async function loadCategories() {

        if (!categoryFilter) return;

        const { data, error } = await db
            .from("categories")
            .select("name")
            .eq("is_active", true)
            .order("name");

        if (error) {
            console.error(error);
            return;
        }

        data.forEach(category => {
            const option = document.createElement("option");
            option.value = category.name;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }

    // Load jobs from Supabase
    async function loadJobs() {

        jobsContainer.innerHTML = "<p>Loading jobs...</p>";

        const { data, error } = await db
            .from("jobs")
            .select(`
                id,
                title,
                company_name,
                job_type,
                employment_type,
                location,
                state,
                salary,
                experience,
                is_featured,
                is_verified,
                created_at,
                categories(name)
            `)
            .eq("status", "published")
            .eq("job_type", jobType)
            .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
            .order("is_featured", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Job loading error:", error.message);
            jobsContainer.innerHTML =
                "<p>Unable to load jobs. Please try again later.</p>";
            return;
        }

        allJobs = data || [];
        displayJobs(allJobs);
    }

    // Display jobs
    function displayJobs(jobs) {

        if (jobCount) {
            jobCount.textContent = jobs.length + " job(s) found";
        }

        if (jobs.length === 0) {
            jobsContainer.innerHTML =
                "<p>No jobs available at the moment. Please check again later.</p>";
            return;
        }

        jobsContainer.innerHTML = jobs.map(job => {

            return `
                <article class="job-card">

                    <div class="job-card-header">
                        <h3>${escapeHTML(job.title)}</h3>

                        <div>
                            ${job.is_featured
                                ? '<span class="job-badge featured">Featured</span>'
                                : ""}

                            ${job.is_verified
                                ? '<span class="job-badge verified">Verified</span>'
                                : ""}
                        </div>
                    </div>

                    <p class="company-name">
                        ${escapeHTML(job.company_name)}
                    </p>

                    <p>${escapeHTML(job.categories?.name || "Other Jobs")}</p>

                    <div class="job-meta">
                        <span>
                            ${jobType === "remote" ? "🌍 Remote" : "🏢 On-site"}
                        </span>

                        <span>
                            💼 ${escapeHTML(job.employment_type || "Not specified")}
                        </span>

                        <span>
                            📍 ${escapeHTML(job.location || job.state || "Not specified")}
                        </span>
                    </div>

                    <p class="job-salary">
                        ${escapeHTML(job.salary || "Salary not specified")}
                    </p>

                    <p>
                        Experience: ${escapeHTML(job.experience || "Not specified")}
                    </p>

                    <a
                        href="job-details.html?id=${encodeURIComponent(job.id)}"
                        class="btn btn-primary"
                    >
                        View Details
                    </a>

                </article>
            `;
        }).join("");
    }

    // Search and filter jobs
    function filterJobs() {

        const search = searchInput?.value.toLowerCase().trim() || "";
        const category = categoryFilter?.value || "";
        const experience = experienceFilter?.value || "";

        const filteredJobs = allJobs.filter(job => {

            const matchesSearch =
                (job.title || "").toLowerCase().includes(search) ||
                (job.company_name || "").toLowerCase().includes(search);

            const matchesCategory =
                !category || job.categories?.name === category;

            const matchesExperience =
                !experience || job.experience === experience;

            return matchesSearch && matchesCategory && matchesExperience;
        });

        displayJobs(filteredJobs);
    }

    searchInput?.addEventListener("input", filterJobs);
    categoryFilter?.addEventListener("change", filterJobs);
    experienceFilter?.addEventListener("change", filterJobs);

    await loadCategories();
    await loadJobs();

});
