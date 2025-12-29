const fs = require("fs");
const { Client } = require("ssh2");
const path = require("path");
const axios = require("axios");

const settings = require("../settings.js");
const OWNER_ID = "./db/onlyID.json";
const OWNER_UID = settings.ownerId;
const CPU_CHECK_STATUS_FILE = "./db/cekcpu.json";
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

let sock = null;
const versions = {
  1: { domain: "domain", plta: "plta", pltc: "pltc" },
  2: { domain: "domainV2", plta: "pltaV2", pltc: "pltcV2" },
  3: { domain: "domainV3", plta: "pltaV3", pltc: "pltcV3" },
  4: { domain: "domainV4", plta: "pltaV4", pltc: "pltcV4" },
  5: { domain: "domainV5", plta: "pltaV5", pltc: "pltcV5" },
  6: { domain: "domainV6", plta: "pltaV6", pltc: "pltcV6" },
  7: { domain: "domainV7", plta: "pltaV7", pltc: "pltcV7" }
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

const pltcMap = {
  "2": pltcV2,
  "3": pltcV3,
  "4": pltcV4,
  "5": pltcV5,
  "6": pltcV6,
  "7": pltcV7
};
function loadCooldown() {
  if (!fs.existsSync(COOLDOWN_FILE)) {
    fs.writeFileSync(COOLDOWN_FILE, JSON.stringify({ globalCooldown: 5000 }, null, 2));
  }
  return JSON.parse(fs.readFileSync(COOLDOWN_FILE));
}

function saveCooldown(data) {
  fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(data, null, 2));
}
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
    return `⏳ Tunggu ${sisa} detik lagi sebelum pakai command ini!`;
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
const CPU_FILE = path.join(__dirname, "cpu.json");
const CPU_LIMIT_PERCENT = 80;
const AUTO_CPU_DELAY = 5 * 60 * 1000; // 5 menit

let autoCpuInterval = null;

// ===== LOAD CPU STATUS =====
function loadCpuState() {
  if (!fs.existsSync(CPU_FILE)) {
    fs.writeFileSync(
      CPU_FILE,
      JSON.stringify(
        {
          autocpu: false,
          autocpuV: {
            2: false,
            3: false,
            4: false,
            5: false,
            6: false,
            7: false
          }
        },
        null,
        2
      )
    );
  }
  return JSON.parse(fs.readFileSync(CPU_FILE));
}

// ===== SAVE CPU STATUS =====
function saveCpuState(state) {
  fs.writeFileSync(CPU_FILE, JSON.stringify(state, null, 2));
}

let cpuState = loadCpuState();

// AUTO START JIKA ENABLED
if (cpuState.autocpu) {
  autoCpuInterval = setInterval(runAutoCpuCheck, AUTO_CPU_DELAY);
}
function sanitizeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function asHtmlBlockFromPlain(captionPlain) {
  const safeHtml = sanitizeHtml(captionPlain);
  return `<blockquote><pre>${safeHtml}</pre></blockquote>`;
}
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
// cadp
bot.onText(/^\/cadp(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Ambil parameter
  const text = match[1] ? match[1].trim() : null;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  // Cek cooldown
  const isCooldown = checkCooldown(msg);
  if (isCooldown) return bot.sendMessage(chatId, isCooldown);

  // Cek premium
  const premiumUsers = JSON.parse(fs.readFileSync(PREMIUM_FILE));
  if (!premiumUsers.includes(String(userId))) {
    return bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses premium!", {
      reply_markup: {
        inline_keyboard: [[{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/@${dev}` }]],
      },
    });
  }

  // Validasi argumen
  if (!text) {
    return bot.sendMessage(
      chatId,
      "❌ Format Salah!\nContoh: /cadp namapanel,idtele"
    );
  }

  const commandParams = text.split(",");
  if (commandParams.length < 2) {
    return bot.sendMessage(
      chatId,
      "❌ Format Salah!\nContoh: /cadp namapanel,idtele"
    );
  }

  const panelName = commandParams[0].trim();
  const telegramId = commandParams[1].trim();
  const password = panelName + Math.random().toString(36).slice(2, 5);

  try {
    const response = await fetch(`${domain}/api/application/users`, {
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
        password: password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      return bot.sendMessage(
        chatId,
        JSON.stringify(data.errors[0], null, 2)
      );
    }

    const user = data.attributes;

    const userInfo = `
TYPE: ADMIN PANEL
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ ADMIN: ${user.root_admin}
`;
    bot.sendMessage(chatId, userInfo);

    await bot.sendPhoto(telegramId, panel, {
      caption: `<blockquote>🔐 Sukses Created Admin Panel!</blockquote>
👤 Username : <code>${panelName}</code>
🔑 Password : <code>${password}</code>

<blockquote>📌 Rules Admin Panel</blockquote>
▸ No Rusuh Panel!
▸ No DDoS!!
▸ Simpan data akun
▸ No Share Free!
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "🌐 Domain", url: domain }]],
      },
    });

    bot.sendMessage(
      chatId,
      `✅ *Berhasil kirim Admin Panel ke @${msg.from.username}*\n(ID: ${telegramId})`,
      { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
    );
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat membuat admin panel."
    );
  }
});
    // cadpv2
bot.onText(/\/cadpv2(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1];
    
      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }
    
  const premV2Users = JSON.parse(fs.readFileSync(PREMV2_FILE));
  const isPremiumV2 = premV2Users.includes(String(msg.from.id));   
      if (!isPremiumV2) {
    bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses premium v2!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }
  
  const commandParams = match[1].split(",");
if (commandParams.length < 2) {
  bot.sendMessage(
    chatId,
    "❌ Format Salah! Penggunaan: /cadpv2 nama,idtele"
  );
  return;
}

  const panelName = commandParams[0].trim();
  const telegramId = commandParams[1].trim();

  const password = panelName + Math.random().toString(36).slice(2, 5);
    
  try {
    const response = await fetch(`${domainV2}/api/application/users`, {
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
        password: password,
      }),
    });
    const data = await response.json();
    if (data.errors) {
      bot.sendMessage(chatId, JSON.stringify(data.errors[0], null, 2));
      return;
    }
    const user = data.attributes;
    const userInfo = `
TYPE: ADMIN PANEL V2
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ LANGUAGE: ${user.language}
➟ ADMIN: ${user.root_admin}
➟ CREATED AT: ${user.created_at}
    `;
    bot.sendMessage(chatId, userInfo);
     
    const caption = `🔐 Sukses Created Admin Panel V2!

👤 Username: <code>${user.username}</code>
🔑 Password: <code>${password}</code>
🌐 Login: ${domainV2}

<blockquote>📌 Catatan :
Simpan informasi data ini dengan aman
dan jangan bagikan ke orang lain!
</blockquote>
`;

bot.sendPhoto(telegramId, panel, { caption, parse_mode: "HTML" });
   
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan dalam pembuatan admin. Silakan coba lagi nanti."
    );
  }
});
 
    // cadpv3
bot.onText(/\/cadpv3(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1];
    
      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }
    
  const premV3Users = JSON.parse(fs.readFileSync(PREMV3_FILE));
  const isPremiumV3 = premV3Users.includes(String(msg.from.id));   
      if (!isPremiumV3) {
    bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses premium v3", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }
  
  const commandParams = match[1].split(",");
if (commandParams.length < 2) {
  bot.sendMessage(
    chatId,
    "❌ Format Salah! Penggunaan: /cadpv3 nama,idtele"
  );
  return;
}

  const panelName = commandParams[0].trim();
  const telegramId = commandParams[1].trim();

  const password = panelName + Math.random().toString(36).slice(2, 5);
    
  try {
    const response = await fetch(`${domainV3}/api/application/users`, {
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
        password: password,
      }),
    });
    const data = await response.json();
    if (data.errors) {
      bot.sendMessage(chatId, JSON.stringify(data.errors[0], null, 2));
      return;
    }
    const user = data.attributes;
    const userInfo = `
TYPE: ADMIN PANEL V3
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ LANGUAGE: ${user.language}
➟ ADMIN: ${user.root_admin}
➟ CREATED AT: ${user.created_at}
    `;
    bot.sendMessage(chatId, userInfo);
     
    const caption = `🔐 Sukses Created Admin Panel V3!

👤 Username: <code>${user.username}</code>
🔑 Password: <code>${password}</code>
🌐 Login: ${domainV3}

<blockquote>📌 Catatan :
Simpan informasi data ini dengan aman
dan jangan bagikan ke orang lain!
</blockquote>
`;

bot.sendPhoto(telegramId, panel, { caption, parse_mode: "HTML" });
   
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan dalam pembuatan admin. Silakan coba lagi nanti."
    );
  }
});
    
    // cadpv4
bot.onText(/\/cadpv4(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1];
    
      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }
    
  const premV4Users = JSON.parse(fs.readFileSync(PREMV4_FILE));
  const isPremiumV4 = premV4Users.includes(String(msg.from.id));   
      if (!isPremiumV4) {
    bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses premium v4", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }
  
  const commandParams = match[1].split(",");
if (commandParams.length < 2) {
  bot.sendMessage(
    chatId,
    "❌ Format Salah! Penggunaan: /cadpv4 nama,idtele"
  );
  return;
}

  const panelName = commandParams[0].trim();
  const telegramId = commandParams[1].trim();

  const password = panelName + Math.random().toString(36).slice(2, 5);
    
  try {
    const response = await fetch(`${domainV4}/api/application/users`, {
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
        password: password,
      }),
    });
    const data = await response.json();
    if (data.errors) {
      bot.sendMessage(chatId, JSON.stringify(data.errors[0], null, 2));
      return;
    }
    const user = data.attributes;
    const userInfo = `
TYPE: ADMIN PANEL V4
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ LANGUAGE: ${user.language}
➟ ADMIN: ${user.root_admin}
➟ CREATED AT: ${user.created_at}
    `;
    bot.sendMessage(chatId, userInfo);
     
    const caption = `🔐 Sukses Created Admin Panel V4!

👤 Username: <code>${user.username}</code>
🔑 Password: <code>${password}</code>
🌐 Login: ${domainV4}

<blockquote>📌 Catatan :
Simpan informasi data ini dengan aman
dan jangan bagikan ke orang lain!
</blockquote>
`;

bot.sendPhoto(telegramId, panel, { caption, parse_mode: "HTML" });
   
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan dalam pembuatan admin. Silakan coba lagi nanti."
    );
  }
});
    
    // cadpv5
bot.onText(/\/cadpv5(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1];
    
      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }
    
  const premV5Users = JSON.parse(fs.readFileSync(PREMV5_FILE));
  const isPremiumV5 = premV5Users.includes(String(msg.from.id));   
      if (!isPremiumV5) {
    bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses premium v5", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }
  
  const commandParams = match[1].split(",");
if (commandParams.length < 2) {
  bot.sendMessage(
    chatId,
    "❌ Format Salah! Penggunaan: /cadpv5 nama,idtele"
  );
  return;
}

  const panelName = commandParams[0].trim();
  const telegramId = commandParams[1].trim();

  const password = panelName + Math.random().toString(36).slice(2, 5);
    
  try {
    const response = await fetch(`${domainV5}/api/application/users`, {
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
        password: password,
      }),
    });
    const data = await response.json();
    if (data.errors) {
      bot.sendMessage(chatId, JSON.stringify(data.errors[0], null, 2));
      return;
    }
    const user = data.attributes;
    const userInfo = `
TYPE: ADMIN PANEL V5
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ LANGUAGE: ${user.language}
➟ ADMIN: ${user.root_admin}
➟ CREATED AT: ${user.created_at}
    `;
    bot.sendMessage(chatId, userInfo);
     
    const caption = `🔐 Sukses Created Admin Panel V5!

👤 Username: <code>${user.username}</code>
🔑 Password: <code>${password}</code>
🌐 Login: ${domainV5}

<blockquote>📌 Catatan :
Simpan informasi data ini dengan aman
dan jangan bagikan ke orang lain!
</blockquote>
`;

bot.sendPhoto(telegramId, panel, { caption, parse_mode: "HTML" });
   
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan dalam pembuatan admin. Silakan coba lagi nanti."
    );
  }
});
bot.onText(/\/cadpv6(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1];

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }
    
  const premV6Users = JSON.parse(fs.readFileSync(PREMV6_FILE));
  const isPremiumV6 = premV6Users.includes(String(msg.from.id));   
      if (!isPremiumV6) {
    bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses premium v6", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }
  
  const commandParams = match[1].split(",");
if (commandParams.length < 2) {
  bot.sendMessage(
    chatId,
    "❌ Format Salah! Penggunaan: /cadpv6 nama,idtele"
  );
  return;
}

  const panelName = commandParams[0].trim();
  const telegramId = commandParams[1].trim();

  const password = panelName + Math.random().toString(36).slice(2, 5);
    
  try {
    const response = await fetch(`${domainV6}/api/application/users`, {
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
        password: password,
      }),
    });
    const data = await response.json();
    if (data.errors) {
      bot.sendMessage(chatId, JSON.stringify(data.errors[0], null, 2));
      return;
    }
    const user = data.attributes;
    const userInfo = `
TYPE: ADMIN PANEL V6
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ LANGUAGE: ${user.language}
➟ ADMIN: ${user.root_admin}
➟ CREATED AT: ${user.created_at}
    `;
    bot.sendMessage(chatId, userInfo);
     
    const caption = `🔐 Sukses Created Admin Panel V6!

👤 Username: <code>${user.username}</code>
🔑 Password: <code>${password}</code>
🌐 Login: ${domainV6}

<blockquote>📌 Catatan :
Simpan informasi data ini dengan aman
dan jangan bagikan ke orang lain!
</blockquote>
`;

