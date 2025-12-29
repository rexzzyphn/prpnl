const fs = require("fs-extra");
const settings = require("../settings.js");
const OWNER_ID = settings.ownerId;
const ownerIdNum = Number(OWNER_ID);

let warnDB = {};
const pendingWarns = new Map();

async function loadWarnDB() {
  try {
    if (await fs.pathExists("./db/warnDB.json")) {
      warnDB = await fs.readJson("./db/warnDB.json");
    } else {
      warnDB = {};
      await saveWarnDB();
    }
  } catch (e) {
    console.error("Gagal load warnDB:", e);
  }
}

async function saveWarnDB() {
  try {
    await fs.ensureDir("./db");
    await fs.writeJson("./db/warnDB.json", warnDB, { spaces: 2 });
  } catch (e) {
    console.error("Gagal save warnDB:", e);
  }
}

loadWarnDB();

const autodelFile = "./db/autodel.json";

function loadAutodel() {
  try {
    if (!fs.existsSync(autodelFile)) {
      fs.ensureDirSync("./db");
      fs.writeJsonSync(autodelFile, { words: [] }, { spaces: 2 });
    }
    return fs.readJsonSync(autodelFile);
  } catch (e) {
    console.error("Gagal load autodel:", e);
    return { words: [] };
  }
}

function saveAutodel(data) {
  try {
    fs.ensureDirSync("./db");
    fs.writeJsonSync(autodelFile, data, { spaces: 2 });
  } catch (e) {
    console.error("Gagal save autodel:", e);
  }
}

const WELCOME_FILE = "./db/welcomeStatus.json";

// Load atau buat file welcomeStatus.json
let welcomeStatus = {};
if (fs.existsSync(WELCOME_FILE)) {
  welcomeStatus = JSON.parse(fs.readFileSync(WELCOME_FILE, "utf-8"));
} else {
  fs.writeFileSync(WELCOME_FILE, JSON.stringify({}));
}
// Fungsi cek owner
function notOwner(msg, chatId, botInstance) {
  return botInstance.sendMessage(chatId, "❌ Anda bukan owner.");
}

module.exports = (bot) => {
  bot.onText(/^\/warn(?:\s+(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!msg.chat.type.includes("group")) return bot.sendMessage(chatId, "❌ Khusus Group");
    if (msg.from.id !== ownerIdNum) return bot.sendMessage(chatId, "❌ Khusus Owner");

    const reason = match[1] || "Tanpa alasan";
    const target = msg.reply_to_message?.from;
    if (!target) return bot.sendMessage(chatId, "⚠️ Balas pesan anggota yang ingin diberi peringatan.");

    const userId = target.id;
    if (!warnDB[userId]) warnDB[userId] = [];
    warnDB[userId].push(reason);
    await saveWarnDB();

    const warnCount = warnDB[userId].length;

    const sent = await bot.sendMessage(chatId,
      `⚠️ ${target.first_name} telah diperingatkan!\n🔹 Alasan: ${reason}\n📌 Total peringatan: ${warnCount}/3`, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{
            text: "❌ Batalkan Peringatan",
            callback_data: `cancel_warn_${userId}`
          }]]
        }
      }
    );

    pendingWarns.set(userId, sent.message_id);

    if (msg.reply_to_message) {
      try { await bot.deleteMessage(chatId, msg.reply_to_message.message_id); } catch (e) {}
    }

    if (warnCount >= 3) {
      try {
        await bot.kickChatMember(chatId, userId);
        delete warnDB[userId];
        await saveWarnDB();
        bot.sendMessage(chatId, `🚨 ${target.first_name} telah dikeluarkan karena mencapai batas peringatan.`);
      } catch (e) {
        bot.sendMessage(chatId, `❌ Gagal mengeluarkan ${target.first_name}. Pastikan bot admin.`);
      }
    }
  });

  bot.onText(/^\/warns$/, async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.chat.type.includes("group")) return bot.sendMessage(chatId, "❌ Khusus Group");
    if (msg.from.id !== ownerIdNum) return bot.sendMessage(chatId, "❌ Khusus Owner");

    const target = msg.reply_to_message?.from;
    if (!target) return bot.sendMessage(chatId, "⚠️ Balas pesan anggota untuk melihat peringatannya.");

    const warns = warnDB[target.id] || [];
    if (warns.length === 0) return bot.sendMessage(chatId, `✅ <b>${target.first_name}</b> belum memiliki peringatan.`, { parse_mode: "HTML" });

    const list = warns.map((r, i) => `${i + 1}. ${r}`).join("\n");
    bot.sendMessage(chatId, `⚠️ Peringatan untuk <b>${target.first_name}</b>:\n\n${list}`, { parse_mode: "HTML" });
  });

  bot.onText(/^\/resetwarn$/, async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.chat.type.includes("group")) return bot.sendMessage(chatId, "❌ Khusus Group");
    if (msg.from.id !== ownerIdNum) return bot.sendMessage(chatId, "❌ Khusus Owner");

    const target = msg.reply_to_message?.from;
    if (!target) return bot.sendMessage(chatId, "⚠️ Balas pesan anggota untuk menghapus peringatannya.");

    delete warnDB[target.id];
    await saveWarnDB();
    bot.sendMessage(chatId, `✅ Peringatan <b>${target.first_name}</b> telah dihapus.`, { parse_mode: "HTML" });
  });

