/**
 * 内测申请 → 飞书多维表格。
 * App Secret 只从环境变量读取，不要写进仓库。
 *
 * FEISHU_APP_ID
 * FEISHU_APP_SECRET
 * FEISHU_APP_TOKEN   默认 U2fNbKo2tacPV4sGQ9GcquBYnob
 * FEISHU_TABLE_ID    默认 tblZdj9fOQUHgHPM
 * ALLOWED_ORIGINS    逗号分隔，例如 https://fullstackinnoai.github.io
 */

const ROLES = {
  creator: "创作者",
  "创作者": "创作者",
  ip: "IP 持有者 / 品牌",
  "IP 持有者 / 品牌": "IP 持有者 / 品牌",
  asset: "资产制作伙伴",
  "资产制作伙伴": "资产制作伙伴",
  other: "其他",
  "其他": "其他",
};

const WANTS = {
  persona: "角色设定",
  "角色设定": "角色设定",
  voice: "专属声音",
  "专属声音": "专属声音",
  content: "视频与动画",
  "视频与动画": "视频与动画",
  device: "随身设备",
  "随身设备": "随身设备",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hits = new Map();

function origins() {
  return (process.env.ALLOWED_ORIGINS || "https://fullstackinnoai.github.io")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function cors(req, res) {
  const origin = req.headers.origin || "";
  const allowed = origins();
  if (allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function mapList(values, dict) {
  if (!Array.isArray(values)) return [];
  const out = [];
  for (const value of values) {
    const label = dict[String(value).trim()];
    if (label && !out.includes(label)) out.push(label);
  }
  return out;
}

function limited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const prev = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  if (prev.length >= 5) {
    hits.set(ip, prev);
    return true;
  }
  prev.push(now);
  hits.set(ip, prev);
  return false;
}

async function tenantToken() {
  const res = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0 || !data.tenant_access_token) {
    const err = new Error("feishu auth failed");
    err.detail = data.msg || res.statusText;
    throw err;
  }
  return data.tenant_access_token;
}

async function createRecord(token, fields) {
  const app = process.env.FEISHU_APP_TOKEN || "U2fNbKo2tacPV4sGQ9GcquBYnob";
  const table = process.env.FEISHU_TABLE_ID || "tblZdj9fOQUHgHPM";
  const res = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${app}/tables/${table}/records`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fields }),
    }
  );
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    const err = new Error("feishu write failed");
    err.detail = data.msg || res.statusText;
    throw err;
  }
  return data;
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    send(res, 405, { ok: false, message: "只接受 POST" });
    return;
  }
  if (!process.env.FEISHU_APP_ID || !process.env.FEISHU_APP_SECRET) {
    send(res, 500, { ok: false, message: "申请服务还没配好，请稍后再试。" });
    return;
  }

  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
  if (limited(ip)) {
    send(res, 429, { ok: false, message: "提交太频繁，请十分钟后再试。" });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    send(res, 400, { ok: false, message: "请求格式不正确。" });
    return;
  }

  const email = String(body.email || "").trim();
  if (!EMAIL.test(email) || email.length > 120) {
    send(res, 400, { ok: false, message: "请填写有效邮箱。" });
    return;
  }
  if (body.consent !== true) {
    send(res, 400, { ok: false, message: "请确认同意后再提交。" });
    return;
  }
  const note = String(body.note || "").trim();
  if (note.length > 300) {
    send(res, 400, { ok: false, message: "一句话请控制在 300 字以内。" });
    return;
  }

  const fields = {
    邮箱: email,
    隐私同意: true,
  };
  const roles = mapList(body.roles, ROLES);
  const wants = mapList(body.wants, WANTS);
  if (roles.length) fields["你的身份"] = roles;
  if (wants.length) fields["最想体验的能力"] = wants;
  if (note) fields["给我们的一句话"] = note;

  try {
    const token = await tenantToken();
    await createRecord(token, fields);
  } catch (err) {
    console.error("apply failed", err.detail || err.message);
    send(res, 502, { ok: false, message: "暂时没能提交，请稍后再试。" });
    return;
  }
  send(res, 200, { ok: true });
}
