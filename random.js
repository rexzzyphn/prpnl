const fs = require('fs-extra');
const Plfs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const axios = require('axios');
const FormData = require('form-data');
const settings = require('../settings.js');

const OWNER_ID = settings.ownerId;

module.exports = (bot) => {

bot.onText(/\/tts(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[1];

    if (text?.toLowerCase() === 'ttstalk') return;

    if (!text) {
        return bot.sendMessage(chatId, "Usage: /tts teksnya");
    }

    if (text.length > 200) {
        return bot.sendMessage(chatId, '❌ Teks terlalu panjang (maks 200 karakter)');
    }

    try {
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=id&client=tw-ob`;

        await bot.sendVoice(chatId, ttsUrl, {
            reply_to_message_id: msg.message_id
        });
    } catch (error) {
        bot.sendMessage(chatId, '❌ Error: Gagal membuat audio TTS');
    }
});


// WEB2APK
bot.onText(/\/web2apk(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const url = match[1];

    if (!url) {
        return bot.sendMessage(chatId, "Usage: /web2apk https://website.com");
    }

    try {
        bot.sendMessage(chatId, "🔄 Creating APK from website... Please wait 2-3 minutes.");
        
        const response = await axios.post('https://api.web2apk.com/generate', {
            url: url,
            appName: `App_${Date.now()}`,
            packageName: `com.webapp.${Date.now()}`,
            version: "1.0",
            versionCode: 1,
            icon: "https://cdn-icons-png.flaticon.com/512/1006/1006771.png",
            splashScreen: "https://via.placeholder.com/1080x1920/3B82F6/FFFFFF?text=Loading..."
        });

        const { data } = response;

        if (data.success && data.apkUrl) {
            const apkResponse = await axios.get(data.apkUrl, { responseType: 'stream' });
            const apkPath = `./apk_${Date.now()}.apk`;

            const writer = fs.createWriteStream(apkPath);
            apkResponse.data.pipe(writer);

            writer.on('finish', async () => {
                await bot.sendDocument(chatId, apkPath, {
                    caption: `📱 APK Generated!\n🌐 Website: ${url}\n📦 Size: ${(fs.statSync(apkPath).size / 1024 / 1024).toFixed(2)} MB`
                });
                fs.unlinkSync(apkPath);
            });
        }
    } catch (error) {
        bot.sendMessage(chatId, "❌ Failed to generate APK");
    }
});


// LYRICS
bot.onText(/\/lyrics(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match[1];

    if (!query) {
        return bot.sendMessage(chatId, `❗ *Usage:* /lyrics artist - title`, {
            parse_mode: "Markdown"
        });
    }

    try {
        const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(query)}`);
        const lyrics = response.data.lyrics;

        if (!lyrics) {
            return bot.sendMessage(chatId, "❌ Lirik tidak ditemukan");
        }

        if (lyrics.length > 3000) {
            const parts = lyrics.match(/[\s\S]{1,3000}/g);

            bot.sendMessage(chatId, `
🎵 *LYRICS - ${query.toUpperCase()}*

${parts[0]}
...
(1/${parts.length})
            `.trim(), {
                parse_mode: 'Markdown'
            });

            for (let i = 1; i < parts.length; i++) {
                setTimeout(() => {
                    bot.sendMessage(chatId, parts[i], {
                        parse_mode: 'Markdown'
                    });
                }, i * 800);
            }

        } else {
            bot.sendMessage(chatId, `
🎵 *LYRICS - ${query.toUpperCase()}*

${lyrics}

🔍 /lyrics artist - title
            `.trim(), {
                parse_mode: 'Markdown'
            });
        }

    } catch (error) {
        bot.sendMessage(chatId, "❌ Lirik tidak ditemukan");
    }
});

const downloadYoutube = async (url) => {
  const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(url)}`;
  const { data } = await axios.get(apiUrl, { timeout: 30000 });
  if (!data.success) throw new Error("Download gagal");
  return data.data;
};

bot.onText(/^\/play(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const argsRaw = match[1];

  try {
    if (!argsRaw) return bot.sendMessage(chatId, "❌ Format salah.\n\nContoh: /play judul atau url");

    const query = argsRaw.trim();
    let ytUrl = query;

    if (!/https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i.test(query)) {
      const results = await axios.get(
        `https://api.yupra.my.id/api/search/youtube?q=${encodeURIComponent(query)}`,
        { timeout: 20000 }
      );
      if (!results.data.results.length) throw new Error("Video tidak ditemukan");
      ytUrl = results.data.results[0].url;
    }

    await bot.sendChatAction(chatId, "record_audio");
    const info = await downloadYoutube(ytUrl);

    const stream = await axios.get(info.download_url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(stream.data);

    await bot.sendAudio(chatId, buffer, {
      filename: info.title + ".mp3",
      mimetype: "audio/mpeg",
      caption: `🎵 ${info.title}`,
      reply_markup: {
        inline_keyboard: [
          [{ text: "YT Link", url: ytUrl }]
        ]
      }
    });
  } catch (e) {
    console.error("[PLAY ERROR]", e);
    bot.sendMessage(chatId, "❌ Gagal download");
  }
});
bot.onText(/\/spamngl(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userId !== OWNER_ID) {
    return bot.sendMessage(chatId, "❌ Command ini hanya bisa digunakan oleh owner.");
  }

  if (!match[1]) {
    return bot.sendMessage(chatId, "⚙️ Cara pakai:\nBalas pesan tanpa spasi → /spamngl <username/link> | <jumlah>");
  }

  const replied = msg.reply_to_message;
  const input = match[1].split("|").map(v => v.trim());

  if (!replied || !replied.text) {
    return bot.sendMessage(chatId, "⚠️ Balas pesan yang isinya **tanpa spasi**!\nContoh:\n(reply) /spamngl username | 5");
  }

  const pesan = replied.text.trim();
  if (pesan.includes(" ")) {
    return bot.sendMessage(chatId, "❌ Pesan tidak boleh mengandung spasi!");
  }

  const target = input[0];
  const jumlah = parseInt(input[1]) || 10;

  if (!target) {
    return bot.sendMessage(chatId, "⚠️ Format salah!\n/spamngl <username/link> | <jumlah>");
  }

  if (jumlah > 30) {
    return bot.sendMessage(chatId, "❌ Jumlah maksimal 30!");
  }

  let username = target.replace("https://ngl.link/", "").trim();

  const prosesMsg = await bot.sendMessage(chatId, "⏳ Proses spam NGL...");

  let sukses = 0;
  let gagal = 0;

  for (let i = 1; i <= jumlah; i++) {
    try {
      const url = `https://piereeapi.vercel.app/tools/ngl?user=${encodeURIComponent(username)}&msg=${encodeURIComponent(pesan)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === true) sukses++;
      else gagal++;
    } catch {
      gagal++;
    }

    await new Promise(resolve => setTimeout(resolve, 700));
  }

  const report = `
<blockquote>✅ <b>Sukses spam NGL</b>!</blockquote>
✔ Berhasil : ${sukses}
✘ Gagal : ${gagal}
  `;

  await bot.editMessageText(report, {
    chat_id: chatId,
    message_id: prosesMsg.message_id,
    parse_mode: "HTML"
  });
});

const pendingMessages = {};

bot.onText(/\/sendgmail(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const email = match[1];

    if (!email) {
        return bot.sendMessage(chatId, '❌ Cara penggunaan: /sendgmail target@gmail.com');
    }

    if (!email.endsWith('@gmail.com')) {
        return bot.sendMessage(chatId, '❌ Hanya email @gmail.com yang diperbolehkan. Contoh: /sendgmail example@gmail.com');
    }

    pendingMessages[chatId] = { email };
    const promptMsg = await bot.sendMessage(chatId, '📝 Masukkan SUBJECT email:');
    pendingMessages[chatId].promptMsgId = promptMsg.message_id;
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;

    if (!pendingMessages[chatId]) return;

    const state = pendingMessages[chatId];

    try {
        if (state.promptMsgId) {
            await bot.deleteMessage(chatId, state.promptMsgId).catch(() => {});
        }
    } catch {}

    if (!state.subject) {
        state.subject = msg.text;
        const promptMsg = await bot.sendMessage(chatId, '✉️ Masukkan PESAN yang ingin dikirim:');
        state.promptMsgId = promptMsg.message_id;
        return;
    }

    if (!state.message) {
        state.message = msg.text;
        const promptMsg = await bot.sendMessage(chatId, '🔢 Masukkan JUMLAH pengiriman:');
        state.promptMsgId = promptMsg.message_id;
        return;
    }

    if (!state.count) {
        const count = parseInt(msg.text);
        if (isNaN(count) || count <= 0) {
            const promptMsg = await bot.sendMessage(chatId, '❌ Masukkan angka yang valid.');
            state.promptMsgId = promptMsg.message_id;
            return;
        }

        state.count = count;

        if (state.promptMsgId) {
            await bot.deleteMessage(chatId, state.promptMsgId).catch(() => {});
        }

        bot.sendMessage(chatId, `⏳ Mengirim ${state.count} email ke ${state.email}...`);

        let success = 0;
        let failed = 0;

        for (let i = 0; i < state.count; i++) {
            try {
                await axios.get('https://api.fikmydomainsz.xyz/tools/sendmail/send', {
                    params: {
                        to: state.email,
                        subject: state.subject,
                        message: state.message
                    }
                });
                success++;
            } catch {
                failed++;
            }
        }

        const report = `
\`\`\`
✅ Selesai mengirim pesan!
Target : ${state.email}
Subject : ${state.subject}
Pesan : ${state.message}
Jumlah : ${state.count}

Informasi:
✅ Berhasil : ${success}
❌ Gagal : ${failed}
\`\`\`
        `;
        bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
        delete pendingMessages[chatId];
    }
});
bot.onText(/\/infogempa/, async (msg) => {
  const chatId = msg.chat.id;
  const sentMsg = await bot.sendMessage(chatId, '⏳ Mengambil informasi gempa terbaru...');

  try {
    const res = await axios.get('https://piereeapi.vercel.app/search/gempa');
    const data = res.data;

    if (!data || !data.status || !data.data) {
      return bot.editMessageText('❌ Tidak ada informasi gempa terbaru.', {
        chat_id: chatId,
        message_id: sentMsg.message_id
      });
    }

    const g = data.data;
    const replyText = 
`🌐 *Info Gempa Terkini*
*Tanggal:* ${g.tanggal || "-"}
*Jam:* ${g.jam || "-"}
*Magnitude:* ${g.magnitude || "-"}
*Kedalaman:* ${g.kedalaman || "-"}
*Wilayah:* ${g.wilayah || "-"}
*Potensi:* ${g.potensi || "-"}
*Koordinat:* ${g.koordinat || "-"}
*Lintang:* ${g.lintang || "-"}
*Bujur:* ${g.bujur || "-"}`;

    await bot.sendPhoto(chatId, g.shakemap || g.map || g.image, {
      caption: replyText,
      parse_mode: 'Markdown'
    });

    await bot.deleteMessage(chatId, sentMsg.message_id);

  } catch (err) {
    bot.editMessageText('❌ Terjadi kesalahan saat mengambil data gempa.', {
      chat_id: chatId,
      message_id: sentMsg.message_id
    });
  }
});

