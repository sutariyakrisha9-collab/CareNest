
// ===================================
// ADMIN APPOINTMENT MANAGEMENT
// ===================================

const API_URL = "http://localhost:5000/api";

const token = sessionStorage.getItem("token");


// ===================================
// HTML ELEMENTS
// ===================================

const appointmentsList = document.getElementById("appointmentsList");

const appointmentSearch = document.getElementById("appointmentSearch");

const appointmentSearchBtn = document.getElementById("appointmentSearchBtn");

const appointmentStatusFilter = document.getElementById("appointmentStatusFilter");

const totalAppointments = document.getElementById("totalAppointments");

const appointmentMessage = document.getElementById("appointmentMessage");

const previousAppointmentPage = document.getElementById("previousAppointmentPage");

const nextAppointmentPage = document.getElementById("nextAppointmentPage");

const appointmentPageInfo = document.getElementById("appointmentPageInfo");


// ===================================
// PAGINATION VARIABLES
// ===================================

let currentPage = 1;

const limit = 5;

let totalPages = 1;


// ===================================
// CHECK ADMIN LOGIN
// ===================================

if (!token) {

    alert("Please login as admin first.");

    window.location.href = "login.html";

} else {

    loadAppointments();

}


// ===================================
// ESCAPE HTML
// ===================================

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


// ===================================
// FORMAT DATE
// ===================================

function formatAppointmentDate(dateValue) {

    if (!dateValue) {
        return "Not Available";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return "Invalid Date";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });

}


// ===================================
// SHOW MESSAGE
// ===================================

function showAppointmentMessage(message, success = true) {

    appointmentMessage.textContent = message;

    appointmentMessage.style.color = success ? "#078c7d" : "#d93025";

}


// ===================================
// LOAD ALL APPOINTMENTS
// ===================================

async function loadAppointments() {

    try {

        appointmentsList.innerHTML = `
            <tr>
                <td colspan="8">Loading appointments...</td>
            </tr>
        `;

        const keyword = appointmentSearch.value.trim();

        const status = appointmentStatusFilter.value;

        const params = new URLSearchParams();

        params.append("page", currentPage);
        params.append("limit", limit);

        if (keyword) {
            params.append("keyword", keyword);
        }

        if (status) {
            params.append("status", status);
        }

        const response = await fetch(
            `${API_URL}/appointments/search?${params.toString()}`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {

            if (response.status === 401 || response.status === 403) {

                showAppointmentMessage(
                    data.message || "Admin access denied.",
                    false
                );

                return;
            }

            throw new Error(data.message || "Unable to load appointments");

        }

        if (!data.success) {
            throw new Error(data.message || "Unable to load appointments");
        }

        totalAppointments.textContent = data.totalAppointments ?? 0;

        totalPages = data.totalPages || 1;

        currentPage = data.currentPage || currentPage;

        appointmentPageInfo.textContent =
            `Page ${currentPage} of ${totalPages}`;

        previousAppointmentPage.disabled = currentPage <= 1;

        nextAppointmentPage.disabled = currentPage >= totalPages;

        displayAppointments(data.appointments || []);

        showAppointmentMessage("");

    } catch (error) {

        console.error("Load Appointments Error:", error);

        appointmentsList.innerHTML = `
            <tr>
                <td colspan="8">Unable to load appointments.</td>
            </tr>
        `;

        showAppointmentMessage(error.message, false);

    }

}


// ===================================
// DISPLAY APPOINTMENTS
// ===================================

function displayAppointments(appointments) {

    if (!appointments.length) {

        appointmentsList.innerHTML = `
            <tr>
                <td colspan="8">No appointments found.</td>
            </tr>
        `;

        return;
    }

    appointmentsList.innerHTML = appointments.map((appointment, index) => {

        const patientName = escapeHTML(
            appointment.patient?.name || "Unknown Patient"
        );

        const patientEmail = escapeHTML(
            appointment.patient?.email || "Not Available"
        );

        const doctorName = escapeHTML(
            appointment.doctor?.name || "Unknown Doctor"
        );

        const reason = escapeHTML(
            appointment.reason || "Not Available"
        );

        const date = escapeHTML(
            formatAppointmentDate(appointment.appointmentDate)
        );

        const status = appointment.status || "pending";

        const appointmentId = escapeHTML(appointment._id);

        const serialNumber = ((currentPage - 1) * limit) + index + 1;

        return `
            <tr>

                <td>${serialNumber}</td>

                <td>${patientName}</td>

                <td>${patientEmail}</td>

                <td>${doctorName}</td>

                <td>${date}</td>

                <td>${reason}</td>

                <td>
                    <strong>${escapeHTML(status.toUpperCase())}</strong>
                </td>

                <td>

                    <select
                        class="appointment-status-select"
                        data-id="${appointmentId}"
                        data-old-status="${escapeHTML(status)}"
                        aria-label="Update appointment status"
                    >

                        <option value="pending" ${status === "pending" ? "selected" : ""}>
                            Pending
                        </option>

                        <option value="confirmed" ${status === "confirmed" ? "selected" : ""}>
                            Confirmed
                        </option>

                        <option value="completed" ${status === "completed" ? "selected" : ""}>
                            Completed
                        </option>

                        <option value="cancelled" ${status === "cancelled" ? "selected" : ""}>
                            Cancelled
                        </option>

                    </select>

                </td>

            </tr>
        `;

    }).join("");

}


// ===================================
// UPDATE APPOINTMENT STATUS
// ===================================

async function updateAppointmentStatus(id, newStatus, selectElement) {

    const oldStatus = selectElement.dataset.oldStatus;

    try {

        selectElement.disabled = true;

        showAppointmentMessage("Updating appointment status...");

        const response = await fetch(
            `${API_URL}/appointments/${encodeURIComponent(id)}/status`,
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
            throw new Error(data.message || "Status update failed");
        }

        if (!data.success) {
            throw new Error(data.message || "Status update failed");
        }

        selectElement.dataset.oldStatus = newStatus;

        showAppointmentMessage(
            "Appointment status updated successfully!"
        );

        // Reload appointments after successful update
        await loadAppointments();

    } catch (error) {

        console.error("Update Status Error:", error);

        selectElement.value = oldStatus;

        showAppointmentMessage(error.message, false);

    } finally {

        selectElement.disabled = false;

    }

}


// ===================================
// STATUS CHANGE EVENT
// ===================================

appointmentsList.addEventListener("change", function (event) {

    if (event.target.classList.contains("appointment-status-select")) {

        const selectElement = event.target;

        const appointmentId = selectElement.dataset.id;

        const newStatus = selectElement.value;

        updateAppointmentStatus(
            appointmentId,
            newStatus,
            selectElement
        );

    }

});


// ===================================
// SEARCH BUTTON
// ===================================

appointmentSearchBtn.addEventListener("click", function () {

    currentPage = 1;

    loadAppointments();

});


// ===================================
// SEARCH USING ENTER KEY
// ===================================

appointmentSearch.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        currentPage = 1;

        loadAppointments();

    }

});


// ===================================
// FILTER BY STATUS
// ===================================

appointmentStatusFilter.addEventListener("change", function () {

    currentPage = 1;

    loadAppointments();

});


// ===================================
// PREVIOUS PAGE
// ===================================

previousAppointmentPage.addEventListener("click", function () {

    if (currentPage > 1) {

        currentPage--;

        loadAppointments();

    }

});


// ===================================
// NEXT PAGE
// ===================================

nextAppointmentPage.addEventListener("click", function () {

    if (currentPage < totalPages) {

        currentPage++;

        loadAppointments();

    }

});
