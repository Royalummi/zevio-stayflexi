const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "")
    return defaultValue;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const normalizeProviderKey = (providerKey) =>
  String(providerKey || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");

const toEnvProviderToken = (providerKey) =>
  normalizeProviderKey(providerKey)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_");

const getRequestSecret = (req) => {
  const headerSecret = req.headers["x-channel-secret"];
  if (headerSecret) return String(headerSecret);

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  if (req.query?.secret) {
    return String(req.query.secret);
  }

  return "";
};

const getRequestIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
};

export const authenticateChannelManagerRequest = (req, res, next) => {
  const providerKey = normalizeProviderKey(req.params.providerKey);

  if (!providerKey) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid provider key" });
  }

  if (!parseBoolean(process.env.CHANNEL_MANAGER_ENABLED, false)) {
    return res
      .status(503)
      .json({ success: false, message: "Channel manager is disabled" });
  }

  const allowedProviders = String(
    process.env.CHANNEL_MANAGER_ALLOWED_PROVIDERS || "",
  )
    .split(",")
    .map((value) => normalizeProviderKey(value))
    .filter(Boolean);

  if (allowedProviders.length > 0 && !allowedProviders.includes(providerKey)) {
    return res
      .status(403)
      .json({ success: false, message: "Provider is not allowed" });
  }

  const envProviderToken = toEnvProviderToken(providerKey);
  const providerEnabled = parseBoolean(
    process.env[`CHANNEL_MANAGER_PROVIDER_${envProviderToken}_ENABLED`],
    providerKey === "stayflexi",
  );

  if (!providerEnabled) {
    return res
      .status(503)
      .json({ success: false, message: `${providerKey} is disabled` });
  }

  const allowedIps = String(process.env.CHANNEL_MANAGER_ALLOWED_IPS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const requestIp = getRequestIp(req);
  if (allowedIps.length > 0 && !allowedIps.includes(requestIp)) {
    return res
      .status(403)
      .json({ success: false, message: "Source IP is not allowed" });
  }

  const sharedSecret =
    process.env[`CHANNEL_MANAGER_PROVIDER_${envProviderToken}_SHARED_SECRET`] ||
    (providerKey === "stayflexi" ? process.env.STAYFLEXI_SHARED_SECRET : "");

  if (sharedSecret) {
    const requestSecret = getRequestSecret(req);
    if (!requestSecret || requestSecret !== sharedSecret) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid channel manager credentials",
        });
    }
  }

  req.channelManager = {
    providerKey,
    requestIp,
  };

  next();
};
