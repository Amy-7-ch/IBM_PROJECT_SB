// DOM Elements
const sidebar = document.getElementById('sidebar');
const mobileToggle = document.getElementById('mobileToggle');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatArea = document.getElementById('chatArea');
const welcomeContainer = document.getElementById('welcomeContainer');
const messagesContainer = document.getElementById('messagesContainer');
const chatsList = document.getElementById('chatsList');
const foldersList = document.getElementById('foldersList');
const searchInput = document.getElementById('searchInput');
const voiceBtn = document.getElementById('voiceBtn');
const robotContainer = document.getElementById('robotContainer');
const robot = document.getElementById('robot');

// State
let currentChat = null;
let chatHistory = [];
let folders = [];
let selectedColor = 'blue';
let currentFolderId = null;
let isSaved = false;
let isRecording = false;
let recognition = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initFlipClock();
    loadFromStorage();
    setupEventListeners();
    initSpeechRecognition();
    initRobotInteractions();
});

// Robot Interaction System
function initRobotInteractions() {
    // Input focus - robot moves to input
    messageInput.addEventListener('focus', () => {
        robotContainer.classList.add('move-to-input');
        robot.classList.add('excited');
        setTimeout(() => robot.classList.remove('excited'), 600);
    });

    // Input blur - robot returns to idle
    messageInput.addEventListener('blur', () => {
        if (!messageInput.value.trim()) {
            robotContainer.classList.remove('move-to-input');
        }
    });

    // Typing - robot reacts
    let typingTimeout;
    messageInput.addEventListener('input', () => {
        robot.classList.add('typing');
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            robot.classList.remove('typing');
        }, 500);
    });

    // Message sent - robot celebrates
    sendBtn.addEventListener('click', () => {
        if (messageInput.value.trim()) {
            robotContainer.classList.remove('move-to-input');
            robotContainer.classList.add('move-to-chat');
            robot.classList.add('excited');
            setTimeout(() => {
                robot.classList.remove('excited');
                robotContainer.classList.remove('move-to-chat');
            }, 2000);
        }
    });
}

// Storage Management
function loadFromStorage() {
    const savedChats = localStorage.getItem('studybuddy_chats');
    const savedFolders = localStorage.getItem('studybuddy_folders');
    
    if (savedChats) {
        chatHistory = JSON.parse(savedChats);
    }
    
    if (savedFolders) {
        folders = JSON.parse(savedFolders);
    }
    
    renderChatHistory();
    renderFolders();
}

function saveToStorage() {
    localStorage.setItem('studybuddy_chats', JSON.stringify(chatHistory));
    localStorage.setItem('studybuddy_folders', JSON.stringify(folders));
}

// Flip Clock with Seconds and Creative Animation
function initFlipClock() {
    updateFlipClock();
    setInterval(updateFlipClock, 1000);
}

function updateFlipClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    updateFlipCard('hoursTens', hours[0]);
    updateFlipCard('hoursOnes', hours[1]);
    updateFlipCard('minutesTens', minutes[0]);
    updateFlipCard('minutesOnes', minutes[1]);
    updateFlipCard('secondsTens', seconds[0]);
    updateFlipCard('secondsOnes', seconds[1]);
}

function updateFlipCard(id, newValue) {
    const card = document.getElementById(id);
    const front = card.querySelector('.flip-card-front');
    const back = card.querySelector('.flip-card-back');
    
    if (front.textContent !== newValue) {
        back.textContent = newValue;
        card.classList.add('flipping');
        
        setTimeout(() => {
            front.textContent = newValue;
            card.classList.remove('flipping');
        }, 600);
    }
}

// Event Listeners
function setupEventListeners() {
    // Mobile toggle
    mobileToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Close sidebar and menus when clicking outside
    document.addEventListener('click', (e) => {
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && 
                !mobileToggle.contains(e.target) && 
                sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        }
        
        // Close context menus
        const contextMenus = document.querySelectorAll('.context-menu');
        contextMenus.forEach(menu => {
            if (!menu.contains(e.target) && !e.target.closest('.menu-btn')) {
                menu.classList.remove('active');
            }
        });
    });

    // Enter to send
    messageInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Search functionality
    searchInput?.addEventListener('input', (e) => {
        filterChats(e.target.value);
    });

    // Color picker
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            colorOptions.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            selectedColor = option.dataset.color;
        });
    });
}

// Speech Recognition
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isRecording = true;
            voiceBtn.classList.add('recording');
            showToast('Listening...');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            messageInput.value = transcript;
            messageInput.focus();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            showToast('Error: ' + event.error);
            isRecording = false;
            voiceBtn.classList.remove('recording');
        };

        recognition.onend = () => {
            isRecording = false;
            voiceBtn.classList.remove('recording');
        };
    }
}

