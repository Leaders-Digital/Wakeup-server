const axios = require("axios");

const DEFAULT_BASE = "https://prodconvamiaafcmeapi.azurewebsites.net";
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

function shortBody(data) {
  if (data == null) return "";
  if (typeof data === "string") return data.replace(/\s+/g, " ").slice(0, 400);
  try {
    return JSON.stringify(data).slice(0, 400);
  } catch {
    return String(data).slice(0, 400);
  }
}

function extractToken(data) {
  if (!data || typeof data !== "object") return null;
  return (
    data.token ||
    data.access_token ||
    data.accessToken ||
    data.bearerToken ||
    (data.data && (data.data.token || data.data.access_token)) ||
    null
  );
}

/**
 * Authenticates against the AAFCME / ConvAmi API and returns a Bearer token.
 *
 * Production AAFCME / ConvAmi API:
 *   POST https://prodconvamiaafcmeapi.azurewebsites.net/v2/auth/tokens
 *   Content-Type: application/json
 *   Body: { email, password }
 *   Returns: { token, validity?, status? }
 *
 * Override the base URL with CNRPS_API_BASE_URL when needed.
 */
async function fetchCnrpsBearerToken() {
  if (
    tokenCache.token &&
    Date.now() < tokenCache.expiresAtMs - TOKEN_EXPIRY_SKEW_MS
  ) {
    return tokenCache.token;
  }

  const base = getBaseUrl();
  const email = process.env.CNRPS_EMAIL || process.env.CNRPS_USERNAME;
  const password = process.env.CNRPS_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "CNRPS_EMAIL (or CNRPS_USERNAME) and CNRPS_PASSWORD must be set in environment"
    );
  }

  const url = `${base}/v2/auth/tokens`;
  const payload = { email, password };
  const timeout = Number(process.env.CNRPS_HTTP_TIMEOUT_MS) || 20000;

  const res = await axios.request({
    method: "POST",
    url,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout,
    validateStatus: () => true,
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(
      `CNRPS auth failed: POST ${url} -> HTTP ${res.status} (content-type=${res.headers["content-type"] || "-"}) body=${shortBody(res.data)}`
    );
  }

  const token = extractToken(res.data);
  const statusValue = Number(res.data?.status);
  if (!Number.isNaN(statusValue) && statusValue !== 1 && !token) {
    throw new Error(
      `CNRPS auth rejected credentials (status=${statusValue}) body=${shortBody(res.data)}`
    );
  }
  if (!token) {
    throw new Error(
      `CNRPS auth response did not include a token field. body=${shortBody(res.data)}`
    );
  }

  const validityMinutes = Number(res.data?.validity);
  const ttlMs =
    !Number.isNaN(validityMinutes) && validityMinutes > 0
      ? validityMinutes * 60 * 1000
      : 5 * 60 * 1000;

  tokenCache = {
    token,
    expiresAtMs: Date.now() + ttlMs,
  };

  return token;
}

/**
 * Production AAFCME / ConvAmi API:
 *   GET https://prodconvamiaafcmeapi.azurewebsites.net/v2/auth/{cnrps}/eligibility
 *   Authorization: Bearer {token}
 *   Returns: { result: true | false }
 */
async function checkMemberEligibility(cnrps) {
  const base = getBaseUrl();
  const token = await fetchCnrpsBearerToken();
  const url = `${base}/v2/auth/${encodeURIComponent(cnrps)}/eligibility`;
  const timeout = Number(process.env.CNRPS_HTTP_TIMEOUT_MS) || 20000;

  const res = await axios.request({
    method: "get",
    url,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    timeout,
    validateStatus: () => true,
  });

  if (res.status === 401 || res.status === 403) {
    tokenCache = { token: null, expiresAtMs: 0 };
  }

  if (res.status < 200 || res.status >= 300) {
    throw new Error(
      `CNRPS eligibility GET ${url} -> HTTP ${res.status} (content-type=${res.headers["content-type"] || "-"}) body=${shortBody(res.data)}`
    );
  }

  if (res.data && typeof res.data === "object") {
    return !!res.data.result;
  }

  throw new Error(
    `CNRPS eligibility unexpected response (content-type=${res.headers["content-type"] || "-"}) body=${shortBody(res.data)}`
  );
}

module.exports = {
  fetchCnrpsBearerToken,
  checkMemberEligibility,
  getBaseUrl,
  normalizeCnrpsCode,
};