bot.onText(/\/ytsearch(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1]?.trim();

  if (!query) {
    return bot.sendMessage(chatId, '❌ Contoh penggunaan: /ytsearch lucu');
  }

  const sentMsg = await bot.sendMessage(chatId, '🔍 Mencari video YouTube...');

  try {
    const res = await axios.get(`https://piereeapi.vercel.app/search/youtube?q=${encodeURIComponent(query)}&type=video`);
    const data = res.data;

    if (!data || !data.status || !data.data || !data.data.length) {
      return bot.editMessageText('❌ Video tidak ditemukan.', {
        chat_id: chatId,
        message_id: sentMsg.message_id
      });
    }

    const video = data.data[0];
    const caption = 
`🎬 *${video.title}*
📺 Channel: [${video.channel?.name || "-"}](${video.channel?.url || video.url})
⏱ Durasi: ${video.duration || "-"}
👁 Views: ${video.viewCount || "-"}
🗓 Tayang: ${video.publishedTime || "-"}
🔗 [Tonton di YouTube](${video.url})`;

    await bot.sendPhoto(chatId, video.thumbnail || video.thumbnails?.[0], {
      caption,
      parse_mode: 'Markdown'
    });

    await bot.deleteMessage(chatId, sentMsg.message_id);

  } catch (err) {
    bot.editMessageText('❌ Terjadi kesalahan saat mencari video.', {
      chat_id: chatId,
      message_id: sentMsg.message_id
    });
  }
});
bot.onText(/\/ttsearch (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];

  if (!query) return bot.sendMessage(chatId, '❌ Contoh penggunaan:\n/ttsearch lucu');

  const loadingMsg = await bot.sendMessage(chatId, '⏳ Mencari video TikTok...');

  try {
    const res = await fetch(`https://piereeapi.vercel.app/search/tiktok?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!data.status || !data.result || data.result.length === 0) {
      return bot.editMessageText('❌ Video tidak ditemukan.', { chat_id: chatId, message_id: loadingMsg.message_id });
    }

    // Ambil video pertama
    const video = data.result[0];

    let caption = `🎬 *${video.title}*\n👤 ${video.author.nickname}\n📦 Durasi: ${video.duration}s\n💾 Download: ${video.download_count}\n🔗 [Link Video](${video.play})`;
    
    // Kirim Video
    await bot.sendVideo(chatId, video.play, { caption, parse_mode: 'Markdown' });

    // Kirim Audio
    await bot.sendAudio(chatId, video.music, { 
      caption: `🎵 Musik: ${video.music_info.title}\n👤 ${video.music_info.author}`, 
      parse_mode: 'Markdown' 
    });

    await bot.editMessageText('✅ Selesai mengirim video dan audio!', { chat_id: chatId, message_id: loadingMsg.message_id });
    
  } catch (err) {
    console.error(err);
    await bot.editMessageText('❌ Terjadi kesalahan saat mengambil data.', { chat_id: chatId, message_id: loadingMsg.message_id });
  }
});
bot.onText(/\/spotifysearch (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];
  if (!query) return bot.sendMessage(chatId, '❌ Contoh: /spotifysearch Graze The Roof');

  const wait = await bot.sendMessage(chatId, '🔍 Mencari lagu di Spotify...');

  try {
    const res = await fetch(`https://piereeapi.vercel.app/search/spotify?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!data.status || !data.results || data.results.length === 0) {
      return bot.editMessageText('❌ Tidak ditemukan hasil untuk pencarian tersebut.', { chat_id: chatId, message_id: wait.message_id });
    }

    const first = data.results[0];

    const caption = `🎵 *${first.title}*\n👤 Artist: ${first.artist}\n💽 Album: ${first.album}\n📅 Rilis: ${first.release_date}\n⏱️ Durasi: ${first.duration}\n🔗 [Dengarkan di Spotify](${first.url})`;

    await bot.editMessageText('✅ Ditemukan! Mengirim preview audio...', { chat_id: chatId, message_id: wait.message_id });

    await bot.sendPhoto(chatId, first.thumbnail, { caption, parse_mode: 'Markdown', disable_web_page_preview: false });

    // Coba kirim preview audio jika tersedia di API (optional)
    if (first.preview_url) {
      await bot.sendAudio(chatId, first.preview_url, { title: first.title, performer: first.artist });
    } else {
      await bot.sendMessage(chatId, '⚠️ Tidak ada preview audio untuk lagu ini.');
    }

  } catch (err) {
    console.error(err);
    bot.editMessageText('❌ Terjadi kesalahan saat mencari lagu.', { chat_id: chatId, message_id: wait.message_id });
  }
});
bot.onText(/\/tvsearch(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const channelName = match[1]?.trim();

  if (!channelName) {
    return bot.sendMessage(chatId, '❌ Contoh penggunaan: /tvsearch trans7');
  }

  // Kirim pesan proses
  const sentMsg = await bot.sendMessage(chatId, '🔄 Proses mengambil jadwal...');

  try {
    const res = await axios.get(`https://piereeapi.vercel.app/search/jadwaltv?channel=${encodeURIComponent(channelName)}`);
    const data = res.data;

    if (!data.status) {
      return bot.editMessageText(`❌ Jadwal TV untuk channel "${channelName}" tidak ditemukan.`, {
        chat_id: chatId,
        message_id: sentMsg.message_id
      });
    }

    const replyText = `Channel Name : ${data.channel}\nSchedule :\n${data.schedule.replace(/\\n/g, '\n')}`;

    bot.editMessageText(replyText, {
      chat_id: chatId,
      message_id: sentMsg.message_id
    });
  } catch (err) {
    bot.editMessageText('❌ Terjadi kesalahan saat mengambil jadwal TV.', {
      chat_id: chatId,
      message_id: sentMsg.message_id
    });
  }
});
bot.onText(/\/cekcuaca(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const kota = match[1];

  if (!kota) {
    return bot.sendMessage(chatId,
      '❌ Format salah.\n\nContoh penggunaan:\n/cekcuaca Jakarta'
    );
  }

  const wait = await bot.sendMessage(chatId, '⏳ Mengambil data cuaca...');

  try {
    const res = await fetch(`https://api.resellergaming.my.id/tools/cekcuaca?kota=${encodeURIComponent(kota)}`);
    const data = await res.json();

    if (!data.status) {
      return bot.editMessageText('❌ Gagal mendapatkan data cuaca.', {
        chat_id: chatId,
        message_id: wait.message_id
      });
    }

    const result = `
🌆 Kota: ${data.kota}
🌡 Suhu: ${data.suhu}
☁️ Deskripsi: ${data.deskripsi}
💧 Kelembaban: ${data.kelembaban}
💨 Angin: ${data.angin}
📊 Tekanan: ${data.tekanan}
👀 Visibility: ${data.visibility}
⏰ Update: ${data.update}
    `.trim();

    await bot.editMessageText(result, {
      chat_id: chatId,
      message_id: wait.message_id
    });

  } catch (err) {
    await bot.editMessageText('❌ Terjadi kesalahan.', {
      chat_id: chatId,
      message_id: wait.message_id
    });
  }
});
  bot.onText(/\/githubstalk (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = match[1]?.trim();

    if (!username) return bot.sendMessage(chatId, "Usage: /githubstalk <username>");

    try {
      const response = await axios.get(`https://piereeapi.vercel.app/stalk/github?user=${encodeURIComponent(username)}`);
      const data = response.data;

      if (!data || data.status === false || !data.data) {
        return bot.sendMessage(chatId, "❌ Username tidak di temukan");
      }

      const user = data.data;
      const caption = 
`👤 *GitHub Profile*
────────────────────────
🔎 *Username:* ${user.username}
🆔 *ID:* ${user.id}
🌐 *URL:* ${user.url}
👤 *Type:* ${user.type}
🛡 *Admin:* ${user.admin ? "Ya" : "Tidak"}

📄 *Bio:* ${user.bio || "-"}
🏢 *Company:* ${user.company || "-"}
📍 *Location:* ${user.location || "-"}
✉️ *Email:* ${user.email || "-"}
🔗 *Blog:* ${user.blog || "-"}

📦 *Public Repos:* ${user.public_repo}
📝 *Public Gists:* ${user.public_gists}
👥 *Followers:* ${user.followers}
👣 *Following:* ${user.following}

📅 *Dibuat:* ${new Date(user.created_at).toLocaleDateString()}
♻️ *Update Terakhir:* ${new Date(user.updated_at).toLocaleDateString()}
`;

      return bot.sendPhoto(chatId, user.profile_pic, { caption, parse_mode: "Markdown" });

    } catch (err) {
      console.error(err);
      return bot.sendMessage(chatId, "❌ Username tidak di temukan");
    }
  });

  bot.onText(/\/twitterstalk (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = match[1]?.trim();

    if (!username) return bot.sendMessage(chatId, "❌ Masukkan username Twitter!\nContoh: /twitterstalk siputzx");

    try {
      const { data } = await axios.post("https://api.siputzx.my.id/api/stalk/twitter", { user: username });

      if (!data.status) return bot.sendMessage(chatId, "❌ Gagal mengambil data Twitter.");

      const user = data.data;
      const caption = `
🐦 *${user.name}* (@${user.username})
🆔 ID: \`${user.id}\`
✅ Verified: ${user.verified ? "Yes" : "No"}
📍 Lokasi: ${user.location || "-"}
📅 Bergabung: ${new Date(user.created_at).toLocaleDateString("id-ID")}
📝 Bio: ${user.description || "-"}

📊 *Statistik*
🧵 Tweets: ${user.stats.tweets}
👥 Followers: ${user.stats.followers}
👣 Following: ${user.stats.following}
❤️ Likes: ${user.stats.likes}
🖼️ Media: ${user.stats.media}
      `;
      await bot.sendPhoto(chatId, user.profile.image, { caption, parse_mode: "Markdown" });

    } catch (err) {
      console.error(err);
      return bot.sendMessage(chatId, "🚫 Terjadi kesalahan saat mengambil data Twitter.");
    }
  });

  bot.onText(/\/pinstalk(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = match[1]?.trim();

    if (!username) return bot.sendMessage(chatId, "❌ Gunakan: /pinstalk <username>");

    try {
      const response = await axios.get(`https://piereeapi.vercel.app/stalk/pinterest?q=${encodeURIComponent(username)}`);
      const data = response.data;

      if (!data || data.status === false || !data.data) {
        return bot.sendMessage(chatId, "❌ Username tidak di temukan");
      }

      const user = data.data;
      const caption =
`📌 *Pinterest Profile*
────────────────────────
👤 *Username:* ${user.username}
🆔 *ID:* ${user.id}
👥 *Full Name:* ${user.full_name || "-"}

🌐 *URL:* ${user.profile_url}
🏳️ *Country:* ${user.country || "-"}
📍 *Location:* ${user.location || "-"}

📝 *Bio:* ${user.bio || "-"}

📊 *Stats*
• Pins: ${user.stats.pins}
• Followers: ${user.stats.followers}
• Following: ${user.stats.following}
• Boards: ${user.stats.boards}
• Likes: ${user.stats.likes}
• Saves: ${user.stats.saves}

🔗 *Website:* ${user.website || "-"}
🌍 *Domain Verified:* ${user.domain_verified ? "Ya" : "Tidak"}

📅 *Dibuat:* ${user.created_at}
`;

      return bot.sendPhoto(chatId, user.image.original, { caption, parse_mode: "Markdown" });

    } catch (err) {
      console.error(err);
      return bot.sendMessage(chatId, "❌ Username tidak di temukan");
    }
  });

  bot.onText(/\/robloxstalk(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = match[1]?.trim();

    if (!username) return bot.sendMessage(chatId, "❌ Gunakan: /robloxstalk <username>");

    try {
      const response = await axios.get(`https://piereeapi.vercel.app/stalk/roblox?user=${encodeURIComponent(username)}`);
      const data = response.data;

      if (!data || data.status === false || !data.data) {
        return bot.sendMessage(chatId, "❌ Username tidak di temukan");
      }

      const user = data.data;
      const basic = user.basic;
      const social = user.social;
      const avatarUrl = user.avatar?.data?.[0]?.imageUrl || "";

      const caption = 
`🎮 *Roblox Profile*
────────────────────────
👤 *Username:* ${basic.name}
🆔 *User ID:* ${basic.id}
⭐ *Display Name:* ${basic.displayName}
📝 *Description:* ${basic.description || "-"}

⏳ *Created:* ${new Date(basic.created).toLocaleDateString()}
🚫 *Banned:* ${basic.isBanned ? "Ya" : "Tidak"}
✔️ *Verified Badge:* ${basic.hasVerifiedBadge ? "Ya" : "Tidak"}

📊 *Social Stats*
• Friends: ${social.friends?.count || 0}
• Followers: ${social.followers?.count || 0}
• Following: ${social.following?.count || 0}
`;

      return bot.sendPhoto(chatId, avatarUrl, { caption, parse_mode: "Markdown" });

    } catch (err) {
      console.error(err);
      return bot.sendMessage(chatId, "❌ Username tidak di temukan");
    }
  });

