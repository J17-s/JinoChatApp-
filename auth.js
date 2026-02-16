// ============================================
// JINO Sync - Auth (ログインページ認証)
// ============================================
// Supabase設定は js/config/supabase.js で一元管理。
// supabaseClient, ALLOWED_EMAILS はグローバルで利用可能。
//
// 認証フロー (callback.html なし、直接アプリへ):
//   login.html → Google OAuth → index.html (initApp で処理)

// Check if user is already logged in
async function checkAuth() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session) {
            const userEmail = session.user.email.toLowerCase();

            if (ALLOWED_EMAILS.some(e => e.toLowerCase() === userEmail)) {
                window.location.href = 'index.html';
            } else {
                await supabaseClient.auth.signOut();
                alert('このアカウントはアクセスが許可されていません。\nYuuka専用のアプリです。');
            }
        }
    } catch (err) {
        console.error('Auth check error:', err);
    }
}

// Google Login (PKCE フロー → 直接 index.html へリダイレクト)
async function signInWithGoogle() {
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/index.html'
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
    checkAuth();

    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', signInWithGoogle);
    }
});