// CLOSE
bot.onText(/^\/close$/, async (msg) => {
  const chatId = msg.chat.id;
  if (!msg.chat.type.includes("group")) return bot.sendMessage(chatId, "❌ Khusus Group");
  if (msg.from.id !== OWNER_ID) return bot.sendMessage(chatId, "❌ Khusus Owner");

  try {
    await bot.setChatPermissions(chatId, {
      can_send_messages: false,
      can_send_media_messages: false,
      can_send_other_messages: false,
      can_add_web_page_previews: false
    });
    bot.sendMessage(chatId, "✅ Grup telah *ditutup*.", { parse_mode: "Markdown" });
  } catch {
    bot.sendMessage(chatId, "⚠️ Gagal menutup grup.");
  }
});

// OPEN
bot.onText(/^\/open$/, async (msg) => {
  const chatId = msg.chat.id;
  if (!msg.chat.type.includes("group")) return bot.sendMessage(chatId, "❌ Khusus Group");
  if (msg.from.id !== OWNER_ID) return bot.sendMessage(chatId, "❌ Khusus Owner");

  try {
    await bot.setChatPermissions(chatId, {
      can_send_messages: true,
      can_send_media_messages: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true
    });
    bot.sendMessage(chatId, "✅ Grup telah *dibuka*.", { parse_mode: "Markdown" });
  } catch {
    bot.sendMessage(chatId, "⚠️ Gagal membuka grup.");
  }
});
// PIN
bot.onText(/^\/pin$/, async (msg) => {
  const chatId = msg.chat.id;
  if (!msg.chat.type.includes("group")) return bot.sendMessage(chatId, global.mess.group);
  if (msg.from.id !== OWNER_ID) return notOwner(msg, chatId);

  if (!msg.reply_to_message)
    return bot.sendMessage(chatId, "⚠️ Balas pesan yang ingin disematkan.");

  try {
    await bot.pinChatMessage(chatId, msg.reply_to_message.message_id);
    bot.sendMessage(chatId, "📌 Pesan disematkan.");
  } catch {
    bot.sendMessage(chatId, "❌ Gagal menyematkan pesan.");
  }
});

// UNPIN
bot.onText(/^\/unpin$/, async (msg) => {
  const chatId = msg.chat.id;
  if (!msg.chat.type.includes("group")) return bot.sendMessage(chatId, global.mess.group);
  if (msg.from.id !== OWNER_ID) return notOwner(msg, chatId);

  if (!msg.reply_to_message)
    return bot.sendMessage(chatId, "⚠️ Balas pesan yang ingin dilepas.");

  try {
    await bot.unpinChatMessage(chatId, msg.reply_to_message.message_id);
    bot.sendMessage(chatId, "📌 Sematan dilepas.");
  } catch {
    bot.sendMessage(chatId, "❌ Gagal melepas sematan.");
  }
});

