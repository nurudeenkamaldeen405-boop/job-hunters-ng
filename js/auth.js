// JOB HUNTERS NG - ADMIN AUTHENTICATION

document.addEventListener("DOMContentLoaded", function () {

    const db = window.jhnSupabase;
    const loginForm = document.getElementById("adminLoginForm");
    const message = document.getElementById("loginMessage");

    if (!db || !loginForm) {
        console.error("Supabase or login form not found.");
        return;
    }

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = document.getElementById("adminEmail").value.trim();
        const password = document.getElementById("adminPassword").value;

        message.textContent = "Checking login details...";

        const { data, error } = await db.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            message.textContent = "Login failed. Check your email and password.";
            return;
        }

        // Check the user's role in the database
        const { data: profile, error: profileError } = await db
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

        if (profileError || profile?.role !== "admin") {

            await db.auth.signOut();

            message.textContent = "Access denied. Admin account required.";
            return;
        }

        message.textContent = "Login successful. Opening dashboard...";

        window.location.href = "dashboard.html";

    });

});
