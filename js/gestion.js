import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://jovcbebpunhmpvhflnio.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdmNiZWJwdW5obXB2aGZsbmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTYxODIsImV4cCI6MjA3Mzk3MjE4Mn0.98VIdpjh4ap8h4iyoCANjhjjI88T784VUbxfLtcSa5o'
const supabase = createClient(supabaseUrl, supabaseKey)

let currentCourse = null
let currentWeek = null
const username = localStorage.getItem('username')

// ------------------- FUNCIONES DE MINIATURA -------------------
async function generatePDFThumbnail(pdfUrl) {
  try {
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 0.3 })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: context, viewport }).promise
    return canvas.toDataURL()
  } catch (e) {
    console.error('Error generando miniatura PDF:', e)
    return 'imagenes/pdf.png'
  }
}

async function getFileThumbnail(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  // IMÁGENES
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return file.url;

  // PDF
  if (ext === 'pdf') return await generatePDFThumbnail(file.url);

  // Word (.doc/.docx)
  if (['doc','docx'].includes(ext)) {
    try {
      const response = await fetch(file.url);
      const arrayBuffer = await response.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const firstLines = result.value.split('\n').slice(0,5).join('\n');
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#000';
      ctx.font = '12px monospace';
      ctx.textBaseline = 'top';
      firstLines.split('\n').forEach((line,i)=>ctx.fillText(line,5,i*14));
      return canvas.toDataURL();
    } catch(e){ return 'imagenes/file-icon.png'; }
  }

  // TXT / CSV
  if (['txt','csv'].includes(ext)) {
    try {
      const res = await fetch(file.url);
      const text = await res.text();
      const firstLines = text.split('\n').slice(0,5).join('\n');
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#000';
      ctx.font = '12px monospace';
      ctx.textBaseline = 'top';
      firstLines.split('\n').forEach((line,i)=>ctx.fillText(line,5,i*14));
      return canvas.toDataURL();
    } catch(e){ return 'imagenes/file-icon.png'; }
  }

  // VIDEO
  if (['mp4','webm','ogg'].includes(ext)) return file.url;

  // Otros
  return 'imagenes/file-icon.png';
}

// ------------------- CURSOS -------------------
async function loadCourses() {
  const { data, error } = await supabase.from('courses').select('*').eq('created_by', username)
  if (error) return console.error('Error cargando cursos:', error.message)

  const coursesList = document.getElementById('courses-list')
  coursesList.innerHTML = ''

  data.forEach(c => {
    const div = document.createElement('div')
    div.className = 'card-item'

    div.innerHTML = `
      <img src="${c.image_url || 'imagenes/defaultCourse.png'}" class="course-thumb">
      <span>${c.title}</span>
      <button class="edit-course-btn btn-accent">Editar</button>
      <button class="delete-course-btn btn-delete">Eliminar</button>
      <button class="enter-course-btn btn-secondary">Ingresar</button>
    `

    div.querySelector('.edit-course-btn').onclick = async () => {
      const newTitle = prompt('Nuevo nombre del curso', c.title)
      if (!newTitle) return
      await supabase.from('courses').update({ title: newTitle }).eq('id', c.id)
      loadCourses()
    }

    div.querySelector('.delete-course-btn').onclick = async () => {
      if (!confirm('¿Eliminar este curso?')) return
      await supabase.from('courses').delete().eq('id', c.id)
      loadCourses()
    }

    div.querySelector('.enter-course-btn').onclick = () => selectCourse(c.id, c.title)
    coursesList.appendChild(div)
  })
}