function toggleVoiceRecognition() {
    if (!recognition) {
        showToast('Speech recognition not supported in your browser');
        return;
    }

    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

// Menu Functions
function showSidebarMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('sidebarMenu');
    const rect = event.target.getBoundingClientRect();
    menu.style.left = (rect.left - 150) + 'px';
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.classList.add('active');
}

function showSettings() {
    closeContextMenu();
    showToast('Settings feature coming soon!');
}

function exportAllChats() {
    closeContextMenu();
    const dataStr = JSON.stringify({
        chats: chatHistory,
        folders: folders,
        exportDate: new Date().toISOString()
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studybuddy-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('All chats exported successfully!');
}

function importChats() {
    closeContextMenu();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.chats) {
                    chatHistory = [...chatHistory, ...data.chats];
                }
                if (data.folders) {
                    folders = [...folders, ...data.folders];
                }
                saveToStorage();
                renderChatHistory();
                renderFolders();
                showToast('Chats imported successfully!');
            } catch (error) {
                showToast('Error importing file');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function clearAllData() {
    closeContextMenu();
    if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
        chatHistory = [];
        folders = [];
        localStorage.removeItem('studybuddy_chats');
        localStorage.removeItem('studybuddy_folders');
        renderChatHistory();
        renderFolders();
        startNewChat();
        showToast('All data cleared!');
    }
}

function showAbout() {
    closeContextMenu();
    alert('StudyBuddy AI\n\nVersion 1.0\n\nYour intelligent study companion powered by AI.\n\n© 2024 StudyBuddy');
}

function exportCurrentChat() {
    closeContextMenu();
    if (currentChat === null) {
        showToast('No conversation to export');
        return;
    }
    
    const chat = chatHistory[currentChat];
    const dataStr = JSON.stringify(chat, null, 2);
    
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chat.title.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('Chat exported successfully!');
}

// Folder Management
function renderFolders() {
    if (!foldersList) return;
    
    foldersList.innerHTML = '';
    folders.forEach((folder, index) => {
        const folderItem = document.createElement('div');
        folderItem.className = 'folder-item';
        folderItem.setAttribute('data-color', folder.color);
        folderItem.innerHTML = `
            <i class="fas fa-folder"></i>
            <span>${folder.name}</span>
            <button class="menu-btn" onclick="showFolderMenu(event, ${index})">
                <i class="fas fa-ellipsis"></i>
            </button>
        `;
        folderItem.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-btn')) {
                filterChatsByFolder(index);
            }
        });
        foldersList.appendChild(folderItem);
    });
}

function showCreateFolderModal() {
    const modal = document.getElementById('createFolderModal');
    const input = document.getElementById('folderNameInput');
    input.value = '';
    
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(o => o.classList.remove('selected'));
    colorOptions[0].classList.add('selected');
    selectedColor = 'blue';
    
    modal.classList.add('active');
    input.focus();
}

function createFolder() {
    const input = document.getElementById('folderNameInput');
    const name = input.value.trim();
    
    if (!name) {
        showToast('Please enter a folder name');
        return;
    }
    
    folders.push({
        id: Date.now(),
        name: name,
        color: selectedColor,
        chats: []
    });
    
    saveToStorage();
    renderFolders();
    closeModal('createFolderModal');
    showToast('Folder created successfully!');
}

function showFolderMenu(event, index) {
    event.stopPropagation();
    const menu = document.getElementById('folderContextMenu');
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.classList.add('active');
    currentFolderId = index;
}

function renameFolderAction() {
    if (currentFolderId === null) return;
    
    const folder = folders[currentFolderId];
    const newName = prompt('Rename folder:', folder.name);
    
    if (newName && newName.trim()) {
        folders[currentFolderId].name = newName.trim();
        saveToStorage();
        renderFolders();
        showToast('Folder renamed!');
    }
    
    closeContextMenu();
}

function deleteFolderAction() {
    if (currentFolderId === null) return;
    
    if (confirm('Delete this folder? (Chats will not be deleted)')) {
        folders.splice(currentFolderId, 1);
        saveToStorage();
        renderFolders();
        showToast('Folder deleted!');
    }
    
    closeContextMenu();
}

function filterChatsByFolder(folderIndex) {
    const folder = folders[folderIndex];
    const items = document.querySelectorAll('.chat-item');
    
    items.forEach(item => {
        const chatId = item.dataset.chatId;
        if (folder.chats.includes(parseInt(chatId))) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
    
    showToast(`Showing chats in "${folder.name}"`);
}

// Chat History Management
function renderChatHistory() {
    if (!chatsList) return;
    
    chatsList.innerHTML = '';
    chatHistory.forEach((chat, index) => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.dataset.chatId = chat.id;
        if (currentChat === index) {
            chatItem.classList.add('active');
        }
        
        chatItem.innerHTML = `
            <i class="fas fa-message"></i>
            <div class="chat-info">
                <div class="chat-title">
                    ${chat.title}
                    ${chat.saved ? '<span class="saved-badge">Saved</span>' : ''}
                </div>
                <div class="chat-preview">${chat.preview}</div>
            </div>
            <button class="menu-btn" onclick="showChatMenu(event, ${index})">
                <i class="fas fa-ellipsis"></i>
            </button>
        `;
        chatItem.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-btn')) {
                loadChat(index);
            }
        });
        chatsList.appendChild(chatItem);
    });
}

