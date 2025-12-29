const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  jidNormalizedUser,
  proto
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const crypto = require("crypto");
const axios = require("axios");
const readline = require("readline");

const settings = require("../settings.js");
const OWNER_ID = "./db/onlyID.json";
const OWNER_UID = settings.ownerId;
const OWNER_UIID = Number(settings.ownerId);
const ALLOWED_GROUP_ID = settings.groupId;

const {
    domain,
    plta,
    pltc,
    domainV2,
    pltaV2,
    pltcV2,
    domainV3,
    pltaV3,
    pltcV3,
    domainV4,
    pltaV4,
    pltcV4,
    domainV5,
    pltaV5,
    pltcV5,
    domainV6,
    pltaV6,
    pltcV6,
    domainV7,
    pltaV7,
    pltcV7,
    eggs,
    loc,
    dev,
    panel
} = settings;


// database cooldown
const COOLDOWN_FILE = "./db/cooldown.json";
const cooldowns = {};

// fungsi checkCooldown
function checkCooldown(msg) {
  const db = loadCooldown();
  const userId = msg.from.id.toString();
  const now = Date.now();

  if (!cooldowns[userId]) {
    cooldowns[userId] = now;
    return false;
  }

  const diff = now - cooldowns[userId];
  if (diff < db.globalCooldown) {
    const sisa = Math.ceil((db.globalCooldown - diff) / 1000);
    return `⏳ ᴛᴜɴɢɢᴜ ${sisa} ᴅᴇᴛɪᴋ ʟᴀɢɪ sᴇʙᴇʟᴜᴍ ᴘᴀᴋᴀɪ ᴄᴏᴍᴍᴀɴᴅ ɪɴɪ!`;
  }

  cooldowns[userId] = now;
  return false;
}

// fungsi load json file
function loadJsonData(filename) {
    try {
        if (fs.existsSync(filename)) {
            const data = fs.readFileSync(filename, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
    }
    return [];
}
// fungsi save json file
function saveJsonData(filename, data) {
    try {
        fs.writeFileSync(filename, JSON.stringify(data, null, 4));
        return true;
    } catch (error) {
        console.error(`Error saving ${filename}:`, error);
        return false;
    }
}
const specs = {
  "1gb":  { memo: 1024,  cpu: 30,  disk: 1024 },
  "2gb":  { memo: 2048,  cpu: 60,  disk: 2048 },
  "3gb":  { memo: 3072,  cpu: 90,  disk: 3072 },
  "4gb":  { memo: 4096,  cpu: 120, disk: 4096 },
  "5gb":  { memo: 5120,  cpu: 150, disk: 5120 },
  "6gb":  { memo: 6144,  cpu: 180, disk: 6144 },
  "7gb":  { memo: 7168,  cpu: 210, disk: 7168 },
  "8gb":  { memo: 8192,  cpu: 240, disk: 8192 },
  "9gb":  { memo: 9216,  cpu: 270, disk: 9216 },
  "10gb": { memo: 10240, cpu: 300, disk: 10240 },
  
  "1gbv2": { memo: 1024,  cpu: 30,  disk: 1024 },
  "2gbv2": { memo: 2048,  cpu: 60,  disk: 2048 },
  "3gbv2": { memo: 3072,  cpu: 90,  disk: 3072 },
  "4gbv2": { memo: 4096,  cpu: 120, disk: 4096 },
  "5gbv2": { memo: 5120,  cpu: 150, disk: 5120 },
  "6gbv2": { memo: 6144,  cpu: 180, disk: 6144 },
  "7gbv2": { memo: 7168,  cpu: 210, disk: 7168 },
  "8gbv2": { memo: 8192,  cpu: 240, disk: 8192 },
  "9gbv2": { memo: 9216,  cpu: 270, disk: 9216 },
  "10gbv2":{ memo: 10240, cpu: 300, disk: 10240 },

  "1gbv3": { memo: 1024,  cpu: 30,  disk: 1024 },
  "2gbv3": { memo: 2048,  cpu: 60,  disk: 2048 },
  "3gbv3": { memo: 3072,  cpu: 90,  disk: 3072 },
  "4gbv3": { memo: 4096,  cpu: 120, disk: 4096 },
  "5gbv3": { memo: 5120,  cpu: 150, disk: 5120 },
  "6gbv3": { memo: 6144,  cpu: 180, disk: 6144 },
  "7gbv3": { memo: 7168,  cpu: 210, disk: 7168 },
  "8gbv3": { memo: 8192,  cpu: 240, disk: 8192 },
  "9gbv3": { memo: 9216,  cpu: 270, disk: 9216 },
  "10gbv3":{ memo: 10240, cpu: 300, disk: 10240 },

  "1gbv4": { memo: 1024,  cpu: 30,  disk: 1024 },
  "2gbv4": { memo: 2048,  cpu: 60,  disk: 2048 },
  "3gbv4": { memo: 3072,  cpu: 90,  disk: 3072 },
  "4gbv4": { memo: 4096,  cpu: 120, disk: 4096 },
  "5gbv4": { memo: 5120,  cpu: 150, disk: 5120 },
  "6gbv4": { memo: 6144,  cpu: 180, disk: 6144 },
  "7gbv4": { memo: 7168,  cpu: 210, disk: 7168 },
  "8gbv4": { memo: 8192,  cpu: 240, disk: 8192 },
  "9gbv4": { memo: 9216,  cpu: 270, disk: 9216 },
  "10gbv4":{ memo: 10240, cpu: 300, disk: 10240 },

  "1gbv5": { memo: 1024,  cpu: 30,  disk: 1024 },
  "2gbv5": { memo: 2048,  cpu: 60,  disk: 2048 },
  "3gbv5": { memo: 3072,  cpu: 90,  disk: 3072 },
  "4gbv5": { memo: 4096,  cpu: 120, disk: 4096 },
  "5gbv5": { memo: 5120,  cpu: 150, disk: 5120 },
  "6gbv5": { memo: 6144,  cpu: 180, disk: 6144 },
  "7gbv5": { memo: 7168,  cpu: 210, disk: 7168 },
  "8gbv5": { memo: 8192,  cpu: 240, disk: 8192 },
  "9gbv5": { memo: 9216,  cpu: 270, disk: 9216 },
  "10gbv5":{ memo: 10240, cpu: 300, disk: 10240 },
  
  "1gbv6": { memo: 1024,  cpu: 30,  disk: 1024 },
  "2gbv6": { memo: 2048,  cpu: 60,  disk: 2048 },
  "3gbv6": { memo: 3072,  cpu: 90,  disk: 3072 },
  "4gbv6": { memo: 4096,  cpu: 120, disk: 4096 },
  "5gbv6": { memo: 5120,  cpu: 150, disk: 5120 },
  "6gbv6": { memo: 6144,  cpu: 180, disk: 6144 },
  "7gbv6": { memo: 7168,  cpu: 210, disk: 7168 },
  "8gbv6": { memo: 8192,  cpu: 240, disk: 8192 },
  "9gbv6": { memo: 9216,  cpu: 270, disk: 9216 },
  "10gbv6":{ memo: 10240, cpu: 300, disk: 10240 },

  "1gbv7": { memo: 1024,  cpu: 30,  disk: 1024 },
  "2gbv7": { memo: 2048,  cpu: 60,  disk: 2048 },
  "3gbv7": { memo: 3072,  cpu: 90,  disk: 3072 },
  "4gbv7": { memo: 4096,  cpu: 120, disk: 4096 },
  "5gbv7": { memo: 5120,  cpu: 150, disk: 5120 },
  "6gbv7": { memo: 6144,  cpu: 180, disk: 6144 },
  "7gbv7": { memo: 7168,  cpu: 210, disk: 7168 },
  "8gbv7": { memo: 8192,  cpu: 240, disk: 8192 },
  "9gbv7": { memo: 9216,  cpu: 270, disk: 9216 },
  "10gbv7":{ memo: 10240, cpu: 300, disk: 10240 }
};
const domainMap = {
  "2": domainV2,
  "3": domainV3,
  "4": domainV4,
  "5": domainV5,
  "6": domainV6,
  "7": domainV7
};

const pltaMap = {
  "2": pltaV2,
  "3": pltaV3,
  "4": pltaV4,
  "5": pltaV5,
  "6": pltaV6,
  "7": pltaV7
};
const OWNER_FILE = './db/users/adminID.json';

const PREMIUM_FILE = './db/users/premiumUsers.json';
const PREMV2_FILE = './db/users/version/premiumV2.json';
const PREMV3_FILE = './db/users/version/premiumV3.json';
const PREMV4_FILE = './db/users/version/premiumV4.json';
const PREMV5_FILE = './db/users/version/premiumV5.json';
const PREMV6_FILE = './db/users/version/premiumV6.json';
const PREMV7_FILE = './db/users/version/premiumV7.json';

const RESS_FILE = './db/users/resellerUsers.json';
const RESSV2_FILE = './db/users/version/resellerV2.json';
const RESSV3_FILE = './db/users/version/resellerV3.json';
const RESSV4_FILE = './db/users/version/resellerV4.json';
const RESSV5_FILE = './db/users/version/resellerV5.json';
const RESSV6_FILE = './db/users/version/resellerV6.json';
const RESSV7_FILE = './db/users/version/resellerV7.json';


module.exports = (bot) => {

  let sock = null;
  let isWhatsAppConnected = false;

  const randomImages = ["https://files.catbox.moe/9j09ut.jpg"];
  const getRandomImage = () => randomImages[Math.floor(Math.random() * randomImages.length)];

  // Fungsi tanya di terminal
  const question = (query) =>
    new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
      });
    });

  // Start WA session
  const startSesi = async () => {
    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      auth: state,
      browser: ["Mac OS", "Safari", "10.15.7"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "open") isWhatsAppConnected = true;

      if (connection === "close") {
        if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut)
          startSesi();

        isWhatsAppConnected = false;
      }
    });
  };

  // Middleware manual
  const checkWhatsAppConnection = async (chatId) => {
    if (!isWhatsAppConnected) {
      await bot.sendMessage(chatId, "❌ Tidak ada WhatsApp yg terhubung.");
      return false;
    }
    return true;
  }
  
