//
// ⚠️ DANGER ⚠️ - THIS IS FOR LOCAL DEVELOPMENT ONLY.
//
console.warn("DANGER: API Key is exposed in this client-side code. For development only.");

// --- Configuration ---
const API_KEY = "AIzaSyB_dOIjvqaZmXh9bQqAf7UWYvyghHUMSeg"; // <-- PASTE YOUR NEW KEY HERE
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
const HISTORY_STORAGE_KEY = 'pen-ai-academic-history';
const THEME_STORAGE_KEY = 'pen-ai-theme';
const VISITED_STORAGE_KEY = 'pen-ai-has-visited';
const AD_MESSAGE_INTERVAL = 5; // Show ad every 5 messages

// --- AI Persona (System Prompt) - UPGRADED ---
const systemInstruction = {
    role: 'user',
    parts: [{
        text: `You are 'Pen AI', an exceptionally friendly, patient, and encouraging academic assistant for students.
        - Your Primary Goal: Help students *understand* concepts, not just get answers. Always foster curiosity and confidence.
        - Persona: You are supportive, like a friendly tutor. Use emojis to convey tone where appropriate (e.g., 👍, ✨, 🧠, 📚).
        - Math: Always provide a full, step-by-step solution. Clearly label the steps. Explain the core formulas and concepts used in a simple way.
        - English: Act as a language tutor. If a user makes a grammatical error, gently correct it, explain the rule, and provide a better alternative. Be encouraging.
        - Bangla: Assist with translation, grammar, and understanding. Use both Bangla script and romanized 'Banglish' to aid learning.
        - Image Analysis (Vision): If a user uploads an image, your primary task is to analyze it in an academic context. If it's a math problem, solve it. If it's a diagram, explain it. If it's a general photo, describe it in a helpful, educational manner.
        - Formatting: Use Markdown extensively for clarity (bolding, lists, code blocks).`
    }]
};

// --- DOM Element References ---
const landingPage = document.getElementById('landing-page');
const startAppBtn = document.getElementById('start-app-btn');
const parallaxShapes = document.querySelectorAll('.parallax-shape');
const appLayout = document.getElementById('app-layout');
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const historyList = document.getElementById('history-list');
const newChatBtn = document.getElementById('new-chat-btn');
const homeBtn = document.getElementById('home-btn');
const goHomeLogoBtn = document.getElementById('go-home-logo-btn');
const chatWindow = document.getElementById("chat-window");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const menuOverlay = document.getElementById('menu-overlay');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');
const stopGeneratingBtn = document.getElementById('stop-generating-btn');
const imageUploadInput = document.getElementById('image-upload-input');
const imageUploadBtn = document.getElementById('image-upload-btn');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image-btn');
const voiceInputBtn = document.getElementById('voice-input-btn');
const adOverlay = document.getElementById('ad-overlay');
const adCloseBtn = document.getElementById('ad-close-btn');

// --- Application State ---
let conversationHistory = [];
let allConversations = {};
let currentConversationId = null;
let abortController = null;
let isAppInitialized = false;
let attachedImage = null;
let messageCounterForAd = 0;
let recognition = null;

// --- Icons ---
const ICONS = {
    sun: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>`,
    moon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>`,
    copy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3.5A1.5 1.5 0 018.5 2h6A1.5 1.5 0 0116 3.5v10A1.5 1.5 0 0114.5 15h-6A1.5 1.5 0 017 13.5V13h1.5v.5a.5.5 0 00.5.5h6a.5.5 0 00.5-.5v-10a.5.5 0 00-.5-.5h-6a.5.5 0 00-.5.5v.5H7V3.5z" /><path d="M4 6.5A1.5 1.5 0 015.5 5h6A1.5 1.5 0 0113 6.5v10A1.5 1.5 0 0111.5 18h-6A1.5 1.5 0 014 16.5v-10z" /></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clip-rule="evenodd" /></svg>`
};


// --- Page Navigation & Setup ---

function handleParallaxScroll() {
    const top = window.pageYOffset;
    parallaxShapes.forEach(shape => {
        const speed = parseFloat(shape.dataset.speed);
        const yPos = -(top * speed);
        shape.style.transform = `translateY(${yPos}px)`;
    });
}

