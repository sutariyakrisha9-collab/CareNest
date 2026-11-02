
(function () {

    const API_URL = "http://localhost:5000/api";

    const token = sessionStorage.getItem("token");

    const doctorsList = document.getElementById("doctorsList");

    const modal = document.getElementById("editDoctorModal");

    const editForm = document.getElementById("editDoctorForm");

    const message = document.getElementById("editDoctorMessage");

    // ===================================
    // LOAD ALL DOCTORS
    // ===================================

    async function loadDoctors() {

        doctorsList.textContent = "Loading doctors...";

        try {

            const response = await fetch(`${API_URL}/doctor/all`);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load doctors");
            }

            doctorsList.replaceChildren();

            if (!data.doctors || data.doctors.length === 0) {
                doctorsList.textContent = "No doctors found.";
                return;
            }

            data.doctors.forEach(function (doctor) {

                const card = document.createElement("div");
                card.className = "doctor-card";

                const name = doctor.user?.name || "Unknown Doctor";
                const email = doctor.user?.email || "N/A";
                const phone = doctor.user?.phone || "N/A";

                const days = doctor.availableDays?.length
                    ? doctor.availableDays.join(", ")
                    : "Not specified";

                function addDetail(label, value) {

                    const p = document.createElement("p");

                    const strong = document.createElement("strong");
                    strong.textContent = label + ": ";

                    p.append(strong, document.createTextNode(value));

                    card.appendChild(p);
                }

                const heading = document.createElement("h3");
                heading.textContent = name;
                card.appendChild(heading);

                addDetail("Email", email);
                addDetail("Phone", phone);
                addDetail("Specialization", doctor.specialization);
                addDetail("Qualification", doctor.qualification);
                addDetail("Experience", doctor.experience + " years");

                addDetail(
                    "Consultation Fee",
                    "₹" + doctor.consultationFee
                );

                addDetail("Available Days", days);

                const status = document.createElement("span");

                status.className = "doctor-status";

                status.textContent = doctor.isAvailable
                    ? "Available"
                    : "Unavailable";

                card.appendChild(status);

                // Edit Button
                const editBtn = document.createElement("button");

                editBtn.type = "button";
                editBtn.className = "edit-doctor-btn";
                editBtn.textContent = "Edit";

                editBtn.addEventListener("click", function () {
                    openEditModal(doctor);
                });

                // Delete Button
                const deleteBtn = document.createElement("button");

                deleteBtn.type = "button";
                deleteBtn.className = "delete-doctor-btn";
                deleteBtn.textContent = "Delete";

                deleteBtn.addEventListener("click", function () {
                    deleteDoctor(doctor._id, name);
                });

                const actions = document.createElement("div");

                actions.className = "doctor-card-actions";

                actions.append(editBtn, deleteBtn);

                card.appendChild(actions);

                doctorsList.appendChild(card);

            });

        } catch (error) {

            doctorsList.textContent = error.message;

            console.error("Doctor Loading Error:", error);

        }

    }


    // ===================================
    // OPEN EDIT MODAL
    // ===================================

    function openEditModal(doctor) {

        document.getElementById("editDoctorId").value = doctor._id;

        document.getElementById("editDoctorName").value =
            doctor.user?.name || "";

        document.getElementById("editDoctorEmail").value =
            doctor.user?.email || "";

        document.getElementById("editDoctorPhone").value =
            doctor.user?.phone || "";

        document.getElementById("editSpecialization").value =
            doctor.specialization || "";

        document.getElementById("editQualification").value =
            doctor.qualification || "";

        document.getElementById("editExperience").value =
            doctor.experience ?? "";

        document.getElementById("editConsultationFee").value =
            doctor.consultationFee ?? "";

        document.getElementById("editAbout").value =
            doctor.about || "";

        document.querySelectorAll(
            'input[name="editAvailableDays"]'
        ).forEach(function (checkbox) {

            checkbox.checked = doctor.availableDays?.includes(
                checkbox.value
            ) || false;

        });

        message.textContent = "";

        modal.style.display = "block";

    }


    // ===================================
    // CLOSE EDIT MODAL
    // ===================================

    function closeEditModal() {

        modal.style.display = "none";

        editForm.reset();

        message.textContent = "";

    }

    document.getElementById("closeEditModal")
        .addEventListener("click", closeEditModal);

    document.getElementById("cancelEditBtn")
        .addEventListener("click", closeEditModal);


    // ===================================
    // UPDATE DOCTOR
    // ===================================

    editForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const doctorId =
            document.getElementById("editDoctorId").value;

        const availableDays = Array.from(
            document.querySelectorAll(
                'input[name="editAvailableDays"]:checked'
            )
        ).map(function (checkbox) {
            return checkbox.value;
        });

        const doctorData = {

            name: document.getElementById("editDoctorName").value.trim(),

            email: document.getElementById("editDoctorEmail").value.trim(),

            phone: document.getElementById("editDoctorPhone").value.trim(),

            specialization:
                document.getElementById("editSpecialization").value.trim(),

            qualification:
                document.getElementById("editQualification").value.trim(),

            experience:
                Number(document.getElementById("editExperience").value),

            consultationFee:
                Number(document.getElementById("editConsultationFee").value),

            about: document.getElementById("editAbout").value.trim(),

            availableDays

        };

        const saveBtn = document.getElementById("saveDoctorBtn");

        saveBtn.disabled = true;
        saveBtn.textContent = "Updating...";

        message.textContent = "Updating doctor details...";

        try {

            const response = await fetch(
                `${API_URL}/admin/doctors/${doctorId}`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },

                    body: JSON.stringify(doctorData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to update doctor");
            }

            alert("Doctor updated successfully!");

            closeEditModal();

            await loadDoctors();

        } catch (error) {

            message.textContent = error.message;
            message.style.color = "red";

            console.error("Update Doctor Error:", error);

        } finally {

            saveBtn.disabled = false;
            saveBtn.textContent = "Update Doctor";

        }

    });


    // ===================================
    // DELETE DOCTOR
    // ===================================

    async function deleteDoctor(doctorId, doctorName) {

        const confirmDelete = confirm(
            `Are you sure you want to deactivate ${doctorName}?`
        );

        if (!confirmDelete) {
            return;
        }

        try {

            const response = await fetch(
                `${API_URL}/admin/doctors/${doctorId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to delete doctor");
            }

            alert(data.message);

            await loadDoctors();

        } catch (error) {

            alert(error.message);

            console.error("Delete Doctor Error:", error);

        }

    }


    // ===================================
    // INITIAL LOAD
    // ===================================

    if (!token) {

        window.location.href = "login.html";
        return;

    }

    loadDoctors();

})();
