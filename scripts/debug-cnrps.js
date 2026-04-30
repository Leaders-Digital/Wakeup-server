/**
 * Quick CNRPS API connectivity check.
 * Run from Wakeup-server folder: node scripts/debug-cnrps.js [cnrps]
 *
 * Hits the live AAFCME API:
 *   POST {base}/v2/auth/tokens          { email, password }
 *   GET  {base}/v2/auth/{cnrps}/eligibility    Authorization: Bearer {token}
 */
require("dotenv").config();
const axios = require("axios");

const base = (
  process.env.CNRPS_API_BASE_URL ||
  "https://intconvamiaafcmeapi.azurewebsites.net"
).replace(/\/$/, "");
const email = process.env.CNRPS_EMAIL || process.env.CNRPS_USERNAME;
const password = process.env.CNRPS_PASSWORD;
const cnrps = process.argv[2] || "9927110111";

if (!email || !password) {
  console.error("Set CNRPS_EMAIL (or CNRPS_USERNAME) and CNRPS_PASSWORD in .env");
  process.exit(1);
}

function shortBody(d) {
  if (d == null) return "";
  if (typeof d === "string") return d.replace(/\s+/g, " ").slice(0, 800);
  try {
    return JSON.stringify(d).slice(0, 800);
  } catch {
    return String(d).slice(0, 800);
  }
}

async function call(label, opts) {
  const t0 = Date.now();
  try {
    const res = await axios.request({ ...opts, validateStatus: () => true, timeout: 25000 });
    console.log(
      `[${label}] ${opts.method.toUpperCase()} ${opts.url}\n  -> ${res.status} (${Date.now() - t0}ms) ct=${res.headers["content-type"] || "-"}\n  body: ${shortBody(res.data)}\n`
    );
    return res;
  } catch (err) {
    console.log(
      `[${label}] ${opts.method.toUpperCase()} ${opts.url}\n  -> ERROR (${Date.now() - t0}ms) ${err.code || ""} ${err.message}\n`
    );
    return null;
  }
}

(async () => {
  console.log(`Base: ${base}\nemail: ${email}\ncnrps: ${cnrps}\n`);

  const auth = await call("auth", {
    method: "post",
    url: `${base}/v2/auth/tokens`,
    data: { email, password },
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  });

  const token =
    auth?.data?.token ||
    auth?.data?.access_token ||
    auth?.data?.accessToken ||
    null;

  if (!token) {
    console.log("Auth did not return a token; stopping.");
    return;
  }

  await call("eligibility", {
    method: "get",
    url: `${base}/v2/auth/${encodeURIComponent(cnrps)}/eligibility`,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
})();
