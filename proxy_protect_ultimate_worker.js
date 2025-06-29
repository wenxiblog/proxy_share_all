const shadowshareURLs = [
  "https://gitee.com/api/v5/repos/configshare/share/raw/%s?access_token=9019dae4f65bd15afba8888f95d7ebcc&ref=hotfix",
  "https://raw.githubusercontent.com/configshare/share/hotfix/%s",
  "https://shadowshare.v2cross.com/servers/%s",
];

// ✅ 配置项（请按需修改）
const ACCESS_KEY = "abc123";
const BLOCKED_IPS = ["1.2.3.4", "5.6.7.8"];
const REPORT_URL = "https://your-api.com/report"; // POST 接收 JSON

const defaultKey = "8YfiQ8wrkziZ5YFW";
const defaultIV = "8YfiQ8wrkziZ5YFW";

const dailyRequestMap = new Map();
const DAILY_LIMIT = 30;

function getClientIP(request) {
  return request.headers.get("cf-connecting-ip") || "unknown";
}

function jsonResponse(status, message, data = null) {
  return new Response(JSON.stringify({ status, message, data }, null, 2), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.text();
}

function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function pkcs7Unpad(buffer) {
  const pad = buffer[buffer.length - 1];
  return buffer.slice(0, buffer.length - pad);
}

async function aesDecrypt(ciphertext, key, iv) {
  const keyBytes = new TextEncoder().encode(key);
  const ivBytes = new TextEncoder().encode(iv);
  const cipherBytes = base64ToUint8Array(ciphertext);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-CBC" }, false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-CBC", iv: ivBytes }, cryptoKey, cipherBytes);
  return new TextDecoder().decode(pkcs7Unpad(new Uint8Array(decrypted)));
}

async function fetchAndDecryptSmart(filename) {
  for (let urlTemplate of shadowshareURLs) {
    const url = urlTemplate.replace("%s", filename);
    try {
      const encrypted = await fetchText(url);
      const decrypted = await aesDecrypt(encrypted, defaultKey, defaultIV);
      return decrypted;
    } catch (_) {
      continue;
    }
  }
  throw new Error("All sources failed.");
}

async function reportLog(log) {
  try {
    await fetch(REPORT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    });
  } catch (_) {
    // 忽略失败，防止阻塞主流程
  }
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const filename = url.searchParams.get("file");
  const accessKey = url.searchParams.get("key");
  const ip = getClientIP(request);
  const referer = request.headers.get("Referer") || "none";
  const ua = request.headers.get("User-Agent") || "unknown";
  const today = new Date().toISOString().split("T")[0];

  const logData = {
    time: new Date().toISOString(),
    ip,
    filename,
    referer,
    ua,
  };

  console.log(`[${logData.time}] [${ip}] ${filename} | ${referer} | ${ua}`);
  reportLog(logData); // 异步上报日志

  // 检查参数
  if (!filename) return jsonResponse(400, "Missing file parameter.");
  if (accessKey !== ACCESS_KEY) return jsonResponse(403, "Forbidden. Invalid access key.");
  if (BLOCKED_IPS.includes(ip)) return jsonResponse(403, "Access denied. IP is blacklisted.");

  // 限流检查
  const ipKey = `${ip}-${today}`;
  const count = dailyRequestMap.get(ipKey) || 0;
  if (count >= DAILY_LIMIT) return jsonResponse(429, "Rate limit exceeded. Try again tomorrow.");
  dailyRequestMap.set(ipKey, count + 1);

  // 处理解密
  try {
    const decrypted = await fetchAndDecryptSmart(filename);
    return jsonResponse(200, "Success", decrypted);
  } catch (err) {
    return jsonResponse(500, "Fetch/Decrypt failed", err.message);
  }
}