// Supabase Configuration
const SUPABASE_URL = 'https://njvarmfkytofbboqjgeu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmFybWZreXRvZmJib3FqZ2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3ODI4NDUsImV4cCI6MjA1MjM1ODg0NX0.sb_publishable_jjKlMTBb7xXxp6eX4E0yoQ_-I1fGjHU';

// Whitelist - Yuuka's email only
const ALLOWED_EMAILS = ['321mugen@gmail.com'];

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

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
        <p style="font-size: 16px; margin-bottom: 15px;">${message}</p>
        
        <div style="background: #333; padding: 10px; border-radius: 5px; margin-bottom: 20px; font-family: monospace; font-size: 12px; text-align: left; width: 90%; word-break: break-all;">
            <strong>Current URL:</strong><br>${window.location.href.substring(0, 100)}...<br><br>
            <strong>Has Hash:</strong> ${window.location.hash ? 'YES' : 'NO'}<br>
            <strong>Hash Length:</strong> ${window.location.hash.length}
        </div>

        <button onclick="window.location.href='login.html'" style="padding: 10px 20px; font-size: 16px; background: white; color: black; border: none; border-radius: 5px; cursor: pointer;">
            Back to Login
        </button>
    `;

    document.body.appendChild(overlay);
}

// Check authentication on page load
async function checkAuthOnMainPage() {
    console.log("🔒 Checking auth state...");

    // Check if coming back from OAuth redirect (URL has hash)
    if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log("🔗 OAuth redirect detected, attempting file-based session recovery...");

        try {
            // 1. Try standard getSession first
            const { data, error } = await supabaseClient.auth.getSession();
            if (data.session) {
                console.log("🎉 Session recovered via getSession!");
                handleSession(data.session);
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
            }

            // 2. Fallback: Manually parse hash
            console.log("⚠️ getSession failed, trying manual hash parsing...");
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const type = hashParams.get('type');

            console.log(`🎫 Token Debug: AccessToken=${accessToken ? 'YES' : 'NO'}, RefreshToken=${refreshToken ? 'YES' : 'NO'}, Type=${type}`);

            if (accessToken && refreshToken) {
                const { data: manualData, error: manualError } = await supabaseClient.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });

                if (manualData.session) {
                    console.log("🎉 Session recovered via setSession!");
                    handleSession(manualData.session);
                    window.history.replaceState({}, document.title, window.location.pathname);
                    return;
                } else {
                    console.error("❌ setSession failed:", manualError);
                }
            } else if (accessToken) {
                // 3. Last Resort: Identify User directly from Token (Bypass Persistence issues)
                console.log("🚀 Attempting direct token verification (Last Resort)...");
                const user = await getUserFromToken(accessToken);
                if (user) {
                    console.log("🎉 User identified directly from token!");
                    // Fake a session object for UI
                    handleSession({ user: user });
                    window.history.replaceState({}, document.title, window.location.pathname);
                    return;
                }
            }
        } catch (e) {
            console.error("⚠️ Hash recovery failed:", e);
        }
    }

    // Helper to get user from token directly
    async function getUserFromToken(token) {
        try {
            const { data: { user }, error } = await supabaseClient.auth.getUser(token);
            if (user) return user;

            // If API fails, try manual decode (JWT) mostly simply to extract email for check
            // Note: usage of jwt_decode is not available, we use simple base64 decode for payload
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload && payload.email) {
                return { email: payload.email, user_metadata: payload.user_metadata || {} };
            }
        } catch (e) {
            console.error("Token decode failed", e);
        }
        return null;
    }

    // Standard auth state listener
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log("📡 Auth State Changed:", event);
        handleSession(session);
    });
}

// Common session handler
async function handleSession(session) {
    if (!session) {
        console.log("❌ No session found");
        // Only show error if we're not just loading the page for the first time
        // If it's initial load and no session, just redirect
        if (!window.location.hash) {
            window.location.href = 'login.html';
        } else {
            showDebugError("セッションが見つかりませんでした。<br>Supabaseの設定か、Cookieの問題の可能性があります。");
        }
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

    // Hide debug overlay if it exists
    const existingOverlay = document.querySelector('div[style*="z-index: 9999"]');
    if (existingOverlay) existingOverlay.remove();

    updateUserProfile(session.user);
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
