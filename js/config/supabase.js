// ============================================
// JINO Sync - Supabase 共通設定
// ============================================
// このファイルでSupabaseの設定を一元管理する。
// auth.js, auth-guard.js から個別の設定を削除し、
// このファイルを先に読み込むことで共通化する。

// Supabase Configuration
const SUPABASE_URL = 'https://njvarmfkytofbboqjgeu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmFybWZreXRvZmJib3FqZ2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTA0MDAsImV4cCI6MjA4Mzg4NjQwMH0.SzbwPI_W4sIxgvwB1zhOpGApuoPvzfdzkHN1fCDMoLE';

// Whitelist - Yuuka's email only
const ALLOWED_EMAILS = ['321mugen@gmail.com'];

// Initialize Supabase client (single instance for entire app)
// flowType: 'pkce' を使用 (Implicit の #access_token より安全で確実)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    }
});
