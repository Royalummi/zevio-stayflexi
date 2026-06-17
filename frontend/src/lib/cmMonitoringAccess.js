export const CM_MONITORING_ALLOWED_EMAIL = "ranjith@gopafy.com";

export const canAccessCmMonitoring = (user) =>
  String(user?.email || "")
    .trim()
    .toLowerCase() === CM_MONITORING_ALLOWED_EMAIL;