function filterChats(query) {
    const items = document.querySelectorAll('.chat-item');
    const lowerQuery = query.toLowerCase();
    
    items.forEach(item => {
        const title = item.querySelector('.chat-title').textContent.toLowerCase();
        const preview = item.querySelector('.chat-preview').textContent.toLowerCase();
        
        if (title.includes(lowerQuery) || preview.includes(lowerQuery)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function loadChat(index) {
    const chat = chatHistory[index];
    if (!chat) return;
    
    currentChat = index;
    isSaved = chat.saved || false;
    messagesContainer.style.display = 'block';
    welcomeContainer.style.display = 'none';
    messagesContainer.innerHTML = '';
    
    chat.messages.forEach(msg => {
        addMessageToUI(msg.text, msg.type, false);
    });
    
    renderChatHistory();
    
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
    }
}

function showChatMenu(event, index) {
    event.stopPropagation();
    currentChat = index;
    const menu = document.getElementById('chatOptionsMenu');
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.classList.add('active');
}

function deleteCurrentChat() {
    if (currentChat === null) return;
    
    if (confirm('Delete this conversation?')) {
        chatHistory.splice(currentChat, 1);
        saveToStorage();
        renderChatHistory();
        startNewChat();
        showToast('Conversation deleted!');
    }
    
    closeContextMenu();
}

function moveChatToFolder() {
    if (currentChat === null) return;
    
    if (folders.length === 0) {
        showToast('Create a folder first!');
        closeContextMenu();
        return;
    }
    
    const folderNames = folders.map((f, i) => `${i + 1}. ${f.name}`).join('\n');
    const choice = prompt(`Select folder:\n${folderNames}\n\nEnter number:`);
    
    if (choice) {
        const folderIndex = parseInt(choice) - 1;
        if (folderIndex >= 0 && folderIndex < folders.length) {
            const chatId = chatHistory[currentChat].id;
            if (!folders[folderIndex].chats.includes(chatId)) {
                folders[folderIndex].chats.push(chatId);
                saveToStorage();
                showToast(`Moved to "${folders[folderIndex].name}"!`);
            }
        }
    }
    
    closeContextMenu();
}

function showRenameModal() {
    if (currentChat === null) {
        showToast('No conversation to rename');
        return;
    }
    
    const modal = document.getElementById('renameChatModal');
    const input = document.getElementById('chatNameInput');
    input.value = chatHistory[currentChat].title;
    modal.classList.add('active');
    input.focus();
    input.select();
}

function renameChat() {
    if (currentChat === null) return;
    
    const input = document.getElementById('chatNameInput');
    const newName = input.value.trim();
    
    if (!newName) {
        showToast('Please enter a name');
        return;
    }
    
    chatHistory[currentChat].title = newName;
    saveToStorage();
    renderChatHistory();
    closeModal('renameChatModal');
    showToast('Conversation renamed!');
}

function shareChat() {
    if (currentChat === null) {
        showToast('No conversation to share');
        return;
    }
    
    const chat = chatHistory[currentChat];
    const text = `${chat.title}\n\n${chat.messages.map(m => `${m.type.toUpperCase()}: ${m.text}`).join('\n\n')}`;
    
    if (navigator.share) {
        navigator.share({
            title: chat.title,
            text: text
        }).then(() => {
            showToast('Shared successfully!');
        }).catch(() => {
            copyToClipboard(text);
        });
    } else {
        copyToClipboard(text);
    }
}

function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Copied to clipboard!');
}

function startNewChat() {
    currentChat = null;
    isSaved = false;
    messagesContainer.style.display = 'none';
    welcomeContainer.style.display = 'block';
    messagesContainer.innerHTML = '';
    messageInput.value = '';
    
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
    }
}

function useSuggestion(text) {
    messageInput.value = text;
    messageInput.focus();
}

// Send Message
async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    if (welcomeContainer.style.display !== 'none') {
        welcomeContainer.style.display = 'none';
        messagesContainer.style.display = 'block';
    }
    
    addMessageToUI(message, 'user');
    
    if (currentChat === null) {
        const newChat = {
            id: Date.now(),
            title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
            preview: message.slice(0, 100),
            messages: [{text: message, type: 'user'}],
            timestamp: Date.now(),
            saved: false
        };
        chatHistory.unshift(newChat);
        currentChat = 0;
    } else {
        chatHistory[currentChat].messages.push({text: message, type: 'user'});
        chatHistory[currentChat].timestamp = Date.now();
    }
    
    messageInput.value = '';
    sendBtn.disabled = true;
    
    // Robot thinking state
    robotContainer.classList.add('thinking');
    
    const typingIndicator = showTypingIndicator();
    
    try {
        const response = await fetch('http://127.0.0.1:8000/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message})
        });
        
        typingIndicator.remove();
        robotContainer.classList.remove('thinking');
        
        if (!response.ok) {
            throw new Error('Network error');
        }
        
        const data = await response.json();
        
        addMessageToUI(data.reply, 'bot', true);
        
        if (currentChat !== null) {
            chatHistory[currentChat].messages.push({text: data.reply, type: 'bot'});
            chatHistory[currentChat].preview = data.reply.slice(0, 100);
        }
        
    } catch (error) {
        typingIndicator.remove();
        robotContainer.classList.remove('thinking');
        const errorMsg = "I'm having trouble connecting to the server. Please make sure the backend is running on http://127.0.0.1:8000";
        addMessageToUI(errorMsg, 'bot');
        
        if (currentChat !== null) {
            chatHistory[currentChat].messages.push({text: errorMsg, type: 'bot'});
        }
    } finally {
        sendBtn.disabled = false;
        messageInput.focus();
        saveToStorage();
        renderChatHistory();
    }
}

