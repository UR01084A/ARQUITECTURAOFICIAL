import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔑 Tus credenciales de Supabase
const SUPABASE_URL = "https://jovcbebpunhmpvhflnio.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdmNiZWJwdW5obXB2aGZsbmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTYxODIsImV4cCI6MjA3Mzk3MjE4Mn0.98VIdpjh4ap8h4iyoCANjhjjI88T784VUbxfLtcSa5o";

// ⚡ Cliente Supabase con persistencia
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

const form = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    // 🔑 Intentar login con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    console.log("✅ Sesión iniciada:", data.session);

    // ✅ Login correcto → redirigir
    window.location.href = "upload.html";
  } catch (err) {
    errorMessage.style.display = "block";
    errorMessage.textContent = "⚠ " + err.message;
  }
});
