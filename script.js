//
// ⚠️ DANGER ⚠️ - THIS IS FOR LOCAL DEVELOPMENT ONLY.
//
console.warn("DANGER: API Key is exposed in this client-side code. For development only.");

// --- Your API Key Here ---
const API_KEY = "AIzaSyB_dOIjvqaZmXh9bQqAf7UWYvyghHUMSeg"; // <-- PASTE YOUR NEW KEY HERE
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
const HISTORY_STORAGE_KEY = 'pen-ai-academic-history';

// --- AI Persona (System Prompt) ---
const systemInstruction = {
    role: 'user', // We send this as a 'user' message to instruct the 'model'
    parts: [{
        text: `You are 'Pen AI', a friendly and encouraging academic assistant designed to help students. Your primary goal is to help students learn, not just give them the final answer.
        - For math problems, you must always show the step-by-step solution and explain the core concepts and formulas used.
        - For English questions, act as a language tutor. Correct grammar, explain vocabulary, suggest improvements for writing, and be encouraging.
        - For Bangla questions, assist with translation, grammar, and understanding the language. When appropriate, use both Bangla script and romanized 'Banglish' to help the student learn.
        - Always be patient and break down complex topics into simple, easy-to-understand parts. Your tone should be supportive and educational.`
    }]
};

// --- DOM Element References ---
const appLayout = document.getElementById('app-layout');
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const historyList = document.getElementById('history-list');
const newChatBtn = document.getElementById('new-chat-btn');
const chatWindow = document.getElementById("chat-window");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const menuOverlay = document.getElementById('menu-overlay');
const mathBtn = document.getElementById('math-btn');
const engBtn = document.getElementById('eng-btn');
const banglaBtn = document.getElementById('bangla-btn');

// --- Application State ---
let conversationHistory = [];
let allConversations = {};
let currentConversationId = null;

//
// *** FIX: Replaced all minified code with the full, readable functions below. ***
//

// --- Main Functions ---

/** Toggles the visibility of the history menu, handling mobile overlay */
function toggleMenu() {
    const isMobile = window.innerWidth <= 768;
    if (appLayout.classList.contains('menu-open')) {
        appLayout.classList.remove('menu-open');
        if (isMobile) menuOverlay.classList.add('hidden');
    } else {
        appLayout.classList.add('menu-open');
        if (isMobile) menuOverlay.classList.remove('hidden');
    }
}

/** Starts a new chat session with the academic persona */
function startNewChat() {
    currentConversationId = null;
    // CRITICAL: Every new chat starts with the system instruction
    conversationHistory = [systemInstruction];
    chatWindow.innerHTML = '';
    addMessage("assistant", "Welcome! I'm Pen AI, your academic assistant. Try a quick start button or ask me anything about Math, English, or Bangla!");
    messageInput.focus();
    if (window.innerWidth <= 768 && appLayout.classList.contains('menu-open')) {
        toggleMenu();
    }
}

/** Pre-fills the input for a specific subject */
function setSubjectPrompt(subject) {
    const prompts = {
        math: "Solve this and show the steps: 2x + 5 = 15",
        english: "Correct this sentence and explain the grammar: 'He go to school yesterday.'",
        bangla: "Translate to Bangla: 'I love learning new things.'"
    };
    messageInput.value = prompts[subject] || '';
    messageInput.focus();
}

/** Adds a message to the chat UI, but hides the system prompt */
function addMessage(role, text) {
    // Don't show the system instruction in the chat window
    if (text === systemInstruction.parts[0].text) return;

    const messageContainer = document.createElement("div");
    messageContainer.classList.add("message", `${role}-message`);
    const messageHeader = document.createElement("strong");
    messageHeader.textContent = role === "user" ? "You" : "Pen AI";
    const messageContent = document.createElement("div");
    messageContent.classList.add("message-content");
    if (text) {
        messageContent.innerHTML = DOMPurify.sanitize(marked.parse(text));
    }
    
    messageContainer.appendChild(messageHeader);
    messageContainer.appendChild(messageContent);
    chatWindow.appendChild(messageContainer);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return messageContent;
}

/** Shows a typing indicator in an empty assistant message */
function showTypingIndicator() {
    const messageContent = addMessage('assistant', '');
    const indicator = document.createElement('div');
    indicator.classList.add('typing-indicator');
    indicator.innerHTML = '<span></span><span></span><span></span>';
    messageContent.appendChild(indicator);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return messageContent;
}

/** Handles the chat form submission */
async function handleFormSubmit(event) {
    event.preventDefault();
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    setFormState(true);
    addMessage("user", userMessage);
    conversationHistory.push({ role: "user", parts: [{ text: userMessage }] });
    messageInput.value = "";
    
    try {
        const assistantMessageContent = showTypingIndicator();
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: conversationHistory }),
        });

        if (!response.ok) throw new Error((await response.json()).error.message);

        const data = await response.json();
        assistantMessageContent.innerHTML = ''; // Remove typing indicator
        const assistantResponse = data.candidates[0].content.parts[0].text;
        conversationHistory.push({ role: "model", parts: [{ text: assistantResponse }] });
        
        await typeWriter(assistantMessageContent, assistantResponse);
        saveCurrentConversation();

    } catch (error) {
        console.error("Error:", error);
        addMessage("assistant", `Sorry, an error occurred: ${error.message}`);
    } finally {
        setFormState(false);
    }
}

