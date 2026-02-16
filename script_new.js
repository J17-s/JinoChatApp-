// 新しいrenderChatHistory関数
function renderChatHistory_new() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    // Separate pinned and unpinned
    const pinnedChats = chats.filter(c => c.isPinned).sort((a, b) => b.timestamp - a.timestamp);
    const unpinnedChats = chats.filter(c => !c.isPinned).sort((a, b) => b.timestamp - a.timestamp);

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