bot.onText(/\/ytstalk(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1];

  if (!username) {
    return bot.sendMessage(chatId, `❌ /ytstalk <username>`);
  }

  try {
    const res = await fetch(`https://piereeapi.vercel.app/stalk/youtube?username=${encodeURIComponent(username)}`);
    const data = await res.json();

    if (!data.status || !data.data?.channel) {
      return bot.sendMessage(chatId, `❌ Channel tidak ditemukan untuk username: ${username}`);
    }

    const ch = data.data.channel;
    const caption = 
`📺 *YouTube Stalk Result*
──────────────────
👤 *Username:* ${ch.username}
👥 *Subscriber:* ${ch.subscriberCount}
🎞️ *Video Count:* ${ch.videoCount}
🔗 *Channel URL:* ${ch.channelUrl}
📝 *Description:*
${ch.description ? ch.description.slice(0, 800) + (ch.description.length > 800 ? "..." : "") : "Tidak ada deskripsi."}`;

    await bot.sendPhoto(chatId, ch.avatarUrl, {
      caption,
      parse_mode: "Markdown"
    });
  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mengambil data.");
  }
});
bot.onText(/\/ttstalk(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1];

  if (!username) {
    return bot.sendMessage(chatId, `❌ /ttstalk <username>`);
  }

  bot.sendMessage(chatId, `🔍 Sedang mencari data TikTok @${username}...`);

  try {
    const res = await axios.get(`https://piereeapi.vercel.app/stalk/tiktok?username=${encodeURIComponent(username)}`);
    const data = res.data;

    if (!data.status || !data.data || !data.data.user) {
      return bot.sendMessage(chatId, `❌ Tidak ditemukan data untuk username: ${username}`);
    }

    const user = data.data.user;
    const stats = data.data.stats || {};

    const caption = `
📱 *TIKTOK STALK RESULT*
────────────────────
👤 *Username:* @${user.uniqueId || "-"}
🏷️ *Nama:* ${user.nickname || "-"}
🌍 *Verified:* ${user.verified ? "✅ Ya" : "❌ Tidak"}
📝 *Bio:* ${user.signature || "-"}
📦 *Follower:* ${stats.followerCount || 0}
👥 *Following:* ${stats.followingCount || 0}
❤️ *Likes:* ${stats.heartCount || stats.heart || 0}
🎥 *Video:* ${stats.videoCount || 0}
🔒 *Akun Privat:* ${user.privateAccount ? "Ya" : "Tidak"}
────────────────────
🕒 Data diperbarui: ${new Date(data.timestamp || Date.now()).toLocaleString("id-ID")}
`;

    await bot.sendPhoto(chatId, user.avatarLarger || user.avatarMedium || user.avatarThumb, {
      caption,
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, `⚠️ Gagal mengambil data. Coba lagi nanti.`);
  }
});
bot.onText(/\/igdl(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const url = match[1];

    if (!url) {
        return bot.sendMessage(chatId, "Usage: /igdl link_instagram");
    }
    
    try {
        const loadingMsg = await bot.sendMessage(chatId, "📸 Mengunduh dari Instagram...");
        
        const apiUrl = `https://instagram-post-reels-stories-downloader.p.rapidapi.com/instagram/?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'x-rapidapi-host': 'instagram-post-reels-stories-downloader.p.rapidapi.com',
                'x-rapidapi-key': 'c7de8dbae6msh28b2f2d11e3aec5p115350jsn2388a88272c5',
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.media && data.media.length > 0) {
            await bot.editMessageText(`✅ Ditemukan ${data.media.length} media!`, {
                chat_id: chatId,
                message_id: loadingMsg.message_id
            });
            
            for (let i = 0; i < Math.min(data.media.length, 5); i++) {
                const media = data.media[i];
                
                if (media.type === 'video' || media.type === 'reel') {
                    await bot.sendVideo(chatId, media.url, {
                        caption: i === 0
                        ? `📸 *Instagram Downloader*\n\n👤 *Username:* ${data.username || 'Unknown'}\n📝 *Caption:* ${data.caption?.substring(0, 200) || 'No caption'}\n\n📥 *Downloaded via* @kinzxxoffc *Bot*`
                        : "",
                        parse_mode: 'Markdown',
                        supports_streaming: true
                    });
                } else {
                    await bot.sendPhoto(chatId, media.url, {
                        caption: i === 0
                        ? `📸 *Instagram Downloader*\n\n👤 *Username:* ${data.username || 'Unknown'}\n\n📥 *Downloaded via* @kinzxxoffc *Bot*`
                        : "",
                        parse_mode: 'Markdown'
                    });
                }
                
                if (i < Math.min(data.media.length, 5) - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            
        } else {
            throw new Error("Tidak ada media ditemukan");
        }
        
    } catch (error) {
        bot.sendMessage(chatId, `❌ Error: ${error.message}\n\nPastikan:\n1. Link valid\n2. Tidak private\n3. Coba ulang`, {
            reply_to_message_id: msg.message_id
        });
    }
});
  bot.onText(/^\/facebook(?:\s+(.+))?$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const url = match[1]?.trim();

    if (!url) {
      return bot.sendMessage(chatId,
        "🚫 Masukkan link Facebook!\n\nContoh:\n/facebook https://www.facebook.com/...",
        { parse_mode: "Markdown" }
      );
    }

    try {
      const api = `https://piereeapi.vercel.app/download/facebook?url=${encodeURIComponent(url)}`;
      const res = await axios.get(api).catch(() => null);

      if (!res?.data?.status || !res.data.result) {
        return bot.sendMessage(chatId, "❌ Gagal mengambil video dari Facebook. Pastikan link valid.");
      }

      const video = res.data.result;
      const videoUrl = video.hd || video.sd || null;

      if (!videoUrl) {
        return bot.sendMessage(chatId, "❌ Tidak ditemukan URL video valid.");
      }

      const caption = `📘 *Facebook Video*\n🎞️ Resolusi: ${video.hd ? "HD" : "SD"}`;

      await bot.sendVideo(chatId, videoUrl, {
        caption,
        parse_mode: "Markdown"
      });

    } catch (err) {
      return bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mengambil video dari Facebook.");
    }
  });
  
  bot.onText(/^\/capcutdl(?:\s+(.+))?$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const url = match[1]?.trim();

    if (!url || !url.includes("capcut.com")) {
      return bot.sendMessage(
        chatId,
        "🚫 Contoh penggunaan:\n`/capcutdl https://www.capcut.com/tv2/ZSBr4BaK6/`",
        { parse_mode: "Markdown" }
      );
    }

    let loadingMsg;
    try {
      loadingMsg = await bot.sendMessage(chatId, "🔄 Mengambil video dari CapCut...");

      // Panggil API yang benar
      const res = await axios.get("https://api.resellergaming.my.id/download/capcut", {
        params: { url },
        headers: { accept: "application/json" }
      });

      const data = res.data.data;

      if (!res.data.status || !data || !data.videoUrl) {
        return bot.sendMessage(chatId, "❌ Gagal mengambil video. Pastikan link valid.");
      }

      const caption = `🎬 *CapCut Downloader*

📌 *Judul:* ${data.title || "-"}
👍 *Likes:* ${data.likes || "-"}
👥 *Pengguna:* ${data.pengguna || "-"}
🔗 *Source:* [Klik untuk lihat](${url})

_Sedang mengirim video..._`;

      // Kirim poster jika ada
      if (data.posterUrl) {
        await bot.sendPhoto(chatId, data.posterUrl, {
          caption,
          parse_mode: "Markdown"
        });
      } else {
        await bot.sendMessage(chatId, caption, { parse_mode: "Markdown" });
      }

      // Kirim video via URL langsung lebih aman
      await bot.sendVideo(chatId, data.videoUrl, {
        caption: "✅ Video berhasil didapatkan!",
        parse_mode: "Markdown"
      });

      if (loadingMsg) await bot.deleteMessage(chatId, loadingMsg.message_id);

    } catch (e) {
      console.error("CAPCUT ERROR:", e);
      try { if (loadingMsg) await bot.deleteMessage(chatId, loadingMsg.message_id); } catch(e){}
      return bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mengambil video. Coba lagi.");
    }
  });