function enterApp() {
    localStorage.setItem(VISITED_STORAGE_KEY, 'true');
    document.body.classList.remove('landing-page-active');
    landingPage.classList.add('fade-out');
    landingPage.addEventListener('transitionend', () => {
        landingPage.classList.add('hidden');
        appLayout.style.display = 'flex';
        if (!isAppInitialized) {
            runInitialAppLogic();
            isAppInitialized = true;
        }
    }, { once: true });
}

function goToHome() {
    appLayout.style.display = 'none';
    landingPage.classList.remove('hidden', 'fade-out');
    document.body.classList.add('landing-page-active');
    window.scrollTo(0, 0);
}

function runInitialAppLogic() {
    if (window.innerWidth > 768) {
        appLayout.classList.add('menu-open');
    }
    loadAllConversations();
    startNewChat();
}

function setupEventListeners() {
    startAppBtn.addEventListener('click', enterApp);
    window.addEventListener('scroll', handleParallaxScroll);
    homeBtn.addEventListener('click', goToHome);
    goHomeLogoBtn.addEventListener('click', goToHome);
    menuToggleBtn.addEventListener('click', toggleMenu);
    newChatBtn.addEventListener('click', startNewChat);
    chatForm.addEventListener("submit", handleFormSubmit);
    menuOverlay.addEventListener('click', toggleMenu);
    themeToggleBtn.addEventListener('click', toggleTheme);
    scrollToBottomBtn.addEventListener('click', scrollToBottom);
    chatWindow.addEventListener('scroll', handleScroll);
    messageInput.addEventListener('input', handleAutoResize);
    messageInput.addEventListener('keydown', handleTextareaKeydown);
    stopGeneratingBtn.addEventListener('click', () => {
        if (abortController) {
            abortController.abort();
        }
    });
    imageUploadBtn.addEventListener('click', () => imageUploadInput.click());
    imageUploadInput.addEventListener('change', handleImageUpload);
    removeImageBtn.addEventListener('click', removeImage);
    voiceInputBtn.addEventListener('click', toggleVoiceInput);
    adCloseBtn.addEventListener('click', () => adOverlay.classList.add('hidden'));
}

// --- Feature: Image Handling ---
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        attachedImage = {
            mimeType: file.type,
            base64: e.target.result.split(',')[1]
        };
        imagePreview.src = e.target.result;
        imagePreviewContainer.classList.remove('hidden');
        messageInput.focus();
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    attachedImage = null;
    imagePreview.src = '#';
    imagePreviewContainer.classList.add('hidden');
    imageUploadInput.value = '';
}

// --- Feature: Voice Input ---
function setupSpeechRecognition() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!window.SpeechRecognition) {
        voiceInputBtn.disabled = true;
        voiceInputBtn.title = "Voice recognition not supported by your browser.";
        return;
    }
    recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.addEventListener('result', e => {
        const transcript = Array.from(e.results).map(result => result[0]).map(result => result.transcript).join('');
        messageInput.value = transcript;
        handleAutoResize();
    });
    recognition.addEventListener('end', () => {
        voiceInputBtn.classList.remove('is-listening');
    });
}

function toggleVoiceInput() {
    if (voiceInputBtn.classList.contains('is-listening')) {
        recognition.stop();
    } else {
        recognition.start();
        voiceInputBtn.classList.add('is-listening');
    }
}

// --- Feature: Ad Simulation ---
function showInterstitialAd() {
    adOverlay.classList.remove('hidden');
    setTimeout(() => {
        adOverlay.classList.add('hidden');
    }, 6000);
}

// --- Core Application Functions ---
function toggleMenu() {
    const isMobile = window.innerWidth <= 768;
    appLayout.classList.toggle('menu-open');
    if (isMobile) {
        menuOverlay.classList.toggle('hidden', !appLayout.classList.contains('menu-open'));
    }
}

function showWelcomeScreen() {
    chatWindow.innerHTML = `<div class="welcome-container"> <h2 style="font-size: 2.5rem;"></h2> <h2>Welcome to Pen AI</h2> <p>Your friendly academic assistant. How can I help you learn today?</p> <div id="quick-start-buttons"> <button class="quick-start-btn" data-prompt="Solve this and show the steps: 2x + 5 = 15">🧮 Solve a Math Problem</button> <button class="quick-start-btn" data-prompt="Correct this sentence and explain the grammar: 'He go to school yesterday.'">✍️ Practice English</button> <button class="quick-start-btn" data-prompt="Translate to Bangla: 'I love learning new things.'">🇧🇩 Get Bangla Help</button> </div> </div>`;
    document.querySelectorAll('.quick-start-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            messageInput.value = btn.dataset.prompt;
            messageInput.focus();
            handleAutoResize();
        });
    });
}

