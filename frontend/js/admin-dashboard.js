
(function () {

    // ==================================
    // ADMIN DASHBOARD
    // ==================================

    const API_URL = "https://carenest-backend-xbuo.onrender.com/api";

    const token = sessionStorage.getItem("token");

    const user = JSON.parse(
        sessionStorage.getItem("user") || "null"
    );


    // ==================================
    // CHECK ADMIN LOGIN
    // ==================================

    if (!token || !user) {

        window.location.href = "login.html";
        return;

    }

    if (user.role !== "admin") {

        alert("Access denied! Admin account required.");

        window.location.href = "login.html";
        return;

    }

    document.getElementById("adminName").textContent = user.name;


    // ==================================
    // LOGOUT
    // ==================================

    const logoutBtn = document.getElementById("logoutBtn");

    logoutBtn.addEventListener("click", function () {

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        window.location.href = "login.html";

    });


    // ==================================
    // ADD DOCTOR
    // ==================================

    const addDoctorForm = document.getElementById("addDoctorForm");

    const message = document.getElementById("addDoctorMessage");

    addDoctorForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        message.textContent = "Adding doctor...";
        message.style.color = "blue";

        // Get selected available days
        const availableDays = Array.from(
            document.querySelectorAll(
                'input[name="availableDays"]:checked'
            )
        ).map(checkbox => checkbox.value);


        // Get form data
        const doctorData = {

            name: document.getElementById("doctorName").value.trim(),

            email: document.getElementById("doctorEmail").value.trim(),

            phone: document.getElementById("doctorPhone").value.trim(),

            password: document.getElementById("doctorPassword").value,

            specialization: document.getElementById("specialization").value.trim(),

            qualification: document.getElementById("qualification").value.trim(),

            experience: Number(
                document.getElementById("experience").value
            ),

            consultationFee: Number(
                document.getElementById("consultationFee").value
            ),

            about: document.getElementById("about").value.trim(),

            availableDays: availableDays

        };


        try {

            // Send data to backend
            const response = await fetch(
                `${API_URL}/admin/doctors`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },

                    body: JSON.stringify(doctorData)
                }
            );


            const data = await response.json();


            // Handle errors
            if (!response.ok) {

                throw new Error(
                    data.message || "Unable to add doctor"
                );

            }


            // Success message
            message.textContent = data.message;

            message.style.color = "green";


            // Reset form
            addDoctorForm.reset();

            console.log("Doctor Added:", data);


        } catch (error) {

            message.textContent = error.message;

            message.style.color = "red";

            console.error("Add Doctor Error:", error);

        }

    });

})();
