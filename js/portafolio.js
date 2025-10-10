import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://jovcbebpunhmpvhflnio.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdmNiZWJwdW5obXB2aGZsbmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTYxODIsImV4cCI6MjA3Mzk3MjE4Mn0.98VIdpjh4ap8h4iyoCANjhjjI88T784VUbxfLtcSa5o'
const supabase = createClient(supabaseUrl, supabaseKey)

let currentCourse = null
let currentWeek = null

// ------------------- MINIATURAS -------------------
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
  const ext = file.name.split('.').pop().toLowerCase()
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return file.url
  if (ext === 'pdf') return await generatePDFThumbnail(file.url)
  if (['mp4','webm','ogg'].includes(ext)) return 'imagenes/video-icon.png'
  return 'imagenes/file-icon.png'
}

// ------------------- CURSOS -------------------
async function loadCourses() {
  const { data, error } = await supabase.from('courses').select('*')
  if (error) return console.error(error)

  const coursesList = document.getElementById('courses-list')
  coursesList.innerHTML = ''

  data.forEach(c => {
    const div = document.createElement('div')
    div.className = 'card-item'
    div.innerHTML = `
      <img src="${c.image_url || 'imagenes/defaultCourse.png'}" class="course-thumb">
      <span>${c.title}</span>
      <div class="btn-container">
        <button class="btn-accent">Ver Semanas</button>
      </div>
    `
    div.querySelector('button').onclick = () => selectCourse(c.id, c.title)
    coursesList.appendChild(div)
  })
}

// ------------------- SEMANAS -------------------
async function loadWeeks(courseId) {
  const { data, error } = await supabase.from('weeks').select('*').eq('course_id', courseId)
  if (error) return console.error(error)

  const weeksList = document.getElementById('weeks-list')
  weeksList.innerHTML = ''

  data.forEach(w => {
    const div = document.createElement('div')
    div.className = 'card-item'
    div.innerHTML = `
      <span>Semana ${w.week_number}</span>
      <div class="btn-container">
        <button class="btn-accent">Ver Archivos</button>
      </div>
    `
    div.querySelector('button').onclick = () => selectWeek(w.id, w.week_number)
    weeksList.appendChild(div)
  })
}

function selectCourse(courseId, courseTitle) {
  currentCourse = courseId
  document.getElementById('course-title').textContent = courseTitle
  document.getElementById('course-display').style.display = 'none'
  document.getElementById('week-display').style.display = 'block'
  loadWeeks(courseId)
}

document.getElementById('back-to-courses-btn').onclick = () => {
  document.getElementById('week-display').style.display = 'none'
  document.getElementById('course-display').style.display = 'block'
}

// ------------------- ARCHIVOS -------------------
async function loadFiles(weekId) {
  const { data: files, error } = await supabase.from('files').select('*').eq('week_id', weekId)
  if (error) return console.error(error)

  const filesList = document.getElementById('files-list')
  filesList.innerHTML = ''

  for (const f of files) {
    const thumbUrl = await getFileThumbnail(f)
    const div = document.createElement('div')
    div.className = 'card-item'
    div.innerHTML = `
      <img src="${thumbUrl}" class="file-thumb">
      <span>${f.name}</span>
      <div style="display:flex; justify-content:center; flex-wrap:wrap;">
        <button class="preview-file-btn btn-accent">👁 Visualizar</button>
        <button class="download-file-btn btn-secondary">⬇ Descargar</button>
      </div>
    `
    div.querySelector('.preview-file-btn').onclick = () => previewFile(f)
    div.querySelector('.download-file-btn').onclick = () => downloadFile(f)
    filesList.appendChild(div)
  }
}

function selectWeek(weekId, weekNumber) {
  currentWeek = weekId
  document.getElementById('week-title').textContent = `Semana ${weekNumber}`
  document.getElementById('week-display').style.display = 'none'
  document.getElementById('files-display').style.display = 'block'
  loadFiles(weekId)
}

document.getElementById('back-to-weeks-btn').onclick = () => {
  document.getElementById('files-display').style.display = 'none'
  document.getElementById('week-display').style.display = 'block'
}

// ------------------- MODAL MEJORADO -------------------
async function previewFile(file) {
  const { data: { publicUrl } } = supabase.storage.from('portfolio-files').getPublicUrl(file.path)
  if (!publicUrl) return alert('No se puede obtener la URL del archivo')

  const modal = document.getElementById('fileModal')
  const modalBody = document.getElementById('modal-body')
  const modalTitle = document.getElementById('modal-title')
  const modalDownload = document.getElementById('modal-download')

  modalTitle.textContent = file.name
  modal.style.display = 'flex'

  const ext = file.name.split('.').pop().toLowerCase()
  if(['jpg','jpeg','png','gif','webp'].includes(ext)) {
    modalBody.innerHTML = `<img src="${publicUrl}" style="width:100%; height:100%; object-fit:contain; border-radius:8px;">`
  } else if(ext === 'pdf') {
    modalBody.innerHTML = `<iframe src="${publicUrl}" width="100%" height="100%" style="border:none;"></iframe>`
  } else if(['mp4','webm','ogg'].includes(ext)) {
    modalBody.innerHTML = `<video src="${publicUrl}" controls style="width:100%; height:100%;"></video>`
  } else if(['doc','docx','ppt','pptx','xls','xlsx'].includes(ext)) {
    modalBody.innerHTML = `<iframe src="https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(publicUrl)}" width="100%" height="100%" style="border:none;"></iframe>`
  } else {
    modalBody.innerHTML = `<p>No se puede previsualizar este archivo.</p>`
  }

  // Descargar inmediatamente desde Supabase
  modalDownload.onclick = () => downloadFile(file)
  document.getElementById('modal-close').onclick = () => modal.style.display = 'none'
}

// ------------------- DESCARGA INMEDIATA -------------------
async function downloadFile(file) {
  const { data, error } = await supabase.storage.from('portfolio-files').download(file.path)
  if (error) return alert('Error descargando archivo: ' + error.message)

  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ------------------- INICIALIZACIÓN -------------------
loadCourses()
