// ============================================
// JINO Sync - チャットストレージ (Supabase)
// ============================================
// localStorage の代わりに Supabase を使ってチャットを保存・読み込みする。
// script.js からはこのファイルの関数を呼ぶだけでOK。

/**
 * 現在ログイン中のユーザーIDを取得
 */
async function getCurrentUserId() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.user?.id || null;
}

/**
 * Supabaseから全チャットを読み込む
 * localStorage時代と同じ形式のオブジェクト配列を返す
 */
async function dbLoadAllChats() {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data: chatRows, error } = await supabaseClient
        .from('chats')
        .select(`
            *,
            messages (*)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('❌ チャット読み込みエラー:', error);
        return [];
    }

    return (chatRows || []).map(row => ({
        id: row.id,
        title: row.title,
        isPinned: row.pinned,
        timestamp: new Date(row.updated_at).getTime(),
        messages: (row.messages || [])
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .map(m => ({
                sender: m.sender,
                text: m.content
            }))
    }));
}

/**
 * 新しいチャットを作成
 * @returns {Object} 作成されたチャットオブジェクト（既存の形式で返す）
 */
async function dbCreateChat(title = '新しいチャット') {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabaseClient
        .from('chats')
        .insert({ user_id: userId, title: title })
        .select()
        .single();

    if (error) {
        console.error('❌ チャット作成エラー:', error);
        return null;
    }

    return {
        id: data.id,
        title: data.title,
        isPinned: data.pinned,
        timestamp: new Date(data.updated_at).getTime(),
        messages: []
    };
}

/**
 * メッセージを1件追加
 */
async function dbAddMessage(chatId, sender, text) {
    const { error } = await supabaseClient
        .from('messages')
        .insert({
            chat_id: chatId,
            sender: sender,
            content: text
        });

    if (error) {
        console.error('❌ メッセージ保存エラー:', error);
        return false;
    }

    // チャットの更新日時を更新
    await supabaseClient
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

    return true;
}

/**
 * チャットのメッセージを全て差し替え（編集時用）
 */
async function dbSaveMessages(chatId, messages) {
    // 既存メッセージを全削除
    await supabaseClient
        .from('messages')
        .delete()
        .eq('chat_id', chatId);

    // 新しいメッセージを全挿入
    if (messages.length > 0) {
        const rows = messages.map(msg => ({
            chat_id: chatId,
            sender: msg.sender,
            content: msg.text
        }));

        const { error } = await supabaseClient
            .from('messages')
            .insert(rows);

        if (error) {
            console.error('❌ メッセージ一括保存エラー:', error);
            return false;
        }
    }

    // チャットの更新日時を更新
    await supabaseClient
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

    return true;
}

/**
 * チャットのメタデータを更新（タイトル、ピン留め等）
 */
async function dbUpdateChat(chatId, updates) {
    const dbUpdates = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.isPinned !== undefined) dbUpdates.pinned = updates.isPinned;
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabaseClient
        .from('chats')
        .update(dbUpdates)
        .eq('id', chatId);

    if (error) {
        console.error('❌ チャット更新エラー:', error);
        return false;
    }
    return true;
}

/**
 * チャットを削除（メッセージもCASCADEで自動削除される）
 */
async function dbDeleteChat(chatId) {
    const { error } = await supabaseClient
        .from('chats')
        .delete()
        .eq('id', chatId);

    if (error) {
        console.error('❌ チャット削除エラー:', error);
        return false;
    }
    return true;
}

/**
 * localStorageからSupabaseへデータを移行する
 * 初回のみ実行される
 */
async function dbMigrateFromLocalStorage() {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const localData = localStorage.getItem('jinoAllChats');
    if (!localData) return;

    const localChats = JSON.parse(localData);
    if (!localChats || localChats.length === 0) return;

    // Supabaseに既にデータがあるか確認
    const { data: existing } = await supabaseClient
        .from('chats')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

    if (existing && existing.length > 0) {
        // 既にDBにデータがあるので移行不要
        console.log('📋 Supabaseにデータあり、移行スキップ');
        return;
    }

    console.log(`🚚 ${localChats.length}件のチャットをSupabaseへ移行開始...`);

    for (const chat of localChats) {
        // チャットを作成
        const { data: newChat, error: chatError } = await supabaseClient
            .from('chats')
            .insert({
                user_id: userId,
                title: chat.title || '新しいチャット',
                pinned: chat.isPinned || false,
                created_at: new Date(chat.timestamp || Date.now()).toISOString(),
                updated_at: new Date(chat.timestamp || Date.now()).toISOString()
            })
            .select()
            .single();

        if (chatError) {
            console.error('移行エラー (chat):', chatError);
            continue;
        }

        // メッセージを移行
        if (chat.messages && chat.messages.length > 0) {
            const msgRows = chat.messages.map(msg => ({
                chat_id: newChat.id,
                sender: msg.sender,
                content: msg.text
            }));

            const { error: msgError } = await supabaseClient
                .from('messages')
                .insert(msgRows);

            if (msgError) {
                console.error('移行エラー (messages):', msgError);
            }
        }
    }

    console.log('✅ 移行完了！ localStorageのデータはバックアップとして残します');
}