// PROMOTE
bot.onText(/^\/promote\s+(.+?)(?:\s+@(\S+))?$/, async (msg, match) => {
  if (msg.chat.type === "private") return bot.sendMessage(msg.chat.id, "⚠️ Fitur /promote hanya bisa digunakan di grup!");
  if (msg.from.id.toString() !== OWNER_ID.toString()) return;

  const gelar = match[1]?.trim();
  if (!gelar) return bot.sendMessage(msg.chat.id, "⚠️ Gunakan format: /promote <gelar_khusus> (reply atau mention)");

  let targetUserId;
  if (msg.reply_to_message) targetUserId = msg.reply_to_message.from.id;
  else if (match[2]) {
    try {
      const user = await bot.getChat(`@${match[2]}`);
      targetUserId = user.id;
    } catch (err) {
      return bot.sendMessage(msg.chat.id, "⚠️ Username tidak valid!");
    }
  } else return bot.sendMessage(msg.chat.id, "⚠️ Reply pesan atau mention @username!");

  try {
    await client.invoke(new Api.channels.EditAdmin({
      channel: msg.chat.id,
      userId: targetUserId,
      adminRights: new Api.ChatAdminRights({
        changeInfo: false,
        postMessages: true,
        editMessages: true,
        deleteMessages: false,
        banUsers: false,
        inviteUsers: false,
        pinMessages: false,
        addAdmins: false
      }),
      rank: gelar
    }));

    bot.sendMessage(msg.chat.id, `✅ Pengguna berhasil dipromote dengan gelar: ${gelar}`);
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, "⚠️ Gagal promote. Pastikan akun kamu owner grup!");
  }
});

// DEMOTE
bot.onText(/^\/demote(?:\s+@(\S+))?$/, async (msg, match) => {
  if (msg.chat.type === "private") return bot.sendMessage(msg.chat.id, "⚠️ Fitur /demote hanya bisa digunakan di grup!");
  if (msg.from.id.toString() !== OWNER_ID.toString()) return;

  let targetUserId;
  if (msg.reply_to_message) targetUserId = msg.reply_to_message.from.id;
  else if (match[1]) {
    try {
      const user = await bot.getChat(`@${match[1]}`);
      targetUserId = user.id;
    } catch (err) {
      return bot.sendMessage(msg.chat.id, "⚠️ Username tidak valid!");
    }
  } else return bot.sendMessage(msg.chat.id, "⚠️ Reply pesan atau mention @username!");

  try {
    await client.invoke(new Api.channels.EditAdmin({
      channel: msg.chat.id,
      userId: targetUserId,
      adminRights: new Api.ChatAdminRights({
        changeInfo: false,
        postMessages: false,
        editMessages: false,
        deleteMessages: false,
        banUsers: false,
        inviteUsers: false,
        pinMessages: false,
        addAdmins: false
      }),
      rank: ""
    }));

    bot.sendMessage(msg.chat.id, `✅ Pengguna berhasil didemote`);
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, "⚠️ Gagal demote. Pastikan akun kamu owner grup!");
  }
});
bot.onText(/^\/del$/, async (msg) => {
  const chatId = msg.chat.id;

  // hanya bisa di grup
  if (!msg.chat.type.includes("group"))
    return bot.sendMessage(chatId, "❗ Fitur ini hanya untuk grup.");

  // hanya OWNER_ID
  if (msg.from.id !== OWNER_ID)
    return bot.sendMessage(chatId, "❌ Anda bukan owner");

  // harus reply
  const targetMsg = msg.reply_to_message;
  if (!targetMsg)
    return bot.sendMessage(chatId, "⚠️ Balas pesan yang ingin dihapus, lalu ketik /del");

  try {
    // hapus pesan target
    await bot.deleteMessage(chatId, targetMsg.message_id);

    // hapus pesan /del dari owner
    await bot.deleteMessage(chatId, msg.message_id);

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Gagal menghapus pesan. Pastikan bot adalah admin dan memiliki izin hapus pesan.");
  }
});
function parseDuration(str) {
  const num = parseInt(str);
  const unit = str.slice(-1);

  if (isNaN(num)) return null;

  switch (unit) {
    case "d": return num * 24 * 60 * 60 * 1000;
    case "h": return num * 60 * 60 * 1000;
    case "m": return num * 60 * 1000;
    default: return null;
  }
}