bot.sendPhoto(telegramId, panel, { caption, parse_mode: "HTML" });
   
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan dalam pembuatan admin. Silakan coba lagi nanti."
    );
  }
});
bot.onText(/\/cadpv7(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1];
    
      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }
    
  const premV7Users = JSON.parse(fs.readFileSync(PREMV7_FILE));
  const isPremiumV7 = premV7Users.includes(String(msg.from.id));   
      if (!isPremiumV7) {
    bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses premium v7", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }
  
  const commandParams = match[1].split(",");
if (commandParams.length < 2) {
  bot.sendMessage(
    chatId,
    "❌ Format Salah! Penggunaan: /cadpv7 nama,idtele"
  );
  return;
}

  const panelName = commandParams[0].trim();
  const telegramId = commandParams[1].trim();

  const password = panelName + Math.random().toString(36).slice(2, 5);
    
  try {
    const response = await fetch(`${domainV7}/api/application/users`, {
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
        password: password,
      }),
    });
    const data = await response.json();
    if (data.errors) {
      bot.sendMessage(chatId, JSON.stringify(data.errors[0], null, 2));
      return;
    }
    const user = data.attributes;
    const userInfo = `
TYPE: ADMIN PANEL V7
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ LANGUAGE: ${user.language}
➟ ADMIN: ${user.root_admin}
➟ CREATED AT: ${user.created_at}
    `;
    bot.sendMessage(chatId, userInfo);
     
    const caption = `🔐 Sukses Created Admin Panel V7!

👤 Username: <code>${user.username}</code>
🔑 Password: <code>${password}</code>
🌐 Login: ${domainV7}

<blockquote>📌 Catatan :
Simpan informasi data ini dengan aman
dan jangan bagikan ke orang lain!
</blockquote>
`;

