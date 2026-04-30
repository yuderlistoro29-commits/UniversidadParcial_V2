/* =====================================================
   CONFIGURACIÓN Y VARIABLES GLOBALES
   ===================================================== */
const API_URL = "/api";
let currentEmail = "";

/* =====================================================
   INICIALIZACIÓN
   ===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    checkUnauthParam();
    validateExistingSession();
    initOTPBoxes();
});

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        validateExistingSession();
    }
});

/* ── Lógica de los 6 cuadros de OTP ── */
function initOTPBoxes() {
    const boxes = Array.from({ length: 6 }, (_, i) => document.getElementById("b" + i));

    boxes.forEach((box, i) => {
        if (!box) return;

        box.addEventListener("input", (e) => {
            // Solo números y un solo dígito
            box.value = e.target.value.replace(/\D/g, "")[0] || "";
            // Salto al siguiente cuadro
            if (box.value && i < 5) boxes[i + 1].focus();
            updateOTPState(boxes);
        });

        box.addEventListener("keydown", (e) => {
            // Retroceder con Borrar
            if (e.key === "Backspace" && !box.value && i > 0) {
                boxes[i - 1].focus();
                boxes[i - 1].value = "";
                updateOTPState(boxes);
            }
        });

        box.addEventListener("paste", (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData)
                .getData("text")
                .replace(/\D/g, "");
            paste.split("").slice(0, 6).forEach((ch, j) => {
                if (boxes[j]) boxes[j].value = ch;
            });
            const nextFocus = Math.min(paste.length, 5);
            if (boxes[nextFocus]) boxes[nextFocus].focus();
            updateOTPState(boxes);
        });
    });
}

function updateOTPState(boxes) {
    boxes.forEach((b) => b.classList.toggle("filled", !!b.value));
    const complete = boxes.map((b) => b.value).join("").length === 6;
    const verifyBtn = document.getElementById("verify-btn");
    if (verifyBtn) verifyBtn.disabled = !complete;
    
    // Limpiar mensajes al escribir
    const msg = document.getElementById("message");
    if (msg) {
        msg.textContent = "";
        msg.className = "notice";
    }
}

function getOTPCode() {
    return Array.from({ length: 6 }, (_, i) => document.getElementById("b" + i).value).join("");
}

function clearOTPBoxes() {
    Array.from({ length: 6 }, (_, i) => {
        const b = document.getElementById("b" + i);
        if (b) {
            b.value = "";
            b.classList.remove("filled");
        }
    });
    const verifyBtn = document.getElementById("verify-btn");
    if (verifyBtn) verifyBtn.disabled = true;
}

/* =====================================================
   NAVEGACIÓN Y SESIÓN
   ===================================================== */
function showEmailForm() {
    document.getElementById("hero-section").style.display = "none";
    document.getElementById("otp-section").style.display = "none";
    document.getElementById("email-section").style.display = "grid";
}

function backToLanding() {
    document.getElementById("email-section").style.display = "none";
    document.getElementById("otp-section").style.display = "none";
    document.getElementById("hero-section").style.display = "grid";
    document.getElementById("email").value = "";
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
    } catch (_) { /* ignore */ }

    sessionStorage.clear();
}

function checkUnauthParam() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("unauth") === "1") {
        const modal = document.getElementById("unauth-modal");
        if (modal) modal.style.display = "flex";
        history.replaceState(null, "", "/");
    }
}

function closeUnauthModal() {
    const modal = document.getElementById("unauth-modal");
    if (modal) modal.style.display = "none";
}

/* =====================================================
   FLUJO DE AUTENTICACIÓN (API)
   ===================================================== */
async function requestOTP(isResend = false) {
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();

    if (!email) {
        showMessage('Por favor ingresa tu correo', 'error', true);
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
        
        // Actualizar UI
        const displayEmail = document.getElementById("otp-email-display");
        if (displayEmail) displayEmail.textContent = email;

        document.getElementById('email-section').style.display = 'none';
        document.getElementById('otp-section').style.display = 'grid';

        if (isResend) clearOTPBoxes();

        const msg = isResend
            ? 'Código reenviado. El anterior ya no es válido.'
            : 'Código enviado. Revisa tu correo.';
        showMessage(msg, 'success', false);

    } catch (error) {
        showMessage(error.message, 'error', true);
    }
}

async function verifyOTP() {
    const code = getOTPCode();

    if (code.length !== 6) {
        showMessage("El código debe tener 6 dígitos", "error", false);
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

        // Guardar sesión y redirigir
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("email", currentEmail);
        window.location.replace("/students");

    } catch (error) {
        showMessage(error.message, "error", false);
    }
}

/* ── Helpers de Mensajes ── */
function showMessage(msg, type, isEmailScreen) {
    const targetId = isEmailScreen ? "message-email" : "message";
    const el = document.getElementById(targetId);
    if (el) {
        el.textContent = msg;
        el.className = `notice ${type}`;
    }
}