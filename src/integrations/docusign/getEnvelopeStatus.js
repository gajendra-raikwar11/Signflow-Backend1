const docusign = require("docusign-esign");
const { getAuthenticatedClient } = require("./docusignClient");

/**
 * Fetches envelope + per-recipient status from DocuSign
 */
async function getEnvelopeStatus(docusignEnvelopeId) {
  const { apiClient, accountId } = await getAuthenticatedClient();
  const envelopesApi = new docusign.EnvelopesApi(apiClient);

  // Overall envelope status
  const envelope = await envelopesApi.getEnvelope(accountId, docusignEnvelopeId);

  // Per-recipient status (who signed, who is pending)
  const recipients = await envelopesApi.listRecipients(accountId, docusignEnvelopeId);

  return {
    status: envelope.status, // sent / completed / declined / voided
    sentDateTime: envelope.sentDateTime,
    completedDateTime: envelope.completedDateTime,
    signers: (recipients.signers || []).map((s) => ({
      name: s.name,
      email: s.email,
      status: s.status, // created / sent / delivered / signed / declined
      signedDateTime: s.signedDateTime,
      routingOrder: s.routingOrder,
    })),
  };
}

module.exports = { getEnvelopeStatus };