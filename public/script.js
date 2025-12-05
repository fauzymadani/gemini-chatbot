const API_URL = 'http://localhost:3000/api/chat';

const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatMessages = document.getElementById('chatMessages');
const sendBtn = document.querySelector('.send-btn');

let conversation = [];
let isLoading = false;

// Clear welcome message on first message
function clearWelcome() {
    const welcome = document.querySelector('.message-welcome');
    if (welcome) {
        welcome.remove();
    }
}

// Add message to chat UI
function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'You' : 'AI';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';

    // Render markdown for bot messages, plain text for user
    if (role === 'bot') {
        textDiv.innerHTML = renderMarkdown(content);
        textDiv.classList.add('markdown-content');
    } else {
        textDiv.textContent = content;
    }

    contentDiv.appendChild(textDiv);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Add loading indicator
function addLoadingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.id = 'loadingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'AI';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerHTML = `
        <span>AI is thinking</span>
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
    `;

    contentDiv.appendChild(loadingDiv);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Remove loading indicator
function removeLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Configure marked for security and styling
marked.setOptions({
    breaks: true,
    gfm: true,
});

// Sanitize and render markdown content
function renderMarkdown(text) {
    // Use marked to convert markdown to HTML
    const html = marked.parse(text);

    // Create a temporary container to sanitize
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove dangerous elements
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    return temp.innerHTML;
}

// Scroll to bottom of chat
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message to API
async function sendMessage(userMessage) {
    if (isLoading) return;

    // Clear welcome message
    clearWelcome();

    // Add user message to UI
    addMessage('user', userMessage);

    // Add user message to conversation
    conversation.push({
        role: 'user',
        contents: userMessage
    });

    // Show loading indicator
    isLoading = true;
    addLoadingIndicator();
    sendBtn.disabled = true;
    userInput.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversation
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const botResponse = data.result;

        // Remove loading indicator
        removeLoadingIndicator();

        // Add bot message to UI
        addMessage('bot', botResponse);

        // Add bot message to conversation
        conversation.push({
            role: 'model',
            contents: botResponse
        });
    } catch (error) {
        removeLoadingIndicator();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = `Error: ${error.message}`;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.appendChild(errorDiv);
        messageDiv.appendChild(contentDiv);

        chatMessages.appendChild(messageDiv);
        scrollToBottom();

        console.error('Error:', error);
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

// Handle form submission
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const message = userInput.value.trim();

    if (!message) return;

    sendMessage(message);
    userInput.value = '';
});

// Focus on input when page loads
userInput.focus();

