// JOB HUNTERS NG - JOB DETAILS

document.addEventListener("DOMContentLoaded", async function () {

    const supabase = window.jhnSupabase;
    const container = document.getElementById("jobDetails");

    document.getElementById("currentYear").textContent =
        new Date().getFullYear();

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
            return ["http:", "https:"].includes(url.protocol)
                ? url.href
                : "";
        } catch {
            return "";
        }
    }

    if (!supabase) {
        container.textContent = "Database connection unavailable.";
        return;
    }

    const jobId = new URLSearchParams(window.location.search).get("id");

    if (!jobId) {
        container.textContent = "No job was selected.";
        return;
    }

    const { data: job, error } = await supabase
        .from("jobs")
        .select(`
            *,
            categories(name)
        `)
        .eq("id", jobId)
        .eq("status", "published")
        .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
        .maybeSingle();

    if (error || !job) {
        container.innerHTML = `
            <h2>Job Not Available</h2>
            <p>This job may have expired or been removed.</p>
            <a href="remote-jobs.html" class="btn btn-primary">
                Browse Available Jobs
            </a>
        `;
        return;
    }

    const applicationURL = safeURL(job.application_url);

    const applicationButton = applicationURL
        ? `<a href="${escapeHTML(applicationURL)}"
             target="_blank" rel="noopener noreferrer"
             class="btn btn-primary">Apply for This Job</a>`
        : job.application_email
            ? `<a href="mailto:${encodeURIComponent(job.application_email)}"
                 class="btn btn-primary">Apply by Email</a>`
            : "<p>Application instructions are not currently available.</p>";

    container.innerHTML = `
        <article class="job-card">

            <div class="job-card-header">
                <h1>${escapeHTML(job.title)}</h1>

                <div>
                    ${job.is_featured ? '<span class="job-badge featured">Featured</span>' : ""}
                    ${job.is_verified ? '<span class="job-badge verified">Verified</span>' : ""}
                </div>
            </div>

            <h3>${escapeHTML(job.company_name)}</h3>

            <hr>

            <h3>Job Information</h3>

            <p><strong>Category:</strong>
                ${escapeHTML(job.categories?.name || "Not specified")}
            </p>

            <p><strong>Job Type:</strong>
                ${escapeHTML(job.job_type)}
            </p>

            <p><strong>Employment Type:</strong>
                ${escapeHTML(job.employment_type || "Not specified")}
            </p>

            <p><strong>Location:</strong>
                ${escapeHTML(job.location || job.state || "Not specified")}
            </p>

            <p><strong>Salary:</strong>
                ${escapeHTML(job.salary || "Not specified")}
            </p>

            <p><strong>Experience:</strong>
                ${escapeHTML(job.experience || "Not specified")}
            </p>

            <hr>

            <h3>Job Description</h3>
            <p>${escapeHTML(job.description || "No description provided.")}</p>

            <h3>Requirements</h3>
            <p>${escapeHTML(job.requirements || "No requirements provided.")}</p>

            <h3>Application Deadline</h3>
            <p>${escapeHTML(job.deadline || "Not specified")}</p>

            <br>

            ${applicationButton}

            <br><br>

            <a href="https://wa.me/?text=${encodeURIComponent(
                "Check out this job: " + job.title + " - " +
                window.location.href
            )}" target="_blank" rel="noopener noreferrer">
                Share this job on WhatsApp
            </a>

        </article>
    `;
});