bot.sendPhoto(telegramId, panel, { caption, parse_mode: "HTML" });
   
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan dalam pembuatan admin. Silakan coba lagi nanti."
    );
  }
});
bot.onText(/^\/unli(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;

  // Hanya untuk grup
      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const text = match[1] ? match[1].trim() : "";

  // Cek user reseller
  const ressUsers = JSON.parse(fs.readFileSync(RESS_FILE));
  if (!ressUsers.includes(String(msg.from.id))) {
    bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }

  const t = text.split(",");
  if (t.length < 2) {
    bot.sendMessage(chatId, "⚠️ Format: /unli namapanel,idtele");
    return;
  }

  const username = t[0].trim();
  const u = parseInt(t[1].trim());
  const name = username + "unli";
  const egg = eggs;
  const loc = settings.loc;
  const memo = "0";
  const cpu = "0";
  const disk = "0";
  const email = `${username}@gmail.com`;
  const spc =
    'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const password = username + Math.random().toString(36).slice(2, 5);

  let user, server;

  try {
    // CREATE USER
    const response = await fetch(`${domain}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: "en",
        password: password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      if (
        data.errors[0].meta.rule === "unique" &&
        data.errors[0].meta.source_field === "email"
      ) {
        bot.sendMessage(chatId, "⚠️ Email & Username sudah ada di panel! Coba lagi.");
      } else {
        bot.sendMessage(chatId, `❌ Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;

    // CREATE SERVER
    const response2 = await fetch(`${domain}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
      body: JSON.stringify({
        name: name,
        description: "",
        user: user.id,
        egg: parseInt(egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: spc,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu,
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1,
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      bot.sendMessage(chatId, `❌ Error saat buat server: ${JSON.stringify(data2.errors[0], null, 2)}`);
      return;
    }
    server = data2.attributes;

  } catch (error) {
    bot.sendMessage(chatId, `❌ Error API: ${error.message}`);
    return;
  }

  if (user && server) {
    bot.sendMessage(
      chatId,
      `Type: Panel Unli
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB
`
    );

    function esc(text) {
      return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
    }

    const safeName = esc(username);
    const safeEmail = esc(email);
    const safeId = esc(user.id);
    const safeUser = esc(user.username);
    const safePass = esc(password);
    const safeDomain = esc(domain);

    const copyUser = `\`${safeUser}\``;
    const copyPass = `\`${safePass}\``;
    const spoilerDomain = `||${safeDomain}||`;

    try {
      await bot.sendPhoto(u, panel, {
        caption: `🔐 *Sukses Created Panel\\!*
🌐 *Akun Panel*
▸ Username: ${copyUser}
▸ Password: ${copyPass}

⚠️ *Rules Panel*
▸ Sensor domain
▸ Simpan data akun
▸ Garansi 15 hari`,
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🌐 Login", url: domain },
            ],
          ],
        },
      });

      bot.sendMessage(
        chatId,
        `✅ Berhasil kirim panel ke @${msg.from.username}\n(ID: ${u})`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
                               
    } catch (err) {
      bot.sendMessage(chatId, `⚠️ Gagal kirim panel ke user ID ${u}.  
Kemungkinan user belum start bot / blokir bot.\n\nDetail error: ${err.message}`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    }

  } else {
    bot.sendMessage(chatId, `❌ Akun panel tidak ada! Laporkan ke @${dev}.`);
  }
});
    
   // unli v2
bot.onText(/\/unliv2(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
    
      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const isCooldown = checkCooldown(msg);
    if (isCooldown) return bot.sendMessage(chatId, isCooldown);
    
  const ressV2Users = JSON.parse(fs.readFileSync(RESSV2_FILE));
  const isResellerV2 = ressV2Users.includes(String(msg.from.id));   
      if (!isResellerV2) {
    bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller v2!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }

  const t = text.split(",");
  if (t.length < 2) {
    bot.sendMessage(chatId, "⚠️ Format: /unliv2 namapanel,idtele");
    return;
  }

  const username = t[0].trim();
  const u = parseInt(t[1].trim());
  const name = username + "unli";
  const egg = eggs;
  const loc = settings.loc;
  const memo = "0";
  const cpu = "0";
  const disk = "0";
  const email = `${username}@gmail.com`;
  const spc =
    'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const password = username + Math.random().toString(36).slice(2, 5);
    
  let user;
  let server;

  try {
    // CREATE USER
    const response = await fetch(`${domainV2}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV2}`,
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: "en",
        password: password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      if (
        data.errors[0].meta.rule === "unique" &&
        data.errors[0].meta.source_field === "email"
      ) {
        bot.sendMessage(chatId, "⚠️ Email & Username sudah ada di panel! Coba lagi.");
      } else {
        bot.sendMessage(chatId, `❌ Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;

    // CREATE SERVER
    const response2 = await fetch(`${domainV2}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV2}`,
      },
      body: JSON.stringify({
        name: name,
        description: "",
        user: user.id,
        egg: parseInt(egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: spc,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu,
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1,
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      bot.sendMessage(chatId, `❌ Error saat buat server: ${JSON.stringify(data2.errors[0], null, 2)}`);
      return;
    }
    server = data2.attributes;

  } catch (error) {
    bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    return;
  }

  if (user && server) {
    bot.sendMessage(
      chatId,
      `Type: Panel Unli V2
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB
`
    );

function esc(text) {
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

const safeName = esc(username);
const safeEmail = esc(email);
const safeId = esc(user.id);
const safeUser = esc(user.username);
const safePass = esc(password);
const safeDomain = esc(domainV2);

// copy
const copyUser = `\`${safeUser}\``;
const copyPass = `\`${safePass}\``;
    
// spoiler
const spoilerDomain = `||${safeDomain}||`;

bot.sendPhoto(u, panel, {
  caption: `🔐 *Sukses Created Panel V2\\!*
🌐 *Akun Panel V2*
▸ Username: ${copyUser}
▸ Password: ${password}
▸ Login: ${spoilerDomain}

⚠️ *Rules Panel*
▸ Sensor domain
▸ Simpan data akun
▸ Garansi 15 hari`,
  parse_mode: "MarkdownV2",
  reply_markup: {
    inline_keyboard: [
      [
        { text: "🌐 Domain", url: domainV3 },
        { text: "🔑 Salin Password", switch_inline_query_current_chat: password }
      ],
    ],
  },
});

    bot.sendMessage(
      chatId,
      `✅ Berhasil kirim panel V2 ke @${msg.from.username}\n(ID: ${u})`
    );
  } else {
    bot.sendMessage(chatId, `❌ Akun panel tidak ada! Laporkan ke @${dev}.`);
  }
});
    
  // unli v3
bot.onText(/\/unliv3(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
    
      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const isCooldown = checkCooldown(msg);
    if (isCooldown) return bot.sendMessage(chatId, isCooldown);
    
  const ressV3Users = JSON.parse(fs.readFileSync(RESSV3_FILE));
  const isResellerV3 = ressV3Users.includes(String(msg.from.id));   
      if (!isResellerV3) {
    bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller v3", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }

  const t = text.split(",");
  if (t.length < 2) {
    bot.sendMessage(chatId, "⚠️ Format: /unliv3 namapanel,idtele");
    return;
  }

  const username = t[0].trim();
  const u = parseInt(t[1].trim());
  const name = username + "unli";
  const egg = eggs;
  const loc = settings.loc;
  const memo = "0";
  const cpu = "0";
  const disk = "0";
  const email = `${username}@gmail.com`;
  const spc =
    'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const password = username + Math.random().toString(36).slice(2, 5);
    
  let user;
  let server;

  try {
    // CREATE USER
    const response = await fetch(`${domainV3}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV3}`,
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: "en",
        password: password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      if (
        data.errors[0].meta.rule === "unique" &&
        data.errors[0].meta.source_field === "email"
      ) {
        bot.sendMessage(chatId, "⚠️ Email & Username sudah ada di panel! Coba lagi.");
      } else {
        bot.sendMessage(chatId, `❌ Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;

    // CREATE SERVER
    const response2 = await fetch(`${domainV3}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV3}`,
      },
      body: JSON.stringify({
        name: name,
        description: "",
        user: user.id,
        egg: parseInt(egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: spc,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu,
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1,
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      bot.sendMessage(chatId, `❌ Error saat buat server: ${JSON.stringify(data2.errors[0], null, 2)}`);
      return;
    }
    server = data2.attributes;

  } catch (error) {
    bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    return;
  }

  if (user && server) {
    bot.sendMessage(
      chatId,
      `Type: Panel Unli V3
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB
`
    );

function esc(text) {
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

const safeName = esc(username);
const safeEmail = esc(email);
const safeId = esc(user.id);
const safeUser = esc(user.username);
const safePass = esc(password);
const safeDomain = esc(domainV3);

// copy
const copyUser = `\`${safeUser}\``;
const copyPass = `\`${safePass}\``;
    
// spoiler
const spoilerDomain = `||${safeDomain}||`;

bot.sendPhoto(u, panel, {
  caption: `🔐 *Sukses Created Panel V3\\!*
🌐 *Akun Panel V3*
▸ Username: ${copyUser}
▸ Password: ${copyPass}
▸ Login: ${spoilerDomain}

⚠️ *Rules Panel*
▸ Sensor domain
▸ Simpan data akun
▸ Garansi 15 hari`,
  parse_mode: "MarkdownV2",
  reply_markup: {
    inline_keyboard: [
      [
        { text: "🌐 Domain", url: domainV3 },
        { text: "🔑 Salin Password", switch_inline_query_current_chat: password }
      ],
    ],
  },
});

    bot.sendMessage(
      chatId,
      `✅ Berhasil kirim panel V3 ke @${msg.from.username}\n(ID: ${u})`
    );
  } else {
    bot.sendMessage(chatId, `❌ Akun panel tidak ada! Laporkan ke @${dev}.`);
  }
});
   
  // unli v4
bot.onText(/\/unliv4(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
    
      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const isCooldown = checkCooldown(msg);
    if (isCooldown) return bot.sendMessage(chatId, isCooldown);
    
  const ressV4Users = JSON.parse(fs.readFileSync(RESSV4_FILE));
  const isResellerV4 = ressV4Users.includes(String(msg.from.id));   
      if (!isResellerV4) {
    bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller v4", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }

  const t = text.split(",");
  if (t.length < 2) {
    bot.sendMessage(chatId, "⚠️ Format: /unliv4 namapanel,idtele");
    return;
  }

  const username = t[0].trim();
  const u = parseInt(t[1].trim());
  const name = username + "unli";
  const egg = eggs;
  const loc = settings.loc;
  const memo = "0";
  const cpu = "0";
  const disk = "0";
  const email = `${username}@gmail.com`;
  const spc =
    'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const password = username + Math.random().toString(36).slice(2, 5);
    
  let user;
  let server;

  try {
    // CREATE USER
    const response = await fetch(`${domainV4}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV4}`,
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: "en",
        password: password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      if (
        data.errors[0].meta.rule === "unique" &&
        data.errors[0].meta.source_field === "email"
      ) {
        bot.sendMessage(chatId, "⚠️ Email & Username sudah ada di panel! Coba lagi.");
      } else {
        bot.sendMessage(chatId, `❌ Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;

    // CREATE SERVER
    const response2 = await fetch(`${domainV4}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV4}`,
      },
      body: JSON.stringify({
        name: name,
        description: "",
        user: user.id,
        egg: parseInt(egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: spc,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu,
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1,
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      bot.sendMessage(chatId, `❌ Error saat buat server: ${JSON.stringify(data2.errors[0], null, 2)}`);
      return;
    }
    server = data2.attributes;

  } catch (error) {
    bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    return;
  }

  if (user && server) {
    bot.sendMessage(
      chatId,
      `Type: Panel Unli V4
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB
`
    );

function esc(text) {
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

const safeName = esc(username);
const safeEmail = esc(email);
const safeId = esc(user.id);
const safeUser = esc(user.username);
const safePass = esc(password);
const safeDomain = esc(domainV4);

// copy
const copyUser = `\`${safeUser}\``;
const copyPass = `\`${safePass}\``;
    
// spoiler
const spoilerDomain = `||${safeDomain}||`;

bot.sendPhoto(u, panel, {
  caption: `🔐 *Sukses Created Panel V4\\!*
🌐 *Akun Panel V4*
▸ Username: ${copyUser}
▸ Password: ${copyPass}
▸ Login: ${spoilerDomain}

⚠️ *Rules Panel*
▸ Sensor domain
▸ Simpan data akun
▸ Garansi 15 hari`,
  parse_mode: "MarkdownV2",
  reply_markup: {
    inline_keyboard: [
      [
        { text: "🌐 Domain", url: domainV4 },
        { text: "🔑 Salin Password", switch_inline_query_current_chat: password }
      ],
    ],
  },
});

    bot.sendMessage(
      chatId,
      `✅ Berhasil kirim panel V4 ke @${msg.from.username}\n(ID: ${u})`
    );
  } else {
    bot.sendMessage(chatId, `❌ Akun panel tidak ada! Laporkan ke @${dev}.`);
  }
});
    
  // unli v5
bot.onText(/\/unliv5(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
    
      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const isCooldown = checkCooldown(msg);
    if (isCooldown) return bot.sendMessage(chatId, isCooldown);
    
  const ressV5Users = JSON.parse(fs.readFileSync(RESSV5_FILE));
  const isResellerV5 = ressV5Users.includes(String(msg.from.id));   
      if (!isResellerV5) {
    bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller v5!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }],
        ],
      },
    });
    return;
  }

  const t = text.split(",");
  if (t.length < 2) {
    bot.sendMessage(chatId, "⚠️ Format: /unliv5 namapanel,idtele");
    return;
  }

  const username = t[0].trim();
  const u = parseInt(t[1].trim());
  const name = username + "unli";
  const egg = eggs;
  const loc = settings.loc;
  const memo = "0";
  const cpu = "0";
  const disk = "0";
  const email = `${username}@gmail.com`;
  const spc =
    'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const password = username + Math.random().toString(36).slice(2, 5);
    
  let user;
  let server;

  try {
    // CREATE USER
    const response = await fetch(`${domainV5}/api/application/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV5}`,
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: "en",
        password: password,
      }),
    });

    const data = await response.json();
    if (data.errors) {
      if (
        data.errors[0].meta.rule === "unique" &&
        data.errors[0].meta.source_field === "email"
      ) {
        bot.sendMessage(chatId, "⚠️ Email & Username sudah ada di panel! Coba lagi.");
      } else {
        bot.sendMessage(chatId, `❌ Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;

    // CREATE SERVER
    const response2 = await fetch(`${domainV5}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${pltaV5}`,
      },
      body: JSON.stringify({
        name: name,
        description: "",
        user: user.id,
        egg: parseInt(egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: spc,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu,
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1,
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      bot.sendMessage(chatId, `❌ Error saat buat server: ${JSON.stringify(data2.errors[0], null, 2)}`);
      return;
    }
    server = data2.attributes;

  } catch (error) {
    bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    return;
  }

  if (user && server) {
    bot.sendMessage(
      chatId,
      `Type: Panel Unli V5
📡 ID: ${user.id}
👤 USERNAME: ${username}
⚙️ MEMORY: ${server.limits.memory === 0 ? "Unlimited" : server.limits.memory} MB
`
    );

function esc(text) {
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

const safeName = esc(username);
const safeEmail = esc(email);
const safeId = esc(user.id);
const safeUser = esc(user.username);
const safePass = esc(password);
const safeDomain = esc(domainV5);

// copy
const copyUser = `\`${safeUser}\``;
const copyPass = `\`${safePass}\``;
    
// spoiler
const spoilerDomain = `||${safeDomain}||`;

bot.sendPhoto(u, panel, {
  caption: `🔐 *Sukses Created Panel V5\\!*
🌐 *Akun Panel V5*
▸ Username: ${copyUser}
▸ Password: ${copyPass}
▸ Login: ${spoilerDomain}

⚠️ *Rules Panel*
▸ Sensor domain
▸ Simpan data akun
▸ Garansi 15 hari`,
  parse_mode: "MarkdownV2",
  reply_markup: {
    inline_keyboard: [
      [
        { text: "🌐 Domain", url: domainV5 },
        { text: "🔑 Salin Password", switch_inline_query_current_chat: password }
      ],
    ],
  },
});

    bot.sendMessage(
      chatId,
      `✅ Berhasil kirim panel V5 ke @${msg.from.username}\n(ID: ${u})`
    );
  } else {
    bot.sendMessage(chatId, `❌ Akun panel tidak ada! Laporkan ke @${dev}.`);
  }
});
bot.onText(/\/unliv6(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const isCooldown = checkCooldown(msg);
  if (isCooldown) return bot.sendMessage(chatId, isCooldown);

  const ressV6Users = JSON.parse(fs.readFileSync(RESSV6_FILE));
  const isResellerV6 = ressV6Users.includes(String(msg.from.id));
  if (!isResellerV6)
    return bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller v6", {
      reply_markup: {
        inline_keyboard: [[{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }]],
      },
    });

  const t = text.split(",");
  if (t.length < 2) return bot.sendMessage(chatId, "⚠️ Format: /unliv6 namapanel,idtele");

  const username = t[0].trim();
  const u = parseInt(t[1].trim());

  const name = username + "unli";
  const egg = eggs;
  const loc = settings.loc;
  const memo = "0";
  const cpu = "0";
  const disk = "0";
  const email = `${username}@gmail.com`;

  const spc =
    'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';

  const password = username + Math.random().toString(36).slice(2, 5);

  let user;
  let server;

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
      bot.sendMessage(chatId, `❌ Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      return;
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
        description: "",
        user: user.id,
        egg: parseInt(egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: spc,
        environment: { INST: "npm", USER_UPLOAD: "0", AUTO_UPDATE: "0", CMD_RUN: "npm start" },
        limits: { memory: memo, swap: 0, disk: disk, io: 500, cpu: cpu },
        feature_limits: { databases: 5, backups: 5, allocations: 1 },
        deploy: { locations: [parseInt(loc)], dedicated_ip: false, port_range: [] },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      bot.sendMessage(chatId, `❌ Error: ${JSON.stringify(data2.errors[0], null, 2)}`);
      return;
    }

    server = data2.attributes;

  } catch (err) {
    bot.sendMessage(chatId, "❌ Error: " + err.message);
    return;
  }

  bot.sendMessage(chatId, `Type: Panel Unli V6\n📡 ID: ${user.id}\n👤 USERNAME: ${username}\n⚙️ MEMORY: Unlimited`);

  function esc(text) {
    return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
  }

  const copyUser = `\`${esc(username)}\``;
  const copyPass = `\`${esc(password)}\``;
  const spoilerDomain = `||${esc(domainV6)}||`;

  bot.sendPhoto(u, panel, {
    caption: `🔐 *Sukses Created Panel V6\\!*
🌐 *Akun Panel V6*
▸ Username: ${copyUser}
▸ Password: ${copyPass}
▸ Login: ${spoilerDomain}

⚠️ *Rules Panel*
▸ Sensor domain
▸ Simpan data akun
▸ Garansi 15 hari`,
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🌐 Domain", url: domainV6 },
          { text: "🔑 Salin Password", switch_inline_query_current_chat: password }
        ],
      ],
    },
  });

  bot.sendMessage(chatId, `✅ Berhasil kirim panel V6 ke @${msg.from.username}\n(ID: ${u})`);
});
bot.onText(/\/unliv7(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const isCooldown = checkCooldown(msg);
  if (isCooldown) return bot.sendMessage(chatId, isCooldown);

  const ressV7Users = JSON.parse(fs.readFileSync(RESSV7_FILE));
  const isResellerV7 = ressV7Users.includes(String(msg.from.id));
  if (!isResellerV7)
    return bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller v7!", {
      reply_markup: {
        inline_keyboard: [[{ text: "ᴊᴏɪɴ ꜱᴇʀᴠᴇʀ", url: `https://t.me/${dev}` }]],
      },
    });

  const t = text.split(",");
  if (t.length < 2) return bot.sendMessage(chatId, "⚠️ Format: /unliv7 namapanel,idtele");

  const username = t[0].trim();
  const u = parseInt(t[1].trim());

  const name = username + "unli";
  const egg = eggs;
  const loc = settings.loc;
  const memo = "0";
  const cpu = "0";
  const disk = "0";
  const email = `${username}@gmail.com`;

  const spc =
    'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';

  const password = username + Math.random().toString(36).slice(2, 5);

  let user;
  let server;

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
      bot.sendMessage(chatId, `❌ Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      return;
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
        description: "",
        user: user.id,
        egg: parseInt(egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup: spc,
        environment: { INST: "npm", USER_UPLOAD: "0", AUTO_UPDATE: "0", CMD_RUN: "npm start" },
        limits: { memory: memo, swap: 0, disk: disk, io: 500, cpu: cpu },
        feature_limits: { databases: 5, backups: 5, allocations: 1 },
        deploy: { locations: [parseInt(loc)], dedicated_ip: false, port_range: [] },
      }),
    });

    const data2 = await response2.json();
    if (data2.errors) {
      bot.sendMessage(chatId, `❌ Error: ${JSON.stringify(data2.errors[0], null, 2)}`);
      return;
    }

    server = data2.attributes;

  } catch (err) {
    bot.sendMessage(chatId, "❌ Error: " + err.message);
    return;
  }

  bot.sendMessage(chatId, `Type: Panel Unli V7\n📡 ID: ${user.id}\n👤 USERNAME: ${username}\n⚙️ MEMORY: Unlimited`);

  function esc(text) {
    return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
  }

  const copyUser = `\`${esc(username)}\``;
  const copyPass = `\`${esc(password)}\``;
  const spoilerDomain = `||${esc(domainV7)}||`;

  bot.sendPhoto(u, panel, {
    caption: `🔐 *Sukses Created Panel V7\\!*
🌐 *Akun Panel V7*
▸ Username: ${copyUser}
▸ Password: ${copyPass}
▸ Login: ${spoilerDomain}

⚠️ *Rules Panel*
▸ Sensor domain
▸ Simpan data akun
▸ Garansi 15 hari`,
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🌐 Domain", url: domainV7 },
          { text: "🔑 Salin Password", switch_inline_query_current_chat: password }
        ],
      ],
    },
  });

  bot.sendMessage(chatId, `✅ Berhasil kirim panel V7 ke @${msg.from.username}\n(ID: ${u})`);
});
    // specs ram
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
bot.onText(/^\/(1|2|3|4|5|6|7|8|9|10)gb(?:\s+(.+))?$/i,
  async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

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
    const text = match[2]; // nama,idtele

    // ===== VALIDASI FORMAT =====
    if (!text) {
      return bot.sendMessage(
        chatId,
        `❌ Format Salah!\n\nGunakan:\n/${size}gb nama,idtele`
      );
    }

    const split = text.split(",");
    if (split.length < 2) {
      return bot.sendMessage(
        chatId,
        `❌ Format Salah!\n\nGunakan:\n/${size}gb nama,idtele`
      );
    }

    const username = split[0].trim().toLowerCase();
    const targetId = split[1].trim();

    if (!username || !/^\d+$/.test(targetId)) {
      return bot.sendMessage(
        chatId,
        `❌ Format Salah!\n\nGunakan:\n/${size}gb nama,idtele`
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

      // ===== INFO KE GRUP (TIDAK DIUBAH) =====
      bot.sendMessage(
        chatId,
        `NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory} MB
DISK: ${server.limits.disk} MB
CPU: ${server.limits.cpu}%`
      );

      // ===== KIRIM KE PRIVATE USER (TIDAK DIUBAH) =====
      bot.sendPhoto(
        Number(targetId),
        "https://files.catbox.moe/a7ljii.jpeg",
        {
          caption: `<blockquote>
<blockquote>🔐 BERIKUT DATA PANEL ${size}GB ANDA</blockquote>
🌐 Login: ${domain}/
👤 Username: ${user.username}
🔑 Password: <code>${password}</code>

<blockquote>📌 Rules Panel!</blockquote>
- Jangan DDoS
- Jangan sebar domain
- Simpan data panel anda!!
</blockquote>`,
          parse_mode: "HTML",
        }
      );

      bot.sendMessage(
        chatId,
        "✅ Data panel telah dikirim ke chat pribadi pengguna!"
      );
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, "❌ Gagal membuat panel.");
    }
  }
);
bot.onText(/^\/(1|2|3|4|5|6|7|8|9|10)gbv([2-7])(?:\s+)?(.*)?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const ressUsers = JSON.parse(fs.readFileSync(RESS_FILE));
  if (!ressUsers.includes(String(userId))) {
    return bot.sendMessage(chatId, "❌ Kamu belum memiliki akses reseller v2!", {
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
      `❌ Format Salah: /${size}gbv${ver} nama,id`
    );
  }

  const t = text.split(",");
  if (t.length < 2) {
    return bot.sendMessage(
      chatId,
      `❌ Format Salah: /${size}gbv${ver} nama,id`
    );
  }

  const key = `${size}gbv${ver}`;
  const spec = specs[key];
  if (!spec) {
    return bot.sendMessage(chatId, "❌ Spesifikasi tidak ditemukan");
  }

  const domain = domainMap[ver];
  const plta = pltaMap[ver];

  const username = t[0].trim();
  const targetId = t[1].trim();
  const name = username + `${size}gb`;

  const egg = settings.eggs;
  const loc = settings.loc;
  const email = `${username}@gmail.com`;

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const password = Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");

  let user, server;

  try {
    const resUser = await fetch(`${domain}/api/application/users`, {
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
      return bot.sendMessage(chatId, `Error: ${du.errors[0].detail}`);
    }

    user = du.attributes;

    const resServer = await fetch(`${domain}/api/application/servers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
      body: JSON.stringify({
        name,
        user: user.id,
        egg: parseInt(egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
        startup:
          'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}',
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
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: [],
        },
      }),
    });

    const ds = await resServer.json();
    server = ds.attributes;
  } catch (e) {
    return bot.sendMessage(chatId, `Error: ${e.message}`);
  }

  bot.sendMessage(
    chatId,
    `NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory} MB
DISK: ${server.limits.disk} MB
CPU: ${server.limits.cpu}%`
  );

bot.sendPhoto(
  targetId,
  "https://files.catbox.moe/a7ljii.jpeg",
  {
    caption: `<blockquote>
<blockquote>🔐 BERIKUT DATA PANEL ${size}GB V${ver} ANDA</blockquote>
🌐 Login: ${domain}/
👤 Username: ${user.username}
🔑 Password: <code>${password}</code>

<blockquote>📌 Rules Panel!</blockquote>
- Jangan DDoS
- Jangan sebar domain
- Simpan data panel anda!!
</blockquote>`,
    parse_mode: "HTML"
  }
);

  bot.sendMessage(chatId, "✅ Data panel telah dikirim ke chat pribadi pengguna!");
});
    
bot.onText(/^\/delsrv (.+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const srv = match[1].trim();

  const isCooldown = checkCooldown(msg);
  if (isCooldown) return bot.sendMessage(chatId, isCooldown);

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  if (!ownerUsers.includes(String(msg.from.id))) {
    return bot.sendMessage(chatId, "❌ Hanya untuk owner!", {
      reply_markup: {
        inline_keyboard: [[{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }]]
      }
    });
  }

  if (!srv) {
    return bot.sendMessage(
      chatId,
      "⚠️ Gunakan format:\n/delsrv <ID_SERVER>"
    );
  }

  try {
    const del = await fetch(`${domain}/api/application/servers/${srv}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
    });

    /* ====== STATUS VALIDATION ====== */

    if (del.status === 204) {
      return bot.sendMessage(
        chatId,
        `<blockquote>✅ <b>SERVER BERHASIL DIHAPUS</b>

🆔 <b>ID</b>: <code>${srv}</code>
🧹 Status: <b>Clean</b>
</blockquote>`,
        {
          parse_mode: "HTML",
          reply_to_message_id: msg.message_id,
        }
      );
    }

    if (del.status === 404) {
      return bot.sendMessage(
        chatId,
        `<blockquote>❌ <b>SERVER TIDAK DITEMUKAN</b>

🆔 <b>ID</b>: <code>${srv}</code>
</blockquote>`,
        { parse_mode: "HTML" }
      );
    }

    /* ====== ERROR LAIN ====== */
    const errText = await del.text();
    console.error("DEL SRV ERROR:", errText);

    bot.sendMessage(
      chatId,
      `<blockquote>⚠️ <b>GAGAL MENGHAPUS SERVER</b>

🆔 <b>ID</b>: <code>${srv}</code>
📛 <b>Status</b>: ${del.status}
</blockquote>`,
      { parse_mode: "HTML" }
    );

  } catch (error) {
    console.error("DEL SRV CATCH:", error);
    bot.sendMessage(
      chatId,
      "⚠️ Terjadi kesalahan sistem saat menghapus server."
    );
  }
});

