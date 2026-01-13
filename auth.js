// Supabase Configuration
const SUPABASE_URL = 'https://njvarmfkytofbboqjgeu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmFybWZreXRvZmJib3FqZ2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3ODI4NDUsImV4cCI6MjA1MjM1ODg0NX0.sb_publishable_jjKlMTBb7xXxp6eX4E0yoQ_-I1fGjHU';

// Whitelist - Yuuka's email only
const ALLOWED_EMAILS = ['321mugen@gmail.com'];

// Initialize Supabase client
const supabaseAuth = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

// Check if user is already logged in
async function checkAuth() {
    const { data: { session } } = await supabaseAuth.auth.getSession();

    if (session) {
        const userEmail = session.user.email;

        // Check if email is in whitelist
        if (ALLOWED_EMAILS.includes(userEmail)) {
            // Redirect to main app
            window.location.href = 'index.html';
        } else {
            // Not authorized - sign out and show error
            await supabaseAuth.auth.signOut();
            alert('このアカウントはアクセスが許可されていません。\nYuuka専用のアプリです。');
        }
    }
}

// Google Login
async function signInWithGoogle() {
    const { data, error } = await supabaseAuth.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // Redirect to callback page to handle session establishment
            redirectTo: window.location.origin + '/callback.html'
        }
    });

    if (error) {
        console.error('Login error:', error);
        alert('ログインに失敗しました。もう一度お試しください。');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    checkAuth();

    // Google login button
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', signInWithGoogle);
    }
});
