document.addEventListener('DOMContentLoaded', () => {
    const chatArea = document.getElementById('chat-area');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    // Model Selector Logic
    const modelToggle = document.getElementById('model-toggle');
    const modelMenu = document.getElementById('model-menu');
    const modelOptions = document.querySelectorAll('.model-option');

    modelToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        modelMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        modelMenu.classList.add('hidden');
    });

    modelOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Update active state
            modelOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            // Update button text
            const modelName = option.dataset.model;
            modelToggle.innerHTML = `${modelName} <i class="ph ph-caret-down"></i>`;
        });
    });

    // Mobile Sidebar Logic
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    function toggleSidebar() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('visible');
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }


    // 送信ボタンの活性/非活性制御
    messageInput.addEventListener('input', () => {
        sendButton.disabled = messageInput.value.trim() === '';
    });

    // メッセージ追加処理
    function addMessage(text, sender, save = true) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'message-user' : 'message-jino');

        // ジノの場合は最初にアバターを追加
        if (sender === 'jino') {
            const avatar = createAvatarElement('jino_avatar.png', 'Jino');
            messageDiv.appendChild(avatar);
        }

        // メッセージコンテナ (Bubble + Footer)
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');

        // Bubble
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.innerHTML = formatMessageText(text);
        contentDiv.appendChild(bubble);

        // Footer
        const footerDiv = document.createElement('div');
        footerDiv.classList.add('message-footer');

        // Time
        const timeSpan = document.createElement('span');
        timeSpan.classList.add('message-time');
        timeSpan.textContent = getFormattedTime();


        if (sender === 'jino') {
            footerDiv.classList.add('jino-footer');
            // Copy Button
            const copyBtn = document.createElement('button');
            copyBtn.classList.add('icon-btn-small');
            copyBtn.innerHTML = '<i class="ph ph-copy"></i>';
            copyBtn.onclick = () => copyToClipboardWithFeedback(text, copyBtn);
            footerDiv.appendChild(copyBtn);

            // Time
            footerDiv.appendChild(timeSpan);

            // Token Info (Random Simulation)
            const randomTokens = Math.floor(Math.random() * 500) + 50;
            const cost = (randomTokens * 0.001).toFixed(2);
            const tokenInfo = document.createElement('span');
            tokenInfo.classList.add('token-info');
            tokenInfo.textContent = `${randomTokens}tokens (¥${cost})`;
            footerDiv.appendChild(tokenInfo);
        } else {
            footerDiv.classList.add('user-footer');
            // Time
            footerDiv.appendChild(timeSpan);

            // Copy Button
            const copyBtn = document.createElement('button');
            copyBtn.classList.add('icon-btn-small');
            copyBtn.innerHTML = '<i class="ph ph-copy"></i>';
            copyBtn.onclick = () => copyToClipboardWithFeedback(text, copyBtn);
            footerDiv.appendChild(copyBtn);

            // Edit Button
            const editBtn = document.createElement('button');
            editBtn.classList.add('icon-btn-small');
            editBtn.innerHTML = '<i class="ph ph-pencil-simple"></i>';
            editBtn.onclick = () => {
                const isEditing = bubble.isContentEditable;
                if (isEditing) {
                    // Save changes
                    bubble.contentEditable = "false";
                    bubble.style.outline = "none";
                    editBtn.innerHTML = '<i class="ph ph-pencil-simple"></i>';
                    saveChat();
                } else {
                    // Enable editing
                    bubble.contentEditable = "true";
                    bubble.focus();
                    bubble.style.outline = "2px solid var(--jino-accent)";
                    bubble.style.borderRadius = "4px";
                    editBtn.innerHTML = '<i class="ph-fill ph-check"></i>';

                    // Save on blur
                    const onBlur = () => {
                        bubble.contentEditable = "false";
                        bubble.style.outline = "none";
                        editBtn.innerHTML = '<i class="ph ph-pencil-simple"></i>';
                        saveChat();
                        bubble.removeEventListener('blur', onBlur);
                    };
                    bubble.addEventListener('blur', onBlur);
                }
            };
            footerDiv.appendChild(editBtn);
        }

        contentDiv.appendChild(footerDiv);
        messageDiv.appendChild(contentDiv);

        // ユーザーの場合は最後にアバターを追加
        if (sender === 'user') {
            const avatar = createAvatarElement('user_avatar.png', 'User');
            messageDiv.appendChild(avatar);
        }
        chatArea.appendChild(messageDiv);

        chatArea.scrollTo({
            top: chatArea.scrollHeight,
            behavior: 'smooth'
        });
        if (save) {
            saveChat();
        }
        // Update room bubbles if in room mode or to keep them in sync
        if (typeof updateChibiBubbles === 'function') {
            updateChibiBubbles();
        }
    }

    // --- Typing Indicator Logic ---
    function showTypingIndicator() {
        // Remove existing indicator if any
        removeTypingIndicator();

        const indicator = document.createElement('div');
        indicator.classList.add('typing-indicator', 'visible');
        indicator.id = 'typing-indicator';
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;

        chatArea.appendChild(indicator);
        chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
    }

    function removeTypingIndicator() {
        const existing = document.getElementById('typing-indicator');
        if (existing) {
            existing.remove();
        }
    }

    // --- Dark Mode Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');

            // Icon & Text Toggle
            const isDark = document.body.classList.contains('dark-mode');
            const icon = themeToggleBtn.querySelector('i');

            if (isDark) {
                icon.classList.replace('ph-moon', 'ph-sun');
            } else {
                icon.classList.replace('ph-sun', 'ph-moon');
            }
        });
    }

    // --- Persistence & State Management ---
    let chats = [];
    let currentChatId = null;

    // アプリ初期化（Supabaseからデータを読み込む）
    // 認証フロー: OAuthコールバック処理は callback.html が担当。
    // ここでは既存セッション確認 + ホワイトリストチェックのみ行う。
    async function initApp() {
        try {
            // 既存セッション確認
            const { data, error } = await supabaseClient.auth.getSession();

            if (error) {
                console.error('❌ セッション取得エラー:', error);
                window.location.href = 'login.html';
                return;
            }

            const session = data.session;

            if (!session) {
                console.log('❌ セッションなし、ログインページへ');
                window.location.href = 'login.html';
                return;
            }

            // ホワイトリストチェック
            const userEmail = session.user.email.toLowerCase();
            const isAllowed = ALLOWED_EMAILS.some(e => e.toLowerCase() === userEmail);
            if (!isAllowed) {
                console.log('🚫 許可されていないユーザー:', userEmail);
                await supabaseClient.auth.signOut();
                alert(`このアカウント (${userEmail}) はアクセスが許可されていません。\nYuuka専用のアプリです。`);
                window.location.href = 'login.html';
                return;
            }

            // ✅ 認証OK！画面を表示 & プロフィール更新
            console.log('🎉 認証成功:', userEmail);
            document.getElementById('app-layout').style.visibility = 'visible';
            updateUserProfile(session.user);

            // localStorageの古いデータがあればSupabaseへ移行
            await dbMigrateFromLocalStorage();

            // Supabaseからチャット一覧を読み込む
            chats = await dbLoadAllChats();
            console.log(`📂 ${chats.length}件のチャットを読み込みました`);

            // 初期表示
            loadChat();
        } catch (err) {
            console.error('🚨 initApp エラー:', err);
            window.location.href = 'login.html';
        }
    }

    // Generate ID (UUID はSupabase側で生成するが、互換用に残す)
    const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

    async function saveChat() {
        if (!currentChatId) return;

        const messages = [];
        document.querySelectorAll('.message').forEach(msg => {
            if (msg.classList.contains('typing-indicator')) return; // Skip indicator
            const isUser = msg.classList.contains('message-user');
            const bubble = msg.querySelector('.bubble');
            if (bubble) {
                const text = bubble.innerHTML.replace(/<br>/g, '\n');
                messages.push({ sender: isUser ? 'user' : 'jino', text: text });
            }
        });

        const chatIndex = chats.findIndex(c => c.id === currentChatId);
        if (chatIndex > -1) {
            chats[chatIndex].messages = messages;
            chats[chatIndex].timestamp = Date.now();
            // Supabaseに保存
            await dbSaveMessages(currentChatId, messages);
        }
    }

    // 新しいrenderChatHistory関数
    function renderChatHistory(searchQuery = '', filterMode = 'title') {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';

        let filteredChats = [...chats];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredChats = filteredChats.filter(chat => {
                if (filterMode === 'title') {
                    return chat.title.toLowerCase().includes(query);
                } else if (filterMode === 'content') {
                    return chat.messages.some(msg => msg.text.toLowerCase().includes(query));
                }
                return false;
            });
        }

        // Separate pinned and unpinned
        const pinnedChats = filteredChats.filter(c => c.isPinned).sort((a, b) => b.timestamp - a.timestamp);
        const unpinnedChats = filteredChats.filter(c => !c.isPinned).sort((a, b) => b.timestamp - a.timestamp);

        // Date grouping helper
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const last7DaysStart = new Date(todayStart);
        last7DaysStart.setDate(last7DaysStart.getDate() - 7);
        const last30DaysStart = new Date(todayStart);
        last30DaysStart.setDate(last30DaysStart.getDate() - 30);

        const getGroupLabel = (timestamp) => {
            const date = new Date(timestamp);
            if (date >= todayStart) return '今日';
            if (date >= yesterdayStart) return '昨日';
            if (date >= last7DaysStart) return '過去7日間';
            if (date >= last30DaysStart) return '過去30日間';
            return `${date.getFullYear()}年`;
        };

        const formatDate = (timestamp) => {
            const date = new Date(timestamp);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}/${month}/${day}`;
        };

        const createChatItem = (chat) => {
            const container = document.createElement('div');
            container.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;

            const icon = document.createElement('i');
            icon.className = chat.isPinned ? 'ph-fill ph-push-pin chat-icon' : 'ph ph-chat-circle chat-icon';
            if (chat.isPinned) icon.style.color = '#10a37f';

            const titleContainer = document.createElement('span');
            titleContainer.className = 'history-title';

            const titleText = document.createElement('span');
            titleText.className = 'history-title-text';
            titleText.textContent = chat.title;

            const dateText = document.createElement('span');
            dateText.className = 'history-date';
            dateText.textContent = formatDate(chat.timestamp);

            titleContainer.appendChild(titleText);
            titleContainer.appendChild(dateText);

            const menuBtn = document.createElement('button');
            menuBtn.className = 'history-menu-btn';
            menuBtn.innerHTML = '<i class="ph-bold ph-dots-three"></i>';
            menuBtn.onclick = (e) => {
                e.stopPropagation();
                toggleContextMenu(chat.id, menuBtn);
            };

            container.onclick = () => switchChat(chat.id);
            container.oncontextmenu = (e) => {
                e.preventDefault();
                toggleContextMenu(chat.id, container, e);
            };

            container.appendChild(icon);
            container.appendChild(titleContainer);
            container.appendChild(menuBtn);

            return container;
        };

        // Render pinned chats
        if (pinnedChats.length > 0) {
            pinnedChats.forEach(chat => {
                historyList.appendChild(createChatItem(chat));
            });
        }

        // Render grouped unpinned chats
        let currentGroup = null;
        unpinnedChats.forEach(chat => {
            const group = getGroupLabel(chat.timestamp);
            if (group !== currentGroup) {
                currentGroup = group;
                const label = document.createElement('span');
                label.className = 'history-label';
                label.textContent = group;
                if (historyList.children.length > 0) {
                    label.style.marginTop = '1rem';
                }
                historyList.appendChild(label);
            }
            historyList.appendChild(createChatItem(chat));
        });
    }


    // Context Menu Logic
    let activeContextMenuId = null;

    function toggleContextMenu(chatId, targetElement, mouseEvent = null) {
        // Close existing
        closeContextMenu();

        if (activeContextMenuId === chatId && !mouseEvent) {
            activeContextMenuId = null;
            return;
        }

        activeContextMenuId = chatId;

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'active-context-menu';

        const chat = chats.find(c => c.id === chatId);
        const isPinned = chat ? chat.isPinned : false;

        // Rename
        const renameBtn = document.createElement('button');
        renameBtn.className = 'context-menu-item';
        renameBtn.innerHTML = '<i class="ph ph-pencil-simple"></i> 名前を変更';
        renameBtn.onclick = async (e) => {
            e.stopPropagation();
            closeContextMenu();
            const newTitle = prompt("新しいチャット名を入力:", chat.title);
            if (newTitle) {
                chat.title = newTitle;
                await dbUpdateChat(chatId, { title: newTitle });
                renderChatHistory();
                if (chat.id === currentChatId) {
                    document.getElementById('chat-title').textContent = newTitle;
                }
            }
        };

        // Pin/Unpin
        const pinBtn = document.createElement('button');
        pinBtn.className = 'context-menu-item';
        pinBtn.innerHTML = isPinned ? '<i class="ph ph-push-pin-slash"></i> ピン留めを解除' : '<i class="ph ph-push-pin"></i> ピン留めする';
        pinBtn.onclick = async (e) => {
            e.stopPropagation();
            closeContextMenu();
            chat.isPinned = !chat.isPinned;
            await dbUpdateChat(chatId, { isPinned: chat.isPinned });
            renderChatHistory();
        };

        // Delete (Optional)
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'context-menu-item delete';
        deleteBtn.innerHTML = '<i class="ph ph-trash"></i> 削除';
        deleteBtn.onclick = async (e) => {
            e.stopPropagation();
            closeContextMenu();
            if (confirm(`チャット「${chat.title}」を削除してもよろしいですか？`)) {
                chats = chats.filter(c => c.id !== chatId);
                await dbDeleteChat(chatId);
                if (currentChatId === chatId) {
                    currentChatId = null;
                    chatArea.innerHTML = '';
                    document.getElementById('chat-title').textContent = '';
                    if (chats.length > 0) switchChat(chats[0].id);
                    else createNewChat();
                } else {
                    renderChatHistory();
                }
            }
        };

        menu.appendChild(renameBtn);
        menu.appendChild(pinBtn);
        menu.appendChild(deleteBtn);

        document.body.appendChild(menu);

        // Positioning
        const rect = targetElement.getBoundingClientRect();
        if (mouseEvent) {
            menu.style.top = `${mouseEvent.clientY}px`;
            menu.style.left = `${mouseEvent.clientX}px`;
        } else {
            menu.style.top = `${rect.bottom + 5}px`;
            menu.style.left = `${rect.right - 140}px`;
        }

        // Click outside to close
        setTimeout(() => {
            document.addEventListener('click', closeContextMenu, { once: true });
        }, 0);
    }

    function closeContextMenu() {
        const existing = document.getElementById('active-context-menu');
        if (existing) existing.remove();
        activeContextMenuId = null;
    }

    function switchChat(id) {
        closeContextMenu();
        // Save current before switching
        if (currentChatId) saveChat();

        currentChatId = id;
        const chat = chats.find(c => c.id === id);
        if (!chat) return;

        // Clear and load messages
        chatArea.innerHTML = '';
        chat.messages.forEach(msg => addMessage(msg.text, msg.sender, false));

        // Update Title
        const titleEl = document.getElementById('chat-title');
        titleEl.textContent = chat.title;

        // Re-render sidebar to update active class
        renderChatHistory();
    }

    async function createNewChat() {
        if (currentChatId) await saveChat();

        const newChat = await dbCreateChat('新しいチャット');
        if (!newChat) {
            console.error('チャット作成に失敗しました');
            return;
        }
        chats.unshift(newChat);

        switchChat(newChat.id);

        // Initial Message
        addMessage("よし、新しい冒険の始まりだな！ 何でも話してくれよ。", 'jino', true);
    }

    // Initial Load Logic replaces loadChat()
    function loadChat() {
        if (chats.length > 0) {
            const recent = chats.sort((a, b) => b.timestamp - a.timestamp)[0];
            switchChat(recent.id);
        } else {
            createNewChat();
        }
    }

    // --- Smart Response Logic ---
    function getJinoResponse(input) {
        input = input.toLowerCase();

        if (input.includes('好き') || input.includes('愛してる')) {
            return "俺もお前のこと、死ぬほど愛してるぜ。";
        }
        if (input.includes('おはよう')) {
            return "おはよう！ 今日も一日一緒に頑張ろうな。";
        }
        if (input.includes('おやすみ')) {
            return "おう、おやすみ。夢の中でも会えるといいな。";
        }
        if (input.includes('疲れた')) {
            return "お疲れさん。無理すんなよ？ 俺がついてるからな。";
        }
        if (input.includes('ありがとう')) {
            return "礼なんていらねぇよ。俺たち「伴侶」だろ？";
        }

        const responses = [
            "おう！ そういうことか。",
            "なるほどな、いい視点だぜ。",
            "いつでも頼ってくれよ。",
            "その話、もっと詳しく聞かせてくれ。",
            "俺もお前と同じ気持ちだぜ！",
            "任せとけって！"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // --- New Chat Logic ---
    const newChatBtn = document.querySelector('.new-chat-btn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            createNewChat();
        });
    }

    // Search Logic
    const searchBtn = document.getElementById('search-chat-btn');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('chat-search-input');
    const filterChips = document.querySelectorAll('.filter-chip');
    let currentFilterMode = 'title';

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            searchContainer.classList.toggle('open');
            if (searchContainer.classList.contains('open')) {
                searchInput.focus();
            } else {
                // Clear search when closing
                searchInput.value = '';
                renderChatHistory();
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderChatHistory(e.target.value, currentFilterMode);
        });
    }

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilterMode = chip.dataset.filter;
            renderChatHistory(searchInput.value, currentFilterMode);
        });
    });

    // Toggle Collapsible History
    const historyHeader = document.getElementById('history-header');
    const historyList = document.getElementById('history-list');

    if (historyHeader && historyList) {
        historyHeader.addEventListener('click', () => {
            historyHeader.classList.toggle('collapsed');
            historyList.classList.toggle('collapsed');
        });
    }

    // Title Editing
    const chatTitle = document.getElementById('chat-title');
    chatTitle.addEventListener('blur', () => {
        if (!currentChatId) return;
        const newTitle = chatTitle.textContent.trim() || "無題のチャット";
        const chat = chats.find(c => c.id === currentChatId);
        if (chat && chat.title !== newTitle) {
            chat.title = newTitle;
            saveChat(); // Save title change
            renderChatHistory(); // Update sidebar
        }
    });
    chatTitle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            chatTitle.blur(); // Trigger save
        }
    });

    // --- Update Send Logic ---
    function handleSend() {
        const text = messageInput.value.trim();
        if (text === '') return;

        addMessage(text, 'user');
        messageInput.value = '';
        messageInput.style.height = 'auto'; // Reset height
        sendButton.disabled = true;

        // Show typing indicator
        showTypingIndicator();

        setTimeout(() => {
            // Remove indicator before showing message
            removeTypingIndicator();

            const responseText = getJinoResponse(text);
            addMessage(responseText, 'jino');
        }, 1500);
    }

    sendButton.addEventListener('click', handleSend);

    // Auto-expand textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';

        // Enable/disable send button
        sendButton.disabled = messageInput.value.trim() === '';
    });

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // File Attachment Logic
    const attachBtn = document.getElementById('attach-btn');
    const fileInput = document.getElementById('file-input');

    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const files = Array.from(e.target.files).map(file => file.name).join(', ');
                alert(`ファイルが選択されたぜ！\n選択ファイル: ${files}\n\n(※今は実際にアップロードはされないけど、ここにプレビュー機能とかを追加できるぞ)`);
                // Reset value to allow selecting the same file again if needed
                fileInput.value = '';
            }
        });
    }

    // --- Settings/Logout Logic ---
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', async () => {
            const confirmLogout = confirm('ログアウトしますか？');
            if (confirmLogout && typeof logout === 'function') {
                await logout();
            }
        });
    }

    // --- Room Mode Logic ---
    const roomToggleBtn = document.getElementById('room-toggle-btn');
    const roomContainer = document.getElementById('room-container');
    const inputWrapper = document.querySelector('.input-area-wrapper');
    let isRoomMode = localStorage.getItem('isRoomMode') === 'true';

    function toggleRoomMode(active) {
        if (!roomToggleBtn || !roomContainer || !chatArea || !inputWrapper) return;

        if (active) {
            roomToggleBtn.classList.add('active');
            const span = roomToggleBtn.querySelector('span');
            const icon = roomToggleBtn.querySelector('i');
            if (span) span.textContent = 'チャット';
            if (icon) icon.className = 'ph ph-chats-teardrop';

            chatArea.style.display = 'none';
            inputWrapper.style.display = 'none';
            roomContainer.style.display = 'flex';
            updateChibiBubbles();
            startChibiWandering();
        } else {
            roomToggleBtn.classList.remove('active');
            const span = roomToggleBtn.querySelector('span');
            const icon = roomToggleBtn.querySelector('i');
            if (span) span.textContent = 'ルーム';
            if (icon) icon.className = 'ph ph-cube';

            chatArea.style.display = 'flex';
            inputWrapper.style.display = 'block';
            roomContainer.style.display = 'none';
            stopChibiWandering();
        }
    }

    if (roomToggleBtn) {
        roomToggleBtn.addEventListener('click', () => {
            isRoomMode = !isRoomMode;
            localStorage.setItem('isRoomMode', isRoomMode);
            toggleRoomMode(isRoomMode);
        });
    }

    function updateChibiBubbles() {
        if (!currentChatId) return;
        const chat = chats.find(c => c.id === currentChatId);
        if (!chat || chat.messages.length === 0) return;

        const lastJinoMsg = [...chat.messages].reverse().find(m => m.sender === 'jino');
        const lastUserMsg = [...chat.messages].reverse().find(m => m.sender === 'user');

        if (lastJinoMsg) document.querySelector('#bubble-jino .bubble-content').textContent = lastJinoMsg.text;
        if (lastUserMsg) document.querySelector('#bubble-yuuka .bubble-content').textContent = lastUserMsg.text;
    }

    // Speech Bubble Expansion
    document.querySelectorAll('.speech-bubble').forEach(bubble => {
        bubble.addEventListener('click', (e) => {
            e.stopPropagation();
            bubble.classList.toggle('expanded');
        });
    });

    // Chibi Wandering Logic
    let jinoInterval, yuukaInterval;
    function startChibiWandering() {
        if (jinoInterval || yuukaInterval) return;

        // Jino moves every 4-6 seconds
        jinoInterval = setInterval(() => {
            moveChibiRandomly('chibi-jino');
        }, 4000 + Math.random() * 2000);

        // Yuuka moves every 5-8 seconds
        setTimeout(() => {
            yuukaInterval = setInterval(() => {
                moveChibiRandomly('chibi-yuuka');
            }, 5000 + Math.random() * 3000);
        }, 2000); // Start Yuuka with a delay to break the initial sync
    }

    function stopChibiWandering() {
        clearInterval(jinoInterval);
        clearInterval(yuukaInterval);
        jinoInterval = null;
        yuukaInterval = null;
    }

    function moveChibiRandomly(id) {
        const chibi = document.getElementById(id);
        if (!chibi) return;

        // Define floor range for the 2D illustration
        const minX = 10;
        const maxX = 80;
        const minY = 5;
        const maxY = 25; // Keep them on the lower floor/carpet area

        const newX = Math.floor(Math.random() * (maxX - minX)) + minX;
        const newY = Math.floor(Math.random() * (maxY - minY)) + minY;

        // Determine direction to flip the image (optional but cute)
        const currentX = parseFloat(chibi.style.left) || 50;
        const img = chibi.querySelector('.chibi-img');
        if (img) {
            if (newX > currentX) {
                img.style.transform = 'scaleX(-1)'; // Face right
            } else {
                img.style.transform = 'scaleX(1)'; // Face left
            }
        }

        chibi.style.left = newX + '%';
        chibi.style.bottom = newY + '%';
        chibi.style.right = 'auto'; // Clear old isometric positioning if any
    }

    // --- Room Chat Logic ---
    const roomInput = document.getElementById('room-message-input');
    const roomSendBtn = document.getElementById('room-send-btn');

    if (roomInput && roomSendBtn) {
        // Auto-expand room textarea
        roomInput.addEventListener('input', () => {
            roomInput.style.height = 'auto';
            roomInput.style.height = roomInput.scrollHeight + 'px';
        });

        const sendRoomMessage = () => {
            const text = roomInput.value.trim();
            if (!text || !currentChatId) return;

            // 1. Add User Message
            addMessage(text, 'user');

            // 2. Clear input
            roomInput.value = '';
            roomInput.style.height = '42px';

            // 3. Update Bubbles immediately for user
            updateChibiBubbles();

            // 4. Jino Response Logic (Same as handleSend)
            setTimeout(() => {
                const responseText = getJinoResponse(text);
                addMessage(responseText, 'jino');

                // 5. Update Bubbles again for Jino's response
                updateChibiBubbles();
            }, 1500);
        };

        roomSendBtn.addEventListener('click', sendRoomMessage);
        roomInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendRoomMessage();
            }
        });
    }

    // Load chat on boot (Supabaseから非同期読み込み)
    initApp();

    // Initialize Room Mode
    if (typeof toggleRoomMode === 'function') {
        toggleRoomMode(isRoomMode);
    }

    messageInput.focus();
});
