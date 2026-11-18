// JOB HUNTERS NG - COMPLETE ADMIN JOB MANAGEMENT

document.addEventListener("DOMContentLoaded", async function () {

    const db = window.jhnSupabase;

    const form = document.getElementById("adminJobForm");
    const message = document.getElementById("jobFormMessage");
    const jobsList = document.getElementById("adminJobsList");

    if (!db || !form) {
        console.error("Database or form not found.");
        return;
    }

    // CHECK ADMIN LOGIN
    const { data: sessionData } = await db.auth.getSession();

    if (!sessionData.session) {
        window.location.href = "login.html";
        return;
    }

    const user = sessionData.session.user;

    const { data: profile, error: profileError } = await db
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || profile?.role !== "admin") {
        await db.auth.signOut();
        window.location.href = "login.html";
        return;
    }

    // FORM FIELDS
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

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    // LOAD CATEGORIES
    async function loadCategories() {

        const { data, error } = await db
            .from("categories")
            .select("id, name")
            .eq("is_active", true)
            .order("name");

        if (error) {
            showMessage("Unable to load categories.");
            console.error(error);
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

    // LOAD EXISTING JOBS
    async function loadJobs() {

        jobsList.textContent = "Loading jobs...";

        const { data, error } = await db
            .from("jobs")
            .select(`
                id,
                title,
                company_name,
                job_type,
                status,
                is_featured,
                is_verified,
                salary_min,
                salary_max,
                salary_currency
            `)
            .order("created_at", { ascending: false });

        if (error) {
            jobsList.textContent = "Unable to load jobs.";
            console.error(error);
            return;
        }

        if (!data || data.length === 0) {
            jobsList.textContent = "No jobs added yet.";
            return;
        }

        jobsList.innerHTML = data.map(job => `

            <article class="admin-stat-card">

                <h3>${escapeHTML(job.title)}</h3>

                <p>${escapeHTML(job.company_name)}</p>

                <p>Type: ${escapeHTML(job.job_type)}</p>

                <p>Status: ${escapeHTML(job.status)}</p>

                <p>
                    Salary:
                    ${job.salary_min ?? "Not specified"}
                    -
                    ${job.salary_max ?? "Not specified"}
                    ${escapeHTML(job.salary_currency || "NGN")}
                </p>

                <p>
                    ${job.is_featured ? "Featured" : ""}
                    ${job.is_verified ? "Verified" : ""}
                </p>

                <button type="button" data-edit="${job.id}">
                    Edit
                </button>

                <button type="button" data-delete="${job.id}">
                    Delete
                </button>

            </article>

        `).join("");

    }

    // RESET FORM
    function resetForm() {

        form.reset();

        fields.id.value = "";

        document.getElementById("jobFormTitle").textContent =
            "Add New Job";

    }

    // SAVE OR UPDATE JOB
    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        showMessage("Saving job...");

        const minimum = fields.salaryMin.value
            ? Number(fields.salaryMin.value)
            : null;

        const maximum = fields.salaryMax.value
            ? Number(fields.salaryMax.value)
            : null;

        if (
            minimum !== null &&
            maximum !== null &&
            minimum > maximum
        ) {
            showMessage("Minimum salary cannot exceed maximum salary.");
            return;
        }

        const jobData = {

            title: fields.title.value.trim(),

            company_name: fields.company.value.trim(),

            category_id: fields.category.value,

            job_type: fields.type.value,

            employment_type:
                fields.employment.value.trim() || null,

            location:
                fields.location.value.trim() || null,

            state:
                fields.state.value.trim() || null,

            salary_min: minimum,

            salary_max: maximum,

            salary_currency: fields.salaryCurrency.value,

            salary_period: fields.salaryPeriod.value,

            experience_level:
                fields.experience.value || null,

            description:
                fields.description.value.trim(),

            requirements:
                fields.requirements.value.trim() || null,

            application_url:
                fields.application.value.trim() || null,

            application_email:
                fields.email.value.trim() || null,

            source_url:
                fields.source.value.trim() || null,

            deadline:
                fields.deadline.value || null,

            expires_at: fields.expiry.value
                ? new Date(
                    fields.expiry.value + "T23:59:59"
                ).toISOString()
                : null,

            status: fields.status.value,

            is_featured: fields.featured.checked,

            is_verified: fields.verified.checked

        };

        let result;

        if (fields.id.value) {

            result = await db
                .from("jobs")
                .update(jobData)
                .eq("id", fields.id.value);

        } else {

            jobData.created_by = user.id;

            result = await db
                .from("jobs")
                .insert(jobData);

        }

        if (result.error) {

            console.error(result.error);

            showMessage("Error: " + result.error.message);

            return;
        }

        showMessage("Job saved successfully!", true);

        resetForm();

        await loadJobs();

    });

    // EDIT AND DELETE JOBS
    jobsList.addEventListener("click", async function (event) {

        const editId = event.target.dataset.edit;
        const deleteId = event.target.dataset.delete;

        // EDIT JOB
        if (editId) {

            const { data: job, error } = await db
                .from("jobs")
                .select("*")
                .eq("id", editId)
                .single();

            if (error) {
                showMessage("Unable to load job.");
                return;
            }

            fields.id.value = job.id;
            fields.title.value = job.title;
            fields.company.value = job.company_name;
            fields.category.value = job.category_id || "";
            fields.type.value = job.job_type;

            fields.employment.value = job.employment_type || "";
            fields.location.value = job.location || "";
            fields.state.value = job.state || "";

            fields.salaryMin.value = job.salary_min ?? "";
            fields.salaryMax.value = job.salary_max ?? "";

            fields.salaryCurrency.value =
                job.salary_currency || "NGN";

            fields.salaryPeriod.value =
                job.salary_period || "monthly";

            fields.experience.value =
                job.experience_level || "";

            fields.description.value = job.description || "";
            fields.requirements.value = job.requirements || "";

            fields.application.value = job.application_url || "";
            fields.email.value = job.application_email || "";
            fields.source.value = job.source_url || "";

            fields.deadline.value = job.deadline || "";

            fields.expiry.value = job.expires_at
                ? job.expires_at.substring(0, 10)
                : "";

            fields.status.value = job.status;

            fields.featured.checked = job.is_featured;
            fields.verified.checked = job.is_verified;

            document.getElementById("jobFormTitle").textContent =
                "Edit Job";

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }

        // DELETE JOB
        if (deleteId) {

            const confirmed = confirm(
                "Are you sure you want to delete this job?"
            );

            if (!confirmed) return;

            const { error } = await db
                .from("jobs")
                .delete()
                .eq("id", deleteId);

            if (error) {
                showMessage("Unable to delete job.");
                console.error(error);
                return;
            }

            showMessage("Job deleted successfully!", true);

            await loadJobs();

        }

    });

    // CANCEL EDITING
    document.getElementById("cancelEdit")
        .addEventListener("click", resetForm);

    // START
    await loadCategories();

    await loadJobs();

});
