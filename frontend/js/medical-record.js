(function () {
// ======================================
// CARENEST - MEDICAL RECORD MANAGEMENT
// ======================================

// Backend API URL
const API_URL = "http://localhost:5000/api";

// Get patient token
const token = sessionStorage.getItem("token");

// Get HTML elements
const recordUploadForm = document.getElementById("recordUploadForm");
const recordTitle = document.getElementById("recordTitle");
const recordDescription = document.getElementById("recordDescription");
const recordFile = document.getElementById("recordFile");
const recordUploadMessage = document.getElementById("recordUploadMessage");
const recordsList = document.getElementById("recordsList");
const recordCount = document.getElementById("recordCount");

// Check login
if (!token) {
    window.location.href = "login.html";
}


// ======================================
// 1. LOAD MEDICAL RECORDS
// ======================================

async function loadMedicalRecords() {

    try {

        const response = await fetch(`${API_URL}/medical-records`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load medical records");
        }

        const records = data.records || [];

        // Update dashboard count
        if (recordCount) {
            recordCount.textContent =
                data.totalRecords ?? data.total ?? records.length;
        }

        // Check records container
        if (!recordsList) return;

        recordsList.innerHTML = "";

        // If no records found
        if (records.length === 0) {

            recordsList.textContent = "No medical records found.";

            return;
        }

        // Display records
        records.forEach((record) => {

            const card = document.createElement("div");
            card.className = "record-card";

            const title = document.createElement("h3");
            title.textContent = record.title || "Untitled Record";

            const description = document.createElement("p");
            description.textContent =
                record.description || "No description available";

            const fileName = document.createElement("p");
            fileName.textContent =
                "File: " + (record.fileName || "Unknown file");

            // Download button
            const downloadButton = document.createElement("button");

            downloadButton.textContent = "Download";
            downloadButton.className = "book-btn";

            downloadButton.addEventListener("click", () => {
                downloadMedicalRecord(record._id, record.fileName);
            });

            // Delete button
            const deleteButton = document.createElement("button");

            deleteButton.textContent = "Delete";
            deleteButton.className = "book-btn";
            deleteButton.style.background = "#dc3545";
            deleteButton.style.marginLeft = "10px";

            deleteButton.addEventListener("click", () => {
                deleteMedicalRecord(record._id);
            });

            // Add elements to card
            card.appendChild(title);
            card.appendChild(description);
            card.appendChild(fileName);
            card.appendChild(downloadButton);
            card.appendChild(deleteButton);

            recordsList.appendChild(card);

        });

    } catch (error) {

        console.error("Medical Records Error:", error);

        if (recordsList) {
            recordsList.textContent = error.message;
        }

    }

}


// ======================================
// 2. UPLOAD MEDICAL RECORD
// ======================================

if (recordUploadForm) {

    recordUploadForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const title = recordTitle.value.trim();
        const description = recordDescription.value.trim();
        const file = recordFile.files[0];

        // Validate title and file
        if (!title || !file) {

            recordUploadMessage.textContent =
                "Please enter a title and select a file.";

            recordUploadMessage.style.color = "red";

            return;
        }

        // Allowed file types
        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png"
        ];

        if (!allowedTypes.includes(file.type)) {

            recordUploadMessage.textContent =
                "Only PDF, JPG and PNG files are allowed.";

            recordUploadMessage.style.color = "red";

            return;
        }

        // Maximum file size: 5 MB
        if (file.size > 5 * 1024 * 1024) {

            recordUploadMessage.textContent =
                "File size must be less than 5 MB.";

            recordUploadMessage.style.color = "red";

            return;
        }

        try {

            const formData = new FormData();

            formData.append("title", title);
            formData.append("description", description);

            // IMPORTANT:
            // This field name must match upload.single() in backend.
            formData.append("medicalFile", file);

            recordUploadMessage.textContent = "Uploading...";
            recordUploadMessage.style.color = "blue";

            const response = await fetch(
                `${API_URL}/medical-records/upload`,
                {
                    method: "POST",

                    headers: {
                        "Authorization": `Bearer ${token}`
                    },

                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message || "Medical record upload failed"
                );

            }

            // Success message
            recordUploadMessage.textContent =
                data.message || "Medical record uploaded successfully!";

            recordUploadMessage.style.color = "green";

            // Reset form
            recordUploadForm.reset();

            // Refresh records list and count
            await loadMedicalRecords();

        } catch (error) {

            recordUploadMessage.textContent = error.message;
            recordUploadMessage.style.color = "red";

            console.error("Upload Error:", error);

        }

    });

}


// ======================================
// 3. DOWNLOAD MEDICAL RECORD
// ======================================

async function downloadMedicalRecord(id, fileName) {

    try {

        const response = await fetch(
            `${API_URL}/medical-records/download/${id}`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {

            let message = "Download failed";

            try {
                const data = await response.json();
                message = data.message || message;
            } catch (error) {
                // Keep default message
            }

            throw new Error(message);

        }

        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = fileName || "medical-record";

        document.body.appendChild(link);

        link.click();

        link.remove();

        window.URL.revokeObjectURL(url);

    } catch (error) {

        alert(error.message);

        console.error("Download Error:", error);

    }

}


// ======================================
// 4. DELETE MEDICAL RECORD
// ======================================

async function deleteMedicalRecord(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this medical record?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/medical-records/${id}`,
            {
                method: "DELETE",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Unable to delete medical record"
            );

        }

        alert(data.message || "Medical record deleted successfully!");

        // Refresh records and count
        await loadMedicalRecords();

    } catch (error) {

        alert(error.message);

        console.error("Delete Error:", error);

    }

}


// ======================================
// 5. LOAD RECORDS WHEN PAGE OPENS
// ======================================

loadMedicalRecords();
})();