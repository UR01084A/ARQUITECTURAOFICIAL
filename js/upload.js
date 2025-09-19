let trabajos = JSON.parse(localStorage.getItem("trabajos")) || [];

function mostrarTrabajos() {
  const trabajosList = document.getElementById("trabajosList");
  trabajosList.innerHTML = "";

  trabajos.forEach((trabajo) => {
    const div = document.createElement("div");
    div.classList.add("trabajo-card");
    div.innerHTML = `
      <h3>${trabajo.titulo}</h3>
      <a href="${trabajo.archivo}" download>📂 Descargar</a>
    `;
    trabajosList.appendChild(div);
  });

  if (localStorage.getItem("isAdmin") === "true") {
    document.getElementById("uploadForm").style.display = "block";
  }
}

function subirTrabajo() {
  const titulo = document.getElementById("tituloTrabajo").value;
  const archivoInput = document.getElementById("archivoTrabajo");

  if (titulo && archivoInput.files.length > 0) {
    const archivo = URL.createObjectURL(archivoInput.files[0]);
    const nuevoTrabajo = { titulo, archivo };
    trabajos.push(nuevoTrabajo);
    localStorage.setItem("trabajos", JSON.stringify(trabajos));
    mostrarTrabajos();
    document.getElementById("tituloTrabajo").value = "";
    archivoInput.value = "";
  } else {
    alert("Por favor complete todos los campos.");
  }
}

mostrarTrabajos();