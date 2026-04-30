const API_URL = "/api";

let currentEmail = "";

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        validateExistingSession();
    }
});

// Muestra modal si viene redirigido por acceso no autorizado
function checkUnauthParam() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("unauth") === "1") {
        document.getElementById("unauth-modal").style.display = "flex";
        // Limpia el param de la URL sin recargar
        history.replaceState(null, "", "/");
    }
}

function closeUnauthModal() {
    document.getElementById("unauth-modal").style.display = "none";
}

async function validateExistingSession() {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/auth/session`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
            window.location.replace("/students");
            return;
        }
    } catch (_) {
        // ignore
    }

    sessionStorage.clear();
}

document.addEventListener("DOMContentLoaded", () => {
    checkUnauthParam();
    validateExistingSession();
});

async function requestOTP(isResend = false) {
    const email = document.getElementById('email').value.trim();

    if (!email) {
        showMessage('Por favor ingresa tu correo', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/request-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.detail || 'Error enviando OTP');

        currentEmail = email;
        document.getElementById('email-section').style.display = 'none';
        document.getElementById('otp-section').style.display = 'grid';

        const msg = isResend
            ? 'Código reenviado. El código anterior ya no es válido.'
            : 'Código enviado. Revisa tu correo y coloca el código.';
        showMessage(msg, 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function verifyOTP() {
    const code = document.getElementById("otp-code").value.trim();

    if (!code || code.length !== 6) {
        showMessage("El código debe tener 6 dígitos", "error");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: currentEmail, code }),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.detail || "Código inválido");

        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("email", currentEmail);
        window.location.replace("/students");
    } catch (error) {
        showMessage(error.message, "error");
    }
}

function showMessage(msg, type) {
    const el = document.getElementById("message");
    el.textContent = msg;
    el.className = `notice ${type}`;
}
