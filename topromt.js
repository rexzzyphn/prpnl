const axios = require('axios');
const fs = require('fs');

const escapeMarkdown = (text) => {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
};

const topromt = async (path) => {
  try {
    const response = await axios.post(
      'https://imageprompt.org/api/ai/prompts/image',
      {
        base64Url: fs.readFileSync(path).toString('base64'),
        imageModelId: 0,
        language: 'id'
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (e) {
    throw e.response?.data || e.message;
  }
};

// Ubah menjadi bot.onText
module.exports = (bot) => {
  bot.onText(/\/toprompt/, async (msg) => {
    const chatId = msg.chat.id;
    const q = msg.reply_to_message;

    if (!q || !q.photo) {
      return bot.sendMessage(chatId, '❌ Reply ke gambar dulu dong!');
    }

    // ⬇⬇ Tambahan teks PROSES
    const waitMsg = await bot.sendMessage(
      chatId,
      '🔄 Proses...\n⏳ Sedang memproses gambar, tunggu sebentar...'
    );

    try {
      const fileId = q.photo[q.photo.length - 1].file_id;
      const file = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const media = Buffer.from(response.data);

      const temp = `./tmp_img_${Date.now()}.jpg`;
      fs.writeFileSync(temp, media);

      const data = await topromt(temp);
      const promptText = data?.prompt ? data.prompt.trim() : 'Gagal mendapatkan prompt';

      const escapedPrompt = escapeMarkdown(promptText);

      await bot.sendMessage(
        chatId,
        `✅ Prompt berhasil dibuat:\n\n\`${escapedPrompt}\``,
        { parse_mode: 'MarkdownV2' }
      );

      fs.unlinkSync(temp);

    } catch (e) {
      await bot.sendMessage(chatId, `❌ Terjadi error:\n${e.message || e}`);
    }
  });
};