function addMessageToUI(text, type, animate = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    if (type === 'user') {
        avatar.innerHTML = '<i class="fas fa-user"></i>';
    } else {
        avatar.innerHTML = `
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M28 22 C28 18, 32 16, 36 18 L48 23 L48 72 L36 67 C32 65, 28 67, 28 72 Z" fill="url(#msgGrad1)" opacity="0.95"/>
                <path d="M72 22 C72 18, 68 16, 64 18 L52 23 L52 72 L64 67 C68 65, 72 67, 72 72 Z" fill="url(#msgGrad2)" opacity="0.95"/>
                <rect x="47" y="20" width="6" height="54" fill="url(#msgGrad3)" rx="1.5"/>
                <circle cx="41" cy="46" r="2.8" fill="#1E293B"/>
                <circle cx="59" cy="46" r="2.8" fill="#1E293B"/>
                <path d="M43 54 Q50 59, 57 54" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none"/>
                <defs>
                    <linearGradient id="msgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#A78BFA;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#C4B5FD;stop-opacity:1" />
                    </linearGradient>
                    <linearGradient id="msgGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#86EFAC;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#6EE7B7;stop-opacity:1" />
                    </linearGradient>
                    <linearGradient id="msgGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
                    </linearGradient>
                </defs>
            </svg>
        `;
    }
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    messagesContainer.appendChild(messageDiv);
    
    if (animate && type === 'bot') {
        typeText(content, text);
    } else {
        content.textContent = text;
    }
    
    scrollToBottom();
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message bot';
    indicator.innerHTML = `
        <div class="message-avatar">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M28 22 C28 18, 32 16, 36 18 L48 23 L48 72 L36 67 C32 65, 28 67, 28 72 Z" fill="url(#typingGrad1)" opacity="0.95"/>
                <path d="M72 22 C72 18, 68 16, 64 18 L52 23 L52 72 L64 67 C68 65, 72 67, 72 72 Z" fill="url(#typingGrad2)" opacity="0.95"/>
                <rect x="47" y="20" width="6" height="54" fill="url(#typingGrad3)" rx="1.5"/>
                <circle cx="41" cy="46" r="2.8" fill="#1E293B"/>
                <circle cx="59" cy="46" r="2.8" fill="#1E293B"/>
                <path d="M43 54 Q50 59, 57 54" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none"/>
                <defs>
                    <linearGradient id="typingGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#A78BFA;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#C4B5FD;stop-opacity:1" />
                    </linearGradient>
                    <linearGradient id="typingGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#86EFAC;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#6EE7B7;stop-opacity:1" />
                    </linearGradient>
                    <linearGradient id="typingGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(indicator);
    scrollToBottom();
    return indicator;
}

function typeText(element, text, speed = 20) {
    let index = 0;
    element.textContent = '';
    
    function type() {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
            scrollToBottom();
            setTimeout(type, speed);
        }
    }
    
    type();
}

function scrollToBottom() {
    chatArea.scrollTo({
        top: chatArea.scrollHeight,
        behavior: 'smooth'
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

function closeContextMenu() {
    const contextMenus = document.querySelectorAll('.context-menu');
    contextMenus.forEach(menu => menu.classList.remove('active'));
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
        }
    }, 250);
});