bot.onText(/^\/listsrvoff$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (msg.text.trim() !== "/listsrvoff") return;

  if (
    (msg.chat.type !== "group" && msg.chat.type !== "supergroup") &&
    userId !== OWNER_ID
  ) return bot.sendMessage(chatId, "❌ Khusus grup!");

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  if (!ownerUsers.includes(String(userId)))
    return bot.sendMessage(chatId, "❌ Khusus owner");

  const loading = await bot.sendMessage(
    chatId,
    "<blockquote>⏳ <b>Proses mengambil daftar server offline...</b></blockquote>",
    { parse_mode: "HTML" }
  );

  await renderOfflineServerList(chatId, 1, loading.message_id);
});

bot.on("callback_query", async (q) => {
  if (!q.data.startsWith("srvoff_page_")) return;

  const chatId = q.message.chat.id;
  const messageId = q.message.message_id;
  const page = parseInt(q.data.split("_")[2]);

  await bot.editMessageText(
    "<blockquote>⏳ <b>Proses mengambil daftar userver offline...</b></blockquote>",
    {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
    }
  );

  await renderOfflineServerList(chatId, page, messageId);
  await bot.answerCallbackQuery(q.id);
});

async function renderOfflineServerList(chatId, page, editMessageId) {
  try {
    const limit = 15;

    // ambil SEMUA server lalu filter offline
    let offline = [];
    let p = 1;
    let totalPages = 1;

    do {
      const f = await fetch(`${domain}/api/application/servers?page=${p}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${plta}`,
        },
      });

      const res = await f.json();
      const servers = res.data || [];
      totalPages = res?.meta?.pagination?.total_pages || 1;

      for (const server of servers) {
        const s = server.attributes;
        let status = s.status;

        try {
          const f3 = await fetch(
            `${domain}/api/client/servers/${s.uuid.split("-")[0]}/resources`,
            {
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${pltc}`,
              },
            }
          );
          const data = await f3.json();
          if (data?.attributes?.current_state)
            status = data.attributes.current_state;
        } catch {}

        if (status === "offline") {
          offline.push({ id: s.id, name: s.name, status });
        }
      }
      p++;
    } while (p <= totalPages);

    if (offline.length === 0) {
      return bot.editMessageText(
        "<blockquote>✅ <b>Tidak ada server offline</b></blockquote>",
        {
          chat_id: chatId,
          message_id: editMessageId,
          parse_mode: "HTML",
        }
      );
    }

    // pagination manual dari hasil offline
    const totalOfflinePages = Math.ceil(offline.length / limit);
    const start = (page - 1) * limit;
    const slice = offline.slice(start, start + limit);

    let content = `📴 <b>Daftar Server Offline</b>
Halaman ${page}/${totalOfflinePages}
Total: ${offline.length}

`;

    for (const s of slice) {
      content += `🆔 <b>ID</b>: ${s.id}
🖥 <b>Nama</b>: ${s.name}
📴 <b>Status</b>: offline

`;
    }

    const text = `<blockquote>${content}</blockquote>`;

    const buttons = [];
    if (page > 1) {
      buttons.push({
        text: "⬅️ Kembali",
        callback_data: `srvoff_page_${page - 1}`,
      });
    }
    if (page < totalOfflinePages) {
      buttons.push({
        text: "➡️ Lanjut",
        callback_data: `srvoff_page_${page + 1}`,
      });
    }

    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: editMessageId,
      parse_mode: "HTML",
      reply_markup: buttons.length
        ? { inline_keyboard: [buttons] }
        : undefined,
    });
  } catch (err) {
    console.error(err);
    await bot.editMessageText(
      "<blockquote>❌ <b>Gagal memuat server offline</b></blockquote>",
      {
        chat_id: chatId,
        message_id: editMessageId,
        parse_mode: "HTML",
      }
    );
  }
}

bot.onText(/^\/listsrvoff([2-7])$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const ver = match[1];

  if (msg.text.trim() !== `/listsrvoff${ver}`) return;

  if (
    (msg.chat.type !== "group" && msg.chat.type !== "supergroup") &&
    userId !== OWNER_ID
  ) return bot.sendMessage(chatId, "❌ Khusus grup!");

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  if (!ownerUsers.includes(String(userId)))
    return bot.sendMessage(chatId, "❌ Khusus owner");

  const domain = domainMap[ver];
  const plta = pltaMap[ver];
  const pltc = pltcMap[ver];

  if (!domain || !plta || !pltc)
    return bot.sendMessage(chatId, "❌ Konfigurasi panel tidak ditemukan");

  const loading = await bot.sendMessage(
    chatId,
    "<blockquote>⏳ <b>Proses mengambi daftarl server offline...</b></blockquote>",
    { parse_mode: "HTML" }
  );

  await renderOfflineServerList(chatId, ver, 1, loading.message_id);
});

bot.on("callback_query", async (q) => {
  if (!q.data.startsWith("srvoff_page_")) return;

  const [, , ver, pageStr] = q.data.split("_");
  const page = parseInt(pageStr);

  const chatId = q.message.chat.id;
  const messageId = q.message.message_id;

  const domain = domainMap[ver];
  const plta = pltaMap[ver];
  const pltc = pltcMap[ver];

  if (!domain || !plta || !pltc) {
    return bot.answerCallbackQuery(q.id, {
      text: "Panel tidak ditemukan",
      show_alert: true,
    });
  }

  await bot.editMessageText(
    "<blockquote>⏳ <b>Proses mengambil daftar server offline...</b></blockquote>",
    {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
    }
  );

  await renderOfflineServerList(chatId, ver, page, messageId);
  await bot.answerCallbackQuery(q.id);
});

async function renderOfflineServerList(chatId, ver, page, editMessageId) {
  try {
    const limit = 15;
    const domain = domainMap[ver];
    const plta = pltaMap[ver];
    const pltc = pltcMap[ver];

    let offline = [];
    let p = 1;
    let totalPages = 1;

    do {
      const f = await fetch(`${domain}/api/application/servers?page=${p}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${plta}`,
        },
      });

      const res = await f.json();
      const servers = res?.data || [];
      totalPages = res?.meta?.pagination?.total_pages || 1;

      for (const server of servers) {
        const s = server.attributes;
        let status = s.status;

        try {
          const f3 = await fetch(
            `${domain}/api/client/servers/${s.uuid.split("-")[0]}/resources`,
            {
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${pltc}`,
              },
            }
          );
          const data = await f3.json();
          if (data?.attributes?.current_state)
            status = data.attributes.current_state;
        } catch {}

        if (status === "offline") {
          offline.push({ id: s.id, name: s.name });
        }
      }

      p++;
    } while (p <= totalPages);

    if (offline.length === 0) {
      return bot.editMessageText(
        "<blockquote>✅ <b>Tidak ada server offline</b></blockquote>",
        {
          chat_id: chatId,
          message_id: editMessageId,
          parse_mode: "HTML",
        }
      );
    }

    const totalOfflinePages = Math.ceil(offline.length / limit);
    const start = (page - 1) * limit;
    const slice = offline.slice(start, start + limit);

    let content = `📴 <b>Daftar Server Offline (Panel ${ver})</b>
Halaman ${page}/${totalOfflinePages}
Total: ${offline.length}

`;

    for (const s of slice) {
      content += `🆔 <b>ID</b>: ${s.id}
🖥 <b>Nama</b>: ${s.name}
📴 <b>Status</b>: offline

`;
    }

    const buttons = [];

    if (page > 1) {
      buttons.push({
        text: "⬅️ Kembali",
        callback_data: `srvoff_page_${ver}_${page - 1}`,
      });
    }

    if (page < totalOfflinePages) {
      buttons.push({
        text: "➡️ Lanjut",
        callback_data: `srvoff_page_${ver}_${page + 1}`,
      });
    }

    await bot.editMessageText(`<blockquote>${content}</blockquote>`, {
      chat_id: chatId,
      message_id: editMessageId,
      parse_mode: "HTML",
      reply_markup: buttons.length
        ? { inline_keyboard: [buttons] }
        : undefined,
    });
  } catch (err) {
    console.error(err);
    await bot.editMessageText(
      "<blockquote>❌ <b>Gagal memuat server offline</b></blockquote>",
      {
        chat_id: chatId,
        message_id: editMessageId,
        parse_mode: "HTML",
      }
    );
  }
}
   
