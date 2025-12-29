const fetch = require("node-fetch");

const settings = require("../settings.js");
const {
    loadJsonData,
    saveJsonData,
    addVPS,
    getVPS
} = require("../src/data/function");

const RESSVPS_FILE = './db/users/resellerVps.json';
const OWNER_ID = settings.ownerId;

const userStates = {};

const vpsSpecs = {
  r1c1:  { ram: 1,  cpu: 1, size: "s-1vcpu-1gb",        name: "Ram 1GB Core 1",  icon: "📦" },
  r2c2:  { ram: 2,  cpu: 2, size: "s-2vcpu-2gb",        name: "Ram 2GB Core 2",  icon: "💽" },
  r4c2:  { ram: 4,  cpu: 2, size: "s-2vcpu-4gb",        name: "Ram 4GB Core 2",  icon: "🖥️" },
  r8c4:  { ram: 8,  cpu: 4, size: "s-4vcpu-8gb-amd",   name: "Ram 8GB Core 4",  icon: "⚙️" },
  r16c4: { ram: 16, cpu: 4, size: "s-4vcpu-16gb-amd",  name: "Ram 16GB Core 4", icon: "🛠️" },
  r16c8: { ram: 16, cpu: 8, size: "s-8vcpu-16gb-amd",  name: "Ram 16GB Core 8", icon: "🚀" },
  r32c8: { ram: 32, cpu: 8, size: "s-8vcpu-32gb-amd",  name: "Ram 32GB Core 8", icon: "🏆" }, 
};


const vpsImages = {
  ubuntu20: { image: "ubuntu-20-04-x64", name: "Ubuntu 20.04 LTS", icon: "🟠" },
  ubuntu22: { image: "ubuntu-22-04-x64", name: "Ubuntu 22.04 LTS", icon: "🔵" },
  ubuntu24: { image: "ubuntu-24-04-x64", name: "Ubuntu 24.04 LTS", icon: "🟣" },
  debian11: { image: "debian-11-x64",   name: "Debian 11", icon: "🔴" },
  debian12: { image: "debian-12-x64",   name: "Debian 12", icon: "⚪" },
  centos9: { image: "centos-stream-9-x64", name: "CentOS Stream 9", icon: "🟢" }
};

const vpsRegions = {
  sgp1: { name: "Singapore", flag: "🇸🇬", latency: "Tercepat untuk Asia" },
  nyc1: { name: "New York", flag: "🇺🇸", latency: "USA Pantai Timur" },
  sfo3: { name: "San Francisco", flag: "🇺🇸", latency: "USA Pantai Barat" },
  lon1: { name: "London", flag: "🇬🇧", latency: "Eropa Barat" },
  fra1: { name: "Frankfurt", flag: "🇩🇪", latency: "Eropa Tengah" },
  ams3: { name: "Amsterdam", flag: "🇳🇱", latency: "Eropa Barat" },
  tor1: { name: "Toronto", flag: "🇨🇦", latency: "Amerika Utara" },
  blr1: { name: "Bangalore", flag: "🇮🇳", latency: "Asia Selatan" }
};

module.exports = (bot) => {
async function createVPSDroplet(apiKey, hostname, spec, os, region, password) {
  const dropletData = {
    name: hostname.toLowerCase().trim(),
    region,
    size: vpsSpecs[spec].size,
    image: vpsImages[os].image,
    ssh_keys: null,
    backups: false,
    ipv6: true,
    user_data: `#cloud-config
password: ${password}
chpasswd: { expire: False }
ssh_pwauth: True`,
    tags: ["AnggaDev-VPS"]
  };

  const response = await fetch("https://api.digitalocean.com/v2/droplets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(dropletData)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to create VPS");
  return data.droplet.id;
}

async function getDropletIP(apiKey, dropletId) {
  const response = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch droplet info");
  return data.droplet.networks.v4.find(net => net.type === "public").ip_address;
}

async function getDropletInfo(apiKey, dropletId) {
  const response = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Gagal ambil info VPS (HTTP ${response.status})`);
  }

  return data.droplet;
}
    
async function getDropletInfo(apiKey, dropletId) {
  const response = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Gagal ambil info VPS (HTTP ${response.status})`);
  }

  return data.droplet;
}

