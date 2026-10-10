
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

const conversation = [];

// Menampilkan pesan ke dalam chat box

function appendMessage(sender, text) {
  const row = document.createElement('div');

  row.classList.add(
    'chat-message',
    sender === 'user' ? 'user-message' : 'bot-message'
  );

  // Label nama pengirim
  const label = document.createElement('div');
  label.className = 'message-label';
  label.textContent =
    sender === 'user' ? 'Kamu' : 'Gemini AI';

  // Isi pesan
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;

  row.appendChild(label);
  row.appendChild(bubble);

  // Hapus sambutan awal ketika pesan pertama dikirim
  const welcome = chatBox.querySelector('.welcome');
  if (welcome) {
    welcome.remove();
  }

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;

  return bubble;
}

// Proses mengirim pesan
form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userText = input.value.trim();

  if (!userText) return;

  // Tampilkan pesan pengguna
  appendMessage('user', userText);

  // Simpan pesan ke riwayat percakapan
  conversation.push({
    role: 'user',
    text: userText
  });

  input.value = '';

  // Tampilkan indikator proses
  const botMessage = appendMessage('bot', 'Sedang berpikir...');

  const submitButton = form.querySelector(
    'button[type="submit"]'
  );

  input.disabled = true;

  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversation: conversation
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || `HTTP Error: ${response.status}`
      );
    }

    if (
      data &&
      typeof data.result === 'string' &&
      data.result.trim() !== ''
    ) {
      botMessage.textContent = data.result;

      conversation.push({
        role: 'model',
        text: data.result
      });
    } else {
      botMessage.textContent =
        'Maaf, AI belum memberikan jawaban.';
    }

  } catch (error) {
    console.error('Chatbot error:', error);

    botMessage.textContent =
      'Gagal mendapatkan jawaban. Periksa server dan koneksi API.';

  } finally {
    input.disabled = false;

    if (submitButton) {
      submitButton.disabled = false;
    }

    input.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});