// JOB HUNTERS NG - SUPABASE CONNECTION

(function () {
    const config = window.JHN_CONFIG;

    if (!config) {
        console.error("Supabase configuration not found.");
        return;
    }

    if (!window.supabase) {
        console.error("Supabase library not loaded.");
        return;
    }

    window.jhnSupabase = window.supabase.createClient(
        config.supabaseUrl,
        config.supabasePublishableKey
    );

    console.log("Job Hunters NG database connection initialized.");
})();