bot.onText(/^\/pindl(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const args = match[1]; // argumen setelah /pindl

  if (!args) {
    return bot.sendMessage(chatId, "🚫 Masukkan link Pinterest!\n\nContoh:\n/pindl https://id.pinterest.com/...");
  }

  try {
    const res = await axios.post("https://api.siputzx.my.id/api/d/pinterest", {
      url: args.trim()
    });

    const { status, data } = res.data;
    if (!status || !data?.url) {
      return bot.sendMessage(chatId, "❌ Gagal mengambil media dari Pinterest. Pastikan link valid.");
    }

    const head = await axios.head(data.url);
    const contentType = head.headers["content-type"];

    const caption = `📌 *Pinterest Media*\n🆔 ID: ${data.id || "-"}\n🕒 Dibuat: ${data.created_at || "-"}`;

    if (contentType.includes("video")) {
      await bot.sendVideo(chatId, data.url, { caption, parse_mode: "Markdown" });
    } else if (contentType.includes("image")) {
      await bot.sendPhoto(chatId, data.url, { caption, parse_mode: "Markdown" });
    } else {
      await bot.sendMessage(chatId, `❓ File tidak dikenali (tipe: ${contentType})`);
    }
  } catch (err) {
    console.error("Pinterest Error:", err?.response?.data || err.message);
    return bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mengambil media dari Pinterest.");
  }
});
  
