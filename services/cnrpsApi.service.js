const axios = require("axios");

const DEFAULT_BASE = "https://intconvamiaafcmeapi.azurewebsites.net";
const TOKEN_EXPIRY_SKEW_MS = 10000;
let tokenCache = {
  token: null,
  expiresAtMs: 0,
};

function normalizeCnrpsCode(raw) {
  if (raw == null || typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, "");
}

function getBaseUrl() {
  return (process.env.CNRPS_API_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
}

function extractToken(data) {
  if (!data || typeof data !== "object") return null;
  return (
    data.access_token ||
    data.token ||
    data.accessToken ||
    data.bearerToken ||
    (data.data && (data.data.token || data.data.access_token)) ||
    null
  );
}

/**
 * Authenticates against the external CNRPS API and returns a Bearer token.
 * Contract v2.0 expects POST /auth/tokens with JSON payload { email, password }.
 */
async function fetchCnrpsBearerToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAtMs - TOKEN_EXPIRY_SKEW_MS) {
    return tokenCache.token;
  }

  const base = getBaseUrl();
  const email = process.env.CNRPS_EMAIL || process.env.CNRPS_USERNAME;
  const password = process.env.CNRPS_PASSWORD;
  if (!email || !password) {
    throw new Error("CNRPS_EMAIL and CNRPS_PASSWORD must be set in environment");
  }

  const url = `${base}/auth/tokens`;
  const payload = { email, password };
  const headers = { "Content-Type": "application/json" };
  const timeout = Number(process.env.CNRPS_HTTP_TIMEOUT_MS) || 20000;

  const res = await axios.request({
    method: "POST",
    url,
    data: payload,
    headers,
    timeout,
    validateStatus: () => true,
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(
      `CNRPS auth failed: HTTP ${res.status} ${typeof res.data === "string" ? res.data : JSON.stringify(res.data)}`
    );
  }

  const token = extractToken(res.data);
  if (!token) {
    throw new Error("CNRPS auth response did not include a recognizable token field");
  }
  const statusValue = Number(res.data?.status);
  if (!Number.isNaN(statusValue) && statusValue !== 1) {
    throw new Error("CNRPS auth rejected credentials (status != 1)");
  }

  const validityMinutes = Number(res.data?.validity);
  const ttlMs = !Number.isNaN(validityMinutes) && validityMinutes > 0
    ? validityMinutes * 60 * 1000
    : 5 * 60 * 1000;

  tokenCache = {
    token,
    expiresAtMs: Date.now() + ttlMs,
  };

  return token;
}

/**
 * Calls CheckMemberEligibility. CNRPS is sent in the URL path; optional JSON body is sent if CNRPS_SEND_ELIGIBILITY_BODY=1.
 */
async function checkMemberEligibility(cnrps) {
  const base = getBaseUrl();
  const token = await fetchCnrpsBearerToken();
  const url = `${base}/auth/${encodeURIComponent(cnrps)}/eligibility`;
  const timeout = Number(process.env.CNRPS_HTTP_TIMEOUT_MS) || 20000;
  const sendBody = process.env.CNRPS_SEND_ELIGIBILITY_BODY === "1";

  const res = await axios({
    method: "get",
    url,
    ...(sendBody ? { data: { cnrps } } : {}),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout,
    validateStatus: () => true,
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(
      `CNRPS eligibility HTTP ${res.status}: ${typeof res.data === "string" ? res.data : JSON.stringify(res.data)}`
    );
  }

  return !!res.data?.result;
}

module.exports = {
  fetchCnrpsBearerToken,
  checkMemberEligibility,
  getBaseUrl,
  normalizeCnrpsCode,
};
