const API_URL = "/api/students";
const AUTH_URL = "/api/auth";

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        verifySessionOrRedirect();
    }
});

function authHeaders() {
    const token = sessionStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

function goToLogin() {
    sessionStorage.clear();
    window.location.replace("/?unauth=1");
}

function showSessionModal() {
    document.getElementById("session-modal").style.display = "flex";
}

async function verifySessionOrRedirect() {
    const token = sessionStorage.getItem("token");

    if (!token) {
        goToLogin();
        return false;
    }

    try {
        const response = await fetch(`${AUTH_URL}/session`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            showSessionModal();
            return false;
        }

        document.body.classList.remove("auth-locked");
        return true;
    } catch (_) {
        showSessionModal();
        return false;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const ok = await verifySessionOrRedirect();
    if (ok) await loadStudents();
});

async function loadStudents() {
    try {
        const response = await fetch(API_URL, { headers: authHeaders() });

        if (response.status === 401) {
            showSessionModal();
            return;
        }

        if (!response.ok) throw new Error("No se pudieron cargar los estudiantes");

        const students = await response.json();
        renderTable(students);
    } catch (error) {
        console.error("Error cargando estudiantes:", error);
    }
}

function renderTable(students) {
    const tbody = document.getElementById("students-list");
    tbody.innerHTML = "";

    if (!students.length) {
        tbody.innerHTML = '<tr><td colspan="6">No hay estudiantes registrados</td></tr>';
        return;
    }

    students.forEach((student) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.lastname}</td>
            <td>${student.age}</td>
            <td>${student.grade}</td>
            <td>
                <div class="actions">
                    <button class="btn-secondary" onclick='editStudent(${student.id}, ${JSON.stringify(student.name)}, ${JSON.stringify(student.lastname)}, ${student.age}, ${student.grade})'>Editar</button>
                    <button class="btn-danger" onclick="deleteStudent(${student.id})">Eliminar</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function saveStudent() {
    const id = document.getElementById("student-id").value;
    const name = document.getElementById("name").value.trim();
    const lastname = document.getElementById("lastname").value.trim();
    const age = Number(document.getElementById("age").value);
    const grade = Number(document.getElementById("grade").value);

    if (!name || !lastname || Number.isNaN(age) || Number.isNaN(grade)) {
        alert("Todos los campos son obligatorios");
        return;
    }
    if (age <= 0) { alert("La edad debe ser un número positivo"); return; }
    if (grade < 0 || grade > 5) { alert("La nota debe estar entre 0 y 5"); return; }

    const studentData = { name, lastname, age, grade };
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/${id}` : API_URL;

    try {
        const response = await fetch(url, {
            method,
            headers: authHeaders(),
            body: JSON.stringify(studentData),
        });

        if (response.status === 401) { showSessionModal(); return; }

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Error en la operación");
        }

        clearForm();
        loadStudents();
        alert(id ? "Estudiante actualizado" : "Estudiante creado");
    } catch (error) {
        alert(error.message);
    }
}

async function deleteStudent(id) {
    if (!confirm("¿Estás seguro de eliminar este estudiante?")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        });

        if (response.status === 401) { showSessionModal(); return; }
        if (!response.ok) throw new Error("Error eliminando estudiante");

        loadStudents();
    } catch (error) {
        alert(error.message);
    }
}

function editStudent(id, name, lastname, age, grade) {
    document.getElementById("student-id").value = id;
    document.getElementById("name").value = name;
    document.getElementById("lastname").value = lastname;
    document.getElementById("age").value = age;
    document.getElementById("grade").value = grade;
    document.getElementById("submit-btn").textContent = "Actualizar";
}

function clearForm() {
    document.getElementById("student-id").value = "";
    document.getElementById("name").value = "";
    document.getElementById("lastname").value = "";
    document.getElementById("age").value = "";
    document.getElementById("grade").value = "";
    document.getElementById("submit-btn").textContent = "Guardar";
}

async function logout() {
    const token = sessionStorage.getItem("token");

    try {
        if (token) {
            await fetch(`${AUTH_URL}/logout`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        }
    } catch (_) {
        // ignore
    }

    sessionStorage.clear();
    window.location.replace("/");
}