bot.onText(/\/clearoff/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (msg.text.trim() !== `/clearoff`) return;

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const isCooldown = checkCooldown(msg);
  if (isCooldown) return bot.sendMessage(chatId, isCooldown);

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  const isOwner = ownerUsers.includes(String(msg.from.id));
  if (!isOwner) {
    return bot.sendMessage(chatId, "❌ Hanya untuk owner!", {
      reply_markup: { inline_keyboard: [[{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }]] },
    });
  }

  try {
    await bot.sendMessage(chatId, "⏳ Menghapus semua server & user offline...");

    let offlineServers = [];
    let page = 1;
    let totalPages = 1;

    do {
      let f = await fetch(`${domain}/api/application/servers?page=${page}`, {
        method: "GET",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${plta}` },
      });
      let res = await f.json();
      let servers = res.data;
      totalPages = res.meta.pagination.total_pages;

      for (let server of servers) {
        let s = server.attributes;
        try {
          let f3 = await fetch(`${domain}/api/client/servers/${s.uuid.split("-")[0]}/resources`, {
            method: "GET",
            headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${pltc}` },
          });
          let data = await f3.json();
          let status = data.attributes ? data.attributes.current_state : s.status;
          if (status === "offline") offlineServers.push({ id: s.id, name: s.name });
        } catch {}
      }
      page++;
    } while (page <= totalPages);

    let serverSuccess = [];
    let serverFailed = [];

    for (let srv of offlineServers) {
      try {
        let del = await fetch(`${domain}/api/application/servers/${srv.id}`, {
          method: "DELETE",
          headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${plta}` },
        });
        if (del.status === 204) serverSuccess.push(`✅ ${srv.name} (ID: ${srv.id})`);
        else serverFailed.push(`❌ ${srv.name} (ID: ${srv.id})`);
      } catch {
        serverFailed.push(`❌ ${srv.name} (ID: ${srv.id})`);
      }
    }

    let offlineUsers = [];
    page = 1;
    totalPages = 1;

    do {
      let f = await fetch(`${domain}/api/application/users?page=${page}`, {
        method: "GET",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${plta}` },
      });
      let res = await f.json();
      let users = res.data;
      totalPages = res.meta.pagination.total_pages;

      for (let user of users) {
        let u = user.attributes;
        if (u.root_admin) continue;
        let hasServer = false;
        try {
          let serverCheck = await fetch(`${domain}/api/application/servers?filter[user_id]=${u.id}`, {
            method: "GET",
            headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${plta}` },
          });
          let serverData = await serverCheck.json();
          if (serverData.data && serverData.data.length > 0) hasServer = true;
        } catch {}
        if (!hasServer) offlineUsers.push({ id: u.id, username: u.username, email: u.email });
      }
      page++;
    } while (page <= totalPages);

    let userSuccess = [];
    let userFailed = [];

    for (let user of offlineUsers) {
      try {
        let del = await fetch(`${domain}/api/application/users/${user.id}`, {
          method: "DELETE",
          headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${plta}` },
        });
        if (del.status === 204) userSuccess.push(`✅ ${user.username} (${user.email})`);
        else userFailed.push(`❌ ${user.username} (${user.email})`);
      } catch {
        userFailed.push(`❌ ${user.username} (${user.email})`);
      }
    }

    const report = `<blockquote><b>✅ CLEAR OFF SELESAI (Panel ${ver})</b>

<b>Server OFFLINE:</b>
✔️ ${serverSuccess.length} berhasil
❌ ${serverFailed.length} gagal

${serverSuccess.slice(0, 10).join("\n")}
${serverSuccess.length > 10 ? `\n...dan ${serverSuccess.length - 10} lainnya` : ""}

<b>User tanpa server:</b>
✔️ ${userSuccess.length} berhasil
❌ ${userFailed.length} gagal

${userSuccess.slice(0, 10).join("\n")}
${userSuccess.length > 10 ? `\n...dan ${userSuccess.length - 10} lainnya` : ""}
</blockquote>`;

    await bot.sendMessage(chatId, finalReport, { parse_mode: "HTML" });

  } catch {
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat memproses /clearoff.");
  }
});
bot.onText(/^\/clearoff([2-7])$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const ver = match[1];

  if (msg.text.trim() !== `/clearoff${ver}`) return;

  const domain = domainMap[ver];
  const plta = pltaMap[ver];
  const pltc = pltcMap[ver];

  if (!domain || !plta || !pltc) {
    return bot.sendMessage(chatId, "❌ Konfigurasi domain tidak valid");
  }

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

  const isCooldown = checkCooldown(msg);
  if (isCooldown) return bot.sendMessage(chatId, isCooldown);

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  if (!ownerUsers.includes(String(msg.from.id))) {
    return bot.sendMessage(chatId, "❌ Hanya untuk owner!", {
      reply_markup: {
        inline_keyboard: [[{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }]],
      },
    });
  }

  try {
    await bot.sendMessage(
      chatId,
      `<blockquote>⏳ Membersihkan server & user OFFLINE (Panel ${ver})...</blockquote>`,
      { parse_mode: "HTML" }
    );

    /* ================= SERVER OFFLINE ================= */

    let offlineServers = [];
    let page = 1;
    let totalPages = 1;

    do {
      const f = await fetch(`${domain}/api/application/servers?page=${page}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${plta}`,
        },
      });

      const res = await f.json();
      totalPages = res.meta.pagination.total_pages;

      for (const server of res.data) {
        const s = server.attributes;
        let status = "offline";

        try {
          const f3 = await fetch(
            `${domain}/api/client/servers/${s.identifier}/resources`,
            {
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${pltc}`,
              },
            }
          );
          const data = await f3.json();
          if (data?.attributes?.current_state)
            status = data.attributes.current_state;
        } catch {}

        if (status === "offline") {
          offlineServers.push({ id: s.id, name: s.name });
        }
      }

      page++;
    } while (page <= totalPages);

    let serverSuccess = [];
    let serverFailed = [];

    for (const srv of offlineServers) {
      try {
        const del = await fetch(
          `${domain}/api/application/servers/${srv.id}`,
          {
            method: "DELETE",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${plta}`,
            },
          }
        );

        if (del.status === 204)
          serverSuccess.push(`✅ ${srv.name} (ID: ${srv.id})`);
        else serverFailed.push(`❌ ${srv.name} (ID: ${srv.id})`);
      } catch {
        serverFailed.push(`❌ ${srv.name} (ID: ${srv.id})`);
      }
    }

    /* ================= USER TANPA SERVER ================= */

    let offlineUsers = [];
    page = 1;
    totalPages = 1;

    do {
      const f = await fetch(`${domain}/api/application/users?page=${page}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${plta}`,
        },
      });

      const res = await f.json();
      totalPages = res.meta.pagination.total_pages;

      for (const user of res.data) {
        const u = user.attributes;
        if (u.root_admin) continue;

        let hasServer = false;
        try {
          const sc = await fetch(
            `${domain}/api/application/servers?filter[user_id]=${u.id}`,
            {
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${plta}`,
              },
            }
          );
          const sd = await sc.json();
          if (sd.data && sd.data.length > 0) hasServer = true;
        } catch {}

        if (!hasServer) {
          offlineUsers.push({
            id: u.id,
            username: u.username,
            email: u.email,
          });
        }
      }

      page++;
    } while (page <= totalPages);

    let userSuccess = [];
    let userFailed = [];

    for (const u of offlineUsers) {
      try {
        const del = await fetch(
          `${domain}/api/application/users/${u.id}`,
          {
            method: "DELETE",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${plta}`,
            },
          }
        );

        if (del.status === 204)
          userSuccess.push(`✅ ${u.username} (${u.email})`);
        else userFailed.push(`❌ ${u.username} (${u.email})`);
      } catch {
        userFailed.push(`❌ ${u.username} (${u.email})`);
      }
    }

    /* ================= LAPORAN ================= */

    const report = `<blockquote><b>✅ CLEAR OFF SELESAI (Panel ${ver})</b>

<b>Server OFFLINE:</b>
✔️ ${serverSuccess.length} berhasil
❌ ${serverFailed.length} gagal

${serverSuccess.slice(0, 10).join("\n")}
${serverSuccess.length > 10 ? `\n...dan ${serverSuccess.length - 10} lainnya` : ""}

<b>User tanpa server:</b>
✔️ ${userSuccess.length} berhasil
❌ ${userFailed.length} gagal

${userSuccess.slice(0, 10).join("\n")}
${userSuccess.length > 10 ? `\n...dan ${userSuccess.length - 10} lainnya` : ""}
</blockquote>`;

    await bot.sendMessage(chatId, report, { parse_mode: "HTML" });

  } catch (err) {
    console.error("CLEAROFF ERROR:", err);
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat memproses /clearoff");
  }
});
bot.onText(/\/delalladp (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const excludedId = match[1].trim();

      if ((msg.chat.type !== "group" && msg.chat.type !== "supergroup") && msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, "❌ Fitur ini hanya dapat digunakan di dalam grup!");
      }

      const isCooldown = checkCooldown(msg);
      if (isCooldown) return bot.sendMessage(chatId, isCooldown);

      const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
      const isOwner = ownerUsers.includes(String(msg.from.id));
      if (!isOwner) {
        return bot.sendMessage(chatId, "❌ Hanya untuk owner!", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }],
            ],
          },
        });
      }

      bot.sendMessage(chatId, `⏳ Menghapus semua admin panel kecuali ID: ${excludedId}...`);

      try {
        let page = 1;
        let totalPages = 1;
        let adminUsers = [];
        let deletedCount = 0;
        let failedCount = 0;

        // Ambil semua user dari semua halaman
        do {
          let f = await fetch(`${domain}/api/application/users?page=${page}`, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${plta}`,
            },
          });

          let res = await f.json();
          let users = res.data;
          totalPages = res.meta.pagination.total_pages;

          // Filter hanya admin panel (root_admin = true)
          for (let user of users) {
            let u = user.attributes;
            if (u.root_admin && u.id.toString() !== excludedId) {
              adminUsers.push({ id: u.id, username: u.username, email: u.email });
            }
          }

          page++;
        } while (page <= totalPages);

        // Hapus admin panel yang tidak termasuk excluded ID
        for (let admin of adminUsers) {
          try {
            let del = await fetch(`${domain}/api/application/users/${admin.id}`, {
              method: "DELETE",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${plta}`,
              },
            });

            if (del.status === 204) {
              deletedCount++;
              console.log(`✅ Deleted admin: ${admin.username} (${admin.id})`);
            } else {
              failedCount++;
              console.log(`❌ Failed to delete admin: ${admin.username} (${admin.id})`);
            }
          } catch (err) {
            failedCount++;
            console.error(`Error deleting admin ${admin.id}:`, err);
          }
        }

        const resultMessage = `🗑️ *HASIL DELETE ALL ADMIN PANEL*

✅ Berhasil dihapus: ${deletedCount}
❌ Gagal dihapus: ${failedCount}
🛡️ ID yang dilindungi: ${excludedId}

${deletedCount > 0 ? '✨ Semua admin panel berhasil dihapus kecuali yang dilindungi!' : '❌ Tidak ada admin panel yang dihapus.'}`;

        bot.sendMessage(chatId, resultMessage, { parse_mode: "Markdown" });

      } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "❌ Terjadi kesalahan saat menghapus admin panel.");
      }
    });

// command /autodel - set auto delete on/off (untuk group)
bot.onText(/^\/autodel\s+(on|off)$/, (msg, match) => {
    const chatId = msg.chat.id;
    const action = match[1].toLowerCase();

    const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
      const isOwner = ownerUsers.includes(String(msg.from.id));
      if (!isOwner) {
        return bot.sendMessage(chatId, "❌ Hanya untuk owner!", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }],
            ],
          },
        });
      }

    bot.sendMessage(chatId, '🔧 Mengatur auto-delete...', {
        reply_to_message_id: msg.message_id
    });
});

// command /setautodel - atur interval (untuk group)
bot.onText(/^\/setautodel\s+(\d+)$/, (msg, match) => {
    const chatId = msg.chat.id;
    const interval = parseInt(match[1]);

    const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
      const isOwner = ownerUsers.includes(String(msg.from.id));
      if (!isOwner) {
        return bot.sendMessage(chatId, "❌ Hanya untuk owner!", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }],
            ],
          },
        });
      }

    if (interval < 1 || interval > 24) {
        return bot.sendMessage(chatId, '❌ Interval harus antara 1-24 jam!', {
            reply_to_message_id: msg.message_id
        });
    }

    bot.sendMessage(chatId, `✅ Interval auto-delete diatur menjadi ${interval} jam!`, {
        reply_to_message_id: msg.message_id
    });
});

// command /autodelstatus - cek status (untuk group)
bot.onText(/^\/autodelstatus$/, (msg) => {
    const chatId = msg.chat.id;

    const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
      const isOwner = ownerUsers.includes(String(msg.from.id));
      if (!isOwner) {
        return bot.sendMessage(chatId, "❌ Hanya untuk owner!", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }],
            ],
          },
        });
      }

    const statusMessage = `
🔧 **STATUS AUTO-DELETE**

**Status:** ❌ Fitur ini hanya tersedia di private chat bot
**Info:** Gunakan command di private chat bot untuk mengatur auto-delete

**Fitur:**
- Hapus server offline otomatis
- Hapus user offline otomatis  
- Jadwal customizable (1-24 jam)
- Laporan detail setiap eksekusi
    `;

    bot.sendMessage(chatId, statusMessage, { 
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id
    });
});
bot.onText(/^\/totalserver$/, async (msg) => {
    await totalServerHandler(msg, 1);
});

for (let i = 2; i <= 7; i++) {
    bot.onText(new RegExp(`^\\/totalserverv${i}$`), async (msg) => {
        await totalServerHandler(msg, i);
    });
}