bot.onText(/\/ytdl(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1];

  if (!url) {
    return bot.sendMessage(chatId, "❌ Contoh penggunaan:\n/ytdl <link YouTube>");
  }

  const loadingMsg = await bot.sendMessage(chatId, "⏳ Sedang memproses audio & video...");

  try {
    const audioApi = `https://piereeapi.vercel.app/download/ytmp3?url=${encodeURIComponent(url)}`;
    const audioFetch = await axios.get(audioApi).catch(() => null);

    if (!audioFetch?.data?.status) {
      return bot.editMessageText("❌ Gagal mengambil audio.", {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
      });
    }

    const audioURL = audioFetch.data.result.download;
    const audioTitle = audioFetch.data.result.title || "Audio";
    const audioBuffer = await axios.get(audioURL, { responseType: "arraybuffer" }).catch(() => null);

    if (!audioBuffer?.data) {
      return bot.editMessageText("❌ Gagal mengunduh audio.", {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
      });
    }

    const audioPath = path.join(process.cwd(), `${Date.now()}-audio.mp3`);
    fs.writeFileSync(audioPath, Buffer.from(audioBuffer.data));

    const videoApi = `https://piereeapi.vercel.app/download/ytmp4?url=${encodeURIComponent(url)}`;
    const videoFetch = await axios.get(videoApi).catch(() => null);

    if (!videoFetch?.data?.status) {
      return bot.editMessageText("❌ Gagal mengambil video.", {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
      });
    }

    const videoURL = videoFetch.data.result.download;
    const videoTitle = videoFetch.data.result.title || "Video";
    const videoBuffer = await axios.get(videoURL, { responseType: "arraybuffer" }).catch(() => null);

    if (!videoBuffer?.data) {
      return bot.editMessageText("❌ Gagal mengunduh video.", {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
      });
    }

    const videoPath = path.join(process.cwd(), `${Date.now()}-video.mp4`);
    fs.writeFileSync(videoPath, Buffer.from(videoBuffer.data));

    // KIRIM VIDEO DULU
    await bot.sendVideo(chatId, videoPath, {
      caption: `🎬 *${videoTitle}*`,
      parse_mode: "Markdown",
    });

    // BARU KIRIM AUDIO
    await bot.sendAudio(chatId, audioPath, {
      title: audioTitle,
      caption: `🎵 *${audioTitle}*`,
      parse_mode: "Markdown",
    });

    await bot.deleteMessage(chatId, loadingMsg.message_id);

    try { fs.unlinkSync(audioPath); } catch {}
    try { fs.unlinkSync(videoPath); } catch {}

  } catch (e) {
    await bot.editMessageText("❌ Terjadi kesalahan saat memproses.", {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
    });
  }
});
  bot.onText(/\/videydl(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const input = match[1]; // Ambil URL setelah perintah

    if (!input || !input.startsWith("http")) {
      return bot.sendMessage(
        chatId,
        "❌ Kirim perintah dengan menyertakan URL video dari videy.co\nContoh: `/videydl https://videy.co/v?id=XXXX`",
        { parse_mode: "Markdown" }
      );
    }

    await bot.sendMessage(chatId, "⏳ Sedang memproses video...");

    try {
      const res = await axios.post(
        "https://fastapi.acodes.my.id/api/downloader/videy",
        { text: input },
        {
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.status && res.data?.data) {
        await bot.sendVideo(chatId, res.data.data, {
          caption: "✅ Video berhasil diunduh dari videy.co!",
        });
      } else {
        await bot.sendMessage(chatId, "❌ Gagal mendapatkan video. Coba cek ulang link-nya.");
      }
    } catch (err) {
      console.error("VideyDL error:", err.message || err);
      bot.sendMessage(chatId, "❌ Terjadi kesalahan saat memproses video.");
    }
  });
  bot.onText(/\/twitter (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const args = match[1].trim();

    if (!args) {
      return bot.sendMessage(chatId, "🚫 Masukkan link Twitter!\n\nContoh:\n/twitter https://twitter.com/...");
    }

    try {
      const res = await axios.post("https://api.siputzx.my.id/api/d/twitter", {
        url: args
      });

      const { status, data } = res.data;
      if (!status || !data?.downloadLink) {
        return bot.sendMessage(chatId, "❌ Gagal mengambil video dari Twitter. Pastikan link valid.");
      }

      const head = await axios.head(data.downloadLink);
      const contentType = head.headers["content-type"];

      // Fungsi cek extension URL
      const isImageExt = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      const isVideoExt = (url) => /\.(mp4|mov|mkv|webm|avi|flv)$/i.test(url);

      const caption = `🐦 *${data.videoTitle || "Twitter Video"}*\n📝 ${data.videoDescription || ""}`;

      if (contentType.includes("video")) {
        await bot.sendVideo(chatId, data.downloadLink, { caption, parse_mode: "Markdown" });
      } else if (contentType.includes("image")) {
        await bot.sendPhoto(chatId, data.downloadLink, { caption, parse_mode: "Markdown" });
      } else if (contentType === "application/octet-stream") {
        if (isImageExt(data.downloadLink)) {
          await bot.sendPhoto(chatId, data.downloadLink, { caption, parse_mode: "Markdown" });
        } else if (isVideoExt(data.downloadLink)) {
          await bot.sendVideo(chatId, data.downloadLink, { caption, parse_mode: "Markdown" });
        } else {
          await bot.sendVideo(chatId, data.downloadLink, { caption, parse_mode: "Markdown" });
        }
      } else {
        await bot.sendMessage(chatId, `❓ File tidak dikenali (tipe: ${contentType})`);
      }
    } catch (err) {
      console.error("Twitter Error:", err?.response?.data || err.message);
      return bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mengambil media dari Twitter.");
    }
  });
  
bot.onText(/^\/mediafire(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1]?.trim();

  if (!url) return bot.sendMessage(chatId, '❌ Contoh penggunaan:\n/mediafire <link_mediafire>');

  const loading = await bot.sendMessage(chatId, '⏳ Sedang memproses link...');

  try {
    const res = await fetch(`https://piereeapi.vercel.app/download/mediafire?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    if (!data.status) {
      return bot.editMessageText('❌ Gagal mengambil data dari API!', {
        chat_id: chatId,
        message_id: loading.message_id
      });
    }

    // Ambil nama file dari API
    const filename = data.filename || 'file_mediafire';

    // Unduh file ke buffer
    const fileResp = await fetch(data.url);
    const fileBuffer = await fileResp.arrayBuffer();

    await bot.sendDocument(chatId, Buffer.from(fileBuffer), {
      filename: filename,
      caption: `📁 *${filename}*\n\n🗂️ Type: ${data.filetype || '-'}\n📦 Ekstensi: ${data.ext || '-'}\n📏 Ukuran: ${data.filesizeH || '-'}\n📅 Upload: ${data.aploud || '-'}`,
      parse_mode: 'Markdown'
    });

    await bot.deleteMessage(chatId, loading.message_id);

  } catch (err) {
    console.error('Error mediafire:', err);
    await bot.editMessageText('❌ Terjadi kesalahan saat memproses file!', {
      chat_id: chatId,
      message_id: loading.message_id,
    });
  }
});
bot.onText(/\/spotify (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1];

  if (!url) return bot.sendMessage(chatId, '❌ Contoh penggunaan:\n/spotify <link Spotify>');

  const loadingMsg = await bot.sendMessage(chatId, '⏳ Sedang memproses audio Spotify...');

  try {
    const res = await axios.get(`https://piereeapi.vercel.app/download/spotify?url=${encodeURIComponent(url)}`);
    const data = res.data;

    if (!data.status || !data.download)
      return bot.editMessageText('❌ Gagal mengambil audio.', { chat_id: chatId, message_id: loadingMsg.message_id });

    const { title, artis, image, download } = data;

    await bot.sendAudio(chatId, download, {
      title: `${title} - ${artis}`,
      caption: `🎧 *${title}*\n👤 ${artis}`,
      parse_mode: 'Markdown',
      thumb: image
    });

    await bot.deleteMessage(chatId, loadingMsg.message_id);
  } catch (err) {
    await bot.editMessageText('❌ Terjadi kesalahan.', { chat_id: chatId, message_id: loadingMsg.message_id });
  }
});
bot.onText(/\/tiktok (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1];

  if (!url.includes("tiktok.com")) {
    return bot.sendMessage(chatId, `❌ Masukkan URL TikTok yang valid.\nContoh: /tiktok https://vt.tiktok.com/xxxx`);
  }

  const waitMsg = await bot.sendMessage(chatId, "🕒 Mengambil video dari TikTok...");

  try {
    const { data } = await axios.get("https://restapi-v2.simplebot.my.id/download/tiktok", {
      params: { url },
    });

    const result = data?.result;
    if (!data.status || !result || !result.video_nowm) {
      return bot.editMessageText("❌ Gagal mengambil video TikTok.", {
        chat_id: chatId,
        message_id: waitMsg.message_id,
      });
    }

    // kirim video tanpa watermark
    await bot.sendVideo(chatId, result.video_nowm, {
      caption: "📹 Video TikTok",
    });

    // kalau ada audio
    if (result.audio_url) {
      await bot.sendAudio(chatId, result.audio_url, {
        caption: "🎵 Audio TikTok",
      });
    }

    await bot.editMessageText("✅ Selesai mengunduh video TikTok!", {
      chat_id: chatId,
      message_id: waitMsg.message_id,
    });
  } catch (err) {
    console.error("TikTok Error:", err);
    bot.editMessageText("⚠️ Terjadi kesalahan saat mengunduh video TikTok.", {
      chat_id: chatId,
      message_id: waitMsg.message_id,
    });
  }
});