async function deleteVPS(apiKey, dropletId) {
  const response = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Gagal delete VPS (HTTP ${response.status})`);
  }

  return true;
}

async function getAllVPS(apiKey) {
  const response = await fetch("https://api.digitalocean.com/v2/droplets", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });
  const data = await response.json();
  return data.droplets || [];
}

async function getListVps(apiKey) {
  const response = await fetch("https://api.digitalocean.com/v2/droplets", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Gagal ambil daftar VPS: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.droplets || [];
}

async function getVpsDetail(apiKey, dropletId) {
  const response = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Gagal ambil detail VPS: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.droplet;
}

function formatVPSStatus(status) {
  if (status === "active") return "🟢 Active"
  if (status === "off") return "🔴 Off"
  return "⚪ " + status
}

function formatUptime(createdAt) {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now - created
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffHrs / 24)
  return diffDays > 0 ? `${diffDays}d ${diffHrs % 24}h` : `${diffHrs}h`
}
    
bot.onText(/^\/statusdo$/, async (msg) => {
  const chatId = msg.chat.id;

  const ressVps = loadJsonData(RESSVPS_FILE);
  if (msg.from.id !== OWNER_ID && !ressVps.includes(msg.from.id)) {
    return bot.sendMessage(chatId, '❌ Khusus reseller VPS');
  }

  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🌐 Digital Ocean 1", callback_data: "infodo_1" }],
        [{ text: "🌐 Digital Ocean 2", callback_data: "infodo_2" }],
        [{ text: "🌐 Digital Ocean 3", callback_data: "infodo_3" }],
        [{ text: "🌐 Digital Ocean 4", callback_data: "infodo_4" }],
        [{ text: "🌐 Digital Ocean 5", callback_data: "infodo_5" }]
      ]
    }
  };

  bot.sendMessage(
    chatId,
    `📊 Menu Status Digital Ocean
Thanks from @${settings.dev}

Digital Ocean Account:`,
    {
      reply_to_message_id: msg.message_id,
      ...opts
    }
  );
});

bot.on("callback_query", async (query) => {
  if (!query.message) return;

  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith("infodo_") && !data.includes("detail")) {
    let apiKey, tag;
    if (data === "infodo_1") { apiKey = settings.apiDigitalOcean; tag = "1"; }
    if (data === "infodo_2") { apiKey = settings.apiDigitalOcean2; tag = "2"; }
    if (data === "infodo_3") { apiKey = settings.apiDigitalOcean3; tag = "3"; }
    if (data === "infodo_4") { apiKey = settings.apiDigitalOcean4; tag = "4"; }
    if (data === "infodo_5") { apiKey = settings.apiDigitalOcean5; tag = "5"; }
    if (data === "infodo_6") { apiKey = settings.apiDigitalOcean6; tag = "6"; }

    if (!apiKey) return bot.answerCallbackQuery(query.id, { text: "API Key belum diatur!" });

    try {
      const accountRes = await fetch("https://api.digitalocean.com/v2/account", {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const account = await accountRes.json();

      const dropletRes = await fetch("https://api.digitalocean.com/v2/droplets", {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const droplets = await dropletRes.json();

      if (account.account && account.account.email) {
        const activeVPS = droplets.droplets.filter(d => d.status === "active").length;
        const totalDroplet = droplets.droplets.length;

        let msgText = `<blockquote>`;
        msgText += `📊 Status Akun: ${account.account.status}\n`;
        msgText += `💳 Total Droplet: ${account.account.droplet_limit}\n`;
        msgText += `🌐 VPS Aktif: ${activeVPS}\n`;
        msgText += `💰 Sisa Droplet: ${account.account.droplet_limit - totalDroplet}`;
        msgText += `</blockquote>`;

        bot.editMessageText(msgText, {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "ℹ️ Info Lengkap", callback_data: `infodo_detail_${tag}` }]
            ]
          }
        });
      } else {
        bot.editMessageText("<blockquote>❌ API Key tidak valid atau akun tidak aktif</blockquote>", {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "HTML"
        });
      }
    } catch {
      bot.editMessageText("<blockquote>⚠️ Gagal mengambil data dari DigitalOcean</blockquote>", {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "HTML"
      });
    }
  }

  // ===== INFO LENGKAP =====
  if (data.startsWith("infodo_detail_")) {
    let apiKey;
    if (data === "infodo_detail_1") apiKey = settings.apiDigitalOcean;
    if (data === "infodo_detail_2") apiKey = settings.apiDigitalOcean2;
    if (data === "infodo_detail_3") apiKey = settings.apiDigitalOcean3;
    if (data === "infodo_detail_4") apiKey = settings.apiDigitalOcean4;
    if (data === "infodo_detail_5") apiKey = settings.apiDigitalOcean5;
    if (data === "infodo_detail_6") apiKey = settings.apiDigitalOcean6;

    if (!apiKey) return bot.answerCallbackQuery(query.id, { text: "API Key belum diatur!" });

    try {
      const accountRes = await fetch("https://api.digitalocean.com/v2/account", {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const account = await accountRes.json();

      const dropletRes = await fetch("https://api.digitalocean.com/v2/droplets", {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const droplets = await dropletRes.json();

      const info = account.account;
      const suspendedCount = droplets.droplets.filter(d => d.status !== "active").length;

      let detailText = `<blockquote>`;
      detailText += `📧 Email: ${info.email}\n`;
      detailText += `🆔 UUID: ${info.uuid}\n`;
      detailText += `📅 Status: ${info.status}\n`;
      detailText += `💳 Droplet Limit: ${info.droplet_limit}\n`;
      detailText += `🔒 Email Verified: ${info.email_verified ? "Ya" : "Tidak"}\n`;
      detailText += `📛 Team: ${info.team ? "Ya" : "Tidak"}\n`;
      detailText += `⛔ VPS Suspend: ${suspendedCount}`;
      detailText += `</blockquote>`;

      bot.editMessageText(detailText, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⬅️ Kembali", callback_data: data.replace("detail_", "") }]
          ]
        }
      });
    } catch {
      bot.editMessageText("<blockquote>❌ Gagal mengambil info lengkap</blockquote>", {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "HTML"
      });
    }
  }

  bot.answerCallbackQuery(query.id).catch(() => {});
});
const userCreateVPS = {};

function autoHostnameFromSpec(spec) {
  return `s-${spec.cpu}vcpu-${spec.ram}gb-amd`;
}

bot.onText(/^\/cvps(?:\s+(.+))?$/i, async msg => {
  const ressVps = loadJsonData(RESSVPS_FILE);
  if (msg.from.id !== OWNER_ID && !ressVps.includes(msg.from.id)) {
    return bot.sendMessage(chatId, '❌ Khusus reseller VPS');
  }

  const inputHostname = msg.text.split(" ").slice(1).join(" ").trim();

  userCreateVPS[msg.from.id] = {
    hostname: inputHostname
      ? inputHostname
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "")
          .slice(0, 32)
      : null
  };

const keyboard = [
  [{ text: "🌐 Digital Ocean 1", callback_data: "createvps_1" }],
  [{ text: "🌐 Digital Ocean 2", callback_data: "createvps_2" }],
  [{ text: "🌐 Digital Ocean 3", callback_data: "createvps_3" }],
  [{ text: "🌐 Digital Ocean 4", callback_data: "createvps_4" }],
  [{ text: "🌐 Digital Ocean 5", callback_data: "createvps_5" }]
];

  bot.sendMessage(
    msg.chat.id,
    `📡 *Menu Create VPS*
ᴛʜᴀɴᴋꜱ ꜰʀᴏᴍ @${settings.dev}

Digital Ocean Account:`,
    {
      parse_mode: "Markdown",
      reply_to_message_id: msg.message_id,
      reply_markup: { inline_keyboard: keyboard }
    }
  );
});

bot.on("callback_query", async cb => {
  const chatId = cb.message.chat.id;
  const userId = cb.from.id;
  const data = cb.data;

  if (data.startsWith("createvps_")) {
    const accId = data.split("_")[1];

    const keyboard = Object.entries(vpsSpecs).map(([id, spec]) => ([{
      text: `${spec.icon} ${spec.name}`,
      callback_data: `spec_${accId}_${id}`
    }]));

    return bot.editMessageText(
      `📡 *Menu Create VPS*
🌐 Digital Ocean: *${accId}*
Pilih spesifikasi VPS:`,
      {
        chat_id: chatId,
        message_id: cb.message.message_id,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard }
      }
    );
  }

  /* ===== PILIH SPEC ===== */
  if (data.startsWith("spec_")) {
    const [, accId, specId] = data.split("_");
    const spec = vpsSpecs[specId];
    const userData = userCreateVPS[userId] || {};
    const previewHostname = userData.hostname || autoHostnameFromSpec(spec);

    const keyboard = Object.entries(vpsImages).map(([id, img]) => ([{
      text: `${img.icon} ${img.name}`,
      callback_data: `image_${accId}_${specId}_${id}`
    }]));

    return bot.editMessageText(
      `📦 Spesifikasi VPS
*${spec.name}*
🖥️ Hostname:
\`${previewHostname}\`

Pilih OS image:`,
      {
        chat_id: chatId,
        message_id: cb.message.message_id,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard }
      }
    );
  }

  /* ===== PILIH IMAGE ===== */
  if (data.startsWith("image_")) {
    const [, accId, specId, imageId] = data.split("_");
    const spec = vpsSpecs[specId];
    const img = vpsImages[imageId];

    const keyboard = Object.entries(vpsRegions).map(([id, reg]) => ([{
      text: `${reg.flag} ${reg.name}`,
      callback_data: `region_${accId}_${specId}_${imageId}_${id}`
    }]));

    return bot.editMessageText(
      `📦 Spesifikasi VPS
*${spec.name}*
💿 Image: *${img.name}*

Pilih region:`,
      {
        chat_id: chatId,
        message_id: cb.message.message_id,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard }
      }
    );
  }

  /* ===== CREATE VPS ===== */
  if (data.startsWith("region_")) {
    const [, accId, specId, imageId, regionId] = data.split("_");
    const spec = vpsSpecs[specId];
    const img = vpsImages[imageId];
    const reg = vpsRegions[regionId];

    let apiKey;
    if (accId === "1") apiKey = settings.apiDigitalOcean;
    if (accId === "2") apiKey = settings.apiDigitalOcean2;
    if (accId === "3") apiKey = settings.apiDigitalOcean3;

    const userData = userCreateVPS[userId] || {};
    const hostname = userData.hostname || autoHostnameFromSpec(spec);
    const password = Math.random().toString(36).slice(-10);

    bot.editMessageText(
      `📡 Membuat VPS...
📦 ${spec.name}
🖥️ Hostname: \`${hostname}\`
💿 ${img.name}
🌍 ${reg.flag} ${reg.name}`,
      {
        chat_id: chatId,
        message_id: cb.message.message_id,
        parse_mode: "Markdown"
      }
    );

    try {
      const dropletId = await createVPSDroplet(
        apiKey,
        hostname,
        specId,
        imageId,
        regionId,
        password
      );

      let ipAddress = null;
      while (!ipAddress) {
        await new Promise(res => setTimeout(res, 5000));
        const droplet = await getDropletInfo(apiKey, dropletId);
        ipAddress =
          droplet?.networks?.v4?.find(n => n.type === "public")?.ip_address ||
          null;
      }

      bot.sendMessage(
        chatId,
        `✅ <b>Sukses create VPS!</b>
ʙᴇʀɪᴋᴜᴛ ᴅᴇᴛᴀɪʟ ᴠᴘꜱ ᴀɴᴅᴀ:

<blockquote expandable>🌐 IP VPS: <code>${ipAddress}</code>
🔐 Password: <code>${password}</code>
🖥️ Hostname: <code>${hostname}</code>
🆔 Droplet: <code>${dropletId}</code></blockquote>

📦 Spec: ${spec.name}
💿 OS: ${img.name}
🌍 Region: ${reg.flag} ${reg.name}

📡 ᴅᴇᴛᴀɪʟ ʟᴏɢɪɴ ᴠᴘꜱ:
<code>root@${ipAddress}:22</code>

<blockquote expandable>⚠️ 𝗧.𝗢.𝗦 𝗩𝗣𝗦:
• ɴᴏ ʜᴀᴄᴋɪɴɢ
• ɴᴏ ᴍɪɴɪɴɢ  
• ɴᴏ ᴛᴏʀʀᴇɴᴛ  
• ɴᴏ ᴏᴠᴇʀʟᴏᴀᴅ (100% ᴄᴘᴜ)  
• ɴᴏ ᴅᴅᴏs 
• ɪɴᴛɪɴʏᴀ: ᴊᴀɴɢᴀɴ ᴅɪɢᴜɴᴀᴋᴀɴ ᴜɴᴛᴜᴋ ᴀᴋᴛɪꜰɪᴛᴀꜱ ɪʟᴇɢᴀʟ ᴀᴘᴀ ᴘᴜɴ

🏪 𝗧.𝗢.𝗦 𝗧𝗢𝗞𝗢:
• Web toko mati karena DDoS tapi VPS masih aktif → Garansi TETAP AKTIF  
• VPS mati karena DDoS → Garansi HANGUS  
• VPS aktif tapi tidak bisa login → CPU 100% → Garansi HANGUS  
• Simpan data VPS Anda! Kehilangan data = Garansi hangus  
• Menjadi pembeli yang bijak, gunakan VPS sesuai aturan!

📛 𝗞𝗘𝗧𝗘𝗡𝗧𝗨𝗔𝗡 𝗔𝗞𝗨𝗡 𝗗.𝗢:
• Apabila akun DigitalOcean (DO) terkena suspend → Garansi hangus 

📝 𝗦𝗬𝗔𝗥𝗔𝗧 𝗖𝗟𝗔𝗜𝗠 𝗚𝗔𝗥𝗔𝗡𝗦𝗜:
1. Membawa bukti transfer  
2. Sertakan screenshot chat saat pembelian
3. Simpan tanggal pembelian  
4. Lampirkan data VPS (IP/User/dll)
</blockquote>`,
        { parse_mode: "HTML" }
      );

      delete userCreateVPS[userId];
      bot.answerCallbackQuery(cb.id);
    } catch (err) {
      bot.sendMessage(chatId, `❌ Gagal membuat VPS\n${err.message}`);
    }
  }
});