// MUTE <time>
bot.onText(/^\/mute(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (!msg.chat.type.includes("group"))
    return bot.sendMessage(chatId, "❗ Ini fitur khusus grup.");

  if (msg.from.id !== OWNER_ID)
    return bot.sendMessage(chatId, "❌ Anda bukan owner");

  const target = msg.reply_to_message?.from;
  if (!target)
    return bot.sendMessage(chatId, "⚠️ Balas pesan target lalu ketik /mute <waktu>");

  const timeArg = match[1] ? match[1].trim() : null;
  let untilDate = 0;

  if (timeArg) {
    const ms = parseDuration(timeArg);
    if (!ms)
      return bot.sendMessage(chatId, "❌ Format waktu salah!\nGunakan: 1d, 1h, 1m");

    untilDate = Math.floor((Date.now() + ms) / 1000);
  }

  try {
    await bot.restrictChatMember(chatId, target.id, {
      can_send_messages: false,
      can_send_media_messages: false,
      can_send_other_messages: false,
      can_add_web_page_previews: false,
      until_date: untilDate || undefined // undefined = permanent
    });

    bot.sendMessage(
      chatId,
      `🔇 <b>${target.first_name}</b> berhasil di-mute ${
        timeArg ? `selama <b>${timeArg}</b>` : "secara permanen"
      }.`,
      { parse_mode: "HTML" }
    );
  } catch {
    bot.sendMessage(chatId, "❌ Gagal mute user.");
  }
});

// UNMUTE
bot.onText(/^\/unmute$/, async (msg) => {
  const chatId = msg.chat.id;

  if (!msg.chat.type.includes("group"))
    return bot.sendMessage(chatId, "❗ Ini fitur khusus grup.");

  if (msg.from.id !== OWNER_ID)
    return bot.sendMessage(chatId, "❌ Anda bukan owner");

  const target = msg.reply_to_message?.from;
  if (!target)
    return bot.sendMessage(chatId, "⚠️ Balas pesan target lalu ketik /unmute");

  try {
    await bot.restrictChatMember(chatId, target.id, {
      can_send_messages: true,
      can_send_other_messages: true
    });

    bot.sendMessage(chatId, `🔊 <b>${target.first_name}</b> berhasil di-unmute.`, { parse_mode: "HTML" });
  } catch {
    bot.sendMessage(chatId, "❌ Gagal unmute user.");
  }
});

// BAN
bot.onText(/^\/ban$/, async (msg) => {
  const chatId = msg.chat.id;

  if (!msg.chat.type.includes("group"))
    return bot.sendMessage(chatId, "❗ Ini fitur khusus grup.");

  if (msg.from.id !== OWNER_ID)
    return bot.sendMessage(chatId, "❌ Anda bukan owner");

  const target = msg.reply_to_message?.from;
  if (!target)
    return bot.sendMessage(chatId, "⚠️ Balas pesan target lalu ketik /ban");

  try {
    await bot.kickChatMember(chatId, target.id);
    bot.sendMessage(chatId, `🚫 <b>${target.first_name}</b> berhasil di-ban.`, { parse_mode: "HTML" });
  } catch {
    bot.sendMessage(chatId, "❌ Gagal ban user.");
  }
});

// UNBAN
bot.onText(/^\/unban$/, async (msg) => {
  const chatId = msg.chat.id;

  if (!msg.chat.type.includes("group"))
    return bot.sendMessage(chatId, "❗ Ini fitur khusus grup.");

  if (msg.from.id !== OWNER_ID)
    return bot.sendMessage(chatId, "❌ Anda bukan owner");

  const target = msg.reply_to_message?.from;
  if (!target)
    return bot.sendMessage(chatId, "⚠️ Balas pesan target lalu ketik /unban");

  try {
    await bot.unbanChatMember(chatId, target.id);
    bot.sendMessage(chatId, `♻️ <b>${target.first_name}</b> berhasil di-unban.`, { parse_mode: "HTML" });
  } catch {
    bot.sendMessage(chatId, "❌ Gagal unban user.");
  }
});