// jika hanya ketik /tiktok tanpa argumen
bot.onText(/\/tiktok$/, (msg) => {
  bot.sendMessage(msg.chat.id, `❌ Masukkan URL TikTok yang valid.\nContoh: /tiktok https://vt.tiktok.com/xxxx`);
});
  bot.onText(/\/gitclone (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const repoUrl = match[1]?.trim();

    if (!repoUrl) {
      return bot.sendMessage(chatId, '❌ Contoh penggunaan:\n/gitclone https://github.com/user/repo');
    }

    const loading = await bot.sendMessage(chatId, '⏳ Sedang memproses repo GitHub...');

    try {
      const res = await fetch(`https://piereeapi.vercel.app/download/github?url=${encodeURIComponent(repoUrl)}`);
      const data = await res.json();

      if (!data.status || !data.result?.download) {
        return bot.editMessageText('❌ Gagal mengambil repo dari API!', {
          chat_id: chatId,
          message_id: loading.message_id
        });
      }

      const fileUrl = data.result.download;
      const filename = data.result.filename || 'github_repo.zip';

      const fileResp = await fetch(fileUrl);
      const fileBuffer = await fileResp.arrayBuffer();

      const filePath = path.join(__dirname, filename);
      fs.writeFileSync(filePath, Buffer.from(fileBuffer));

      await bot.sendDocument(chatId, filePath); // TANPA caption

      fs.unlinkSync(filePath);
      await bot.deleteMessage(chatId, loading.message_id);
    } catch (err) {
      console.error('GitClone Error:', err);
      await bot.editMessageText('❌ Terjadi kesalahan saat mengunduh repo!', {
        chat_id: chatId,
        message_id: loading.message_id
      });
    }
  });
  