async function totalServerHandler(msg, num) {
    const chatId = msg.chat.id;

    const isCooldown = checkCooldown(msg);
    if (isCooldown) return bot.sendMessage(chatId, isCooldown);

    let domain, plta;
    if (num === 1) {
        domain = settings.domain;
        plta = settings.plta;
    } else if (num >= 2 && num <= 7) {
        domain = settings[`domainV${num}`];
        plta = settings[`pltaV${num}`];
    } else {
        return bot.sendMessage(chatId, "❌ Pilih server 1–7\nContoh: /totalserver atau /totalserverv2");
    }

    if (!domain || !plta) {
        return bot.sendMessage(chatId, "⚠️ Domain atau token PLTA belum di-set.");
    }

    try {
        const loadingMsg = await bot.sendMessage(chatId, "⏳ Sedang mengecek server...", { reply_to_message_id: msg.message_id });

        let page = 1;
        let totalServers = 0;
        let totalAdmin = 0;

        while (true) {
            const res = await fetch(`${domain}/api/application/servers?page=${page}`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${plta}`,
                },
            }).then(r => r.json());

            if (!res?.data || !Array.isArray(res.data) || res.data.length === 0) break;

            totalServers += res.data.length;

            res.data.forEach(s => {
                if (s?.relationships?.users?.data) {
                    totalAdmin += s.relationships.users.data.length;
                }
            });

            const totalPages = res?.meta?.pagination?.total_pages || 1;
            if (page >= totalPages) break;
            page++;
        }

        const text = 
`🚀 Total Server Panel V${num}: <b>${totalServers}</b>`;

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: loadingMsg.message_id,
            parse_mode: "HTML"
        });

    } catch (err) {
        console.error(err);
        await bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat memproses /totalserver.");
    }
}

    bot.onText(/^\/cekserver\s+(.+)$/, async (msg, match) => {
  const chatId = msg.chat.id;

  // ===== CEK COOLDOWN =====
  const isCooldown = checkCooldown(msg);
  if (isCooldown) return bot.sendMessage(chatId, isCooldown);

  const input = match[1].trim();
  const parts = input.split(",");
  if (parts.length < 2) {
    return bot.sendMessage(
      chatId,
      "❌ Format salah!\nGunakan: /cekserver domain,plta"
    );
  }

  const domain = parts[0].trim();
  const plta = parts[1].trim();

  if (!domain || !plta) {
    return bot.sendMessage(chatId, "⚠️ Domain atau token PLTA tidak valid.");
  }

  let loadingMsg;
  try {
    loadingMsg = await bot.sendMessage(chatId, "⏳ Sedang mengecek server...", {
      reply_to_message_id: msg.message_id
    });

    let page = 1;
    let totalServers = 0;
    let totalAdmin = 0;

    while (true) {
      const res = await fetch(`${domain}/api/application/servers?page=${page}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${plta}`,
        },
      }).then(r => r.json());

      if (!res?.data || !Array.isArray(res.data) || res.data.length === 0) break;

      totalServers += res.data.length;

      res.data.forEach(s => {
        if (s?.relationships?.users?.data) {
          totalAdmin += s.relationships.users.data.length;
        }
      });

      const totalPages = res?.meta?.pagination?.total_pages || 1;
      if (page >= totalPages) break;
      page++;
    }

    const text = 
`🚀 Total Server: <b>${totalServers}</b>
👤 Total Admin: <b>${totalAdmin}</b>
🔗 Domain: <code>${domain}</code>`;

    // EDIT pesan loading sebelumnya
    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
      parse_mode: "HTML"
    });

  } catch (err) {
    console.error(err);
    if (loadingMsg?.message_id) {
      await bot.editMessageText("⚠️ Terjadi kesalahan saat memproses /cekserver.", {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      });
    } else {
      await bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat memproses /cekserver.");
    }
  }
});
bot.onText(/^\/listsrv$/, async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text.trim() !== "/listsrv") return;

  if (
    (msg.chat.type !== "group" && msg.chat.type !== "supergroup") &&
    msg.from.id !== OWNER_ID
  ) return bot.sendMessage(chatId, "❌ Khusus grup!");

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  if (!ownerUsers.includes(String(msg.from.id)))
    return bot.sendMessage(chatId, "❌ Khusus owner");

  const loading = await bot.sendMessage(
    chatId,
    "<blockquote>⏳ <b>Proses mengambil daftar server...</b></blockquote>",
    { parse_mode: "HTML" }
  );

  await renderServerList(chatId, 1, loading.message_id);
});

bot.on("callback_query", async (q) => {
  if (!q.data.startsWith("srv_page_")) return;

  const chatId = q.message.chat.id;
  const messageId = q.message.message_id;
  const page = parseInt(q.data.split("_")[2]);

  // edit jadi loading dulu
  await bot.editMessageText(
    "<blockquote>⏳ <b>Proses mengambil daftar server...</b></blockquote>",
    {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
    }
  );

  await renderServerList(chatId, page, messageId);
  await bot.answerCallbackQuery(q.id);
});

async function renderServerList(chatId, page, editMessageId) {
  try {
    const limit = 15;

    const f = await fetch(
      `${domain}/api/application/servers?page=${page}&per_page=${limit}`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${plta}`,
        },
      }
    );

    const res = await f.json();
    if (!res?.data || !res?.meta?.pagination) {
      throw new Error("Pagination invalid");
    }

    const { current_page, total_pages } = res.meta.pagination;

    let content = `📦 <b>Daftar Server</b>

Halaman ${current_page}/${total_pages}

`;

    for (const server of res.data) {
      const s = server.attributes;
      let status = s.status;

      try {
        const f3 = await fetch(
          `${domain}/api/client/servers/${s.uuid.split("-")[0]}/resources`,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${pltc}`,
            },
          }
        );

        const data = await f3.json();
        if (data?.attributes?.current_state) {
          status = data.attributes.current_state;
        }
      } catch {}

      content += `🆔 <b>ID</b>: ${s.id}
🖥 <b>Nama</b>: ${s.name}
⚙️ <b>Status</b>: ${status}

`;
    }

    const text = `<blockquote>${content}</blockquote>`;

    const buttons = [];

    if (current_page > 1) {
      buttons.push({
        text: "⬅️ Kembali",
        callback_data: `srv_page_${current_page - 1}`,
      });
    }

    if (current_page < total_pages) {
      buttons.push({
        text: "➡️ Lanjut",
        callback_data: `srv_page_${current_page + 1}`,
      });
    }

    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: editMessageId,
      parse_mode: "HTML",
      reply_markup: buttons.length
        ? { inline_keyboard: [buttons] }
        : undefined,
    });

  } catch (err) {
    console.error("RENDER SERVER LIST ERROR:", err);
    await bot.editMessageText(
      "<blockquote>❌ <b>Gagal memuat daftar server</b></blockquote>",
      {
        chat_id: chatId,
        message_id: editMessageId,
        parse_mode: "HTML",
      }
    );
  }
}
bot.onText(/^\/listsrv([2-7])$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const ver = match[1];

  if (
    (msg.chat.type !== "group" && msg.chat.type !== "supergroup") &&
    msg.from.id !== OWNER_ID
  ) return bot.sendMessage(chatId, "❌ Khusus grup!");

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  if (!ownerUsers.includes(String(msg.from.id)))
    return bot.sendMessage(chatId, "❌ Khusus owner");

  const domain = domainMap[ver];
  const plta = pltaMap[ver];
  const pltc = pltcMap[ver];

  if (!domain || !plta || !pltc)
    return bot.sendMessage(chatId, "❌ Konfigurasi panel tidak ditemukan");

  const loading = await bot.sendMessage(
    chatId,
    `<blockquote>⏳ <b>Proses mengambil daftar server (Panel ${ver})...</b></blockquote>`,
    { parse_mode: "HTML" }
  );

  await renderServerList(chatId, 1, loading.message_id, ver, domain, plta, pltc);
});

// CALLBACK PAGINATION
bot.on("callback_query", async (q) => {
  if (!q.data.startsWith("srv_")) return;

  const [, ver, page] = q.data.split("_");
  const chatId = q.message.chat.id;
  const messageId = q.message.message_id;

  const domain = domainMap[ver];
  const plta = pltaMap[ver];
  const pltc = pltcMap[ver];

  if (!domain || !plta || !pltc) return bot.answerCallbackQuery(q.id);

  await bot.editMessageText(
    `<blockquote>⏳ <b>Proses mengambil server (Panel ${ver})...</b></blockquote>`,
    {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
    }
  );

  await renderServerList(
    chatId,
    parseInt(page),
    messageId,
    ver,
    domain,
    plta,
    pltc
  );

  await bot.answerCallbackQuery(q.id);
});

// RENDER SERVER LIST
async function renderServerList(chatId, page, messageId, ver, domain, plta, pltc) {
  try {
    const limit = 15;

    const f = await fetch(
      `${domain}/api/application/servers?page=${page}&per_page=${limit}`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${plta}`,
        },
      }
    );

    const res = await f.json();
    if (!res?.data || !res?.meta?.pagination)
      throw new Error("Pagination invalid");

    const { current_page, total_pages } = res.meta.pagination;

    let content = `📦 <b>Daftar Server</b>
Panel ${ver}
Halaman ${current_page}/${total_pages}

`;

    for (const server of res.data) {
      const s = server.attributes;
      let status = s.status;

      try {
        const f3 = await fetch(
          `${domain}/api/client/servers/${s.uuid.split("-")[0]}/resources`,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${pltc}`,
            },
          }
        );
        const data = await f3.json();
        if (data?.attributes?.current_state)
          status = data.attributes.current_state;
      } catch {}

      content += `🆔 <b>ID</b>: ${s.id}
🖥 <b>Nama</b>: ${s.name}
⚙️ <b>Status</b>: ${status}

`;
    }

    const text = `<blockquote>${content}</blockquote>`;

    const buttons = [];
    if (current_page > 1) {
      buttons.push({
        text: "⬅️ Kembali",
        callback_data: `srv_${ver}_${current_page - 1}`,
      });
    }
    if (current_page < total_pages) {
      buttons.push({
        text: "➡️ Lanjut",
        callback_data: `srv_${ver}_${current_page + 1}`,
      });
    }

    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: buttons.length
        ? { inline_keyboard: [buttons] }
        : undefined,
    });
  } catch (err) {
    console.error(err);
    await bot.editMessageText(
      "<blockquote>❌ <b>Gagal memuat daftar server</b></blockquote>",
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
      }
    );
  }
}
bot.onText(/\/autodeladp\s+(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  if (!ownerUsers.includes(String(msg.from.id))) {
    return bot.sendMessage(chatId, "❌ Hanya untuk owner!", {
      reply_markup: { inline_keyboard: [[{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }]] },
    });
  }

  const args = match[1].split(',').map(a => a.trim()).filter(a => a !== '');
  const targetId = parseInt(args[0]);
  if (isNaN(targetId) || targetId < 1) {
    return bot.sendMessage(chatId, '❗ Format salah.\nGunakan: /autodeladp <sampai_id>,<id_blacklist>\nContoh: /autodeladp 100,105,110');
  }

  const blacklistIds = args.slice(1)
    .map(a => parseInt(a))
    .filter(id => !isNaN(id) && id > targetId);

  bot.sendMessage(chatId, `⚙️ Mengambil semua data admin panel...\nMohon tunggu sebentar.`);

  let allUsers = [];
  let page = 1;

  try {
    while (true) {
      const res = await fetch(`${domain}/api/application/users?page=${page}&per_page=100`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${plta}`
        }
      });

      if (!res.ok) break;
      const json = await res.json();
      if (!json.data || json.data.length === 0) break;

      allUsers.push(...json.data);
      if (!json.meta?.pagination?.links?.next) break;
      page++;
    }
  } catch (err) {
    return bot.sendMessage(chatId, `❌ Gagal mengambil daftar admin: ${err.message}`);
  }

  if (allUsers.length === 0) {
    return bot.sendMessage(chatId, '❗ Tidak ada user ditemukan di panel.');
  }

  const admins = allUsers
    .filter(u => u.attributes.root_admin === true)
    .map(u => u.attributes.id)
    .filter(id => id >= targetId && !blacklistIds.includes(id))
    .sort((a, b) => b - a);

  if (admins.length === 0) {
    return bot.sendMessage(chatId, `❗ Tidak ada admin yang cocok untuk dihapus (>= ${targetId} dan tidak di blacklist).`);
  }

  bot.sendMessage(chatId, `⚠️ Proses penghapusan admin panel dimulai...\n👤 Total admin: ${admins.length}\n📉 Dari ID ${admins[0]} sampai ${targetId}\n🚫 Blacklist: ${blacklistIds.length ? blacklistIds.join(', ') : 'Tidak ada'}`);

  let success = 0;
  let failed = 0;
  let failedList = [];

  for (const id of admins) {
    try {
      const del = await fetch(`${domain}/api/application/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${plta}`
        }
      });

      if (del.status === 204) success++;
      else {
        failed++;
        failedList.push(`${id} (gagal hapus)`);
      }
    } catch (err) {
      failed++;
      failedList.push(`${id} (error: ${err.message})`);
    }

    await new Promise(r => setTimeout(r, typeof DELAY_MS !== 'undefined' ? DELAY_MS : 200));
  }

  let result = `🗑️ Hasil Auto Delete Admin Panel\n\n✅ Berhasil : ${success}\n❌ Gagal    : ${failed}`;
  if (failedList.length) result += `\n\n📋 Gagal pada:\n- ${failedList.join('\n- ')}`;

  bot.sendMessage(chatId, result);
});


