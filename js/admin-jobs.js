// JOB HUNTERS NG - ADMIN JOB MANAGEMENT

document.addEventListener("DOMContentLoaded", async function () {

    const db = window.jhnSupabase;

    const form = document.getElementById("adminJobForm");
    const message = document.getElementById("jobFormMessage");
    const jobsList = document.getElementById("adminJobsList");

    if (!db || !form) {
        return;
    }

    // Protect admin page
    const { data: sessionData } = await db.auth.getSession();

    if (!sessionData.session) {
        window.location.href = "login.html";
        return;
    }

    const { data: profile, error: profileError } = await db
        .from("profiles")
        .select("role")
        .eq("id", sessionData.session.user.id)
        .single();

    if (profileError || profile?.role !== "admin") {
        await db.auth.signOut();
        window.location.href = "login.html";
        return;
    }

    const fields = {
        id: document.getElementById("jobId"),
        title: document.getElementById("jobTitle"),
        company: document.getElementById("companyName"),
        category: document.getElementById("jobCategory"),
        type: document.getElementById("jobType"),
        employment: document.getElementById("employmentType"),
        location: document.getElementById("jobLocation"),
        state: document.getElementById("jobState"),
        salaryMin: document.getElementById("salaryMin"),
salaryMax: document.getElementById("salaryMax"),
salaryCurrency: document.getElementById("salaryCurrency"),
salaryPeriod: document.getElementById("salaryPeriod"),
experience: document.getElementById("experienceLevel"),
        description: document.getElementById("jobDescription"),
        requirements: document.getElementById("jobRequirements"),
        application: document.getElementById("applicationUrl"),
        email: document.getElementById("applicationEmail"),
        source: document.getElementById("sourceUrl"),
        deadline: document.getElementById("jobDeadline"),
        expiry: document.getElementById("jobExpiry"),
        status: document.getElementById("jobStatus"),
        featured: document.getElementById("jobFeatured"),
        verified: document.getElementById("jobVerified")
    };

    function showMessage(text, success = false) {
        message.textContent = text;
        message.style.color = success ? "green" : "red";
    }

    // Load categories
    async function loadCategories() {

        const { data, error } = await db
            .from("categories")
            .select("id, name")
            .eq("is_active", true)
            .order("name");

        if (error) {
            showMessage("Unable to load categories.");
            return;
        }

        fields.category.innerHTML =
            '<option value="">Select Category</option>';

        data.forEach(category => {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.name;
            fields.category.appendChild(option);
        });
    }

    // Load existing jobs
    async function loadJobs() {

        jobsList.textContent = "Loading jobs...";

        const { data, error } = await db
            .from("jobs")
            .select("id, title, company_name, job_type, status, is_featured, is_verified")
            .order("created_at", { ascending: false });

        if (error) {
            jobsList.textContent = "Unable to load jobs.";
            console.error(error);
            return;
        }

        if (!data.length) {
            jobsList.textContent = "No jobs added yet.";
            return;
        }

        jobsList.innerHTML = data.map(job => `
            <article class="admin-stat-card">
                <h3>${escapeHTML(job.title)}</h3>
                <p>${escapeHTML(job.company_name)}</p>
                <p>Type: ${escapeHTML(job.job_type)}</p>
                <p>Status: ${escapeHTML(job.status)}</p>

                <button type="button" data-edit="${job.id}">
                    Edit
                </button>

                <button type="button" data-delete="${job.id}">
                    Delete
                </button>
            </article>
        `).join("");

    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    // Reset form
    function resetForm() {
        form.reset();
        fields.id.value = "";
        document.getElementById("jobFormTitle").textContent = "Add New Job";
    }

    // Save new job or update existing job
    form

                          
