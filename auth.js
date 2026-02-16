// ============================================
// JINO Sync - Auth (ログインページ認証)
// ============================================
// Supabase設定は js/config/supabase.js で一元管理。
// supabaseClient, ALLOWED_EMAILS はグローバルで利用可能。
//
// 認証フロー:
//   login.html → Google OAuth → callback.html → index.html
//   callback.html でメールのホワイトリストチェックを行う。

// Check if user is already logged in
async function checkAuth() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session) {
            const userEmail = session.user.email.toLowerCase();

            // Check if email is in whitelist
            if (ALLOWED_EMAILS.some(e => e.toLowerCase() === userEmail)) {
                // Redirect to main app
                window.location.href = 'index.html';
            } else {
                // Not authorized - sign out and show error
                await supabaseClient.auth.signOut();
                alert('このアカウントはアクセスが許可されていません。\nYuuka専用のアプリです。');
            }
        }
    } catch (err) {
        console.error('Auth check error:', err);
    }
}

// Google Login
async function signInWithGoogle() {
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // callback.html でメールチェックしてからindex.htmlへ
                redirectTo: window.location.origin + '/callback.html'
            }
        });

        if (error) {
            console.error('Login error:', error);
            alert('ログインに失敗しました。もう一度お試しください。');
        }
    } catch (err) {
        console.error('Sign in error:', err);
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