bot.onText(/\/autodelsrv\s+(\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  if (!ownerUsers.includes(String(msg.from.id))) {
    return bot.sendMessage(chatId, "❌ Hanya untuk owner!", {
      reply_markup: { inline_keyboard: [[{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }]] },
    });
  }

  const targetId = parseInt(match[1]);
  if (isNaN(targetId) || targetId < 1) {
    return bot.sendMessage(chatId, '❗ Masukkan angka ID server yang valid. Contoh: /autodelsrv 50');
  }

  bot.sendMessage(chatId, `⚙️ Mengambil semua data server dari panel...\nMohon tunggu, ini bisa memakan waktu.`);

  let allServers = [];
  let page = 1;

  try {
    while (true) {
      const res = await fetch(`${domain}/api/application/servers?page=${page}&per_page=100`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${plta}`
        }
      });

      if (!res.ok) break;
      const json = await res.json();
      if (!json.data || json.data.length === 0) break;

      allServers.push(...json.data);
      if (!json.meta?.pagination?.links?.next) break;
      page++;
    }
  } catch (err) {
    return bot.sendMessage(chatId, `❌ Gagal mengambil daftar server: ${err.message}`);
  }

  if (allServers.length === 0) {
    return bot.sendMessage(chatId, '❗ Tidak ada server ditemukan di panel.');
  }

  const servers = allServers
    .map(s => s.attributes.id)
    .filter(id => id >= targetId)
    .sort((a, b) => b - a);

  if (servers.length === 0) {
    return bot.sendMessage(chatId, `❗ Tidak ada server dengan ID >= ${targetId}`);
  }

  bot.sendMessage(chatId, `⚠️ Proses penghapusan dimulai...\n🧹 Total server: ${servers.length}\n📉 Dari ID ${servers[0]} sampai ${targetId}`);

  let successCount = 0;
  let failCount = 0;
  let failList = [];

  for (const id of servers) {
    try {
      const info = await fetch(`${domain}/api/application/servers/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${plta}`
        }
      });

      if (!info.ok) {
        failCount++;
        failList.push(`${id} (tidak ditemukan)`);
        continue;
      }

      const serverData = await info.json();
      const userId = serverData.attributes.user;

      const delServer = await fetch(`${domain}/api/application/servers/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${plta}`
        }
      });

      if (!delServer.ok) {
        failCount++;
        failList.push(`${id} (gagal hapus server)`);
        continue;
      }

      const delUser = await fetch(`${domain}/api/application/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${plta}`
        }
      });

      if (delUser.ok) successCount++;
      else {
        failCount++;
        failList.push(`${id} (gagal hapus user ${userId})`);
      }

    } catch (err) {
      failCount++;
      failList.push(`${id} (error: ${err.message})`);
    }

    await new Promise(r => setTimeout(r, typeof DELAY_MS !== 'undefined' ? DELAY_MS : 200));
  }

  let result = `🗑️ Hasil Auto Delete Server\n\n✅ Berhasil : ${successCount}\n❌ Gagal    : ${failCount}`;
  if (failList.length) result += `\n\n📋 Gagal pada:\n- ${failList.join('\n- ')}`;

  bot.sendMessage(chatId, result);
});


bot.onText(/^\/infovps(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1];

  if (!input) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: `/infovps 1.1.1.1|password`", {
      parse_mode: "Markdown"
    });
  }

  if (!input.includes("|")) {
    return bot.sendMessage(chatId, "❌ Format salah!\nGunakan format:\n`/infovps ip|password`", {
      parse_mode: "Markdown"
    });
  }

  let [host, password] = input.split("|");
  host = host.trim();
  password = password.trim();

  try {
    const conn = new Client();

    conn.on("ready", () => {
      const command = `
        echo "RUNTIME: $(uptime -p)"
        echo "LOAD: $(uptime | awk -F'load average:' '{print $2}')"
        echo "RAM_TOTAL: $(free -g | awk '/Mem:/ {print $2}')"
        echo "RAM_USED: $(free -g | awk '/Mem:/ {print $3}')"
        echo "CORE: $(nproc)"
        echo "CPU_USAGE: $(top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8}' )"
        echo "DISK_TOTAL: $(df -h / | awk 'NR==2 {print $2}')"
        echo "DISK_USED: $(df -h / | awk 'NR==2 {print $3}')"
        echo "DISK_FREE: $(df -h / | awk 'NR==2 {print $4}')"
        echo "OS: $(hostnamectl | grep 'Operating System' | cut -d ':' -f2)"
        echo "KERNEL: $(uname -r)"
      `;

      conn.exec(command, (err, stream) => {
        if (err) {
          bot.sendMessage(chatId, "❌ Gagal mengeksekusi perintah di VPS.");
          return conn.end();
        }

        let output = "";
        stream.on("data", (data) => (output += data.toString()));
        stream.on("close", () => {

          // Pisahkan per baris
          let info = {};
          output.trim().split("\n").forEach(line => {
            const [key, ...valueParts] = line.split(":");
            info[key.trim()] = valueParts.join(":").trim();
          });

          // Hilangkan nilai 0
          const fix = (val) => (!val || val === "0" || val === "0G") ? "-" : val;

          const runtime = fix(info.RUNTIME);
          const load = fix(info.LOAD);
          const ramTotal = fix(info.RAM_TOTAL);
          const ramUsed = fix(info.RAM_USED);
          const core = fix(info.CORE);
          const cpuUsage = fix(parseFloat(info.CPU_USAGE).toFixed(1));
          const diskTotal = fix(info.DISK_TOTAL);
          const diskUsed = fix(info.DISK_USED);
          const diskFree = fix(info.DISK_FREE);
          const osName = fix(info.OS);
          const kernel = fix(info.KERNEL);

          // Output
          const result = `
📡 *INFO VPS (${host})*

🖥 *System*
• OS: ${osName}
• Kernel: ${kernel}
• Runtime: ${runtime}
• Load Average: ${load}

💾 *Memory*
• RAM Total: ${ramTotal} GB
• RAM Terpakai: ${ramUsed} GB

⚙️ *CPU*
• Core: ${core}
• CPU Usage: ${cpuUsage}%

🗂 *Disk*
• Total: ${diskTotal}
• Digunakan: ${diskUsed}
• Tersisa: ${diskFree}
          `.trim();

          bot.sendMessage(chatId, result, { parse_mode: "Markdown" });
          conn.end();
        });
      });
    });

    conn.on("error", (err) => {
      bot.sendMessage(chatId, `❌ Gagal konek ke VPS: ${err.message}`);
    });

    conn.connect({
      host,
      port: 22,
      username: "root",
      password
    });

  } catch (err) {
    bot.sendMessage(chatId, "❌ Terjadi kesalahan koneksi VPS.");
    console.error(err);
  }
});
// V1 (tanpa angka) menggunakan domain, plta, pltc
bot.onText(/^\/deladp (.+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const targetId = match[1].trim();

  const isCooldown = checkCooldown(msg);
  if (isCooldown) return bot.sendMessage(chatId, isCooldown);

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  if (!ownerUsers.includes(String(msg.from.id))) {
    return bot.sendMessage(chatId, "❌ Hanya untuk owner!", {
      reply_markup: { inline_keyboard: [[{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }]] }
    });
  }

  bot.sendMessage(chatId, `⏳ Menghapus admin panel dengan ID: ${targetId}...`);

  try {
    let f = await fetch(`${domain}/api/application/users/${targetId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
    });

    if (f.status === 404) return bot.sendMessage(chatId, "❌ ID admin tidak ditemukan!");
    let res = await f.json();
    let user = res.attributes;

    if (!user.root_admin) return bot.sendMessage(chatId, "❌ User ini bukan admin panel (root_admin = false)");

    let del = await fetch(`${domain}/api/application/users/${targetId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
    });

    if (del.status === 204) {
      bot.sendMessage(chatId,
        `🗑️ *ADMIN PANEL BERHASIL DIHAPUS*\n\n🆔 ID: ${targetId}\n👤 Username: ${user.username}`,
        { parse_mode: "Markdown" }
      );
    } else {
      bot.sendMessage(chatId, "❌ Gagal menghapus admin panel.");
    }

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat menghapus admin panel.");
  }
});

// V2–V7 (menggunakan domainVx, pltaVx, pltcVx)
for (let i = 2; i <= 7; i++) {
  let domainVar = eval(`domainV${i}`);
  let pltaVar = eval(`pltaV${i}`);
  let pltcVar = eval(`pltcV${i}`);

  bot.onText(new RegExp(`^\\/deladp${i} (.+)$`), async (msg, match) => {
    const chatId = msg.chat.id;
    const targetId = match[1].trim();

    const isCooldown = checkCooldown(msg);
    if (isCooldown) return bot.sendMessage(chatId, isCooldown);

    const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
    if (!ownerUsers.includes(String(msg.from.id))) {
      return bot.sendMessage(chatId, "❌ Hanya untuk owner!", {
        reply_markup: { inline_keyboard: [[{ text: "ʟᴀᴘᴏʀᴀɴ", url: `https://t.me/${dev}` }]] }
      });
    }

    bot.sendMessage(chatId, `⏳ Menghapus admin panel dengan ID: ${targetId}...`);

    try {
      let f = await fetch(`${domainVar}/api/application/users/${targetId}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${pltaVar}`,
        },
      });

      if (f.status === 404) return bot.sendMessage(chatId, "❌ ID admin tidak ditemukan!");
      let res = await f.json();
      let user = res.attributes;

      if (!user.root_admin) return bot.sendMessage(chatId, "❌ User ini bukan admin panel (root_admin = false)");

      let del = await fetch(`${domainVar}/api/application/users/${targetId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${pltaVar}`,
        },
      });

      if (del.status === 204) {
        bot.sendMessage(chatId,
          `🗑️ *ADMIN PANEL BERHASIL DIHAPUS*\n\n🆔 ID: ${targetId}\n👤 Username: ${user.username}`,
          { parse_mode: "Markdown" }
        );
      } else {
        bot.sendMessage(chatId, "❌ Gagal menghapus admin panel.");
      }

    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, "❌ Terjadi kesalahan saat menghapus admin panel.");
    }
  });
}
bot.onText(/^\/status$/, async (msg) => {
  const chatId = msg.chat.id;

  const loading = await bot.sendMessage(
    chatId,
    "⏳ <i>Sedang mengecek status server...</i>",
    { parse_mode: "HTML" }
  );

  const timeoutFetch = (url, options, timeout = 5000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), timeout)
      )
    ]);
  };

  const serverChecks = Object.keys(versions).map(async (i) => {
    const cfg = versions[i];
    const domain = settings[cfg.domain];
    const plta = settings[cfg.plta];
    const pltc = settings[cfg.pltc];

    if (!domain || !plta || !pltc) {
      return `SERVER ${i} OFF ❌`;
    }

    try {
      const url = `${domain}/api/application/users?page=1`;

      const f = await timeoutFetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${plta}`
        }
      });

      if (f.status === 200) return `SERVER ${i} ON ✅`;
      if (f.status === 401 || f.status === 403)
        return `SERVER ${i} OFF ❌ (Unauthorized)`;
      return `SERVER ${i} OFF ❌ (Status ${f.status})`;

    } catch (err) {
      if (err.message === "TIMEOUT")
        return `SERVER ${i} OFF ❌ (Timeout / DDOS)`;
      return `SERVER ${i} OFF ❌ (API error)`;
    }
  });

  // Jalankan semua cek server secara paralel
  const hasil = await Promise.all(serverChecks);

  const finalText = `
<blockquote>🤖 STATUS SEMUA SERVER
━━━━━━━━━━━━━━━━━
${hasil.join("\n")}
</blockquote>
`;

  bot.editMessageText(finalText, {
    chat_id: chatId,
    message_id: loading.message_id,
    parse_mode: "HTML"
  });
});
bot.onText(/^\/servercpu$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userId !== OWNER_UID) {
    return bot.sendMessage(chatId, '❌ Hanya OWNER yang bisa menggunakan perintah ini.');
  }

  const panelDomain = domain;
  const pltaKey = plta;
  const pltcKey = pltc;

  if (!panelDomain || !pltaKey || !pltcKey) {
    return bot.sendMessage(chatId, `<blockquote>❌ Konfigurasi panel tidak ditemukan.</blockquote>`, {
      parse_mode: 'HTML'
    });
  }

  const sentMessage = await bot.sendMessage(
    chatId,
    `<blockquote>⏳ Memeriksa penggunaan CPU server...\n\nBatas CPU Wajar: <b>80%</b></blockquote>`,
    { parse_mode: 'HTML' }
  );

  (async () => {
    try {
      let servers = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get(`${panelDomain}/api/application/servers?page=${page}`, {
          headers: { 'Authorization': `Bearer ${pltaKey}` }
        });

        const result = response.data;
        servers = servers.concat(result.data);
        hasMore = result.meta.pagination.current_page < result.meta.pagination.total_pages;
        page++;
      }

      let abnormalCpuServers = [];

      for (const server of servers) {
        const { id: serverId, name: serverName, uuid: serverUuid } = server.attributes;

        try {
          const resourceResponse = await axios.get(
            `${panelDomain}/api/client/servers/${serverUuid}/resources`,
            { headers: { 'Authorization': `Bearer ${pltcKey}` } }
          );

          const resources = resourceResponse.data.attributes.resources;
          const cpuUsage = resources.cpu_absolute;
          const cpuLimit = resources.cpu_limit;

          const effectiveLimit = cpuLimit > 0 ? cpuLimit : 100;

          if (cpuUsage > 80 && effectiveLimit <= 100 || (cpuLimit > 100 && cpuUsage > (cpuLimit * 0.8))) {
            abnormalCpuServers.push({
              id: serverId,
              name: serverName,
              usage: cpuUsage,
              limit: cpuLimit,
            });
          }
        } catch {}
      }

      if (abnormalCpuServers.length === 0) {
        return bot.editMessageText(
          `<blockquote>✅ Tidak ditemukan server dengan penggunaan CPU di atas batas wajar (80%).</blockquote>`,
          { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: 'HTML' }
        );
      }

      let message = `🚨 <b>Daftar Server CPU Tidak Wajar</b> 🚨\n\n`;
      message += `<b>Batas Wajar:</b> 80%\n`;
      message += "━━━━━━━━━━━━━━━━━━━━━━━\n";

      abnormalCpuServers.forEach(srv => {
        message += `🆔 <b>ID</b>: <code>${srv.id}</code>\n`;
        message += `🔹 <b>Nama</b>: ${srv.name}\n`;
        message += `📈 <b>Penggunaan</b>: ${srv.usage.toFixed(2)}% dari ${srv.limit}%\n`;
        message += "───────────────────────\n";
      });

      message += `📊 <b>Total Server Tidak Wajar</b>: ${abnormalCpuServers.length}`;

      await bot.editMessageText(
        `<blockquote>${message}</blockquote>`,
        { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: 'HTML' }
      );

    } catch (err) {
      await bot.editMessageText(
        `<blockquote>❌ Gagal mengambil data server: ${err.message}</blockquote>`,
        { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: 'HTML' }
      );
    }
  })();
});
bot.onText(/^\/servercpuv([2-7])$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userId !== OWNER_UID) return;

  const ver = match[1];

  // ============================
  //  FIX: Gunakan settings, bukan global
  // ============================
  const panelDomain = settings[`domainV${ver}`];
  const pltaKey     = settings[`pltaV${ver}`];
  const pltcKey     = settings[`pltcV${ver}`];
  // ============================

  if (!panelDomain || !pltaKey || !pltcKey) {
    return bot.sendMessage(chatId,
      `<blockquote>❌ Konfigurasi panel v${ver} tidak ditemukan.</blockquote>`,
      { parse_mode: "HTML" }
    );
  }

  const sent = await bot.sendMessage(
    chatId,
    `<blockquote>⏳ Memeriksa CPU server panel v${ver}...</blockquote>`,
    { parse_mode: "HTML" }
  );

  try {
    let servers = [];
    let page = 1;
    let more = true;

    while (more) {
      const res = await axios.get(`${panelDomain}/api/application/servers?page=${page}`, {
        headers: { Authorization: `Bearer ${pltaKey}` }
      });

      servers = servers.concat(res.data.data);
      more = res.data.meta.pagination.current_page < res.data.meta.pagination.total_pages;
      page++;
    }

    let abnormal = [];

    for (const srv of servers) {
      const { id, name, uuid } = srv.attributes;

      try {
        const rr = await axios.get(`${panelDomain}/api/client/servers/${uuid}/resources`, {
          headers: { Authorization: `Bearer ${pltcKey}` }
        });

        const r = rr.data.attributes.resources;
        const cpu = r.cpu_absolute;
        const limit = r.cpu_limit > 0 ? r.cpu_limit : 100;

        if (cpu > 80 || cpu > limit * 0.8) {
          abnormal.push({ id, name, cpu, limit });
        }

      } catch {}
    }

    if (abnormal.length === 0) {
      return bot.editMessageText(
        `<blockquote>✅ Tidak ditemukan server CPU tinggi di panel v${ver}.</blockquote>`,
        {
          chat_id: chatId,
          message_id: sent.message_id,
          parse_mode: "HTML"
        }
      );
    }

    let m = `🚨 <b>CPU Tinggi (v${ver})</b> 🚨\n\n`;

    abnormal.forEach(x => {
      m += `🆔 <b>ID:</b> <code>${x.id}</code>\n`;
      m += `🔹 <b>Nama:</b> ${x.name}\n`;
      m += `📈 <b>CPU:</b> ${x.cpu.toFixed(2)}% / ${x.limit}%\n`;
      m += `───────────────────────\n`;
    });

    bot.editMessageText(
      `<blockquote>${m}</blockquote>`,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML"
      }
    );

  } catch (e) {
    bot.editMessageText(
      `<blockquote>❌ Error: ${e.message}</blockquote>`,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML"
      }
    );
  }
});
bot.onText(/^\/listadmin(?:\s+(\d+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  if (!ownerUsers.includes(String(senderId)))
    return bot.sendMessage(chatId, "❌ Khusus owner", {
      reply_markup: { inline_keyboard: [[{ text: "Laporan", url: `https://t.me/${dev}` }]] }
    });

  const page = parseInt(match && match[1]) || 1;

  if (!domain || !plta) {
    return bot.sendMessage(chatId, "<blockquote>❌ Konfigurasi panel tidak ditemukan</blockquote>", { parse_mode: "HTML" });
  }

  // Kirim pesan proses pertama
  const prosesMsg = await bot.sendMessage(chatId, "<blockquote>⏳ Memproses daftar admin panel...</blockquote>", { parse_mode: "HTML" });

  try {
    const res = await fetch(`${domain}/api/application/users?page=${page}&per_page=25`, {
      headers: { Authorization: `Bearer ${plta}`, Accept: "application/json" }
    });

    const json = await res.json();
    if (!res.ok) throw new Error();

    const admins = (json.data || []).filter(u => u.attributes?.root_admin);

    let text = "";
    if (!admins.length) {
      text = "<blockquote>🚫 Tidak ada admin di halaman ini</blockquote>";
    } else {
      text = `📋 <b>DAFTAR ADMIN PANEL</b>\n<b>Domain</b>: ${domain}\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
      admins.forEach(u => {
        const a = u.attributes;
        text += `<b>ID</b> : <code>${a.id}</code>\n<b>User</b> : ${a.username}\n───────────────────────\n`;
      });
      const meta = json.meta.pagination;
      text += `📄 Halaman: ${meta.current_page}/${meta.total_pages}`;
    }

    const nav = [];
    if (page > 1) nav.push({ text: "⬅️ Kembali", callback_data: `listadmin:${page - 1}` });
    if (admins.length && page < json.meta.pagination.total_pages) nav.push({ text: "➡️ Lanjut", callback_data: `listadmin:${page + 1}` });

    await bot.editMessageText(`<blockquote>${text}</blockquote>`, {
      chat_id: chatId,
      message_id: prosesMsg.message_id,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: nav.length ? [nav] : [] }
    });

  } catch {
    await bot.editMessageText("<blockquote>⚠️ Gagal mengambil data admin</blockquote>", {
      chat_id: chatId,
      message_id: prosesMsg.message_id,
      parse_mode: "HTML"
    });
  }
});

// ================= LIST ADMIN v2–v7 =================
bot.onText(/^\/listadmin([2-7])(?:\s+(\d+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  if (!ownerUsers.includes(String(senderId)))
    return bot.sendMessage(chatId, "❌ Khusus owner", {
      reply_markup: { inline_keyboard: [[{ text: "Laporan", url: `https://t.me/${dev}` }]] }
    });

  const i = parseInt(match[1]);
  const page = parseInt(match[2]) || 1;

  const domainVar = eval(`domainV${i}`);
  const pltaVar = eval(`pltaV${i}`);

  if (!domainVar || !pltaVar) {
    return bot.sendMessage(chatId, "<blockquote>❌ Konfigurasi panel tidak ditemukan</blockquote>", { parse_mode: "HTML" });
  }

  const prosesMsg = await bot.sendMessage(chatId, `<blockquote>⏳ Memproses daftar admin panel v${i}...</blockquote>`, { parse_mode: "HTML" });

  try {
    const res = await fetch(`${domainVar}/api/application/users?page=${page}&per_page=25`, {
      headers: { Authorization: `Bearer ${pltaVar}`, Accept: "application/json" }
    });

    const json = await res.json();
    if (!res.ok) throw new Error();

    const admins = (json.data || []).filter(u => u.attributes?.root_admin);

    let text = "";
    if (!admins.length) {
      text = "<blockquote>🚫 Tidak ada admin di halaman ini</blockquote>";
    } else {
      text = `📋 <b>DAFTAR ADMIN PANEL v${i}</b>\n<b>Domain</b>: ${domainVar}\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
      admins.forEach(u => {
        const a = u.attributes;
        text += `<b>ID</b> : <code>${a.id}</code>\n<b>User</b> : ${a.username}\n───────────────────────\n`;
      });
      const meta = json.meta.pagination;
      text += `📄 Halaman: ${meta.current_page}/${meta.total_pages}`;
    }

    const nav = [];
    if (page > 1) nav.push({ text: "⬅️ Kembali", callback_data: `listadminv${i}:${page - 1}` });
    if (admins.length && page < json.meta.pagination.total_pages) nav.push({ text: "➡️ Lanjut", callback_data: `listadminv${i}:${page + 1}` });

    await bot.editMessageText(`<blockquote>${text}</blockquote>`, {
      chat_id: chatId,
      message_id: prosesMsg.message_id,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: nav.length ? [nav] : [] }
    });

  } catch {
    await bot.editMessageText("<blockquote>⚠️ Gagal mengambil data admin</blockquote>", {
      chat_id: chatId,
      message_id: prosesMsg.message_id,
      parse_mode: "HTML"
    });
  }
});

// ================= CALLBACK QUERY =================
bot.on("callback_query", async (q) => {
  if (!q.data.startsWith("listadmin")) return;
  await bot.answerCallbackQuery(q.id);

  const chatId = q.message.chat.id;
  const senderId = q.from.id;

  const ownerUsers = JSON.parse(fs.readFileSync(OWNER_FILE));
  if (!ownerUsers.includes(String(senderId))) {
    return bot.sendMessage(chatId, "❌ Khusus owner", {
      reply_markup: { inline_keyboard: [[{ text: "Laporan", url: `https://t.me/${dev}` }]] }
    });
  }

  if (q.data.startsWith("listadminv")) {
    const [, v, p] = q.data.match(/listadminv(\d+):(\d+)/);
    bot.editMessageText(`<blockquote>⏳ Memproses daftar admin panel v${v} halaman ${p}...</blockquote>`, {
      chat_id: chatId,
      message_id: q.message.message_id,
      parse_mode: "HTML"
    }).then(() => {
      bot.processUpdate({
        update_id: Date.now(),
        message: { ...q.message, from: { id: senderId }, text: `/listadminv${v} ${p}` }
      });
    });
  } else {
    const page = q.data.split(":")[1];
    bot.editMessageText(`<blockquote>⏳ Memproses daftar admin panel halaman ${page}...</blockquote>`, {
      chat_id: chatId,
      message_id: q.message.message_id,
      parse_mode: "HTML"
    }).then(() => {
      bot.processUpdate({
        update_id: Date.now(),
        message: { ...q.message, from: { id: senderId }, text: `/listadmin ${page}` }
      });
    });
  }
});
bot.onText(/^\/clearall(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const excludedRaw = match[1];


  if (!excludedRaw)
    return bot.sendMessage(
      chatId,
      `<blockquote>❌ Format salah: <code>/clearall [id yg di kecualikan</code>\nContoh: /clearall 1,2,3</blockquote>`,
      { parse_mode: "HTML" }
    );

  const excludedIds = excludedRaw
    .split(",")
    .map(x => x.trim())
    .filter(x => /^\d+$/.test(x));

  if (!excludedIds.length)
    return bot.sendMessage(
      chatId,
      `<blockquote>❌ ID pengecualian tidak valid</blockquote>`,
      { parse_mode: "HTML" }
    );

  // ================= AMBIL DARI SETTINGS =================
  const panelDomain = settings.domain.replace(/\/$/, "");
  const PLTA = settings.plta;
  const PLTC = settings.pltc; // disiapkan jika perlu client API

  if (!panelDomain || !PLTA)
    return bot.sendMessage(
      chatId,
      `<blockquote>❌ Domain / PLTA belum diset di settings</blockquote>`,
      { parse_mode: "HTML" }
    );

  const infoMsg = await bot.sendMessage(
    chatId,
    `<blockquote>⏳ Menghapus semua server kecuali ID ${excludedIds.join(", ")}....</blockquote>`,
    { parse_mode: "HTML" }
  );

  try {
    // ================= AMBIL SEMUA SERVER =================
    let servers = [];
    let page = 1;
    let more = true;

    while (more) {
      const res = await axios.get(
        `${panelDomain}/api/application/servers?page=${page}`,
        { headers: { Authorization: `Bearer ${PLTA}` } }
      );

      servers.push(...res.data.data);
      more = res.data.meta.pagination.current_page < res.data.meta.pagination.total_pages;
      page++;
    }

    let serverDeleted = 0;
    let serverFailed = 0;

    for (const srv of servers) {
      const sid = String(srv.attributes.id);
      if (excludedIds.includes(sid)) continue;

      try {
        await axios.delete(
          `${panelDomain}/api/application/servers/${sid}`,
          { headers: { Authorization: `Bearer ${PLTA}` } }
        );
        serverDeleted++;
      } catch {
        serverFailed++;
      }
    }

    // ================= AMBIL SEMUA USER =================
    let users = [];
    page = 1;
    more = true;

    while (more) {
      const res = await axios.get(
        `${panelDomain}/api/application/users?page=${page}&include=servers`,
        { headers: { Authorization: `Bearer ${PLTA}` } }
      );

      users.push(...res.data.data);
      more = res.data.meta.pagination.current_page < res.data.meta.pagination.total_pages;
      page++;
    }

    let userDeleted = 0;
    let userSkipped = 0;

    for (const usr of users) {
      const uid = String(usr.attributes.id);
      if (excludedIds.includes(uid)) continue;

      const serverCount = usr.attributes.relationships.servers.data.length;
      if (serverCount > 0) {
        userSkipped++;
        continue;
      }

      try {
        await axios.delete(
          `${panelDomain}/api/application/users/${uid}`,
          { headers: { Authorization: `Bearer ${PLTA}` } }
        );
        userDeleted++;
      } catch {}
    }

    await bot.editMessageText(
`<blockquote>✅ PROSES SELESAI
━━━━━━━━━━━━━━━━━━
🗑 Server terhapus : ${serverDeleted}
❌ Server gagal   : ${serverFailed}

👤 User terhapus  : ${userDeleted}
⏭ User dilewati  : ${userSkipped}

🔒 ID dikecualikan:
${excludedIds.join(", ")}
━━━━━━━━━━━━━━━━━━
</blockquote>`,
      {
        chat_id: chatId,
        message_id: infoMsg.message_id,
        parse_mode: "HTML"
      }
    );

  } catch (err) {
    await bot.editMessageText(
      `<blockquote>❌ ERROR\n${err.message}</blockquote>`,
      {
        chat_id: chatId,
        message_id: infoMsg.message_id,
        parse_mode: "HTML"
      }
    );
  }
});
bot.onText(/^\/autocpu\s+(on|off)$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const action = match[1].toLowerCase();

  if (userId !== OWNER_UID) {
    return bot.sendMessage(
      chatId,
      `<blockquote>❌ Hanya OWNER yang bisa menggunakan perintah ini.</blockquote>`,
      { parse_mode: "HTML" }
    );
  }

  if (action === "on") {
    if (cpuState.autocpu) {
      return bot.sendMessage(
        chatId,
        `<blockquote>⚠️ Auto CPU sudah AKTIF.</blockquote>`,
        { parse_mode: "HTML" }
      );
    }

    cpuState.autocpu = true;
    saveCpuState(cpuState);

    autoCpuInterval = setInterval(runAutoCpuCheck, AUTO_CPU_DELAY);

    return bot.sendMessage(
      chatId,
      `<blockquote>
✅ <b>AUTO CPU AKTIF</b>

⏱ Interval: 5 menit
📈 Batas CPU: 80%
⛔ Auto STOP server overload
📁 Status tersimpan di cpu.json
</blockquote>`,
      { parse_mode: "HTML" }
    );
  }

  if (action === "off") {
    if (!cpuState.autocpu) {
      return bot.sendMessage(
        chatId,
        `<blockquote>⚠️ Auto CPU sudah NONAKTIF.</blockquote>`,
        { parse_mode: "HTML" }
      );
    }

    cpuState.autocpu = false;
    saveCpuState(cpuState);

    clearInterval(autoCpuInterval);
    autoCpuInterval = null;

    return bot.sendMessage(
      chatId,
      `<blockquote>🛑 <b>AUTO CPU DIMATIKAN</b></blockquote>`,
      { parse_mode: "HTML" }
    );
  }
});