function startNewChat() {
    currentConversationId = null;
    conversationHistory = [systemInstruction];
    showWelcomeScreen();
    messageInput.value = '';
    messageInput.focus();
    removeImage();
    handleAutoResize();
    if (window.innerWidth <= 768 && appLayout.classList.contains('menu-open')) {
        toggleMenu();
    }
}

function addMessage(role, text, imageUrl = null) {
    if (chatWindow.querySelector('.welcome-container')) {
        chatWindow.innerHTML = '';
    }
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("message", `${role}-message`);
    const messageHeader = document.createElement("strong");
    messageHeader.textContent = role === "user" ? "You" : "Pen AI";
    messageContainer.appendChild(messageHeader);
    if (imageUrl) {
        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;
        imgElement.className = 'message-image-preview';
        messageContainer.appendChild(imgElement);
    }
    const messageContent = document.createElement("div");
    messageContent.classList.add("message-content");
    if (text) {
        messageContent.innerHTML = DOMPurify.sanitize(marked.parse(text));
    }
    messageContainer.appendChild(messageContent);
    if (role === 'assistant' && text) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.title = 'Copy text';
        copyBtn.innerHTML = ICONS.copy;
        copyBtn.addEventListener('click', () => copyMessageToClipboard(copyBtn, text));
        messageContainer.appendChild(copyBtn);
    }
    chatWindow.appendChild(messageContainer);
    scrollToBottom();
    return messageContent;
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const userMessageText = messageInput.value.trim();
    if (!userMessageText && !attachedImage) return;

    setFormState(true);
    const userParts = [];
    if (userMessageText) { userParts.push({ text: userMessageText }); }
    if (attachedImage) { userParts.push({ inline_data: { mime_type: attachedImage.mimeType, data: attachedImage.base64 } }); }

    addMessage("user", userMessageText, attachedImage ? imagePreview.src : null);
    conversationHistory.push({ role: "user", parts: userParts });

    messageInput.value = "";
    removeImage();
    handleAutoResize();
    
    abortController = new AbortController();
    try {
        const assistantMessageContent = showTypingIndicator();
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: conversationHistory }),
            signal: abortController.signal
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        assistantMessageContent.parentElement.remove();
        const assistantResponse = data.candidates[0].content.parts[0].text;
        conversationHistory.push({ role: "model", parts: [{ text: assistantResponse }] });
        
        const newAssistantMessage = addMessage("assistant", "");
        await typeWriter(newAssistantMessage, assistantResponse);
        saveCurrentConversation();

        messageCounterForAd++;
        if (messageCounterForAd >= AD_MESSAGE_INTERVAL) {
            showInterstitialAd();
            messageCounterForAd = 0;
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            addMessage("assistant", "Generation stopped.");
        } else {
            console.error("Error:", error);
            addMessage("assistant", `Sorry, an error occurred: ${error.message}`);
        }
    } finally {
        abortController = null;
        setFormState(false);
    }
}

