
(function () {
    const API_URL = "http://localhost:5000/api";
    const token = sessionStorage.getItem("token");

    let currentPage = 1;
    const limit = 5;
    let totalPages = 1;

    const patientsList = document.getElementById("patientsList");
    const totalPatients = document.getElementById("totalPatients");
    const patientSearch = document.getElementById("patientSearch");
    const patientSearchBtn = document.getElementById("patientSearchBtn");
    const previousBtn = document.getElementById("previousPatientPage");
    const nextBtn = document.getElementById("nextPatientPage");
    const pageInfo = document.getElementById("patientPageInfo");

    // Prevent HTML injection in displayed user data
    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[char];
        });
    }

    // Load patients from backend
    async function loadPatients() {
        if (!token) {
            patientsList.innerHTML = "<p>Please login as admin.</p>";
            return;
        }

        try {
            patientsList.innerHTML = "<p>Loading patients...</p>";

            const keyword = patientSearch
                ? patientSearch.value.trim()
                : "";

            const response = await fetch(
                `${API_URL}/admin/users?role=patient&page=${currentPage}&limit=${limit}&keyword=${encodeURIComponent(keyword)}`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load patients");
            }

            if (totalPatients) {
                totalPatients.textContent = data.totalUsers || 0;
            }

            totalPages = data.totalPages || 1;

            displayPatients(data.users || []);
            updatePagination();

        } catch (error) {
            console.error("Load Patients Error:", error);
            patientsList.innerHTML =
                `<p>${escapeHTML(error.message)}</p>`;
        }
    }

    // Display patient information
    function displayPatients(patients) {
        if (!patients.length) {
            patientsList.innerHTML = "<p>No patients found.</p>";
            return;
        }

        patientsList.innerHTML = patients.map(patient => {
            const active = patient.isActive === true;

            return `
                <div class="patient-card">
                    <div class="patient-info">
                        <h3>${escapeHTML(patient.name)}</h3>
                        <p>Email: ${escapeHTML(patient.email)}</p>
                        <p>Phone: ${escapeHTML(patient.phone)}</p>
                        <p>
                            Status:
                            <strong>${active ? "Active" : "Inactive"}</strong>
                        </p>
                    </div>

                    <button
                        type="button"
                        class="patient-status-btn"
                        data-id="${escapeHTML(patient._id)}"
                        data-active="${active}"
                    >
                        ${active ? "Deactivate" : "Activate"}
                    </button>
                </div>
            `;
        }).join("");
    }

    // Activate or deactivate a patient
    async function changePatientStatus(patientId, currentStatus) {
        const newStatus = currentStatus !== "true";

        const action = newStatus ? "activate" : "deactivate";

        const confirmed = confirm(
            `Are you sure you want to ${action} this patient?`
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/admin/patients/${encodeURIComponent(patientId)}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        isActive: newStatus
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Status update failed");
            }

            alert(data.message);

            // Refresh patient list
            loadPatients();

        } catch (error) {
            console.error("Update Patient Status Error:", error);
            alert(error.message);
        }
    }

    // Handle Activate / Deactivate button clicks
    if (patientsList) {
        patientsList.addEventListener("click", function (event) {
            const button = event.target.closest(".patient-status-btn");

            if (!button) {
                return;
            }

            const patientId = button.dataset.id;
            const currentStatus = button.dataset.active;

            changePatientStatus(patientId, currentStatus);
        });
    }

    // Search patients
    if (patientSearchBtn) {
        patientSearchBtn.addEventListener("click", function () {
            currentPage = 1;
            loadPatients();
        });
    }

    if (patientSearch) {
        patientSearch.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                currentPage = 1;
                loadPatients();
            }
        });
    }

    // Previous page
    if (previousBtn) {
        previousBtn.addEventListener("click", function () {
            if (currentPage > 1) {
                currentPage--;
                loadPatients();
            }
        });
    }

    // Next page
    if (nextBtn) {
        nextBtn.addEventListener("click", function () {
            if (currentPage < totalPages) {
                currentPage++;
                loadPatients();
            }
        });
    }

    // Update pagination buttons
    function updatePagination() {
        if (pageInfo) {
            pageInfo.textContent =
                `Page ${currentPage} of ${totalPages}`;
        }

        if (previousBtn) {
            previousBtn.disabled = currentPage <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = currentPage >= totalPages;
        }
    }

    // Initial load
    loadPatients();

})();
