const supportConfig = require("../config/support");
const { createTelLink, createWhatsAppLink } = require("../utils/contactLinks");

const CLIENT_DRIVER_CONTACT_STATUSES = ["Accepted", "Driver on the way", "Trip started", "Completed", "Reported", "Reviewed"];

function action(label, href, phoneNumber) {
  if (!href) return null;
  return { label, href, phoneNumber };
}

function bookingTripText(booking) {
  return "from " + booking.pickupLocation + " to " + booking.destination;
}

function supportMessage(booking, viewerRole) {
  if (viewerRole === "driver") return "Hello Umusare Support, I need help with booking " + booking.bookingId + ".";
  return "Hello Umusare Support, I need help with my booking " + booking.bookingId + ".";
}

function getClientPhone(booking) {
  const clientUser = booking.clientUserId || {};
  return clientUser.phone || booking.guestClientPhone || "";
}

function getDriverPhone(booking) {
  const driverProfile = booking.driverId || {};
  const driverUser = driverProfile.userId || {};
  return driverUser.phone || "";
}

function buildSupportActions(booking, viewerRole) {
  return {
    callSupport: action("Call Support", createTelLink(supportConfig.supportPhone), supportConfig.supportPhone),
    whatsappSupport: action(
      "WhatsApp Support",
      createWhatsAppLink(supportConfig.supportWhatsApp, supportMessage(booking, viewerRole)),
      supportConfig.supportWhatsApp
    ),
    emailSupport: supportConfig.supportEmail ? {
      label: "Email Support",
      href: "mailto:" + supportConfig.supportEmail,
      email: supportConfig.supportEmail
    } : null
  };
}

function buildBookingContactActions(booking, viewerRole) {
  const contactActions = buildSupportActions(booking, viewerRole);
  const clientPhone = getClientPhone(booking);
  const driverPhone = getDriverPhone(booking);
  const canClientContactDriver = viewerRole === "admin"
    || (viewerRole === "client" && CLIENT_DRIVER_CONTACT_STATUSES.includes(booking.status));
  const canDriverContactClient = viewerRole === "admin"
    || (viewerRole === "driver" && booking.driverUserId && CLIENT_DRIVER_CONTACT_STATUSES.includes(booking.status));

  if (canClientContactDriver && driverPhone) {
    contactActions.callDriver = action("Call Driver", createTelLink(driverPhone), driverPhone);
    contactActions.whatsappDriver = action(
      "WhatsApp Driver",
      createWhatsAppLink(driverPhone, "Hello, I booked you through Umusare. Please confirm my trip " + bookingTripText(booking) + "."),
      driverPhone
    );
  }

  if (canDriverContactClient && clientPhone) {
    contactActions.callClient = action("Call Client", createTelLink(clientPhone), clientPhone);
    contactActions.whatsappClient = action(
      "WhatsApp Client",
      createWhatsAppLink(clientPhone, "Hello, this is your Umusare driver. I am contacting you about your booking " + bookingTripText(booking) + "."),
      clientPhone
    );
  }

  Object.keys(contactActions).forEach(function (key) {
    if (!contactActions[key]) delete contactActions[key];
  });
  return contactActions;
}

function getPublicSupportContactActions() {
  return {
    supportPhone: supportConfig.supportPhone,
    supportWhatsApp: supportConfig.supportWhatsApp,
    supportEmail: supportConfig.supportEmail,
    callSupport: action("Call Umusare Support", createTelLink(supportConfig.supportPhone), supportConfig.supportPhone),
    whatsappSupport: action(
      "WhatsApp Umusare Support",
      createWhatsAppLink(supportConfig.supportWhatsApp, "Hello Umusare Support, I need help with my booking."),
      supportConfig.supportWhatsApp
    ),
    emailSupport: {
      label: "Email Support",
      href: "mailto:" + supportConfig.supportEmail,
      email: supportConfig.supportEmail
    }
  };
}

module.exports = {
  buildBookingContactActions,
  getPublicSupportContactActions
};
