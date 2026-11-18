// JOB HUNTERS NG - COMMUNITIES SYSTEM

document.addEventListener("DOMContentLoaded", async function () {

    const db = window.jhnSupabase;
    const container = document.getElementById("communitiesList");
    const searchInput = document.getElementById("stateSearch");
    const year = document.getElementById("currentYear");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    if (!db || !container) {
        console.error("Database connection not found.");
        return;
    }

    let allStates = [];

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

    async function loadCommunities() {

        container.innerHTML = "<p>Loading communities...</p>";

        const { data, error } = await db
            .from("locations")
            .select(`
                id,
                state_name,
                communities (
                    id,
                    name,
                    platform,
                    join_url,
                    description,
                    is_active
                )
            `)
            .eq("is_active", true)
            .order("state_name");

        if (error) {
            console.error("Communities error:", error.message);

            container.innerHTML =
                "<p>Unable to load communities. Please try again later.</p>";

            return;
        }

        allStates = data || [];

        displayCommunities(allStates);
    }

    function displayCommunities(states) {

        if (states.length === 0) {
            container.innerHTML = "<p>No states found.</p>";
            return;
        }

        container.innerHTML = states.map(state => {

            const groups = (state.communities || [])
                .filter(group => group.is_active);

            let groupContent = "";

            if (groups.length === 0) {

                groupContent = `
                    <p class="job-badge featured">Coming Soon</p>
                    <p>Our community for ${escapeHTML(state.state_name)}
                    is coming soon.</p>
                `;

            } else {

                groupContent = groups.map(group => {

                    const link = safeURL(group.join_url);

                    return `
                        <div class="community-group">
                            <h4>${escapeHTML(group.name)}</h4>

                            <p>
                                Platform: ${escapeHTML(group.platform)}
                            </p>

                            <p>
                                ${escapeHTML(group.description || "")}
                            </p>

                            ${
                                link
                                ? `<a href="${escapeHTML(link)}"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      class="btn btn-primary">
                                      Join Community
                                   </a>`
                                : "<p>Joining link unavailable.</p>"
                            }
                        </div>
                    `;

                }).join("");

            }

            return `
                <article class="job-card">
                    <h3>${escapeHTML(state.state_name)}</h3>
                    ${groupContent}
                </article>
            `;

        }).join("");
    }

    function searchStates() {

        const search = searchInput.value.toLowerCase().trim();

        const filteredStates = allStates.filter(state =>
            state.state_name.toLowerCase().includes(search)
        );

        displayCommunities(filteredStates);
    }

    searchInput.addEventListener("input", searchStates);

    await loadCommunities();

});
