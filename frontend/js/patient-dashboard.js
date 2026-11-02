(function () {
// ==================================
// PATIENT DASHBOARD
// ==================================

const API_URL = "http://localhost:5000/api";

const token = sessionStorage.getItem("token");
const user = JSON.parse(
    sessionStorage.getItem("user") || "null"
);


// ==================================
// CHECK LOGIN AND ROLE
// ==================================

if (!token || !user) {

    window.location.href = "login.html";

} else if (user.role !== "patient") {

    alert("Access denied! Patient account required.");
    window.location.href = "login.html";

} else {

    document.getElementById("patientName").textContent = user.name;

    document.getElementById("welcomeName").textContent = user.name;

    loadAppointments();

}


// ==================================
// LOAD PATIENT APPOINTMENTS
// ==================================

async function loadAppointments() {

    const message = document.getElementById("appointmentMessage");

    const count = document.getElementById("appointmentCount");

    try {

        message.textContent = "Loading appointments...";

        const response = await fetch(
            `${API_URL}/appointments/my`,
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
                data.message || "Unable to load appointments"
            );

        }

        const appointments = data.appointments || [];

        // Update appointment count
        count.textContent = data.total ?? appointments.length;

        // Clear previous appointment cards
        message.innerHTML = "";

        // No appointments found
        if (appointments.length === 0) {

            message.textContent = "No appointments found.";

            return;

        }

        // Display appointments
        appointments.forEach(appointment => {

            const card = document.createElement("div");

            card.className = "service-card";

            // Doctor name
            const doctorName = appointment.doctor
                ? appointment.doctor.name
                : "Doctor information unavailable";

            // Appointment date
            const date = new Date(
                appointment.appointmentDate
            ).toLocaleString("en-IN");

            // Doctor heading
            const heading = document.createElement("h3");

            heading.textContent = doctorName;

            // Date
            const dateText = document.createElement("p");

            dateText.textContent = "Date: " + date;

            // Reason
            const reasonText = document.createElement("p");

            reasonText.textContent =
                "Reason: " + appointment.reason;

            // Status
            const statusText = document.createElement("p");

            statusText.textContent =
                "Status: " + appointment.status;

            // Add details
            card.append(
                heading,
                dateText,
                reasonText,
                statusText
            );

            message.appendChild(card);

        });

        console.log(
            "Appointments Loaded:",
            appointments.length
        );

    } catch (error) {

        message.textContent = error.message;

        count.textContent = "0";

        console.error("Appointment Error:", error);

    }

}
// ======================================
// LOGOUT
// ======================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", function () {

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        window.location.href = "login.html";

    });

}
})();
