
// ==========================================
// CARENEST - DOCTOR DASHBOARD
// ==========================================

const API_URL = "http://localhost:5000/api";

const token = sessionStorage.getItem("token");

const loggedInUser = JSON.parse(
    sessionStorage.getItem("user") || "null"
);

let allAppointments = [];
let currentPage = 1;
const limit = 5;


// ==========================================
// 1. HELPER FUNCTION
// ==========================================

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


// ==========================================
// 2. CHECK DOCTOR LOGIN
// ==========================================

if (
    !token ||
    !loggedInUser ||
    loggedInUser.role !== "doctor"
) {

    alert("Please login as a doctor.");

    window.location.href = "login.html";

} else {

    setText("doctorName", loggedInUser.name || "Doctor");

    setText("welcomeDoctorName", loggedInUser.name || "Doctor");

    loadDoctorProfile();
    loadDoctorAppointments();

}


// ==========================================
// 3. LOGOUT
// ==========================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", function () {

        const confirmLogout = confirm(
            "Are you sure you want to logout?"
        );

        if (confirmLogout) {

            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");

            window.location.href = "login.html";

        }

    });

}


// ==========================================
// 4. LOAD DOCTOR PROFILE
// ==========================================

async function loadDoctorProfile() {

    try {

        const response = await fetch(
            `${API_URL}/doctor/profile`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Unable to load doctor profile."
            );

        }

        const doctor = data.doctor;

        if (!doctor) {
            throw new Error("Doctor profile not found.");
        }

        const user = doctor.user || loggedInUser;

        setText("doctorName", user.name || "Doctor");

        setText("welcomeDoctorName", user.name || "Doctor");

        setText("profileDoctorName", user.name || "Doctor");

        setText("profileDoctorEmail", user.email || "-");

        setText("profileDoctorPhone", user.phone || "-");

        setText(
            "doctorSpecialization",
            doctor.specialization || "-"
        );

        setText(
            "doctorQualification",
            doctor.qualification || "-"
        );

        setText(
            "doctorExperience",
            doctor.experience !== undefined
                ? doctor.experience + " years"
                : "-"
        );

        // Correct backend field name
        setText(
            "doctorFee",
            doctor.consultationFee !== undefined
                ? "₹" + doctor.consultationFee
                : "-"
        );

        setText("doctorAbout", doctor.about || "-");

    } catch (error) {

        console.error("Doctor Profile Error:", error);

        setText("doctorSpecialization", "Profile not available");

    }

}


// ==========================================
// 5. LOAD DOCTOR APPOINTMENTS
// ==========================================

