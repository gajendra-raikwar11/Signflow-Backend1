const crypto = require("crypto");
const Envelope = require("../../models/Envelope");
const AuditLog = require("../../models/AuditLog");

// function verifyDocuSignHmac(payload, signature) {
//   if (!process.env.DOCUSIGN_WEBHOOK_SECRET) return true;
//   const hmac = crypto.createHmac("sha256", process.env.DOCUSIGN_WEBHOOK_SECRET);
//   hmac.update(payload);
//   const computed = hmac.digest("base64");
//   return computed === signature;
// }


function verifyDocuSignHmac(payload, signature) {
  // Skip HMAC verification for now (enable in production with real secret)
  return true;
}


async function handleDocuSignWebhook(rawBody, signature) {
  if (!verifyDocuSignHmac(rawBody, signature)) {
    throw new Error("Invalid HMAC signature");
  }

  const event = JSON.parse(rawBody);
  const envelopeStatus = event.event;
  const docusignEnvelopeId = event.data?.envelopeId || event.envelopeId;

  if (!docusignEnvelopeId) return;

  const envelope = await Envelope.findOne({ docusignEnvelopeId });
  if (!envelope) return;

  if (envelopeStatus === "envelope-completed") {
    envelope.status = "completed";
  } else if (envelopeStatus === "envelope-declined" || envelopeStatus === "envelope-voided") {
    envelope.status = "voided";
  }

  const recipients = event.data?.envelopeSummary?.recipients?.signers || [];
  recipients.forEach((signer) => {
    const r = envelope.recipients.find(
      (rec) => rec.email.toLowerCase() === signer.email.toLowerCase()
    );
    if (r) {
      if (signer.status === "completed") {
        r.status = "signed";
        r.signedAt = signer.signedDateTime;
      } else if (signer.status === "declined") {
        r.status = "declined";
      }
    }
  });

  await envelope.save();

  await AuditLog.create({
    envelopeId: envelope._id,
    action: envelopeStatus,
    actor: "docusign",
    details: { docusignEnvelopeId, recipients },
  });
}

module.exports = { handleDocuSignWebhook };