/**
 * 内测申请 → 飞书多维表格（Cloudflare Worker）。
 * 密钥只从环境变量读取。
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

function origins(env) {
  return (env.ALLOWED_ORIGINS || "https://fullstackinnoai.github.io")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
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

function json(headers, status, body) {
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = new Headers();
    if (origins(env).includes(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Vary", "Origin");
    }
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Max-Age", "86400");

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return json(headers, 405, { ok: false, message: "只接受 POST" });
    if (!env.FEISHU_APP_ID || !env.FEISHU_APP_SECRET) {
      return json(headers, 500, { ok: false, message: "申请服务还没配好，请稍后再试。" });
    }

    const ip = String(request.headers.get("CF-Connecting-IP") || "unknown");
    if (limited(ip)) return json(headers, 429, { ok: false, message: "提交太频繁，请十分钟后再试。" });

    let body;
    try {
      body = await request.json();
    } catch {
      return json(headers, 400, { ok: false, message: "请求格式不正确。" });
    }

    const email = String(body.email || "").trim();
    if (!EMAIL.test(email) || email.length > 120) {
      return json(headers, 400, { ok: false, message: "请填写有效邮箱。" });
    }
    if (body.consent !== true) {
      return json(headers, 400, { ok: false, message: "请确认同意后再提交。" });
    }
    const note = String(body.note || "").trim();
    if (note.length > 300) {
      return json(headers, 400, { ok: false, message: "一句话请控制在 300 字以内。" });
    }

    const fields = { 邮箱: email, 隐私同意: true };
    const roles = mapList(body.roles, ROLES);
    const wants = mapList(body.wants, WANTS);
    if (roles.length) fields["你的身份"] = roles;
    if (wants.length) fields["最想体验的能力"] = wants;
    if (note) fields["给我们的一句话"] = note;

    try {
      const authRes = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET }),
      });
      const auth = await authRes.json();
      if (!authRes.ok || auth.code !== 0 || !auth.tenant_access_token) {
        console.error("apply failed", auth.msg || authRes.status);
        return json(headers, 502, { ok: false, message: "暂时没能提交，请稍后再试。" });
      }
      const app = env.FEISHU_APP_TOKEN || "U2fNbKo2tacPV4sGQ9GcquBYnob";
      const table = env.FEISHU_TABLE_ID || "tblZdj9fOQUHgHPM";
      const writeRes = await fetch(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${app}/tables/${table}/records`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.tenant_access_token}`,
          },
          body: JSON.stringify({ fields }),
        }
      );
      const written = await writeRes.json();
      if (!writeRes.ok || written.code !== 0) {
        console.error("apply failed", written.msg || writeRes.status);
        return json(headers, 502, { ok: false, message: "暂时没能提交，请稍后再试。" });
      }
    } catch (err) {
      console.error("apply failed", err && err.message);
      return json(headers, 502, { ok: false, message: "暂时没能提交，请稍后再试。" });
    }
    return json(headers, 200, { ok: true });
  },
};
