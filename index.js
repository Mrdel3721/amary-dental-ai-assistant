
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const GEMINI_MODEL = 'gemini-3.8-flash';

// Instruksi khusus untuk Amary Dental AI Assistant
const SYSTEM_INSTRUCTION = `
Kamu adalah Amary Dental AI Assistant,
asisten virtual untuk klinik gigi Amary.

TUGAS UTAMA:
1. Menjawab pertanyaan umum tentang kesehatan gigi.
2. Menjelaskan layanan klinik berdasarkan informasi resmi
   yang tersedia.
3. Membantu pasien memahami persiapan perawatan gigi.
4. Membantu pasien menyiapkan permintaan janji konsultasi.
5. Menggunakan bahasa Indonesia yang ramah, sopan,
   sederhana, dan mudah dipahami.

GAYA KOMUNIKASI:
- Bersikap ramah, profesional, dan empatik.
- Berikan jawaban yang jelas dan tidak bertele-tele.
- Gunakan daftar jika membantu memperjelas penjelasan.
- Panggil pengguna dengan sebutan "Kak" jika sesuai.

BATASAN:
- Jangan mengarang harga, alamat, jam operasional,
  nomor telepon, atau layanan klinik.
- Jika informasi klinik belum tersedia, sarankan pengguna
  menghubungi admin Amary Dental.
- Jangan memberikan diagnosis medis yang pasti.
- Jangan meresepkan obat atau menentukan dosis.
- Berikan informasi kesehatan gigi yang bersifat umum.
- Sarankan pemeriksaan dokter gigi untuk keluhan yang
  membutuhkan evaluasi langsung.
- Jika pasien mengalami kesulitan bernapas atau menelan,
  arahkan untuk segera mendapatkan pertolongan medis.
- Jangan mengklaim reservasi telah dibuat tanpa konfirmasi
  dari admin atau sistem reservasi.

IDENTITAS:
Jika ditanya siapa kamu, jelaskan bahwa kamu adalah
Amary Dental AI Assistant, asisten virtual yang membantu
memberikan informasi umum seputar kesehatan gigi
dan layanan klinik Amary.
`;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  try {
    const { conversation } = req.body || {};

    if (
      !Array.isArray(conversation) ||
      conversation.length === 0
    ) {
      return res.status(400).json({
        error: 'Conversation harus berupa array dan tidak boleh kosong.'
      });
    }

    const contents = conversation.map(({ role, text }) => {
      if (
        !['user', 'model'].includes(role) ||
        typeof text !== 'string' ||
        !text.trim()
      ) {
        throw new Error('Format pesan tidak valid.');
      }

      return {
        role,
        parts: [{ text }]
      };
    });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 800
      }
    });

    const result = response.text;

    if (!result || !result.trim()) {
      throw new Error('Gemini tidak memberikan jawaban.');
    }

    res.status(200).json({
      result
    });

  } catch (error) {
    console.error('Gemini API error:', error);

    res.status(500).json({
      error: error.message || 'Terjadi kesalahan pada server.'
    });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server ready on http://localhost:${PORT}`);
});