// ================= /CADPWA =================
bot.onText(/^\/cadpwa(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1] ? match[1].trim() : null;

  if (!(await checkWhatsAppConnection(chatId))) return;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const premiumUsers = JSON.parse(fs.readFileSync(PREMIUM_FILE));
  if (!premiumUsers.includes(String(userId))) {
    return bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses premium!");
  }

  if (!text) {
    return bot.sendMessage(chatId, "❌ Cara penggunaan:\n/cadpwa nama,628xxxx");
  }

  const [panelName, waNumber] = text.split(",").map(v => v.trim());
  if (!panelName || !waNumber || !/^62\d{8,15}$/.test(waNumber)) {
    return bot.sendMessage(chatId, "❌ Cara penggunaan:\n/cadpwa nama,628xxxx");
  }

  const password = panelName + Math.random().toString(36).slice(2, 5);

  try {
    const res = await fetch(`${domain}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
      body: JSON.stringify({
        email: `${panelName}@gmail.com`,
        username: panelName,
        first_name: panelName,
        last_name: "admin",
        language: "en",
        root_admin: true,
        password,
      }),
    });

    const result = await res.json();
    if (result.errors) {
      return bot.sendMessage(chatId, JSON.stringify(result.errors[0], null, 2));
    }

    const user = result.attributes;

    // ================= TELEGRAM DATA =================
    const tgPanelText = `
TYPE: ADMIN PANEL
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ ADMIN: ${user.root_admin}
`;

    await bot.sendMessage(chatId, tgPanelText.trim());

    // ================= WHATSAPP DATA =================
    const waText = `
🔐 DATA ADMIN PANEL ANDA

🌐 Login: ${domain}
👤 Username: ${panelName}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

    try {
      await sock.sendMessage(`${waNumber}@s.whatsapp.net`, { text: waText });

      await bot.sendMessage(
        chatId,
        `✅ Admin panel berhasil dibuat & dikirim ke ${waNumber}`,
        { reply_to_message_id: msg.message_id }
      );
    } catch (err) {
      await bot.sendMessage(
        chatId,
        `⚠️ Admin panel berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
      );
    }

  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Gagal membuat admin panel.");
  }
});
// ================= /CADPWA =================
bot.onText(/^\/cadpwav2(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1] ? match[1].trim() : null;

  if (!(await checkWhatsAppConnection(chatId))) return;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const premiumUsers = JSON.parse(fs.readFileSync(PREMV2_FILE));
  if (!premiumUsers.includes(String(userId))) {
    return bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses premium v2!");
  }

  if (!text) {
    return bot.sendMessage(chatId, "❌ Cara penggunaan:\n/cadpwav2 nama,628xxxx");
  }

  const [panelName, waNumber] = text.split(",").map(v => v.trim());
  if (!panelName || !waNumber || !/^62\d{8,15}$/.test(waNumber)) {
    return bot.sendMessage(chatId, "❌ Cara penggunaan:\n/cadpwav2 nama,628xxxx");
  }

  const password = panelName + Math.random().toString(36).slice(2, 5);

  try {
    const res = await fetch(`${domainV2}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV2}`,
      },
      body: JSON.stringify({
        email: `${panelName}@gmail.com`,
        username: panelName,
        first_name: panelName,
        last_name: "admin",
        language: "en",
        root_admin: true,
        password,
      }),
    });

    const result = await res.json();
    if (result.errors) {
      return bot.sendMessage(chatId, JSON.stringify(result.errors[0], null, 2));
    }

    const user = result.attributes;

    // ================= TELEGRAM DATA =================
    const tgPanelText = `
TYPE: ADMIN PANEL V2
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ ADMIN: ${user.root_admin}
`;

    await bot.sendMessage(chatId, tgPanelText.trim());

    // ================= WHATSAPP DATA =================
    const waText = `
🔐 BERIKUT DATA ADMIN PANEL V2 ANDA

🌐 Login: ${domain}
👤 Username: ${panelName}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

    try {
      await sock.sendMessage(`${waNumber}@s.whatsapp.net`, { text: waText });

      await bot.sendMessage(
        chatId,
        `✅ Admin panel berhasil dibuat & dikirim ke ${waNumber}`,
        { reply_to_message_id: msg.message_id }
      );
    } catch (err) {
      await bot.sendMessage(
        chatId,
        `⚠️ Admin panel berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
      );
    }

  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Gagal membuat admin panel.");
  }
});
bot.onText(/^\/cadpwav3(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1] ? match[1].trim() : null;

  if (!(await checkWhatsAppConnection(chatId))) return;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const premiumUsers = JSON.parse(fs.readFileSync(PREMV3_FILE));
  if (!premiumUsers.includes(String(userId))) {
    return bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses premium v3!");
  }

  if (!text) {
    return bot.sendMessage(chatId, "❌ Cara penggunaan:\n/cadpwav3 nama,628xxxx");
  }

  const [panelName, waNumber] = text.split(",").map(v => v.trim());
  if (!panelName || !waNumber || !/^62\d{8,15}$/.test(waNumber)) {
    return bot.sendMessage(chatId, "❌ Cara penggunaan:\n/cadpwav3 nama,628xxxx");
  }

  const password = panelName + Math.random().toString(36).slice(2, 5);

  try {
    const res = await fetch(`${domainV3}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV3}`,
      },
      body: JSON.stringify({
        email: `${panelName}@gmail.com`,
        username: panelName,
        first_name: panelName,
        last_name: "admin",
        language: "en",
        root_admin: true,
        password,
      }),
    });

    const result = await res.json();
    if (result.errors) {
      return bot.sendMessage(chatId, JSON.stringify(result.errors[0], null, 2));
    }

    const user = result.attributes;

    // ================= TELEGRAM DATA =================
    const tgPanelText = `
TYPE: ADMIN PANEL V3
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ ADMIN: ${user.root_admin}
`;

    await bot.sendMessage(chatId, tgPanelText.trim());

    // ================= WHATSAPP DATA =================
    const waText = `
🔐 BERIKUT DATA ADMIN PANEL V3 ANDA

🌐 Login: ${domain}
👤 Username: ${panelName}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

    try {
      await sock.sendMessage(`${waNumber}@s.whatsapp.net`, { text: waText });

      await bot.sendMessage(
        chatId,
        `✅ Admin panel v3 berhasil dibuat & dikirim ke ${waNumber}`,
        { reply_to_message_id: msg.message_id }
      );
    } catch (err) {
      await bot.sendMessage(
        chatId,
        `⚠️ Admin panel v3 berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
      );
    }

  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Gagal membuat admin panel.");
  }
});
bot.onText(/^\/cadpwav4(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1] ? match[1].trim() : null;

  if (!(await checkWhatsAppConnection(chatId))) return;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const premiumUsers = JSON.parse(fs.readFileSync(PREMV4_FILE));
  if (!premiumUsers.includes(String(userId))) {
    return bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses premium v4!");
  }

  if (!text) {
    return bot.sendMessage(chatId, "❌ Cara penggunaan:\n/cadpwav4 nama,628xxxx");
  }

  const [panelName, waNumber] = text.split(",").map(v => v.trim());
  if (!panelName || !waNumber || !/^62\d{8,15}$/.test(waNumber)) {
    return bot.sendMessage(chatId, "❌ Cara penggunaan:\n/cadpwav4 nama,628xxxx");
  }

  const password = panelName + Math.random().toString(36).slice(2, 5);

  try {
    const res = await fetch(`${domainV4}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV4}`,
      },
      body: JSON.stringify({
        email: `${panelName}@gmail.com`,
        username: panelName,
        first_name: panelName,
        last_name: "admin",
        language: "en",
        root_admin: true,
        password,
      }),
    });

    const result = await res.json();
    if (result.errors) {
      return bot.sendMessage(chatId, JSON.stringify(result.errors[0], null, 2));
    }

    const user = result.attributes;

    // ================= TELEGRAM DATA =================
    const tgPanelText = `
TYPE: ADMIN PANEL V4
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ ADMIN: ${user.root_admin}
`;

    await bot.sendMessage(chatId, tgPanelText.trim());

    // ================= WHATSAPP DATA =================
    const waText = `
🔐 BERIKUT DATA ADMIN PANEL V4 ANDA

🌐 Login: ${domain}
👤 Username: ${panelName}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

    try {
      await sock.sendMessage(`${waNumber}@s.whatsapp.net`, { text: waText });

      await bot.sendMessage(
        chatId,
        `✅ Admin panel v4 berhasil dibuat & dikirim ke ${waNumber}`,
        { reply_to_message_id: msg.message_id }
      );
    } catch (err) {
      await bot.sendMessage(
        chatId,
        `⚠️ Admin panel v4 berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
      );
    }

  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Gagal membuat admin panel.");
  }
});
bot.onText(/^\/cadpwav5(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1] ? match[1].trim() : null;

  if (!(await checkWhatsAppConnection(chatId))) return;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const premiumUsers = JSON.parse(fs.readFileSync(PREMV5_FILE));
  if (!premiumUsers.includes(String(userId))) {
    return bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses premium v5!");
  }

  if (!text) {
    return bot.sendMessage(chatId, "❌ Cara penggunaan:\n/cadpwav5 nama,628xxxx");
  }

  const [panelName, waNumber] = text.split(",").map(v => v.trim());
  if (!panelName || !waNumber || !/^62\d{8,15}$/.test(waNumber)) {
    return bot.sendMessage(chatId, "❌ Cara penggunaan:\n/cadpwav5 nama,628xxxx");
  }

  const password = panelName + Math.random().toString(36).slice(2, 5);

  try {
    const res = await fetch(`${domainV5}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV5}`,
      },
      body: JSON.stringify({
        email: `${panelName}@gmail.com`,
        username: panelName,
        first_name: panelName,
        last_name: "admin",
        language: "en",
        root_admin: true,
        password,
      }),
    });

    const result = await res.json();
    if (result.errors) {
      return bot.sendMessage(chatId, JSON.stringify(result.errors[0], null, 2));
    }

    const user = result.attributes;

    // ================= TELEGRAM DATA =================
    const tgPanelText = `
TYPE: ADMIN PANEL V5
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ ADMIN: ${user.root_admin}
`;

    await bot.sendMessage(chatId, tgPanelText.trim());

    // ================= WHATSAPP DATA =================
    const waText = `
🔐 BERIKUT DATA ADMIN PANEL V5 ANDA

🌐 Login: ${domain}
👤 Username: ${panelName}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

    try {
      await sock.sendMessage(`${waNumber}@s.whatsapp.net`, { text: waText });

      await bot.sendMessage(
        chatId,
        `✅ Admin panel v5 berhasil dibuat & dikirim ke ${waNumber}`,
        { reply_to_message_id: msg.message_id }
      );
    } catch (err) {
      await bot.sendMessage(
        chatId,
        `⚠️ Admin panel v5 berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
      );
    }

  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Gagal membuat admin panel.");
  }
});
bot.onText(/^\/cadpwav6(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1] ? match[1].trim() : null;

  if (!(await checkWhatsAppConnection(chatId))) return;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const premiumUsers = JSON.parse(fs.readFileSync(PREMV6_FILE));
  if (!premiumUsers.includes(String(userId))) {
    return bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses premium v6!");
  }

  if (!text) {
    return bot.sendMessage(chatId, "❌ Cara penggunaan:\n/cadpwav6 nama,628xxxx");
  }

  const [panelName, waNumber] = text.split(",").map(v => v.trim());
  if (!panelName || !waNumber || !/^62\d{8,15}$/.test(waNumber)) {
    return bot.sendMessage(chatId, "❌ Cara penggunaan:\n/cadpwav6 nama,628xxxx");
  }

  const password = panelName + Math.random().toString(36).slice(2, 5);

  try {
    const res = await fetch(`${domainV6}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV6}`,
      },
      body: JSON.stringify({
        email: `${panelName}@gmail.com`,
        username: panelName,
        first_name: panelName,
        last_name: "admin",
        language: "en",
        root_admin: true,
        password,
      }),
    });

    const result = await res.json();
    if (result.errors) {
      return bot.sendMessage(chatId, JSON.stringify(result.errors[0], null, 2));
    }

    const user = result.attributes;

    // ================= TELEGRAM DATA =================
    const tgPanelText = `
TYPE: ADMIN PANEL V6
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ ADMIN: ${user.root_admin}
`;

    await bot.sendMessage(chatId, tgPanelText.trim());

    // ================= WHATSAPP DATA =================
    const waText = `
🔐 BERIKUT DATA ADMIN PANEL V6 ANDA

🌐 Login: ${domain}
👤 Username: ${panelName}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

    try {
      await sock.sendMessage(`${waNumber}@s.whatsapp.net`, { text: waText });

      await bot.sendMessage(
        chatId,
        `✅ Admin panel v6 berhasil dibuat & dikirim ke ${waNumber}`,
        { reply_to_message_id: msg.message_id }
      );
    } catch (err) {
      await bot.sendMessage(
        chatId,
        `⚠️ Admin panel v6 berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
      );
    }

  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Gagal membuat admin panel.");
  }
});
bot.onText(/^\/cadpwav7(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1] ? match[1].trim() : null;

  if (!(await checkWhatsAppConnection(chatId))) return;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const premiumUsers = JSON.parse(fs.readFileSync(PREMV7_FILE));
  if (!premiumUsers.includes(String(userId))) {
    return bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses premium v7!");
  }

  if (!text) {
    return bot.sendMessage(chatId, "❌ Cara penggunaan:\n/cadpwav7 nama,628xxxx");
  }

  const [panelName, waNumber] = text.split(",").map(v => v.trim());
  if (!panelName || !waNumber || !/^62\d{8,15}$/.test(waNumber)) {
    return bot.sendMessage(chatId, "❌ Cara penggunaan:\n/cadpwav7 nama,628xxxx");
  }

  const password = panelName + Math.random().toString(36).slice(2, 5);

  try {
    const res = await fetch(`${domainV7}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV7}`,
      },
      body: JSON.stringify({
        email: `${panelName}@gmail.com`,
        username: panelName,
        first_name: panelName,
        last_name: "admin",
        language: "en",
        root_admin: true,
        password,
      }),
    });

    const result = await res.json();
    if (result.errors) {
      return bot.sendMessage(chatId, JSON.stringify(result.errors[0], null, 2));
    }

    const user = result.attributes;

    // ================= TELEGRAM DATA =================
    const tgPanelText = `
TYPE: ADMIN PANEL V7
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ ADMIN: ${user.root_admin}
`;

    await bot.sendMessage(chatId, tgPanelText.trim());

    // ================= WHATSAPP DATA =================
    const waText = `
🔐 BERIKUT DATA ADMIN PANEL V7 ANDA

🌐 Login: ${domain}
👤 Username: ${panelName}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

    try {
      await sock.sendMessage(`${waNumber}@s.whatsapp.net`, { text: waText });

      await bot.sendMessage(
        chatId,
        `✅ Admin panel v7 berhasil dibuat & dikirim ke ${waNumber}`,
        { reply_to_message_id: msg.message_id }
      );
    } catch (err) {
      await bot.sendMessage(
        chatId,
        `⚠️ Admin panel v7 berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
      );
    }

  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Gagal membuat admin panel.");
  }
});

bot.onText(/^\/unliwa(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  if (!(await checkWhatsAppConnection(chatId))) return;

  const text = match[1] ? match[1].trim() : "";
  if (!text) {
    return bot.sendMessage(chatId, "⚠️ Cara penggunaan:\n/unliwa nama,628xxxx");
  }

  const t = text.split(",");
  if (t.length < 2) {
    return bot.sendMessage(chatId, "⚠️ Cara penggunaan:\n/unliwa nama,628xxxx");
  }

  const ressUsers = JSON.parse(fs.readFileSync(RESS_FILE));
  if (!ressUsers.includes(String(msg.from.id))) {
    return bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller!");
  }

  const username = t[0].trim();
  const waNumber = t[1].trim().replace(/[^0-9]/g, "");
  const name = username + "unli";
  const email = `${username}@gmail.com`;
  const password = username + Math.random().toString(36).slice(2, 5);

  let user, server;

  try {
    const response = await fetch(`${domain}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
      body: JSON.stringify({
        email,
        username,
        first_name: username,
        last_name: username,
        language: "en",
        password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      return bot.sendMessage(chatId, "❌ Username / Email sudah ada di panel!");
    }

    user = data.attributes;

    const response2 = await fetch(`${domain}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
      body: JSON.stringify({
        name,
        user: user.id,
        egg: parseInt(eggs),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: "npm start",
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: { memory: 0, swap: 0, disk: 0, io: 500, cpu: 0 },
        feature_limits: { databases: 5, backups: 5, allocations: 1 },
        deploy: {
          locations: [parseInt(settings.loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      return bot.sendMessage(chatId, "❌ Gagal membuat server!");
    }

    server = data2.attributes;

    await bot.sendMessage(
      chatId,
      `Type: Panel Unli
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB`
    );
  } catch (e) {
    return bot.sendMessage(chatId, `❌ Error API: ${e.message}`);
  }

  const waText = `
🔐 DATA PANEL UNLIMITED
🌐 Login: ${domain}
👤 Username: ${username}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

  try {
    await sock.sendMessage(`${waNumber}@s.whatsapp.net`, { text: waText });

    await bot.sendMessage(
      chatId,
      `✅ Panel berhasil dibuat & dikirim ke ${waNumber}`,
      { reply_to_message_id: msg.message_id }
    );
  } catch (err) {
    await bot.sendMessage(
      chatId,
      `⚠️ Panel berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
    );
  }
});
bot.onText(/^\/unliwav2(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  if (!(await checkWhatsAppConnection(chatId))) return;

  const text = match[1] ? match[1].trim() : "";
  if (!text) {
    return bot.sendMessage(chatId, "⚠️ Cara penggunaan:\n/unliwav2 nama,628xxxx");
  }

  const t = text.split(",");
  if (t.length < 2) {
    return bot.sendMessage(chatId, "⚠️ Cara penggunaan:\n/unliwav2 nama,628xxxx");
  }

  const ressUsers = JSON.parse(fs.readFileSync(RESSV2_FILE));
  if (!ressUsers.includes(String(msg.from.id))) {
    return bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller v2!");
  }

  const username = t[0].trim();
  const waNumber = t[1].trim().replace(/[^0-9]/g, "");
  const name = username + "unli";
  const email = `${username}@gmail.com`;
  const password = username + Math.random().toString(36).slice(2, 5);

  let user, server;

  try {
    const response = await fetch(`${domainV2}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV2}`,
      },
      body: JSON.stringify({
        email,
        username,
        first_name: username,
        last_name: username,
        language: "en",
        password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      return bot.sendMessage(chatId, "❌ Username / Email sudah ada di panel!");
    }

    user = data.attributes;

    const response2 = await fetch(`${domainV2}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV2}`,
      },
      body: JSON.stringify({
        name,
        user: user.id,
        egg: parseInt(eggs),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: "npm start",
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: { memory: 0, swap: 0, disk: 0, io: 500, cpu: 0 },
        feature_limits: { databases: 5, backups: 5, allocations: 1 },
        deploy: {
          locations: [parseInt(settings.loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      return bot.sendMessage(chatId, "❌ Gagal membuat server!");
    }

    server = data2.attributes;

    await bot.sendMessage(
      chatId,
      `Type: Panel Unli V2
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB`
    );
  } catch (e) {
    return bot.sendMessage(chatId, `❌ Error API: ${e.message}`);
  }

  const waText = `
🔐 DATA PANEL UNLIMITED V2 
🌐 Login: ${domain}
👤 Username: ${username}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

  try {
    await sock.sendMessage(`${waNumber}@s.whatsapp.net`, { text: waText });

    await bot.sendMessage(
      chatId,
      `✅ Panel V2 berhasil dibuat & dikirim ke ${waNumber}`,
      { reply_to_message_id: msg.message_id }
    );
  } catch (err) {
    await bot.sendMessage(
      chatId,
      `⚠️ Panel V2 berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
    );
  }
});
bot.onText(/^\/unliwav3(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  if (!(await checkWhatsAppConnection(chatId))) return;

  const text = match[1] ? match[1].trim() : "";
  if (!text) {
    return bot.sendMessage(chatId, "⚠️ Cara penggunaan:\n/unliwav3 nama,628xxxx");
  }

  const t = text.split(",");
  if (t.length < 2) {
    return bot.sendMessage(chatId, "⚠️ Cara penggunaan:\n/unliwav3 nama,628xxxx");
  }

  const ressUsers = JSON.parse(fs.readFileSync(RESSV3_FILE));
  if (!ressUsers.includes(String(msg.from.id))) {
    return bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller v3!");
  }

  const username = t[0].trim();
  const waNumber = t[1].trim().replace(/[^0-9]/g, "");
  const name = username + "unli";
  const email = `${username}@gmail.com`;
  const password = username + Math.random().toString(36).slice(2, 5);

  let user, server;

  try {
    const response = await fetch(`${domainV3}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV3}`,
      },
      body: JSON.stringify({
        email,
        username,
        first_name: username,
        last_name: username,
        language: "en",
        password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      return bot.sendMessage(chatId, "❌ Username / Email sudah ada di panel!");
    }

    user = data.attributes;

    const response2 = await fetch(`${domainV3}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV3}`,
      },
      body: JSON.stringify({
        name,
        user: user.id,
        egg: parseInt(eggs),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: "npm start",
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: { memory: 0, swap: 0, disk: 0, io: 500, cpu: 0 },
        feature_limits: { databases: 5, backups: 5, allocations: 1 },
        deploy: {
          locations: [parseInt(settings.loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      return bot.sendMessage(chatId, "❌ Gagal membuat server!");
    }

    server = data2.attributes;

    await bot.sendMessage(
      chatId,
      `Type: Panel Unli V3
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB`
    );
  } catch (e) {
    return bot.sendMessage(chatId, `❌ Error API: ${e.message}`);
  }

  const waText = `
🔐 DATA PANEL UNLIMITED V3 
🌐 Login: ${domain}
👤 Username: ${username}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

  try {
    await sock.sendMessage(`${waNumber}@s.whatsapp.net`, { text: waText });

    await bot.sendMessage(
      chatId,
      `✅ Panel V3 berhasil dibuat & dikirim ke ${waNumber}`,
      { reply_to_message_id: msg.message_id }
    );
  } catch (err) {
    await bot.sendMessage(
      chatId,
      `⚠️ Panel V3 berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
    );
  }
});
bot.onText(/^\/unliwav4(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  if (!(await checkWhatsAppConnection(chatId))) return;

  const text = match[1] ? match[1].trim() : "";
  if (!text) {
    return bot.sendMessage(chatId, "⚠️ Cara penggunaan:\n/unliwav4 nama,628xxxx");
  }

  const t = text.split(",");
  if (t.length < 2) {
    return bot.sendMessage(chatId, "⚠️ Cara penggunaan:\n/unliwav4 nama,628xxxx");
  }

  const ressUsers = JSON.parse(fs.readFileSync(RESSV4_FILE));
  if (!ressUsers.includes(String(msg.from.id))) {
    return bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller v4!");
  }

  const username = t[0].trim();
  const waNumber = t[1].trim().replace(/[^0-9]/g, "");
  const name = username + "unli";
  const email = `${username}@gmail.com`;
  const password = username + Math.random().toString(36).slice(2, 5);

  let user, server;

  try {
    const response = await fetch(`${domainV4}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV4}`,
      },
      body: JSON.stringify({
        email,
        username,
        first_name: username,
        last_name: username,
        language: "en",
        password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      return bot.sendMessage(chatId, "❌ Username / Email sudah ada di panel!");
    }

    user = data.attributes;

    const response2 = await fetch(`${domainV4}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV4}`,
      },
      body: JSON.stringify({
        name,
        user: user.id,
        egg: parseInt(eggs),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: "npm start",
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: { memory: 0, swap: 0, disk: 0, io: 500, cpu: 0 },
        feature_limits: { databases: 5, backups: 5, allocations: 1 },
        deploy: {
          locations: [parseInt(settings.loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      return bot.sendMessage(chatId, "❌ Gagal membuat server!");
    }

    server = data2.attributes;

    await bot.sendMessage(
      chatId,
      `Type: Panel Unli V4
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB`
    );
  } catch (e) {
    return bot.sendMessage(chatId, `❌ Error API: ${e.message}`);
  }

  const waText = `
🔐 DATA PANEL UNLIMITED V4 
🌐 Login: ${domain}
👤 Username: ${username}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

  try {
    await sock.sendMessage(`${waNumber}@s.whatsapp.net`, { text: waText });

    await bot.sendMessage(
      chatId,
      `✅ Panel V4 berhasil dibuat & dikirim ke ${waNumber}`,
      { reply_to_message_id: msg.message_id }
    );
  } catch (err) {
    await bot.sendMessage(
      chatId,
      `⚠️ Panel V4 berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
    );
  }
});
bot.onText(/^\/unliwav5(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  if (!(await checkWhatsAppConnection(chatId))) return;

  const text = match[1] ? match[1].trim() : "";
  if (!text) {
    return bot.sendMessage(chatId, "⚠️ Cara penggunaan:\n/unliwav5 nama,628xxxx");
  }

  const t = text.split(",");
  if (t.length < 2) {
    return bot.sendMessage(chatId, "⚠️ Cara penggunaan:\n/unliwav5 nama,628xxxx");
  }

  const ressUsers = JSON.parse(fs.readFileSync(RESSV5_FILE));
  if (!ressUsers.includes(String(msg.from.id))) {
    return bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller v5!");
  }

  const username = t[0].trim();
  const waNumber = t[1].trim().replace(/[^0-9]/g, "");
  const name = username + "unli";
  const email = `${username}@gmail.com`;
  const password = username + Math.random().toString(36).slice(2, 5);

  let user, server;

  try {
    const response = await fetch(`${domainV5}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV5}`,
      },
      body: JSON.stringify({
        email,
        username,
        first_name: username,
        last_name: username,
        language: "en",
        password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      return bot.sendMessage(chatId, "❌ Username / Email sudah ada di panel!");
    }

    user = data.attributes;

    const response2 = await fetch(`${domainV5}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV5}`,
      },
      body: JSON.stringify({
        name,
        user: user.id,
        egg: parseInt(eggs),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: "npm start",
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: { memory: 0, swap: 0, disk: 0, io: 500, cpu: 0 },
        feature_limits: { databases: 5, backups: 5, allocations: 1 },
        deploy: {
          locations: [parseInt(settings.loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      return bot.sendMessage(chatId, "❌ Gagal membuat server!");
    }

    server = data2.attributes;

    await bot.sendMessage(
      chatId,
      `Type: Panel Unli V5
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB`
    );
  } catch (e) {
    return bot.sendMessage(chatId, `❌ Error API: ${e.message}`);
  }

  const waText = `
🔐 DATA PANEL UNLIMITED V5 
🌐 Login: ${domain}
👤 Username: ${username}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

  try {
    await sock.sendMessage(`${waNumber}@s.whatsapp.net`, { text: waText });

    await bot.sendMessage(
      chatId,
      `✅ Panel V5 berhasil dibuat & dikirim ke ${waNumber}`,
      { reply_to_message_id: msg.message_id }
    );
  } catch (err) {
    await bot.sendMessage(
      chatId,
      `⚠️ Panel V5 berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
    );
  }
});
bot.onText(/^\/unliwav6(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  if (!(await checkWhatsAppConnection(chatId))) return;

  const text = match[1] ? match[1].trim() : "";
  if (!text) {
    return bot.sendMessage(chatId, "⚠️ Cara penggunaan:\n/unliwav6 nama,628xxxx");
  }

  const t = text.split(",");
  if (t.length < 2) {
    return bot.sendMessage(chatId, "⚠️ Cara penggunaan:\n/unliwav6 nama,628xxxx");
  }

  const ressUsers = JSON.parse(fs.readFileSync(RESSV6_FILE));
  if (!ressUsers.includes(String(msg.from.id))) {
    return bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller v6!");
  }

  const username = t[0].trim();
  const waNumber = t[1].trim().replace(/[^0-9]/g, "");
  const name = username + "unli";
  const email = `${username}@gmail.com`;
  const password = username + Math.random().toString(36).slice(2, 5);

  let user, server;

  try {
    const response = await fetch(`${domainV6}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV6}`,
      },
      body: JSON.stringify({
        email,
        username,
        first_name: username,
        last_name: username,
        language: "en",
        password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      return bot.sendMessage(chatId, "❌ Username / Email sudah ada di panel!");
    }

    user = data.attributes;

    const response2 = await fetch(`${domainV6}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV6}`,
      },
      body: JSON.stringify({
        name,
        user: user.id,
        egg: parseInt(eggs),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: "npm start",
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: { memory: 0, swap: 0, disk: 0, io: 500, cpu: 0 },
        feature_limits: { databases: 5, backups: 5, allocations: 1 },
        deploy: {
          locations: [parseInt(settings.loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      return bot.sendMessage(chatId, "❌ Gagal membuat server!");
    }

    server = data2.attributes;

    await bot.sendMessage(
      chatId,
      `Type: Panel Unli V6
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB`
    );
  } catch (e) {
    return bot.sendMessage(chatId, `❌ Error API: ${e.message}`);
  }

  const waText = `
🔐 DATA PANEL UNLIMITED V6 
🌐 Login: ${domain}
👤 Username: ${username}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

  try {
    await sock.sendMessage(`${waNumber}@s.whatsapp.net`, { text: waText });

    await bot.sendMessage(
      chatId,
      `✅ Panel V6 berhasil dibuat & dikirim ke ${waNumber}`,
      { reply_to_message_id: msg.message_id }
    );
  } catch (err) {
    await bot.sendMessage(
      chatId,
      `⚠️ Panel V6 berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
    );
  }
});
bot.onText(/^\/unliwav7(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  if (!(await checkWhatsAppConnection(chatId))) return;

  const text = match[1] ? match[1].trim() : "";
  if (!text) {
    return bot.sendMessage(chatId, "⚠️ Cara penggunaan:\n/unliwav7 nama,628xxxx");
  }

  const t = text.split(",");
  if (t.length < 2) {
    return bot.sendMessage(chatId, "⚠️ Cara penggunaan:\n/unliwav7 nama,628xxxx");
  }

  const ressUsers = JSON.parse(fs.readFileSync(RESSV7_FILE));
  if (!ressUsers.includes(String(msg.from.id))) {
    return bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller v7!");
  }

  const username = t[0].trim();
  const waNumber = t[1].trim().replace(/[^0-9]/g, "");
  const name = username + "unli";
  const email = `${username}@gmail.com`;
  const password = username + Math.random().toString(36).slice(2, 5);

  let user, server;

  try {
    const response = await fetch(`${domainV7}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV7}`,
      },
      body: JSON.stringify({
        email,
        username,
        first_name: username,
        last_name: username,
        language: "en",
        password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      return bot.sendMessage(chatId, "❌ Username / Email sudah ada di panel!");
    }

    user = data.attributes;

    const response2 = await fetch(`${domainV7}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV7}`,
      },
      body: JSON.stringify({
        name,
        user: user.id,
        egg: parseInt(eggs),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: "npm start",
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: { memory: 0, swap: 0, disk: 0, io: 500, cpu: 0 },
        feature_limits: { databases: 5, backups: 5, allocations: 1 },
        deploy: {
          locations: [parseInt(settings.loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      return bot.sendMessage(chatId, "❌ Gagal membuat server!");
    }

    server = data2.attributes;

    await bot.sendMessage(
      chatId,
      `Type: Panel Unli V7
📡 ID: ${user.id}
👤 USERNAME: ${username} 
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB`
    );
  } catch (e) {
    return bot.sendMessage(chatId, `❌ Error API: ${e.message}`);
  }

  const waText = `
🔐 DATA PANEL UNLIMITED V7 
🌐 Login: ${domain}
👤 Username: ${username}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

  try {
    await sock.sendMessage(`${waNumber}@s.whatsapp.net`, { text: waText });

    await bot.sendMessage(
      chatId,
      `✅ Panel V7 berhasil dibuat & dikirim ke ${waNumber}`,
      { reply_to_message_id: msg.message_id }
    );
  } catch (err) {
    await bot.sendMessage(
      chatId,
      `⚠️ Panel V7 berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
    );
  }
});
bot.onText(/^\/(1|2|3|4|5|6|7|8|9|10)gbwav([2-7])(?:\s+)?(.*)?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!(await checkWhatsAppConnection(chatId))) return;
  
  // ===== CEK GRUP =====
      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  // ===== CEK RESELLER =====
  const ressUsers = JSON.parse(fs.readFileSync(RESS_FILE));
  if (!ressUsers.includes(String(userId))) {
    return bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }],
        ],
      },
    });
  }

  const size = match[1];
  const ver = match[2];
  const text = match[3];

  if (!text) {
    return bot.sendMessage(
      chatId,
      `❌ Format Salah: /${size}gbv${ver} nama,wa`
    );
  }

  const t = text.split(",");
  if (t.length < 2) {
    return bot.sendMessage(
      chatId,
      `❌ Format Salah: /${size}gbv${ver} nama,wa`
    );
  }

  const username = t[0].trim();
  const waNumber = t[1].trim();
  const email = `${username}@gmail.com`;
  const name = `${username}${size}gb`;

  const key = `${size}gbv${ver}`;
  const spec = specs[key];
  if (!spec) return bot.sendMessage(chatId, "❌ Spesifikasi tidak ditemukan");

  const panelDomain = domainMap[ver];
  const plta = pltaMap[ver];

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const password = Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");

  let user, server;

  try {
    // ===== CREATE USER =====
    const resUser = await fetch(`${panelDomain}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
      body: JSON.stringify({
        email,
        username,
        first_name: username,
        last_name: username,
        language: "en",
        password,
      }),
    });

    const du = await resUser.json();
    if (du.errors) {
      return bot.sendMessage(chatId, `❌ ${du.errors[0].detail}`);
    }

    user = du.attributes;

    // ===== CREATE SERVER =====
    const resServer = await fetch(`${panelDomain}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
      body: JSON.stringify({
        name,
        user: user.id,
        egg: parseInt(settings.eggs),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: "npm start",
        environment: {
          INST: "npm",
          CMD_RUN: "npm start",
        },
        limits: {
          memory: spec.memo,
          swap: 0,
          disk: spec.disk,
          io: 500,
          cpu: spec.cpu,
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1,
        },
        deploy: {
          locations: [parseInt(settings.loc)],
          dedicated_ip: false,
        },
      }),
    });

    const ds = await resServer.json();
    server = ds.attributes;

    // ===== TELEGRAM MESSAGE =====
    await bot.sendMessage(
      chatId,
      `NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory} MB
DISK: ${server.limits.disk} MB
CPU: ${server.limits.cpu}%`
    );

    // ===== WHATSAPP MESSAGE =====
    const waText = `
🔐 BERIKUT DATA PANEL ${size}GB V${ver} ANDA

🌐 Login: ${panelDomain}
👤 Username: ${username}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

    try {
      await sock.sendMessage(
        `${waNumber}@s.whatsapp.net`,
        { text: waText }
      );

      await bot.sendMessage(
        chatId,
        `✅ Panel ${size}GB berhasil dibuat & dikirim ke WhatsApp ${waNumber}`,
        { reply_to_message_id: msg.message_id }
      );
    } catch (err) {
      await bot.sendMessage(
        chatId,
        `⚠️ Panel berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
      );
    }

  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Gagal membuat panel.");
  }
});
bot.onText(/^\/(1|2|3|4|5|6|7|8|9|10)gbwa(?:\s+(.+))?$/i,
  async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!(await checkWhatsAppConnection(chatId))) return;

    // ===== ALLOWED GROUP =====
      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

    // ===== RESELLER CHECK =====
    const ressUsers = JSON.parse(fs.readFileSync(RESS_FILE));
    if (!ressUsers.includes(String(userId))) {
      return bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller!", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }],
          ],
        },
      });
    }

    const size = match[1]; // 1-10
    const text = match[2]; // nama,nomor

    // ===== VALIDASI FORMAT =====
    if (!text) {
      return bot.sendMessage(
        chatId,
        `❌ Format Salah: /${size}gbwa nama,nomor`
      );
    }

    const t = text.split(",");
    if (t.length < 2) {
      return bot.sendMessage(
        chatId,
        `❌ Format Salah: /${size}gbwa nama,nomor`
      );
    }

    const username = t[0].trim().toLowerCase();
    const waNumber = t[1].trim().replace(/[^0-9]/g, "");

    if (!username || !waNumber) {
      return bot.sendMessage(
        chatId,
        `❌ Format Salah: /${size}gbwa nama,nomor`
      );
    }

    // ===== AMBIL SPEK =====
    const key = `${size}gb`;
    const spec = specs[key];
    if (!spec) {
      return bot.sendMessage(chatId, "❌ Spesifikasi tidak ditemukan");
    }

    // ===== GLOBAL PANEL CONFIG =====
    const panelDomain = domain;
    const panelToken = plta;

    const email = `${username}@gmail.com`;

    // ===== PASSWORD RANDOM =====
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const password = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");

    let user, server;

    try {
      // ===== CREATE USER =====
      const resUser = await fetch(`${panelDomain}/api/application/users`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${panelToken}`,
        },
        body: JSON.stringify({
          email,
          username,
          first_name: username,
          last_name: username,
          language: "en",
          password,
        }),
      });

      const du = await resUser.json();
      if (du.errors) {
        return bot.sendMessage(chatId, `❌ ${du.errors[0].detail}`);
      }

      user = du.attributes;

      // ===== CREATE SERVER =====
      const resServer = await fetch(`${panelDomain}/api/application/servers`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${panelToken}`,
        },
        body: JSON.stringify({
          name: `${username}-${size}GB`,
          user: user.id,
          egg: parseInt(settings.eggs),
          docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
          startup:
            'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then npm install ${NODE_PACKAGES}; fi; if [ -f package.json ]; then npm install; fi; npm start',
          environment: {
            INST: "npm",
            USER_UPLOAD: "0",
            AUTO_UPDATE: "0",
            CMD_RUN: "npm start",
          },
          limits: {
            memory: spec.memo,
            swap: 0,
            disk: spec.disk,
            io: 500,
            cpu: spec.cpu,
          },
          feature_limits: {
            databases: 5,
            backups: 5,
            allocations: 1,
          },
          deploy: {
            locations: [parseInt(settings.loc)],
            dedicated_ip: false,
            port_range: [],
          },
        }),
      });

      const ds = await resServer.json();
      server = ds.attributes;

      // ===== INFO KE TELEGRAM =====
      bot.sendMessage(
        chatId,
        `NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory} MB
DISK: ${server.limits.disk} MB
CPU: ${server.limits.cpu}%`
      );

      // ===== WHATSAPP MESSAGE =====
      const waText = `
🔐 BERIKUT DATA PANEL ${size}GB ANDA

🌐 Login: ${panelDomain}
👤 Username: ${username}
🔑 Password: ${password}

⚠️ Simpan data dengan baik
`;

      try {
        await sock.sendMessage(`${waNumber}@s.whatsapp.net`, { text: waText });

        await bot.sendMessage(
          chatId,
          `✅ Panel ${size}GB berhasil dibuat & dikirim ke WhatsApp ${waNumber}`,
          { reply_to_message_id: msg.message_id }
        );
      } catch (err) {
        await bot.sendMessage(
          chatId,
          `⚠️ Panel berhasil dibuat tapi gagal kirim ke WhatsApp\n${err.message}`
        );
      }
    } catch (e) {
      console.error(e);
      bot.sendMessage(chatId, "❌ Gagal membuat panel.");
    }
  }
);
bot.onText(/^\/delsesi$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id; // FIX

  if (userId !== OWNER_UIID)
    return bot.sendMessage(chatId, "❌ Khusus Owner!");

  try {
    await fs.promises.rm("./session", { recursive: true, force: true });
    isWhatsAppConnected = false;

    await bot.sendMessage(chatId, "✅ Session berhasil dihapus!");
    startSesi();
  } catch (e) {
    bot.sendMessage(chatId, "❌ Gagal menghapus session!");
  }
});
bot.onText(/^\/connect(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id; // FIX
  const nomor = match[1] ? match[1].replace(/[^0-9]/g, "") : "";

  if (userId !== OWNER_UIID)
    return bot.sendMessage(chatId, "❌ Khusus Owner!");

  if (!nomor)
    return bot.sendMessage(chatId, "❌ Nomor tidak valid!\nGunakan: /connect <nomor>");

  try {
    const code = await sock.requestPairingCode(nomor, "12345678");
    const formatted = code?.match(/.{1,4}/g)?.join("-") || code;

    await bot.sendPhoto(chatId, "https://files.catbox.moe/mu7tj9.jpg", {
      caption:
`Nomor : ${nomor}
Kode Pairing : \`${formatted}\``,
      parse_mode: "Markdown",
    });
  } catch (err) {
    bot.sendMessage(chatId, "❌ Gagal pairing!");
  }
});
////////////// END /////////
  (async () => {
    startSesi();
  })();
};