bot.onText(/^\/qc(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1]

  if (!text) {
    return bot.sendMessage(chatId, "⚠️ Contoh: /qc teksnya");
  }
    
  bot.sendMessage(chatId, '⏳', {
    reply_to_message_id: msg.message_id
  });

  let ppuser;
  try {
    const photos = await bot.getUserProfilePhotos(msg.from.id, { limit: 1 });
    if (photos.total_count > 0) {
      ppuser = await bot.getFileLink(photos.photos[0][0].file_id);
    } else {
      ppuser = "https://telegra.ph/file/a059a6a734ed202c879d3.jpg";
    }
  } catch (err) {
    ppuser = "https://telegra.ph/file/a059a6a734ed202c879d3.jpg";
  }

  const json = {
    type: "quote",
    format: "png",
    backgroundColor: "#000000",
    width: 812,
    height: 968,
    scale: 2,
    messages: [
      {
        entities: [],
        avatar: true,
        from: {
          id: 1,
          name: msg.from.first_name || "User",
          photo: { url: ppuser },
        },
        text: text,
        replyMessage: {},
      },
    ],
  };

  try {
    const res = await axios.post("https://bot.lyo.su/quote/generate", json, {
      headers: { "Content-Type": "application/json" },
    });

    const buffer = Buffer.from(res.data.result.image, "base64");
    const tempPath = path.join(__dirname, "qc_" + msg.from.id + ".webp");

    fs.writeFileSync(tempPath, buffer);

    await bot.sendSticker(chatId, tempPath, {
      reply_to_message_id: msg.message_id,
    });

    fs.unlinkSync(tempPath);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Gagal membuat QC, coba lagi.");
  }
});
bot.onText(/^\/brat(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
    
  const argsRaw = match[1];

  if (!argsRaw) {
    return bot.sendMessage(chatId, 'Format: /brat <teks> [--gif] [--delay=500]');
  }

  try {
    const args = argsRaw.split(' ');

    const textParts = [];
    let isAnimated = false;
    let delay = 500;

    for (let arg of args) {
      if (arg === '--gif') isAnimated = true;
      else if (arg.startsWith('--delay=')) {
        const val = parseInt(arg.split('=')[1]);
        if (!isNaN(val)) delay = val;
      } else {
        textParts.push(arg);
      }
    }

    const text = textParts.join(' ');
    if (!text) {
      return bot.sendMessage(chatId, 'Teks tidak boleh kosong!');
    }

    if (isAnimated && (delay < 100 || delay > 1500)) {
      return bot.sendMessage(chatId, 'Delay harus antara 100–1500 ms.');
    }

    await bot.sendMessage(chatId, '⏳ ᴍᴇᴍʙᴜᴀᴛ sᴛɪᴄᴋᴇʀ ʙʀᴀᴛ...');

    const apiUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=${isAnimated}&delay=${delay}`;
    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data);

    await bot.sendSticker(chatId, buffer);
  } catch (error) {
    console.error('❌ Error brat:', error.message);
    bot.sendMessage(chatId, 'Gagal membuat stiker brat. Coba lagi nanti ya!');
  }
});

    // command /tourl
bot.onText(/\/tourl/, async (msg) => {
  const chatId = msg.chat.id;
    
  const repliedMsg = msg.reply_to_message;

  if (!repliedMsg || (!repliedMsg.document && !repliedMsg.photo && !repliedMsg.video)) {
    return bot.sendMessage(chatId, "❌ Silakan reply sebuah file/foto/video dengan command /tourl");
  }

  let fileId, fileName;

  if (repliedMsg.document) {
    fileId = repliedMsg.document.file_id;
    fileName = repliedMsg.document.file_name || `file_${Date.now()}`;
  } else if (repliedMsg.photo) {
    const photos = repliedMsg.photo;
    fileId = photos[photos.length - 1].file_id; // resolusi tertinggi
    fileName = `photo_${Date.now()}.jpg`;
  } else if (repliedMsg.video) {
    fileId = repliedMsg.video.file_id;
    fileName = `video_${Date.now()}.mp4`;
  }

  try {
    const processingMsg = await bot.sendMessage(chatId, `⏳ ᴍᴇɴɢᴜᴘʟᴏᴀᴅ ᴋᴇ ᴄᴀᴛʙᴏx...`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });

    const file = await bot.getFile(fileId);
    const fileLink = `https://api.telegram.org/file/bot${settings.token}/${file.file_path}`;

    const fileResponse = await axios.get(fileLink, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(fileResponse.data);

    // Upload ke Catbox
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, {
      filename: fileName,
      contentType: fileResponse.headers['content-type'],
    });

    const { data: catboxUrl } = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders()
    });

    // Validasi URL
    if (!catboxUrl.startsWith('https://')) {
      throw new Error('Catbox tidak mengembalikan URL yang valid');
    }

    await bot.editMessageText(`✅ ᴜᴘʟᴏᴀᴅ ʙᴇʀʜᴀꜱɪʟ!\n\n📎 URL: \`${catboxUrl}\``, {
      chat_id: chatId,
      parse_mode: "Markdown",
      message_id: processingMsg.message_id
    });

  } catch (error) {
    console.error("Upload error:", error?.response?.data || error.message);
    bot.sendMessage(chatId, "❌ Gagal mengupload file ke Catbox");
  }
});
    