async function loadDoctorAppointments() {

    const appointmentsList =
        document.getElementById("appointmentsList");

    if (!appointmentsList) {
        console.error("appointmentsList element not found.");
        return;
    }

    try {

        appointmentsList.innerHTML = `
            <tr>
                <td colspan="8">Loading appointments...</td>
            </tr>
        `;

        const response = await fetch(
            `${API_URL}/doctor/appointments`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Unable to load appointments."
            );

        }

        allAppointments = data.appointments || [];

        updateDashboardStats();

        currentPage = 1;

        displayAppointments();

    } catch (error) {

        console.error("Appointments Error:", error);

        appointmentsList.innerHTML = `
            <tr>
                <td colspan="8">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

    }

}


// ==========================================
// 6. UPDATE DASHBOARD STATISTICS
// ==========================================

function updateDashboardStats() {

    const total = allAppointments.length;

    const pending = allAppointments.filter(
        appointment => appointment.status === "pending"
    ).length;

    const completed = allAppointments.filter(
        appointment => appointment.status === "completed"
    ).length;

    setText("totalAppointments", total);

    setText("pendingAppointments", pending);

    setText("completedAppointments", completed);

}


// ==========================================
// 7. DISPLAY APPOINTMENTS
// ==========================================

function displayAppointments() {

    const appointmentsList =
        document.getElementById("appointmentsList");

    if (!appointmentsList) return;

    const searchElement =
        document.getElementById("appointmentSearch");

    const filterElement =
        document.getElementById("appointmentStatusFilter");

    const searchValue = searchElement
        ? searchElement.value.trim().toLowerCase()
        : "";

    const statusValue = filterElement
        ? filterElement.value
        : "";


    // Search and filter

    const filteredAppointments = allAppointments.filter(
        appointment => {

            const patient = appointment.patient || {};

            const patientName = (
                patient.name || ""
            ).toLowerCase();

            const patientEmail = (
                patient.email || ""
            ).toLowerCase();

            const matchesSearch =
                patientName.includes(searchValue) ||
                patientEmail.includes(searchValue);

            const matchesStatus =
                !statusValue ||
                appointment.status === statusValue;

            return matchesSearch && matchesStatus;

        }
    );


    // Pagination

    const totalPages = Math.max(
        1,
        Math.ceil(filteredAppointments.length / limit)
    );

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * limit;

    const pageAppointments = filteredAppointments.slice(
        startIndex,
        startIndex + limit
    );


    // Empty result

    if (pageAppointments.length === 0) {

        appointmentsList.innerHTML = `
            <tr>
                <td colspan="8">
                    No appointments found.
                </td>
            </tr>
        `;

    } else {

        appointmentsList.innerHTML = pageAppointments.map(
            (appointment, index) => {

                const patient = appointment.patient || {};

                const patientName = patient.name || "Unknown";

                const patientEmail = patient.email || "-";

                const patientPhone = patient.phone || "-";

                const appointmentDate =
                    appointment.appointmentDate
                        ? new Date(
                            appointment.appointmentDate
                        ).toLocaleString("en-IN")
                        : "-";

                const reason = appointment.reason || "-";

                const status = appointment.status || "pending";

                // Only allow valid status transitions
                let statusOptions = "";

                if (status === "pending") {

                    statusOptions = `
                        <option value="pending" selected>Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                    `;

                } else if (status === "confirmed") {

                    statusOptions = `
                        <option value="confirmed" selected>Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    `;

                } else {

                    statusOptions = `
                        <option value="${escapeHTML(status)}" selected>
                            ${escapeHTML(status)}
                        </option>
                    `;

                }

                const isFinalStatus =
                    status === "completed" ||
                    status === "cancelled";

                return `
                    <tr>

                        <td>${startIndex + index + 1}</td>

                        <td>${escapeHTML(patientName)}</td>

                        <td>${escapeHTML(patientEmail)}</td>

                        <td>${escapeHTML(patientPhone)}</td>

                        <td>${escapeHTML(appointmentDate)}</td>

                        <td>${escapeHTML(reason)}</td>

                        <td>
                            <strong>
                                ${escapeHTML(status.toUpperCase())}
                            </strong>
                        </td>

                        <td>

                            <select
                                class="appointment-status-select"
                                data-id="${escapeHTML(appointment._id)}"
                                data-current-status="${escapeHTML(status)}"
                                ${isFinalStatus ? "disabled" : ""}
                            >

                                ${statusOptions}

                            </select>

                        </td>

                    </tr>
                `;

            }
        ).join("");

    }


    // Page information

    setText(
        "appointmentPageInfo",
        `Page ${currentPage} of ${totalPages}`
    );

    const previousButton = document.getElementById(
        "previousAppointmentPage"
    );

    const nextButton = document.getElementById(
        "nextAppointmentPage"
    );

    if (previousButton) {
        previousButton.disabled = currentPage === 1;
    }

    if (nextButton) {
        nextButton.disabled = currentPage === totalPages;
    }

}


// ==========================================
// 8. UPDATE APPOINTMENT STATUS
// ==========================================

const appointmentsListElement =
    document.getElementById("appointmentsList");

if (appointmentsListElement) {

    appointmentsListElement.addEventListener(
        "change",
        async function (event) {

            if (!event.target.classList.contains(
                "appointment-status-select"
            )) {
                return;
            }

            const select = event.target;

            const appointmentId = select.dataset.id;

            const oldStatus = select.dataset.currentStatus;

            const newStatus = select.value;

            if (newStatus === oldStatus) {
                return;
            }

            const confirmUpdate = confirm(
                `Change appointment status from ${oldStatus} to ${newStatus}?`
            );

            if (!confirmUpdate) {

                select.value = oldStatus;

                return;

            }

            select.disabled = true;

            try {

                const response = await fetch(
                    `${API_URL}/doctor/appointments/${appointmentId}/status`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            status: newStatus
                        })
                    }
                );

                const data = await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.message || "Status update failed."
                    );

                }

                alert(
                    data.message ||
                    "Appointment status updated successfully!"
                );

                await loadDoctorAppointments();

            } catch (error) {

                alert(error.message);

                select.value = oldStatus;

                select.disabled = false;

            }

        }
    );

}


// ==========================================
// 9. SEARCH APPOINTMENTS
// ==========================================

const searchButton = document.getElementById(
    "appointmentSearchBtn"
);

if (searchButton) {

    searchButton.addEventListener("click", function () {

        currentPage = 1;

        displayAppointments();

    });

}


const searchInput = document.getElementById(
    "appointmentSearch"
);

if (searchInput) {

    searchInput.addEventListener("keyup", function (event) {

        if (event.key === "Enter") {

            currentPage = 1;

            displayAppointments();

        }

    });

}


// ==========================================
// 10. FILTER APPOINTMENTS
// ==========================================

const statusFilter = document.getElementById(
    "appointmentStatusFilter"
);

if (statusFilter) {

    statusFilter.addEventListener("change", function () {

        currentPage = 1;

        displayAppointments();

    });

}


// ==========================================
// 11. PAGINATION
// ==========================================

const previousButton = document.getElementById(
    "previousAppointmentPage"
);

if (previousButton) {

    previousButton.addEventListener("click", function () {

        if (currentPage > 1) {

            currentPage--;

            displayAppointments();

        }

    });

}


const nextButton = document.getElementById(
    "nextAppointmentPage"
);

if (nextButton) {

    nextButton.addEventListener("click", function () {

        currentPage++;

        displayAppointments();

    });

}


// ==========================================
// 12. HTML ESCAPE FUNCTION
// ==========================================

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, function (character) {

        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];

    });

}
