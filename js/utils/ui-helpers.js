// ============================================
// JINO Sync - UI共通ヘルパー関数
// ============================================
// script.js 内で重複していたUI処理を共通化。
// アバター生成、テキスト整形、時刻取得、コピー機能を提供する。

/**
 * アバター画像要素を生成する
 * @param {string} src - 画像パス
 * @param {string} alt - 代替テキスト
 * @returns {HTMLImageElement}
 */
function createAvatarElement(src, alt) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.classList.add('avatar-icon');
    return img;
}

/**
 * メッセージテキストを整形する
 * - 改行を <br> に変換
 * - （）や () 内のテキストにアクションテキスト装飾を適用
 * @param {string} text - 元のメッセージテキスト
 * @returns {string} HTML文字列
 */
function formatMessageText(text) {
    const withBreaks = text.replace(/\n/g, '<br>');
    // Match both （...） and (...)
    return withBreaks.replace(/([（(])(.*?)([）)])/g, '<span class="action-text">$1$2$3</span>');
}

/**
 * 現在時刻を HH:MM 形式で取得する
 * @returns {string}
 */
function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * テキストをクリップボードにコピーし、ボタンにフィードバックを表示する
 * @param {string} text - コピーするテキスト
 * @param {HTMLButtonElement} btn - フィードバックを表示するボタン要素
 */
function copyToClipboardWithFeedback(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="ph-fill ph-check"></i>';
        setTimeout(() => btn.innerHTML = originalHTML, 2000);
    });
}
