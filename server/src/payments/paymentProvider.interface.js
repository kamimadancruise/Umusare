/**
 * Umusare payment provider contract.
 *
 * Providers should expose:
 * - initiateSubscriptionPayment({ payment, subscription, user, phoneNumber })
 * - checkPaymentStatus(payment)
 * - handlePaymentWebhook(payload, headers)
 *
 * Controllers and domain services should call the payment abstraction instead
 * of depending directly on a specific Mobile Money provider.
 */
module.exports = {};
