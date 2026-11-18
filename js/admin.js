// JOB HUNTERS NG - ADMIN DASHBOARD

document.addEventListener("DOMContentLoaded", async function () {

    const db = window.jhnSupabase;
    const message = document.getElementById("adminMessage");
    const logoutButton = document.getElementById("logoutButton");

    if (!db) {
        message.textContent = "Database connection unavailable.";
        return;
    }

    // Check login session
    const { data: sessionData } = await db.auth.getSession();

    if (!sessionData.session) {
        window.location.href = "login.html";
        return;
    }

    // Verify admin role
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

    message.textContent = "Dashboard connected successfully.";

    // Logout
    logoutButton.addEventListener("click", async function () {
        await db.auth.signOut();
        window.location.href = "login.html";
    });

    // Count records in a table
    async function getCount(table, filters = []) {

        let query = db
            .from(table)
            .select("*", { count: "exact", head: true });

        filters.forEach(filter => {
            query = query.eq(filter.column, filter.value);
        });

        const { count, error } = await query;

        if (error) {
            console.error(table + " error:", error.message);
            return "—";
        }

        return count ?? 0;
    }

    // Count expired jobs
    async function getExpiredJobs() {

        const now = new Date().toISOString();

        const { count, error } = await db
            .from("jobs")
            .select("*", { count: "exact", head: true })
            .or(`status.eq.expired,expires_at.lt.${now}`);

        if (error) {
            console.error("Expired jobs error:", error.message);
            return "—";
        }

        return count ?? 0;
    }

    // Load dashboard statistics
    async function loadStatistics() {

        const statistics = await Promise.all([

            getCount("jobs"),

            getCount("jobs", [
                { column: "job_type", value: "remote" }
            ]),

            getCount("jobs", [
                { column: "job_type", value: "onsite" }
            ]),

            getCount("courses"),

            getCount("subscribers"),

            getExpiredJobs()

        ]);

        document.getElementById("adminTotalJobs").textContent = statistics[0];
        document.getElementById("adminRemoteJobs").textContent = statistics[1];
        document.getElementById("adminOnsiteJobs").textContent = statistics[2];
        document.getElementById("adminTotalCourses").textContent = statistics[3];
        document.getElementById("adminSubscribers").textContent = statistics[4];
        document.getElementById("adminExpiredJobs").textContent = statistics[5];
    }

    await loadStatistics();

});
