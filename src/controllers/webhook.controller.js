const { handleDocuSignWebhook } = require("../integrations/docusign/webhookHandler");

async function docusignWebhook(req, res) {
  try {
    const signature = req.headers["x-docusign-signature-1"];
    await handleDocuSignWebhook(req.rawBody, signature);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { docusignWebhook };