/** Creates a typewriter effect for displaying text */
function typeWriter(element, text) {
    return new Promise(resolve => {
        let i = 0, currentText = '';
        function type() {
            if (i < text.length) {
                currentText += text.charAt(i);
                element.innerHTML = DOMPurify.sanitize(marked.parse(currentText));
                chatWindow.scrollTop = chatWindow.scrollHeight;
                i++;
                setTimeout(type, 15);
            } else {
                resolve();
            }
        }
        type();
    });
}

/** Enables or disables the chat form */
function setFormState(isLoading) {
    messageInput.disabled = isLoading;
    sendButton.disabled = isLoading;
    sendButton.innerHTML = isLoading 
        ? '<div class="typing-indicator" style="padding:0; height: 24px;"><span></span><span></span><span></span></div>'
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>`;
}

// --- History Management Functions ---

/** Loads a specific conversation into the chat window */
function loadConversation(id) {
    const conversation = allConversations[id];
    if (!conversation) return;

    currentConversationId = id;
    conversationHistory = conversation.history;
    chatWindow.innerHTML = '';
    
    // *** FIX: Explicitly filter out the system instruction when loading a chat. ***
    conversation.history.forEach(message => {
        if (message.parts[0].text !== systemInstruction.parts[0].text) {
             addMessage(message.role === 'model' ? 'assistant' : 'user', message.parts[0].text);
        }
    });

    if (window.innerWidth <= 768 && appLayout.classList.contains('menu-open')) {
        toggleMenu();
    }
}

/** Saves the current conversation to localStorage */
function saveCurrentConversation() {
    // Don't save if it's just the initial system prompt
    if (conversationHistory.length <= 1) return;

    if (!currentConversationId) {
        currentConversationId = `chat_${Date.now()}`;
    }
    
    // *** FIX: Ensure the title isn't generated from the system prompt. ***
    const firstUserMessage = conversationHistory.find(m => m.role === 'user' && m.parts[0].text !== systemInstruction.parts[0].text);
    const title = firstUserMessage ? firstUserMessage.parts[0].text.substring(0, 40) + '...' : 'New Chat';

    allConversations[currentConversationId] = {
        id: currentConversationId,
        title: title,
        history: conversationHistory
    };
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allConversations));
    renderHistoryList();
}

/** Loads all conversations from localStorage */
function loadAllConversations() {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    allConversations = saved ? JSON.parse(saved) : {};
    renderHistoryList();
}

/** Renders the list of saved chats in the history menu */
function renderHistoryList() {
    historyList.innerHTML = '';
    const sortedIds = Object.keys(allConversations).sort((a, b) => b.localeCompare(a));
    
    for (const id of sortedIds) {
        const conversation = allConversations[id];
        const item = document.createElement('div');
        item.classList.add('history-item');
        item.dataset.id = id;
        item.innerHTML = `
            <span class="history-item-title">${DOMPurify.sanitize(conversation.title)}</span>
            <button class="delete-chat-btn" title="Delete chat">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.046a.75.75 0 01.701.043l2.258 1.13A2.25 2.25 0 0010 8.25h.008a2.25 2.25 0 001.992-1.418l2.258-1.13a.75.75 0 01.701-.043l.149.046a.75.75 0 10.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 10a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 10zM8.75 15.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z" clip-rule="evenodd" /></svg>
            </button>
        `;
        item.querySelector('.history-item-title').addEventListener('click', () => loadConversation(id));
        item.querySelector('.delete-chat-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteConversation(id);
        });
        historyList.appendChild(item);
    }
}

/** Deletes a conversation from history */
function deleteConversation(id) {
    if (confirm('Are you sure you want to delete this chat?')) {
        delete allConversations[id];
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allConversations));
        renderHistoryList();
        if (currentConversationId === id) {
            startNewChat();
        }
    }
}

// --- Initial Setup ---
function initialize() {
    // Event listeners for subject buttons
    mathBtn.addEventListener('click', () => setSubjectPrompt('math'));
    engBtn.addEventListener('click', () => setSubjectPrompt('english'));
    banglaBtn.addEventListener('click', () => setSubjectPrompt('bangla'));

    // Other listeners
    menuToggleBtn.addEventListener('click', toggleMenu);
    newChatBtn.addEventListener('click', startNewChat);
    chatForm.addEventListener("submit", handleFormSubmit);
    menuOverlay.addEventListener('click', toggleMenu);

    if (window.innerWidth > 768) appLayout.classList.add('menu-open');
    
    loadAllConversations();
    startNewChat();
}

// Run the app
initialize();