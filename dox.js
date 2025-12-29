const fetch = require("node-fetch");

module.exports = (bot) => {
  bot.onText(/^\/doxnik(?:\s+(.+))?$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const nik = match[1]?.trim();

    if (!nik) {
      return bot.sendMessage(chatId, 'ℹ️ Cara penggunaan:\n/doxnik <nomor_nik>');
    }

    let processingMsg;
    try {
      processingMsg = await bot.sendMessage(chatId, '🔄 Memeriksa NIK...');

      const result = await checkNIK(nik);

      if (!result.status || !result.data || !result.data.data) {
        return bot.sendMessage(chatId, '❌ NIK tidak ditemukan atau data tidak tersedia.');
      }

      const data = result.data.data;
      const metadata = result.data.metadata;

      const safe = (value) => value ? value : '-';

      let response = `🆔 *HASIL DOXXING NIK*\n\n`;
      response += `*NIK:* \`${safe(result.data.nik || nik)}\`\n`;
      response += `*Status:* ✅ ${safe(result.data.status)}\n\n`;

      response += `*📝 DATA PRIBADI*\n`;
      response += `• Nama: ${safe(data.nama)}\n`;
      response += `• Jenis Kelamin: ${safe(data.kelamin)}\n`;
      response += `• Tempat/Tgl Lahir: ${safe(data.tempat_lahir)}\n`;
      response += `• Usia: ${safe(data.usia)}\n`;
      response += `• Zodiak: ${safe(data.zodiak)}\n`;
      response += `• Pasaran: ${safe(data.pasaran)}\n`;
      response += `• Ultah Mendatang: ${safe(data.ultah_mendatang)}\n\n`;

      response += `*🏠 DATA ALAMAT*\n`;
      response += `• Provinsi: ${safe(data.provinsi)}\n`;
      response += `• Kabupaten: ${safe(data.kabupaten)}\n`;
      response += `• Kecamatan: ${safe(data.kecamatan)}\n`;
      response += `• Kelurahan: ${safe(data.kelurahan)}\n`;
      response += `• TPS: ${safe(data.tps)}\n`;
      response += `• Alamat: ${safe(data.alamat)}\n\n`;

      if (data.koordinat) {
        response += `*📍 KOORDINAT*\n`;
        response += `• Latitude: ${safe(data.koordinat.lat)}\n`;
        response += `• Longitude: ${safe(data.koordinat.lon)}\n\n`;
      }

      response += `*📊 INFORMASI TAMBAHAN*\n`;
      response += `• Metode Pencarian: ${safe(metadata.metode_pencarian)}\n`;
      response += `• Kode Wilayah: ${safe(metadata.kode_wilayah)}\n`;
      response += `• Nomor Urut: ${safe(metadata.nomor_urut)}\n`;
      response += `• Kategori Usia: ${safe(metadata.kategori_usia)}\n`;
      response += `• Jenis Wilayah: ${safe(metadata.jenis_wilayah)}\n`;
      response += `• Jumlah LHP: ${safe(data.jumlah_lhp)}\n\n`;
      response += `_Data diperbarui: ${new Date(result.timestamp || Date.now()).toLocaleString('id-ID')}_`;

      await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });

      if (processingMsg) await bot.deleteMessage(chatId, processingMsg.message_id);

    } catch (err) {
      console.error('Error in NIK check:', err);
      try { if (processingMsg) await bot.deleteMessage(chatId, processingMsg.message_id); } catch {}
      await bot.sendMessage(chatId, '❌ Gagal memeriksa NIK. Silakan coba lagi beberapa saat.');
    }
  });
};

async function checkNIK(nik) {
  const url = `https://piereeapi.vercel.app/search/nik?q=${nik}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}