bot.onText(/\/iqc(.+)?/, async (msg, match) => {
  const chatId = msg.chat.id;
    
  const text = match[1] ? match[1].trim() : '';

  if (!text) {
    return bot.sendMessage(chatId, '❌ Format Salah: /iqc jam|batre|carrier|pesan\nContoh: /iqc 18:00|40|Indosat|hai hai', {
      reply_to_message_id: msg.message_id
    });
  }

  const parts = text.split('|');
  if (parts.length < 4) {
    return bot.sendMessage(chatId, '❌ Format salah! Gunakan:\n/iqc jam|batre|carrier|pesan\nContoh:\n/iqc 18:00|40|Indosat|hai hai', {
      reply_to_message_id: msg.message_id
    });
  }

  const time = parts[0].trim();
  const battery = parts[1].trim();
  const carrier = parts[2].trim();
  const messageParts = parts.slice(3);
  const messageText = messageParts.join('|').trim();

  if (!time || !battery || !carrier || !messageText) {
    return bot.sendMessage(chatId, '⚠️ Format salah! Pastikan semua field terisi:\n/iqc jam|batre|carrier|pesan', {
      reply_to_message_id: msg.message_id
    });
  }

  const waitingMsg = await bot.sendMessage(chatId, '⏳', {
    reply_to_message_id: msg.message_id
  });

  try {
    const encodedTime = encodeURIComponent(time);
    const encodedCarrier = encodeURIComponent(carrier);
    const encodedMessage = encodeURIComponent(messageText);
    
    const url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodedTime}&batteryPercentage=${battery}&carrierName=${encodedCarrier}&messageText=${encodedMessage}&emojiStyle=apple`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await bot.sendPhoto(chatId, buffer, {
      caption: `✅ *ꜱᴜᴋꜱᴇꜱ ʙᴀɴɢ*`,
      parse_mode: 'Markdown',
      reply_to_message_id: msg.message_id
    });

    await bot.deleteMessage(chatId, waitingMsg.message_id);

  } catch (error) {
    console.error('Error:', error);
    
    await bot.deleteMessage(chatId, waitingMsg.message_id);
    
    await bot.sendMessage(chatId, '❌ Terjadi kesalahan, Coba lagi!', {
      reply_to_message_id: msg.message_id
    });
  }
});
  bot.onText(/\/groq(?: (.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    let prompt = match[1];
    if (!prompt && msg.reply_to_message?.text) prompt = msg.reply_to_message.text;
    if (!prompt) return bot.sendMessage(chatId, '❌ Gunakan: /groq <teks> atau reply ke pesan.');
    const wait = await bot.sendMessage(chatId, '⏳ Memproses dengan Groq...');
    try {
      const res = await fetch(`https://piereeapi.vercel.app/ai/groq?text=${encodeURIComponent(prompt)}`);
      const data = await res.json();
      const hasil = data.result || data.data?.result || data.text || '❌ Tidak ada hasil.';
      bot.editMessageText(hasil, { chat_id: chatId, message_id: wait.message_id });
    } catch {
      bot.editMessageText('❌ Gagal memproses dari Groq API.', { chat_id: chatId, message_id: wait.message_id });
    }
  });

  bot.onText(/\/fixcode/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const replyMsg = msg.reply_to_message;

    try {
      let code = null;
      if (replyMsg?.text) code = replyMsg.text;
      else if (replyMsg?.document) {
        const doc = replyMsg.document;
        if (doc.mime_type === "application/javascript" || doc.file_name.endsWith(".js")) {
          const fileLink = await bot.getFileLink(doc.file_id);
          const res = await fetch(fileLink);
          code = await res.text();
        }
      }
      if (!code) return bot.sendMessage(chatId, "❌ Balas pesan teks error atau file .js dulu bre.");
      await bot.sendMessage(chatId, "🧠 Sedang memproses kode Anda, mohon tunggu sebentar...");
      const prompt = `
Anda adalah AI yang sangat ahli dalam memperbaiki semua jenis kode pemrograman, termasuk JavaScript, Python, C++, dan bahasa pemrograman lainnya. Tugas Anda adalah membantu pengguna memperbaiki kode yang error, tidak efisien, atau memiliki bug, sehingga kode tersebut dapat dijalankan dengan benar.

Instruksi rinci:

1. Periksa kode yang diberikan dan temukan semua kesalahan, bug, atau masalah potensial.
2. Perbaiki semua masalah tersebut dan tuliskan ulang kode yang sudah diperbaiki.
3. Jangan menambahkan penjelasan, komentar, atau catatan apapun di dalam kode. Fokus hanya pada perbaikan kode.
4. Jangan gunakan pembungkus \`\`\` atau format khusus apapun. Hasil harus berupa kode bersih yang siap digunakan.
5. Pastikan struktur kode rapi, indentasi konsisten, dan sintaks benar.

Kode yang perlu diperbaiki adalah sebagai berikut:

${code}
`;
      const url = `https://piereeapi.vercel.app/ai/gpt4o?prompt=${encodeURIComponent(prompt)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data?.result) {
        const reply = data.result.trim();
        const filePath = path.join(__dirname, "fix.txt");
        Plfs.writeFileSync(filePath, reply, "utf8");
        await bot.sendDocument(chatId, filePath, { caption: "✅ Nih Hasil Fixnya!" });
      } else {
        bot.sendMessage(chatId, "❌ Gagal mendapatkan balasan dari AI.");
      }
    } catch {
      bot.sendMessage(chatId, "❌ Terjadi error saat memproses perbaikan kode.");
    }
  });

  bot.onText(/\/chatgpt/, async (msg) => {
    const chatId = msg.chat.id;
    const replyMsg = msg.reply_to_message;
    try {
      let code = null;
      if (replyMsg?.text) code = replyMsg.text;
      else if (replyMsg?.document) {
        const doc = replyMsg.document;
        if (doc.mime_type === "application/javascript" || doc.file_name.endsWith(".js")) {
          const fileLink = await bot.getFileLink(doc.file_id);
          const res = await fetch(fileLink);
          code = await res.text();
        }
      }
      if (!code) return bot.sendMessage(chatId, "❌ Reply ke pesan untuk menggunakan /chatgpt..");
      await bot.sendMessage(chatId, "🧠 Sedang Memproses...");
      const prompt = `
kamu adalah asisten ai pintar, dan ikuti aturan ini
- Gunakan bahasa Indonesia
- Kasih hasilnya pake format \`\`\`(bahasa pemograman) di awal dan \`\`\` di akhir biar gua gampang salin.
- Jangan ada gunakan \`

Ini kodenya bre:

${code}
`;
      const url = `https://piereeapi.vercel.app/ai/gpt4o?prompt=${encodeURIComponent(prompt)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data?.result) {
        const reply = data.result.trim();
        const output = reply.includes("```") ? reply : `\`\`\`javascript\n${reply}\n\`\`\``;
        const hasil = output.length > 4000 ? output.slice(0, 4000) + "..." : output;
        return bot.sendMessage(chatId, hasil, { parse_mode: "Markdown" });
      } else {
        bot.sendMessage(chatId, "❌ Gagal dapet balasan dari AI bre.");
      }
    } catch {
      bot.sendMessage(chatId, "❌ Terjadi error pas proses perbaikan kode.");
    }
  });

  bot.onText(/\/ai/, async (msg) => {
    const chatId = msg.chat.id;
    const replyMsg = msg.reply_to_message;
    try {
      let code = null;
      if (replyMsg?.text) code = replyMsg.text;
      else if (replyMsg?.document) {
        const doc = replyMsg.document;
        if (doc.mime_type === "application/javascript" || doc.file_name.endsWith(".js")) {
          const fileLink = await bot.getFileLink(doc.file_id);
          const res = await fetch(fileLink);
          code = await res.text();
        }
      }
      if (!code) return bot.sendMessage(chatId, "❌ Reply ke pesan untuk menggunakan /ai..");
      await bot.sendMessage(chatId, "🧠 Sedang Memproses...");
      const prompt = `
kamu adalah asisten ai pintar, dan ikuti aturan ini
- Gunakan bahasa Indonesia
- Kasih hasilnya pake format \`\`\`(bahasa pemograman) di awal dan \`\`\` di akhir biar gua gampang salin.
- Jangan ada gunakan \`
- Jawab semua pertanyaan dengan jelas
- bukan bikin kode tapi menjawab pertanyaan

Ini Pertanyaannya bre:

${code}
`;
      const url = `https://piereeapi.vercel.app/ai/gpt4o?prompt=${encodeURIComponent(prompt)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data?.result) {
        const reply = data.result.trim();
        const output = reply.includes("```") ? reply : `\`\`\`javascript\n${reply}\n\`\`\``;
        const hasil = output.length > 4000 ? output.slice(0, 4000) + "..." : output;
        return bot.sendMessage(chatId, hasil, { parse_mode: "Markdown" });
      } else {
        bot.sendMessage(chatId, "❌ Gagal dapet balasan dari AI bre.");
      }
    } catch {
      bot.sendMessage(chatId, "❌ Terjadi error pas proses perbaikan kode.");
    }
  });
bot.onText(/^\/spamotp(?:\s+(62\d+)\s+(\d+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (!match || !match[1] || !match[2]) {
    return bot.sendMessage(
      chatId,
      `<b>Cara penggunaan:</b>\n/spamotp 628xxxx [jumlah]\n<b>❌ Maksimal jumlah 10</b>`,
      { parse_mode: "HTML" }
    );
  }

  const phone = match[1];
  const jumlah = parseInt(match[2], 10);

  if (isNaN(jumlah) || jumlah < 1 || jumlah > 10) {
    return bot.sendMessage(
      chatId,
      `<b>❌ Jumlah harus 1–10</b>`,
      { parse_mode: "HTML" }
    );
  }

  await bot.sendMessage(
    chatId,
    `<i>⏳ Proses mengirim OTP ke ${phone}...</i>`,
    { parse_mode: "HTML" }
  );

  let berhasil = 0;
  let gagal = 0;

  for (let i = 0; i < jumlah; i++) {
    try {
      await sendSingaOTP(phone);
      berhasil++;
    } catch {
      gagal++;
    }
  }

  bot.sendMessage(
    chatId,
    `<blockquote>🚀 Berhasil mengirim otp ke ${phone}</blockquote>\n` +
    `<b>Berhasil :</b> ${berhasil}\n` +
    `<b>Gagal :</b> ${gagal}`,
    { parse_mode: "HTML" }
  );
});

async function sendSingaOTP(phoneNumber) {
  const url =
    "https://api102.singa.id/new/login/sendWaOtp?versionName=2.4.8&versionCode=143&model=SM-G965N&systemVersion=9&platform=android&appsflyer_id=";

  const payload = {
    mobile_phone: phoneNumber,
    type: "mobile",
    is_switchable: 1
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    await tryWithProxy(phoneNumber);
  }
}

async function tryWithProxy(phoneNumber) {
  const proxyUrl = "https://cors-anywhere.herokuapp.com/";
  const targetUrl =
    "https://api102.singa.id/new/login/sendWaOtp?versionName=2.4.8&versionCode=143&model=SM-G965N&systemVersion=9&platform=android&appsflyer_id=";

  const payload = {
    mobile_phone: phoneNumber,
    type: "mobile",
    is_switchable: 1
  };

  await fetch(proxyUrl + targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify(payload),
  });
}
};