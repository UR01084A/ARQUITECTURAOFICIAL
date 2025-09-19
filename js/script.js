const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

let trabajos = JSON.parse(localStorage.getItem("trabajos")) || [];

// LOGIN / LOGOUT
function mostrarLogin() {
  window.location.href = "index.html";
  setTimeout(() => {
    document.getElementById("loginBox")?.scrollIntoView({ behavior: "smooth" });
  }, 100);
}

function login() {
  const usuario = document.getElementById("usuario")?.value;
  const password = document.getElementById("password")?.value;
  const msg = document.getElementById("loginMsg");

  if (usuario === ADMIN_USER && password === ADMIN_PASS) {
    localStorage.setItem("isAdmin", "true");
    msg && (msg.textContent = "Acceso concedido ✅");
    document.getElementById("btnLogoutMenu")?.style.setProperty("display", "inline-block");
    document.getElementById("btnLoginMenu")?.style.setProperty("display", "none");
    document.getElementById("uploadForm")?.style.setProperty("display", "block");
    renderTrabajos();
  } else {
    msg && (msg.textContent = "Credenciales incorrectas ❌");
  }
}

function logout() {
  localStorage.removeItem("isAdmin");
  document.getElementById("btnLogoutMenu")?.style.setProperty("display", "none");
  document.getElementById("btnLoginMenu")?.style.setProperty("display", "inline-block");
  document.getElementById("usuario") && (document.getElementById("usuario").value = "");
  document.getElementById("password") && (document.getElementById("password").value = "");
  document.getElementById("uploadForm")?.style.setProperty("display", "none");
  window.location.href = "index.html";
}

// SUBIR TRABAJO (Base64 para persistencia)
function subirTrabajo() {
  const titulo = document.getElementById("tituloTrabajo").value;
  const archivoInput = document.getElementById("archivoTrabajo");

  if (!titulo || archivoInput.files.length === 0) return alert("Complete todos los campos");

  const file = archivoInput.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    trabajos.push({ titulo, url: e.target.result });
    localStorage.setItem("trabajos", JSON.stringify(trabajos));
    renderTrabajos();
  };

  reader.readAsDataURL(file);
  document.getElementById("tituloTrabajo").value = "";
  archivoInput.value = "";
}

// RENDER TRABAJOS
function renderTrabajos() {
  const container = document.getElementById("trabajosList");
  if (!container) return;
  container.innerHTML = "";
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  trabajos.forEach((trabajo, i) => {
    const card = document.createElement("div");
    card.className = "trabajo-card";

    const a = document.createElement("a");
    a.href = trabajo.url;
    a.download = trabajo.titulo;
    a.textContent = "📂 Descargar";
    card.innerHTML = `<h3>${trabajo.titulo}</h3>`;
    card.appendChild(a);

    if (isAdmin) {
      const btnEdit = document.createElement("button");
      btnEdit.textContent = "✏️ Editar";
      btnEdit.onclick = () => editarTrabajo(i);

      const btnDelete = document.createElement("button");
      btnDelete.textContent = "🗑️ Eliminar";
      btnDelete.onclick = () => eliminarTrabajo(i);

      card.appendChild(btnEdit);
      card.appendChild(btnDelete);
    }

    container.appendChild(card);
  });

  const uploadForm = document.getElementById("uploadForm");
  if (uploadForm) uploadForm.style.display = isAdmin ? "block" : "none";
}

// ELIMINAR
function eliminarTrabajo(index) {
  if (confirm("¿Deseas eliminar este trabajo?")) {
    trabajos.splice(index, 1);
    localStorage.setItem("trabajos", JSON.stringify(trabajos));
    renderTrabajos();
  }
}

// EDITAR
function editarTrabajo(index) {
  const nuevoTitulo = prompt("Nuevo título:", trabajos[index].titulo);
  if (!nuevoTitulo) return;

  const inputArchivo = document.createElement("input");
  inputArchivo.type = "file";
  inputArchivo.onchange = () => {
    if (inputArchivo.files.length > 0) {
      const reader = new FileReader();
      reader.onload = function(e) {
        trabajos[index] = { titulo: nuevoTitulo, url: e.target.result };
        localStorage.setItem("trabajos", JSON.stringify(trabajos));
        renderTrabajos();
      };
      reader.readAsDataURL(inputArchivo.files[0]);
    } else {
      trabajos[index].titulo = nuevoTitulo;
      localStorage.setItem("trabajos", JSON.stringify(trabajos));
      renderTrabajos();
    }
  };
  inputArchivo.click();
}

// Render inicial en trabajos.html
renderTrabajos();

// Mostrar botones login/logout según sesión
if (localStorage.getItem("isAdmin") === "true") {
  document.getElementById("btnLogoutMenu")?.style.setProperty("display", "inline-block");
  document.getElementById("btnLoginMenu")?.style.setProperty("display", "none");
} else {
  document.getElementById("btnLogoutMenu")?.style.setProperty("display", "none");
  document.getElementById("btnLoginMenu")?.style.setProperty("display", "inline-block");
}
