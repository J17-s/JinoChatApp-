// ============================================
// JINO Sync - Auth Guard (認証ユーティリティ)
// ============================================
// Supabase設定は js/config/supabase.js で一元管理。
// 認証チェックは script.js の initApp() で実行。
// このファイルはユーティリティ関数のみ提供する。

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
