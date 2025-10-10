// login.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 🔧 Configura tu Supabase
const supabaseUrl = 'https://jovcbebpunhmpvhflnio.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdmNiZWJwdW5obXB2aGZsbmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTYxODIsImV4cCI6MjA3Mzk3MjE4Mn0.98VIdpjh4ap8h4iyoCANjhjjI88T784VUbxfLtcSa5o'
const supabase = createClient(supabaseUrl, supabaseKey)

// 🧾 Referencias
const form = document.getElementById('login-form')
const errorMsg = document.getElementById('error-msg')
const googleBtn = document.querySelector('.social-btn.google')

// 🔁 Limpia sesión previa
await supabase.auth.signOut()

// ✅ Inicio de sesión manual
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const username = document.getElementById('username').value.trim()
    const password = document.getElementById('password').value.trim()

    if (!username || !password) {
      errorMsg.textContent = 'Por favor completa todos los campos.'
      return
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !data) {
      errorMsg.textContent = 'Usuario no encontrado.'
      return
    }

    if (data.password !== password) {
      errorMsg.textContent = 'Contraseña incorrecta.'
      return
    }

    // 💾 Guarda usuario y permisos completos
    localStorage.setItem('username', data.username)
    localStorage.setItem('email', data.email || '')
    localStorage.setItem('loginMethod', 'manual')

    // 🧩 Permisos según el rol guardado en Supabase
    localStorage.setItem('can_upload', data.can_upload)
    localStorage.setItem('can_edit', data.can_modify)
    localStorage.setItem('can_delete', data.can_delete)

    window.location.href = 'gestionPortafolio.html'
  })
}

// 🌐 Inicio de sesión con Google
if (googleBtn) {
  googleBtn.addEventListener('click', async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/gestionPortafolio.html',
          queryParams: { prompt: 'select_account' },
        },
      })

      if (error) {
        console.error('Error en login con Google:', error.message)
        errorMsg.textContent = 'Error al iniciar sesión con Google.'
      }
    } catch (err) {
      console.error('Excepción:', err)
      errorMsg.textContent = 'Hubo un problema con Google Auth.'
    }
  })
}

// 🔁 Verifica si hay sesión activa
async function checkSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    const user = session.user
    const email = user.email
    const username = email.split('@')[0]

    // 💾 Guardar datos del usuario con permisos limitados
    localStorage.setItem('username', username)
    localStorage.setItem('email', email)
    localStorage.setItem('loginMethod', 'google')

    // 👇 Permisos para usuarios de Google
    localStorage.setItem('can_upload', true)
    localStorage.setItem('can_edit', true)
    localStorage.setItem('can_delete', false)

    // ✅ Redirigir al panel principal
    window.location.href = 'gestionPortafolio.html'
  }
}

checkSession()
