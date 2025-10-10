// Obtener elementos
const videoBg = document.getElementById("bg-video");
const themeToggle = document.getElementById("theme-toggle");

let isNight = false;

// --- 1️⃣ Aplicar tema guardado al cargar la página ---
const savedTheme = localStorage.getItem("isNight");
if (savedTheme !== null) {
  isNight = savedTheme === "true";
} else {
  // Si no hay preferencia guardada, usar tema por defecto (día)
  isNight = false;
}

// Aplicar clases y video
document.body.classList.toggle("night", isNight);
document.body.classList.toggle("day", !isNight);
videoBg.src = isNight ? "imagenes/noche.mp4" : "imagenes/dia.mp4";
themeToggle.textContent = isNight ? "☀️" : "🌙";

// --- 2️⃣ Cambiar tema al hacer clic ---
themeToggle.addEventListener("click", () => {
  isNight = !isNight;

  document.body.classList.toggle("night", isNight);
  document.body.classList.toggle("day", !isNight);

  // efecto de fade para el video
  videoBg.style.opacity = 0;
  setTimeout(() => {
    videoBg.src = isNight ? "imagenes/noche.mp4" : "imagenes/dia.mp4";
    videoBg.style.opacity = 1;
  }, 500);

  // Cambiar ícono
  themeToggle.textContent = isNight ? "☀️" : "🌙";

  // Guardar la preferencia en todas las páginas
  localStorage.setItem("isNight", isNight);
});