// /cekdata atau /cekdata <dropletId>
bot.onText(/^\/cekdata(?:\s+(.+))?$/i, (msg, match) => {
  const chatId = msg.chat.id;
  
  // jika tanpa argumen
  if (!match[1]) {
    return bot.sendMessage(
      chatId,
      "❌ Cara penggunaan:\n/cekdata <droplet_id>",
      { reply_to_message_id: msg.message_id }
    );
  }

  const dropletId = match[1].trim();

  const ressVps = loadJsonData(RESSVPS_FILE);
  if (msg.from.id !== OWNER_ID && !ressVps.includes(msg.from.id)) {
    return bot.sendMessage(chatId, "❌ ᴋʜᴜꜱᴜꜱ ʀᴇꜱᴇʟʟᴇʀ ᴠᴘꜱ");
  }

  const vps = getVPS(dropletId);
  if (!vps) {
    return bot.sendMessage(
      chatId,
      `❌ Data VPS dengan Droplet ID ${dropletId} tidak ditemukan!`,
      { reply_to_message_id: msg.message_id }
    );
  }

  bot.sendMessage(
    chatId,
`📄 Menampilkan Data VPS:

🖥️ Hostname: \`${vps.hostname}\`
🔐 Password: \`${vps.password}\`
🆔 Droplet ID: \`${vps.dropletId}\`

📦 Spec: ${vps.spec}
💿 OS: ${vps.os}
🌍 Region: ${vps.region}
👤 Owner ID: \`${vps.owner}\``,
    { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
  );
});
    
    // khusus reseller
bot.onText(/^\/listvps$/, async msg => {
  const chatId = msg.chat.id;

  const ressVps = loadJsonData(RESSVPS_FILE);
  if (msg.from.id !== OWNER_ID && !ressVps.includes(msg.from.id)) {
    return bot.sendMessage(chatId, '❌ Khusus reseller VPS');
  }

const keyboard = [
  [{ text: "🌐 Digital Ocean 1", callback_data: "listdo_1" }],
  [{ text: "🌐 Digital Ocean 2", callback_data: "listdo_2" }],
  [{ text: "🌐 Digital Ocean 3", callback_data: "listdo_3" }],
  [{ text: "🌐 Digital Ocean 4", callback_data: "listdo_4" }],
  [{ text: "🌐 Digital Ocean 5", callback_data: "listdo_5" }]
];

  await bot.sendMessage(chatId, `*📋 Menu List VPS*
ᴛʜᴀɴᴋꜱ ꜰʀᴏᴍ @${settings.dev}

Digital Ocean Account:`, {
    parse_mode: "Markdown",
    reply_to_message_id: msg.message_id,
    reply_markup: { inline_keyboard: keyboard }
  });
});

bot.on("callback_query", async query => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith("listdo_")) {
    const accId = data.split("_")[1];
    let apiKey;
    if (accId === "1") apiKey = settings.apiDigitalOcean;
    if (accId === "2") apiKey = settings.apiDigitalOcean2;
    if (accId === "3") apiKey = settings.apiDigitalOcean3;
    if (accId === "4") apiKey = settings.apiDigitalOcean4;
    if (accId === "5") apiKey = settings.apiDigitalOcean5;

    try {
      await bot.editMessageText("🔍 Mengambil daftar VPS...", {
        chat_id: chatId,
        message_id: query.message.message_id
      });

      const droplets = await getListVps(apiKey);

      if (droplets.length === 0) {
        return bot.editMessageText("📭 Tidak ada VPS yang ditemukan.", {
          chat_id: chatId,
          message_id: query.message.message_id
        });
      }

      const keyboard = droplets.map(vps => {
        const ip = vps.networks?.v4?.find(net => net.type === "public")?.ip_address || "No IP";
        const region = vpsRegions[vps.region.slug] || { flag: "🏳️", name: "Unknown" };
        const status = formatVPSStatus(vps.status);
        const uptime = formatUptime(vps.created_at);

        return [{
          text: `🖥️ ${vps.name} | ${status} | ${region.flag} ${region.name} | ${ip} | ${uptime}`,
          callback_data: `vpsinfo_${accId}_${vps.id}`
        }];
      });

      await bot.editMessageText(
        `🛰️ *Monitoring Vps*\n\n📊 Total VPS: *${droplets.length}*\nSilahkan klik untuk detail:`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: keyboard }
        }
      );
    } catch (err) {
      console.error("[LIST VPS ERROR]", err);
      bot.sendMessage(chatId, `❌ Gagal ambil daftar VPS\n\n🧾 Error: ${err.message}`);
    }
  }

  if (data.startsWith("vpsinfo_")) {
    const [_, accId, dropletId] = data.split("_");
    let apiKey;
    if (accId === "1") apiKey = settings.apiDigitalOcean;
    if (accId === "2") apiKey = settings.apiDigitalOcean2;
    if (accId === "3") apiKey = settings.apiDigitalOcean3;

    try {
      const droplet = await getVpsDetail(apiKey, dropletId);

      const ip = droplet?.networks?.v4?.find(net => net.type === "public")?.ip_address || "Belum tersedia";
      const region = vpsRegions[droplet?.region?.slug] || { flag: "🏳️", name: "Unknown" };
      const status = formatVPSStatus(droplet?.status);
      const uptime = droplet?.created_at ? formatUptime(droplet.created_at) : "Belum tersedia";

      const info = [
        `🖥️ *${droplet?.name || "Unknown"}*`,
        ``,
        `🆔 ID: \`${droplet?.id || "???"}\``,
        `🌐 IP: \`${ip}\``,
        `📦 Spec: ${droplet?.size_slug || "???"}`,
        `🖥️ OS: ${droplet?.image?.distribution || "???"} ${droplet?.image?.name || ""}`,
        `🌍 Region: ${region.flag} ${region.name}`,
        `📡 Status: ${status}`,
        `⏱️ Uptime: ${uptime}`
      ].join("\n");

      await bot.sendMessage(chatId, info, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("[VPS DETAIL ERROR]", err);
      bot.sendMessage(chatId, `❌ Gagal ambil detail VPS\n\n🧾 Error: ${err.message}`);
    }
  }

  bot.answerCallbackQuery(query.id);
});