async function addCourse() {
  const title = prompt('Nombre del curso:')
  if (!title) return

  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'

  fileInput.onchange = async e => {
    const file = e.target.files[0]
    let imageUrl = null

    if (file) {
      const path = `${username}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('portfolio-files').upload(path, file, { upsert: true })
      if (uploadError) alert('Error subiendo imagen: ' + uploadError.message)
      else {
        const { data: publicUrlData } = supabase.storage.from('portfolio-files').getPublicUrl(path)
        imageUrl = publicUrlData.publicUrl
      }
    }

    await supabase.from('courses').insert([{ title, created_by: username, image_url: imageUrl }])
    loadCourses()
  }

  fileInput.click()
}

function selectCourse(courseId, courseTitle) {
  currentCourse = courseId
  document.getElementById('course-title').textContent = courseTitle
  document.getElementById('course-management').style.display = 'none'
  document.getElementById('week-management').style.display = 'block'
  loadWeeks(courseId)
}

document.getElementById('add-course-btn').onclick = addCourse
document.getElementById('back-to-courses-btn').onclick = () => {
  document.getElementById('week-management').style.display = 'none'
  document.getElementById('course-management').style.display = 'block'
  currentCourse = null
}

// ------------------- SEMANAS -------------------
async function loadWeeks(courseId) {
  const { data, error } = await supabase.from('weeks').select('*').eq('course_id', courseId)
  if (error) return console.error('Error cargando semanas:', error.message)

  const weeksList = document.getElementById('weeks-list')
  weeksList.innerHTML = ''

  data.forEach(w => {
    const div = document.createElement('div')
    div.className = 'card-item'
    div.innerHTML = `
      <span>Semana ${w.week_number}</span>
      <button class="enter-week-btn btn-accent">Ingresar</button>
      <button class="delete-week-btn btn-delete">Eliminar</button>
    `
    div.querySelector('.enter-week-btn').onclick = () => selectWeek(w.id, w.week_number)
    div.querySelector('.delete-week-btn').onclick = async () => {
      if (!confirm('¿Eliminar esta semana?')) return
      await supabase.from('weeks').delete().eq('id', w.id)
      loadWeeks(courseId)
    }
    weeksList.appendChild(div)
  })
}

async function addWeek() {
  if (!currentCourse) return alert('Selecciona un curso primero')
  const weekNumber = parseInt(prompt('Número de semana (1-16):'))
  if (!weekNumber || weekNumber < 1 || weekNumber > 16) return alert('Número inválido')
  await supabase.from('weeks').insert([{ course_id: currentCourse, week_number: weekNumber }])
  loadWeeks(currentCourse)
}

document.getElementById('add-week-btn').onclick = addWeek
document.getElementById('back-to-weeks-btn').onclick = () => {
  document.getElementById('files-management').style.display = 'none'
  document.getElementById('week-management').style.display = 'block'
  currentWeek = null
}

function selectWeek(weekId, weekNumber) {
  currentWeek = weekId
  document.getElementById('week-title').textContent = `Semana ${weekNumber}`
  document.getElementById('week-management').style.display = 'none'
  document.getElementById('files-management').style.display = 'block'
  loadFiles(weekId)
}

// ------------------- ARCHIVOS -------------------
async function uploadFiles() {
  if (!currentWeek) return alert('Selecciona una semana primero')

  const fileInput = document.getElementById('file-input')
  const files = Array.from(fileInput.files)
  if (files.length === 0) return alert('Selecciona al menos un archivo')

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const path = `${username}/${Date.now()}-${safeName}`
    const { error: uploadError } = await supabase.storage.from('portfolio-files').upload(path, file, { upsert: true })
    if (uploadError) { alert(`Error subiendo ${file.name}: ${uploadError.message}`); continue }

    const { data: publicUrlData } = supabase.storage.from('portfolio-files').getPublicUrl(path)
    const fileUrl = publicUrlData.publicUrl

    const { error: insertError } = await supabase.from('files').insert([{
      week_id: currentWeek,
      name: file.name,
      path: path,
      url: fileUrl,
      uploaded_by: username
    }])
    if (insertError) alert(`Error guardando ${file.name}: ${insertError.message}`)
  }

  fileInput.value = ''
  loadFiles(currentWeek)
}

async function loadFiles(weekId) {
  if (!weekId) return
  const { data: files, error } = await supabase.from('files').select('*').eq('week_id', weekId)
  if (error) return console.error('Error cargando archivos:', error.message)

  const filesList = document.getElementById('files-list')
  filesList.innerHTML = ''
  if (!files || files.length === 0) { filesList.textContent = 'No hay archivos en esta semana'; return }

  for (const f of files) {
    const div = document.createElement('div')
    div.className = 'card-item'

    const thumbUrl = await getFileThumbnail(f);

    div.innerHTML = `
      <img src="${thumbUrl}" class="file-thumb">
      <span>${f.name}</span>
      <div style="display:flex; flex-wrap:wrap; justify-content:center;">
        <button class="preview-file-btn btn-accent">👁 Visualizar</button>
        <button class="download-file-btn btn-secondary">⬇ Descargar</button>
        <button class="edit-file-btn btn-secondary">✏ Editar</button>
        <button class="delete-file-btn btn-delete">🗑 Eliminar</button>
      </div>
    `

    div.querySelector('.preview-file-btn').onclick = () => previewFile(f.path, f.name)
    div.querySelector('.download-file-btn').onclick = () => downloadFile(f.path, f.name)
    div.querySelector('.edit-file-btn').onclick = async () => {
      const newName = prompt('Nuevo nombre del archivo', f.name)
      if (!newName) return
      await supabase.from('files').update({ name: newName }).eq('id', f.id)
      loadFiles(currentWeek)
    }
    div.querySelector('.delete-file-btn').onclick = async () => {
      if (!confirm('¿Eliminar este archivo?')) return
      await supabase.from('files').delete().eq('id', f.id)
      loadFiles(currentWeek)
    }

    filesList.appendChild(div)
  }
}

document.getElementById('upload-file-btn').onclick = uploadFiles

// ------------------- PREVISUALIZAR ARCHIVOS -------------------
async function previewFile(path, fileName) {
  const { data: { publicUrl } } = supabase.storage.from('portfolio-files').getPublicUrl(path)
  if (!publicUrl) return alert('No se puede obtener la URL del archivo')

  const modal = document.getElementById('fileModal')
  const modalTitle = document.getElementById('modal-title')
  const modalBody = document.getElementById('modal-body')
  const modalWindow = document.getElementById('modal-window')

  modalTitle.textContent = fileName
  modal.style.display = 'flex'

  const ext = fileName.split('.').pop().toLowerCase()
  let content = ''

  if (['doc','docx','ppt','pptx','xls','xlsx'].includes(ext)) {
    content = `<iframe src="https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(publicUrl)}" width="100%" height="100%" style="border:none;"></iframe>`
  } else if (ext === 'pdf') content = `<iframe src="${publicUrl}" width="100%" height="100%" style="border:none;"></iframe>`
  else if (['jpg','jpeg','png','gif','webp'].includes(ext)) content = `<img src="${publicUrl}" style="width:100%; height:100%; object-fit:contain; border-radius:8px;">`
  else if (['mp4','webm','ogg'].includes(ext)) content = `<video src="${publicUrl}" controls style="width:100%; height:100%;"></video>`
  else if (['mp3','wav'].includes(ext)) content = `<audio src="${publicUrl}" controls style="width:100%;"></audio>`
  else content = `<p>No se puede previsualizar este tipo de archivo.</p><a href="${publicUrl}" download class="btn-accent">Descargar archivo</a>`

  modalBody.innerHTML = content
  modalWindow.style.width = '90%'
  modalWindow.style.height = '90%'
  modalBody.style.maxHeight = 'calc(100% - 50px)'

  document.getElementById('modal-close').onclick = () => modal.style.display = 'none'
  document.getElementById('modal-download').onclick = () => downloadFile(path, fileName)
  document.getElementById('modal-minimize').onclick = () => modalWindow.style.height = '200px'
  document.getElementById('modal-maximize').onclick = () => {
    modalWindow.style.width = '90%'
    modalWindow.style.height = '90%'
  }
}

// ------------------- DESCARGAR ARCHIVOS -------------------
async function downloadFile(path, fileName) {
  const { data, error } = await supabase.storage.from('portfolio-files').download(path)
  if (error) return alert('Error descargando archivo: ' + error.message)

  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ------------------- AUTENTICACIÓN Y SESIÓN -------------------

async function checkSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error obteniendo sesión:', error.message)
    window.location.href = 'login.html'
    return
  }

  if (!data.session) {
    // Si no hay sesión, redirigir a login
    window.location.href = 'login.html'
  } else {
    const email = data.session.user.email
    const username = email.split('@')[0]
    localStorage.setItem('username', username)
    document.getElementById('username').textContent = username
  }
}

// Ejecutar al cargar la página
checkSession()

// ------------------- INICIALIZACIÓN -------------------
loadCourses()
document.getElementById('logout-btn').onclick = () => {
  localStorage.removeItem('username')
  localStorage.removeItem('role')
  window.location.href = 'index.html'
}
