// Supabase Configuration
const SUPABASE_URL = 'https://njvarmfkytofbboqjgeu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmFybWZreXRvZmJib3FqZ2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3ODI4NDUsImV4cCI6MjA1MjM1ODg0NX0.sb_publishable_jjKlMTBb7xXxp6eX4E0yoQ_-I1fGjHU';

// Whitelist - Yuuka's email only
const ALLOWED_EMAILS = ['321mugen@gmail.com'];

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Debug Overlay
function showDebugError(message) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
    overlay.style.color = 'white';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';
    overlay.style.textAlign = 'center';

    overlay.innerHTML = `
        <h2 style="color: #ff4444; margin-bottom: 20px;">⚠️ Login Error</h2>
        <p style="font-size: 18px; margin-bottom: 20px;">${message}</p>
        <button onclick="window.location.href='login.html'" style="padding: 10px 20px; font-size: 16px; background: white; color: black; border: none; border-radius: 5px; cursor: pointer;">
            Back to Login
        </button>
    `;

    document.body.appendChild(overlay);
}

// Check authentication on page load
async function checkAuthOnMainPage() {
    console.log("🔒 Checking auth state...");

    // Wait for auth state to settle
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log("📡 Auth State Changed:", event);

        if (!session) {
            console.log("❌ No session found");
            showDebugError("セッションが見つかりませんでした。<br>Supabaseの設定か、Cookieの問題の可能性があります。");
            return;
        }

        const userEmail = session.user.email.toLowerCase();
        const isAllowed = ALLOWED_EMAILS.some(email => email.toLowerCase() === userEmail);

        // Check if email is in whitelist
        if (!isAllowed) {
            console.log("🚫 User not authorized");
            await supabaseClient.auth.signOut();
            showDebugError(`このアカウント (${userEmail}) は<br>アクセスが許可されていません。`);
            return;
        }

        // Authorized
        console.log("🎉 Login successful!");
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