bot.onText(/^\/delvps (.+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const dropletId = match[1].trim();

  const ressVps = loadJsonData(RESSVPS_FILE);
  if (msg.from.id !== OWNER_ID && !ressVps.includes(msg.from.id)) {
    return bot.sendMessage(chatId, '❌ Khusus reseller VPS');
  }

  if (!dropletId) {
    return bot.sendMessage(chatId, "❌ ID VPS tidak valid");
  }

  bot.sendMessage(
    chatId,
    `*♻️ Menu Delete VPS*
Thanks from @${settings.dev}

Digital Ocean Account:`,
    {
      parse_mode: "Markdown",
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [
          [{ text: "🌐 Digital Ocean 1", callback_data: `delvpsacc_1_${dropletId}` }],
          [{ text: "🌐 Digital Ocean 2", callback_data: `delvpsacc_2_${dropletId}` }],
          [{ text: "🌐 Digital Ocean 3", callback_data: `delvpsacc_3_${dropletId}` }],
          [{ text: "🌐 Digital Ocean 4", callback_data: `delvpsacc_4_${dropletId}` }],
          [{ text: "🌐 Digital Ocean 5", callback_data: `delvpsacc_5_${dropletId}` }]
        ]
      }
    }
  );
});

bot.on("callback_query", async (cbq) => {
  if (!cbq.message) return;

  const chatId = cbq.message.chat.id;
  const data = cbq.data;

  if (data.startsWith("delvpsacc_")) {
    const [, accIndex, dropletId] = data.split("_");

    let apiKey;
    if (accIndex === "1") apiKey = settings.apiDigitalOcean;
    if (accIndex === "2") apiKey = settings.apiDigitalOcean2;
    if (accIndex === "3") apiKey = settings.apiDigitalOcean3;
    if (accIndex === "4") apiKey = settings.apiDigitalOcean4;
    if (accIndex === "5") apiKey = settings.apiDigitalOcean5;

    if (!apiKey) {
      return bot.answerCallbackQuery(cbq.id, { text: "API tidak ditemukan" });
    }

    try {
      const vps = await getDropletInfo(apiKey, dropletId);

      const confirmMsg = [
        `⚠️ *KONFIRMASI DELETE VPS*`,
        ``,
        `🖥️ Name: *${vps.name}*`,
        `🆔 ID: \`${dropletId}\``,
        `🌐 IP: \`${vps.networks?.v4?.[0]?.ip_address || "No IP"}\``,
        ``,
        `❗ *PERINGATAN:*`,
        `• Semua data akan hilang permanen`,
        `• VPS tidak dapat dikembalikan`,
        `• Proses delete tidak bisa dibatalkan`,
        ``,
        `Yakin ingin menghapus VPS ini?`
      ].join("\n");

      bot.sendMessage(chatId, confirmMsg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Ya, Hapus", callback_data: `confirmdel_${accIndex}_${dropletId}` },
              { text: "❌ Batal", callback_data: "canceldelete" }
            ]
          ]
        }
      });
    } catch (err) {
      bot.sendMessage(chatId, `❌ Gagal ambil info VPS\n\n🧾 Error: ${err.message}`);
    }
  }

  if (data.startsWith("confirmdel_")) {
    const [, accIndex, dropletId] = data.split("_"); // FIX

    let apiKey;
    if (accIndex === "1") apiKey = settings.apiDigitalOcean;
    if (accIndex === "2") apiKey = settings.apiDigitalOcean2;
    if (accIndex === "3") apiKey = settings.apiDigitalOcean3;
    if (accIndex === "4") apiKey = settings.apiDigitalOcean4;
    if (accIndex === "5") apiKey = settings.apiDigitalOcean5;

    if (!apiKey) {
      return bot.answerCallbackQuery(cbq.id, { text: "API tidak ditemukan" });
    }

    try {
      await deleteVPS(apiKey, dropletId);
      bot.sendMessage(chatId, `✅ VPS \`${dropletId}\` berhasil dihapus`, { parse_mode: "Markdown" });
    } catch (err) {
      bot.sendMessage(chatId, `❌ Gagal delete VPS\n\n🧾 Error: ${err.message}`);
    }
  }

  if (data === "canceldelete") {
    bot.sendMessage(chatId, "❌ Delete VPS dibatalkan.");
  }

  bot.answerCallbackQuery(cbq.id).catch(() => {});
});

}