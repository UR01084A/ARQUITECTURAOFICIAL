import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://jovcbebpunhmpvhflnio.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdmNiZWJwdW5obXB2aGZsbmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTYxODIsImV4cCI6MjA3Mzk3MjE4Mn0.98VIdpjh4ap8h4iyoCANjhjjI88T784VUbxfLtcSa5o";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const listaArchivos = document.getElementById("listaArchivos");
const tituloSemana = document.getElementById("tituloSemana");

// Obtener curso y semana desde la URL
const params = new URLSearchParams(window.location.search);
const curso = params.get("curso") || "Arquitectura de Software";
const semana = params.get("semana") || "Semana 1";

tituloSemana.textContent = `${curso} - ${semana}`;

// 🔹 Previsualización de archivos
function obtenerPreview(nombreArchivo, url) {
  const ext = nombreArchivo.split(".").pop().toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return `<img src="${url}" class="preview-icon" style="object-fit:cover;border:1px solid #ddd;border-radius:8px;">`;
  }
  if (ext === "pdf") return `<img src="images/pdf-icon.png" class="preview-icon">`;
  if (["doc", "docx"].includes(ext)) return `<img src="images/word-icon.png" class="preview-icon">`;
  if (["xls", "xlsx"].includes(ext)) return `<img src="images/excel-icon.png" class="preview-icon">`;

  return `<img src="images/file-icon.png" class="preview-icon">`;
}

// 🔹 Descargar archivo como blob
async function descargarArchivo(path, nombre) {
  const { data, error } = await supabase.storage.from("archivos").download(path);

  if (error) {
    alert("❌ Error al descargar el archivo");
    return;
  }

  // Crear URL blob y disparar descarga
  const url = window.URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// 🔹 Cargar archivos desde Supabase
async function cargarArchivos() {
  listaArchivos.innerHTML = "<p class='text-center'>⏳ Cargando...</p>";

  const { data, error } = await supabase.storage
    .from("archivos")
    .list(`${curso}/${semana}`, { limit: 100 });

  if (error) {
    listaArchivos.innerHTML = "<p class='text-center text-danger'>❌ Error al listar</p>";
    return;
  }

  if (!data || data.length === 0) {
    listaArchivos.innerHTML = "<p class='text-center'>📭 Sin archivos</p>";
    return;
  }

  listaArchivos.innerHTML = "";

  for (const file of data) {
    const path = `${curso}/${semana}/${file.name}`;

    // URL pública solo para previsualización
    const { data: urlData } = supabase.storage.from("archivos").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const preview = obtenerPreview(file.name, publicUrl);

    const card = document.createElement("div");
    card.className = "col-md-4 animate-box";
    card.innerHTML = `
      <div class="card archivo-card p-3 mb-4 text-center">
        ${preview}
        <p class="nombre-archivo">${file.name}</p>
        <a href="${publicUrl}" target="_blank" class="btn btn-primary">👁 Ver</a>
        <button class="btn btn-success btn-descargar">📥 Descargar</button>
      </div>
    `;

    // Evento para descargar
    card.querySelector(".btn-descargar").addEventListener("click", () => {
      descargarArchivo(path, file.name);
    });

    listaArchivos.appendChild(card);
  }
}

cargarArchivos();