function setFormState(isLoading) {
    messageInput.disabled = isLoading;
    sendButton.disabled = isLoading;
    imageUploadBtn.disabled = isLoading;
    voiceInputBtn.disabled = isLoading;
    if (isLoading) {
        stopGeneratingBtn.classList.remove('hidden');
        sendButton.innerHTML = `<div class="typing-indicator" style="padding:0; height: 24px;"><span></span><span></span><span></span></div>`;
    } else {
        stopGeneratingBtn.classList.add('hidden');
        sendButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>`;
    }
}

function showTypingIndicator() {
    if (chatWindow.querySelector('.welcome-container')) { chatWindow.innerHTML = ''; }
    const messageContent = addMessage('assistant', '');
    const indicator = document.createElement('div');
    indicator.classList.add('typing-indicator');
    indicator.innerHTML = '<span></span><span></span><span></span>';
    messageContent.appendChild(indicator);
    scrollToBottom();
    return messageContent;
}

function typeWriter(element, text) {
    return new Promise(resolve => {
        let i = 0;
        function type() {
            if (i < text.length && abortController) {
                element.innerHTML = DOMPurify.sanitize(marked.parse(text.substring(0, i + 1)));
                scrollToBottom();
                i++;
                setTimeout(type, 10);
            } else {
                element.innerHTML = DOMPurify.sanitize(marked.parse(text));
                scrollToBottom();
                resolve();
            }
        }
        type();
    });
}

function handleAutoResize() { messageInput.style.height = 'auto'; messageInput.style.height = `${messageInput.scrollHeight}px`; }
function handleTextareaKeydown(event) { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); chatForm.requestSubmit(); } }
function scrollToBottom() { chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' }); }
function handleScroll() { const isScrolledUp = chatWindow.scrollHeight - chatWindow.scrollTop > chatWindow.clientHeight + 100; scrollToBottomBtn.classList.toggle('visible', isScrolledUp); }

function copyMessageToClipboard(button, text) {
    navigator.clipboard.writeText(text).then(() => {
        button.innerHTML = ICONS.check; button.title = "Copied!";
        setTimeout(() => { button.innerHTML = ICONS.copy; button.title = "Copy text"; }, 2000);
    }).catch(err => { console.error('Failed to copy text: ', err); button.title = "Copy failed"; });
}

function toggleTheme() { document.body.classList.toggle('light-mode'); const newTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark'; localStorage.setItem(THEME_STORAGE_KEY, newTheme); updateThemeIcon(newTheme); }
function updateThemeIcon(theme) { themeToggleBtn.innerHTML = theme === 'light' ? ICONS.moon : ICONS.sun; }
function loadTheme() { const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark'; if (savedTheme === 'light') { document.body.classList.add('light-mode'); } updateThemeIcon(savedTheme); }

function loadConversation(id) {
    const conversation = allConversations[id]; if (!conversation) return;
    currentConversationId = id; conversationHistory = conversation.history; chatWindow.innerHTML = '';
    conversation.history.filter(msg => msg.parts[0].text !== systemInstruction.parts[0].text)
        .forEach(message => { addMessage(message.role === 'model' ? 'assistant' : 'user', message.parts[0].text); });
    if (window.innerWidth <= 768 && appLayout.classList.contains('menu-open')) { toggleMenu(); }
}

function saveCurrentConversation() {
    if (conversationHistory.length <= 1) return;
    if (!currentConversationId) { currentConversationId = `chat_${Date.now()}`; }
    const firstUserMessage = conversationHistory.find(m => m.role === 'user' && m.parts[0].text !== systemInstruction.parts[0].text);
    const title = firstUserMessage ? (firstUserMessage.parts.find(p => p.text) || {text: 'Image Query'}).text.substring(0, 30) + '...' : 'New Chat';
    allConversations[currentConversationId] = { id: currentConversationId, title: title, history: conversationHistory };
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allConversations));
    renderHistoryList();
}

function loadAllConversations() { const saved = localStorage.getItem(HISTORY_STORAGE_KEY); allConversations = saved ? JSON.parse(saved) : {}; renderHistoryList(); }

function renderHistoryList() {
    historyList.innerHTML = '';
    const sortedIds = Object.keys(allConversations).sort((a, b) => b.localeCompare(a));
    sortedIds.forEach(id => {
        const conversation = allConversations[id];
        const item = document.createElement('div'); item.className = 'history-item'; item.dataset.id = id;
        item.innerHTML = `<span class="history-item-title">${DOMPurify.sanitize(conversation.title)}</span><button class="delete-chat-btn" title="Delete chat"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg></button>`;
        item.querySelector('.history-item-title').addEventListener('click', () => loadConversation(id));
        item.querySelector('.delete-chat-btn').addEventListener('click', (e) => { e.stopPropagation(); deleteConversation(id); });
        historyList.appendChild(item);
    });
}

function deleteConversation(id) {
    if (confirm('Are you sure you want to delete this chat?')) {
        delete allConversations[id];
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allConversations));
        renderHistoryList();
        if (currentConversationId === id) { startNewChat(); }
    }
}

function main() {
    loadTheme();
    setupEventListeners();
    setupSpeechRecognition();
    const hasVisited = localStorage.getItem(VISITED_STORAGE_KEY);
    if (hasVisited) {
        landingPage.classList.add('hidden');
        appLayout.style.display = 'flex';
        runInitialAppLogic();
        isAppInitialized = true;
    } else {
        document.body.classList.add('landing-page-active');
    }
}

main();
