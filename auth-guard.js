// Supabase Configuration
const SUPABASE_URL = 'https://njvarmfkytofbboqjgeu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmFybWZreXRvZmJib3FqZ2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3ODI4NDUsImV4cCI6MjA1MjM1ODg0NX0.sb_publishable_jjKlMTBb7xXxp6eX4E0yoQ_-I1fGjHU';

// Whitelist - Yuuka's email only
const ALLOWED_EMAILS = ['321mugen@gmail.com'];

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check authentication on page load
async function checkAuthOnMainPage() {
    console.log("🔒 Checking auth state...");

    // Wait for auth state to settle (important for redirects)
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log("📡 Auth State Changed:", event);
        console.log("👤 Session:", session ? "Found" : "Not Found");

        if (!session) {
            console.log("❌ No session, redirecting to login.html");
            // Not logged in - redirect to login page
            // Avoid infinite loop if already on login page (though this script runs on index)
            window.location.href = 'login.html';
            return;
        }

        const userEmail = session.user.email.toLowerCase(); // Handle case sensitivity
        console.log("📧 User Email:", userEmail);

        const isAllowed = ALLOWED_EMAILS.some(email => email.toLowerCase() === userEmail);
        console.log("✅ Is Allowed:", isAllowed);

        // Check if email is in whitelist
        if (!isAllowed) {
            console.log("🚫 User not authorized, signing out...");
            // Not authorized - sign out and redirect
            await supabaseClient.auth.signOut();
            alert(`このアカウント (${userEmail}) はアクセスが許可されていません。\nYuuka専用のアプリです。`);
            window.location.href = 'login.html';
            return;
        }

        // Authorized - update UI with user info
        console.log("🎉 Login successful! Welcome Yuuka!");
        updateUserProfile(session.user);
    });
}

// Update user profile in sidebar
function updateUserProfile(user) {
    const usernameEl = document.querySelector('.username');
    const avatarEl = document.querySelector('.user-profile .avatar');

    if (usernameEl) {
        usernameEl.textContent = user.user_metadata?.name || 'Yuuka';
    }

    if (avatarEl && user.user_metadata?.avatar_url) {
        avatarEl.src = user.user_metadata.avatar_url;
    }
}

// Logout function
async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Logout error:', error);
        alert('ログアウトに失敗しました。');
    } else {
        window.location.href = 'login.html';
    }
}

// Run auth check immediately
if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('app')) {
    checkAuthOnMainPage();
}
