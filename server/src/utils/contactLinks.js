function normalizePhone(phoneNumber, forWhatsApp = false) {
  if (!phoneNumber) return "";
  const compact = String(phoneNumber).replace(/\s+/g, "");
  if (forWhatsApp) return compact.replace(/^\+/, "").replace(/[^0-9]/g, "");
  return compact;
}

function createTelLink(phoneNumber) {
  const normalized = normalizePhone(phoneNumber);
  return normalized ? "tel:" + normalized : "";
}

function createWhatsAppLink(phoneNumber, message) {
  const normalized = normalizePhone(phoneNumber, true);
  if (!normalized) return "";
  const encodedMessage = encodeURIComponent(message || "");
  return "https://wa.me/" + normalized + (encodedMessage ? "?text=" + encodedMessage : "");
}

module.exports = {
  createTelLink,
  createWhatsAppLink
};