// KICK
bot.onText(/^\/kick$/, async (msg) => {
  const chatId = msg.chat.id;

  if (!msg.chat.type.includes("group"))
    return bot.sendMessage(chatId, "❗ Ini fitur khusus grup.");

  if (msg.from.id !== OWNER_ID)
    return bot.sendMessage(chatId, "❌ Anda bukan owner");

  const target = msg.reply_to_message?.from;
  if (!target)
    return bot.sendMessage(chatId, "⚠️ Balas pesan target lalu ketik /kick");

  try {
    await bot.kickChatMember(chatId, target.id);
    await bot.unbanChatMember(chatId, target.id); // agar bisa join lagi

    bot.sendMessage(chatId, `👢 <b>${target.first_name}</b> berhasil di-kick.`, { parse_mode: "HTML" });
  } catch {
    bot.sendMessage(chatId, "❌ Gagal kick user.");
  }
});
bot.onText(/^\/sticker$/, async (msg) => {
  const chatId = msg.chat.id;

  // fitur hanya di grup / private juga bisa
  const target = msg.reply_to_message;
  if (!target)
    return bot.sendMessage(chatId, "⚠️ Balas foto/video yang ingin dijadikan sticker.");

  let fileId = null;

  // Cek media
  if (target.photo) {
    fileId = target.photo[target.photo.length - 1].file_id; // kualitas tertinggi
  } else if (target.video) {
    fileId = target.video.file_id;
  } else if (target.document && target.document.mime_type.startsWith("image/")) {
    fileId = target.document.file_id;
  } else {
    return bot.sendMessage(chatId, "❌ Media tidak valid.\nBalas foto atau video pendek.");
  }

  try {
    // Kirim sebagai sticker
    await bot.sendSticker(chatId, fileId, {
      reply_to_message_id: msg.message_id
    });
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Gagal membuat sticker.");
  }
});
// /autodel
bot.onText(/^\/autodel(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userId !== OWNER_ID) return bot.sendMessage(chatId, "❌ Anda bukan owner");

  const param = match[1];
  if (!param) {
    return bot.sendMessage(chatId, "❗ Cara penggunaan:\n/autodel kata1,kata2,kata3");
  }

  const words = param
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0);

  const data = loadAutodel();
  data.words.push(...words);
  data.words = [...new Set(data.words)];
  saveAutodel(data);

  bot.sendMessage(chatId, `✅ Ditambahkan ke autodel:\n- ${words.join("\n- ")}`);
});

// /delautodel <kata>
bot.onText(/^\/delautodel(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userId !== OWNER_ID) return bot.sendMessage(chatId, "❌ Anda bukan owner");

  const word = match[1];
  if (!word) return bot.sendMessage(chatId, "❗ Cara penggunaan:\n/delautodel <kata>");

  const data = loadAutodel();
  const lower = word.toLowerCase();

  if (!data.words.includes(lower)) {
    return bot.sendMessage(chatId, `❌ Kata '${lower}' tidak ada dalam autodel.`);
  }

  data.words = data.words.filter((w) => w !== lower);
  saveAutodel(data);

  bot.sendMessage(chatId, `✅ Kata '${lower}' dihapus dari autodel.`);
});

// Auto delete
bot.on("message", async (msg) => {
  if (!msg.text) return;

  const text = msg.text.toLowerCase();
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userId === OWNER_ID) return;

  const data = loadAutodel();
  if (data.words.length === 0) return;

  for (const word of data.words) {
    if (text.includes(word)) {
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch {}
      break;
    }
  }
});
bot.onText(/^\/welcome\s+(on|off)$/i, (msg, match) => {
  const chatId = msg.chat.id;
  const status = match[1].toLowerCase(); // "on" atau "off"
  
  welcomeStatus[chatId] = status === "on" ? true : false;
  fs.writeFileSync(WELCOME_FILE, JSON.stringify(welcomeStatus, null, 2));

  bot.sendMessage(
    chatId,
    `✅ Fitur welcome telah di *${status}* di group ${chatId}`,
    { parse_mode: "Markdown" }
  );
});

// Event ketika member baru join
bot.on("new_chat_members", (msg) => {
  const chatId = msg.chat.id;

  // Cek apakah welcome aktif di grup ini
  if (!welcomeStatus[chatId]) return;

  msg.new_chat_members.forEach((member) => {
    const username = member.username ? `@${member.username}` : member.first_name;
    const welcomeMessage = `<blockquote>Hallo ${username} selamat datang di group panel by Rexzy 🚀</blockquote>
<blockquote>Rules Group!</blockquote>
- Jangan Promosi
- Jangan Sebar Domain
- Jangan DDoS
- Jangan Rusuh
- Jangan Bagi-Bagi Panel Free
<blockquote>Langgar? Kick no reff!!</blockquote>`;
    
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: "HTML" });
  });
});
}