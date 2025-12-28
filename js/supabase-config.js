/**
 * ==========================================
 * SUPABASE CONFIGURATION
 * ==========================================
 * 
 * INSTRUCCIONES PARA CONFIGURAR:
 * 1. Ve a https://supabase.com y crea una cuenta gratuita
 * 2. Crea un nuevo proyecto
 * 3. Ve a Settings > API
 * 4. Copia el "Project URL" y pégalo en SUPABASE_URL
 * 5. Copia el "anon public" key y pégalo en SUPABASE_ANON_KEY
 */

// ⚠️ IMPORTANTE: Reemplaza estos valores con los de tu proyecto Supabase
   const SUPABASE_URL = 'https://yjpmcifypvtiakqkeayo.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcG1jaWZ5cHZ0aWFrcWtlYXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NjM3MjAsImV4cCI6MjA4MjQzOTcyMH0.s0ijeJZVpmlKrPOHTjgGbuIH-O3vaIPoVJYNIBccemk';

// Validar configuración
if (SUPABASE_URL === 'https://tu-proyecto.supabase.co' || SUPABASE_ANON_KEY === 'tu-anon-key-aqui') {
    console.error('⚠️ ERROR: Debes configurar SUPABASE_URL y SUPABASE_ANON_KEY en js/supabase-config.js');
    console.error('📖 Sigue las instrucciones en SUPABASE_SETUP.md');
}

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportar para uso global
window.supabaseClient = supabase;
window.SUPABASE_URL = SUPABASE_URL;

