const axios = require("axios");
const { getAuthenticatedClient } = require("./docusignClient");

/**
 * Resends the signing email to recipients who haven't completed yet.
 * Using raw axios call instead of the SDK method (SDK has a bug that
 * crashes on certain error paths with updateRecipients).
 */
async function sendReminder(docusignEnvelopeId) {
  const { accountId, baseUri, accessToken } = await getAuthenticatedClient();

  const url = `${baseUri}/v2.1/accounts/${accountId}/envelopes/${docusignEnvelopeId}/recipients?resend_envelope=true`;

  try {
    // First fetch current recipients (DocuSign requires the recipients body on resend)
    const recipientsRes = await axios.get(
      `${baseUri}/v2.1/accounts/${accountId}/envelopes/${docusignEnvelopeId}/recipients`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const result = await axios.put(url, recipientsRes.data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return result.data;
  } catch (err) {
    const detail = err.response ? err.response.data : err.message;
    console.error("sendReminder error detail:", JSON.stringify(detail, null, 2));
    throw new Error(JSON.stringify(detail));
  }
}

module.exports = { sendReminder };