// ================= AUTO CPU CHECK =================
async function runAutoCpuCheck() {
  try {
    if (!cpuState.autocpu) return;

    const panelDomain = settings.domain;
    const pltaKey = settings.plta;
    const pltcKey = settings.pltc;
    if (!panelDomain || !pltaKey || !pltcKey) return;

    let servers = [];
    let page = 1;
    let more = true;

    while (more) {
      const res = await axios.get(
        `${panelDomain}/api/application/servers?page=${page}`,
        { headers: { Authorization: `Bearer ${pltaKey}` } }
      );

      servers = servers.concat(res.data.data);
      more =
        res.data.meta.pagination.current_page <
        res.data.meta.pagination.total_pages;
      page++;
    }

    let stopped = [];

    for (const srv of servers) {
      const { id, name, uuid } = srv.attributes;

      try {
        const rr = await axios.get(
          `${panelDomain}/api/client/servers/${uuid}/resources`,
          { headers: { Authorization: `Bearer ${pltcKey}` } }
        );

        const attr = rr.data.attributes;
        const cpu = attr.resources.cpu_absolute;
        const limit =
          attr.resources.cpu_limit > 0 ? attr.resources.cpu_limit : 100;
        const state = attr.current_state;

        if (
          state === "running" &&
          (cpu > limit * 0.8 || cpu > CPU_LIMIT_PERCENT)
        ) {
          await axios.post(
            `${panelDomain}/api/client/servers/${uuid}/power`,
            { signal: "stop" },
            { headers: { Authorization: `Bearer ${pltcKey}` } }
          );

          stopped.push({ id, name, cpu, limit });
        }
      } catch {}
    }

    if (stopped.length === 0) return;

    let msg = `🚨 <b>AUTO CPU STOP</b>\n\n`;
    msg += `<b>Panel:</b> ${panelDomain}\n`;
    msg += `<b>Batas:</b> 80%\n`;
    msg += `<b>Aksi:</b> Server otomatis OFFLINE\n`;
    msg += "━━━━━━━━━━━━━━━━━━━━━━━\n";

    stopped.forEach(s => {
      msg += `🆔 <b>ID</b>: <code>${s.id}</code>\n`;
      msg += `📦 <b>Nama</b>: ${s.name}\n`;
      msg += `📈 <b>CPU</b>: ${s.cpu.toFixed(2)}% / ${s.limit}%\n`;
      msg += `⛔ <b>Status</b>: OFFLINE\n`;
      msg += "───────────────────────\n";
    });

    msg += `📊 <b>Total</b>: ${stopped.length} server`;

    await bot.sendMessage(
      OWNER_UID,
      `<blockquote>${msg}</blockquote>`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("[AUTOCPU ERROR]", err.message);
  }
}

}