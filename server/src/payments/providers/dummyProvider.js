async function initiateSubscriptionPayment(context) {
  return {
    provider: "dummy",
    providerTransactionId: context.payment.transactionReference,
    externalReference: context.payment.externalReference || context.payment.paymentId,
    status: context.payment.status,
    rawProviderResponse: {
      mode: "dummy",
      message: "Dummy payment provider response for Umusare test mode."
    }
  };
}

async function checkPaymentStatus(payment) {
  return {
    provider: "dummy",
    providerTransactionId: payment.providerTransactionId || payment.transactionReference,
    status: payment.status
  };
}

async function handlePaymentWebhook(payload) {
  return {
    provider: "dummy",
    externalReference: payload && payload.externalReference,
    providerTransactionId: payload && payload.providerTransactionId,
    status: payload && payload.status
  };
}

module.exports = {
  initiateSubscriptionPayment,
  checkPaymentStatus,
  handlePaymentWebhook
};
