
// ==================================
// BACKEND API URL
// ==================================

const API_URL = "https://carenest-backend-xbuo.onrender.com/api";


// ==================================
// SHOW / HIDE PASSWORD
// ==================================

const toggleButtons = document.querySelectorAll(".toggle-password");

toggleButtons.forEach(button => {

    button.addEventListener("click", function () {

        const targetId = this.dataset.target;
        const passwordInput = document.getElementById(targetId);
        const icon = this.querySelector("i");

        if (!passwordInput || !icon) return;

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");

        } else {

            passwordInput.type = "password";

            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");

        }

    });

});


// ==================================
// REDIRECT USER ACCORDING TO ROLE
// ==================================

function redirectUserByRole(user) {

    if (user.role === "patient") {

        window.location.href = "patient-dashboard.html";

    } else if (user.role === "doctor") {

        window.location.href = "doctor-dashboard.html";

    } else if (user.role === "admin") {

        window.location.href = "admin-dashboard.html";

    } else {

        alert("Invalid user role.");

    }

}


// ==================================
// LOGIN FORM - BACKEND CONNECTION
// ==================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const message = document.getElementById("loginMessage");

        if (!email || !password) {

            message.textContent = "Please fill all fields.";
            message.className = "form-message error";
            return;

        }

        message.textContent = "Logging in...";
        message.className = "form-message";

        try {

            const response = await fetch(`${API_URL}/auth/login`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })

            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed.");
            }

            // Save JWT token and user information
            sessionStorage.setItem("token", data.token);
            sessionStorage.setItem("user", JSON.stringify(data.user));

            message.textContent = data.message || "Login successful!";
            message.className = "form-message success";

            console.log("Logged in User:", data.user);

            // Redirect according to role
            setTimeout(() => {
                redirectUserByRole(data.user);
            }, 1000);

        } catch (error) {

            message.textContent = error.message || "Unable to connect to server.";
            message.className = "form-message error";

        }

    });

}


// ==================================
// REGISTER FORM - BACKEND CONNECTION
// ==================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = document.getElementById("fullName").value.trim();

        const email = document.getElementById("registerEmail").value.trim();

        const phone = document.getElementById("phone").value.trim();

        const role = document.getElementById("role").value;

        const password = document.getElementById("registerPassword").value;

        const confirmPassword = document.getElementById("confirmPassword").value;

        const terms = document.getElementById("terms").checked;

        const message = document.getElementById("registerMessage");


        // Name validation

        if (name.length < 3) {

            message.textContent = "Name must contain at least 3 characters.";
            message.className = "form-message error";
            return;

        }


        // Email validation

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

            message.textContent = "Please enter a valid email address.";
            message.className = "form-message error";
            return;

        }


        // Phone validation

        if (!/^[0-9]{10}$/.test(phone)) {

            message.textContent = "Enter a valid 10 digit phone number.";
            message.className = "form-message error";
            return;

        }


        // Password validation

        if (password.length < 8) {

            message.textContent = "Password must contain at least 8 characters.";
            message.className = "form-message error";
            return;

        }


        // Confirm password validation

        if (password !== confirmPassword) {

            message.textContent = "Passwords do not match!";
            message.className = "form-message error";
            return;

        }


        // Terms validation

        if (!terms) {

            message.textContent = "Please accept the Terms and Privacy Policy.";
            message.className = "form-message error";
            return;

        }


        // Check role

        if (!["patient", "doctor"].includes(role)) {

            message.textContent = "Please select a valid role.";
            message.className = "form-message error";
            return;

        }


        message.textContent = "Creating your account...";
        message.className = "form-message";


        try {

            const response = await fetch(`${API_URL}/auth/register`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password,
                    role
                })

            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed.");
            }

            // Check token received from backend
            if (!data.token || !data.user) {
                throw new Error("Registration successful, but login token was not received.");
            }

            // Save JWT token and user information
            sessionStorage.setItem("token", data.token);
            sessionStorage.setItem("user", JSON.stringify(data.user));

            message.textContent = data.message || "Registration successful! Redirecting...";
            message.className = "form-message success";

            console.log("Registered User:", data.user);

            // Redirect automatically according to role
            setTimeout(() => {

                redirectUserByRole(data.user);

            }, 1000);

        } catch (error) {

            message.textContent = error.message || "Unable to connect to server.";
            message.className = "form-message error";

        }

    });

}
