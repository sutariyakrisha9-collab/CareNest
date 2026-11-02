(function () {
// Backend API URL
const API_URL = "https://carenest-backend-xbuo.onrender.com/api";

// Get patient token
const token = sessionStorage.getItem("token");

// Get HTML elements
const doctorSelect = document.getElementById("doctor");
const appointmentForm = document.getElementById("appointmentForm");
const appointmentDate = document.getElementById("appointmentDate");

const bookingMessage = document.getElementById(
    "bookAppointmentMessage"
);


// Check patient login
if (!token) {
    window.location.href = "login.html";
}


// Set minimum appointment date and time
const now = new Date();

now.setMinutes(
    now.getMinutes() - now.getTimezoneOffset()
);

appointmentDate.min = now.toISOString().slice(0, 16);


// ======================================
// 1. LOAD DOCTORS FROM DATABASE
// ======================================

async function loadDoctors() {

    try {

        const response = await fetch(
            `${API_URL}/doctor/all`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to load doctors"
            );
        }

        // Get doctors array
        const doctors = data.doctors || [];

        // Clear dropdown
        doctorSelect.innerHTML =
            '<option value="">Select a Doctor</option>';

        // Display doctors
        doctors.forEach((doctor) => {

            // Get Doctor User ID
            const user = doctor.user;

            const doctorUserId =
                user && typeof user === "object"
                    ? user._id
                    : user;

            if (!doctorUserId) {
                return;
            }

            const doctorName =
                user && typeof user === "object"
                    ? user.name
                    : "Doctor";

            const option = document.createElement("option");

            // Important: Booking API needs User ID
            option.value = doctorUserId;

            option.textContent =
                doctorName +
                " - " +
                (doctor.specialization || "General");

            doctorSelect.appendChild(option);

        });

        // If no doctors found
        if (doctorSelect.options.length === 1) {

            doctorSelect.innerHTML =
                '<option value="">No doctors available</option>';

        }

    } catch (error) {

        console.error("Doctor Loading Error:", error);

        doctorSelect.innerHTML =
            '<option value="">Unable to load doctors</option>';

    }

}


// ======================================
// 2. BOOK APPOINTMENT
// ======================================

appointmentForm.addEventListener(
    "submit",
    async function (event) {

        // Prevent page reload
        event.preventDefault();

        // Get form values
        const doctor = doctorSelect.value;

        const date = appointmentDate.value;

        const reason = document
            .getElementById("reason")
            .value
            .trim();


        // Validate fields
        if (!doctor || !date || !reason) {

            bookingMessage.textContent =
                "Please fill all fields.";

            bookingMessage.style.color = "red";

            return;

        }


        // Check future date
        const selectedDate = new Date(date);

        if (selectedDate <= new Date()) {

            bookingMessage.textContent =
                "Please select a future date and time.";

            bookingMessage.style.color = "red";

            return;

        }


        try {

            // Send appointment request to backend
            const response = await fetch(
                `${API_URL}/appointments`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",

                        "Authorization": `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        doctor: doctor,

                        appointmentDate:
                            selectedDate.toISOString(),

                        reason: reason

                    })

                }
            );


            const data = await response.json();


            // Check API response
            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Appointment booking failed"
                );

            }


            // Success message
            bookingMessage.textContent =
                data.message ||
                "Appointment booked successfully!";

            bookingMessage.style.color = "green";


            // Clear form
            appointmentForm.reset();


            // Reload dashboard after booking
            setTimeout(function () {

                window.location.reload();

            }, 1500);


        } catch (error) {

            // Show error
            bookingMessage.textContent =
                error.message;

            bookingMessage.style.color = "red";

            console.error("Booking Error:", error);

        }

    }
);


// ======================================
// 3. LOAD DOCTORS WHEN PAGE OPENS
// ======================================

loadDoctors();
})();