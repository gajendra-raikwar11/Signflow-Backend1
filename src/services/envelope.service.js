const Envelope = require("../models/Envelope");
const { createEnvelopeInDocuSign } = require("../integrations/docusign/createEnvelope");
const { getEnvelopeStatus } = require("../integrations/docusign/getEnvelopeStatus");

async function saveEnvelopeOnly(data) {
  const envelope = new Envelope({ ...data, status: "draft" });
  await envelope.save();
  return envelope;
}

async function saveAndSendEnvelope(data) {
  const envelope = new Envelope({ ...data, status: "draft" });
  await envelope.save();

  const docusignEnvelopeId = await createEnvelopeInDocuSign(envelope);

  envelope.docusignEnvelopeId = docusignEnvelopeId;
  envelope.status = "sent";
  envelope.sentAt = new Date();
  await envelope.save();

  return envelope;
}

async function syncEnvelopeStatus(idOrDocusignId) {
  let envelope = await Envelope.findOne({
    $or: [
      { docusignEnvelopeId: idOrDocusignId },
      ...(idOrDocusignId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: idOrDocusignId }] : []),
    ],
  });

  if (!envelope || !envelope.docusignEnvelopeId) {
    throw new Error("Envelope not found or not sent yet");
  }

  const liveStatus = await getEnvelopeStatus(envelope.docusignEnvelopeId);

  if (liveStatus.status === "completed") envelope.status = "completed";
  if (liveStatus.status === "voided") envelope.status = "voided";

  envelope.recipients.forEach((r) => {
    const live = liveStatus.signers.find(
      (s) => s.email.toLowerCase() === r.email.toLowerCase()
    );
    if (live) {
      if (live.status === "completed" || live.status === "signed") {
        r.status = "signed";
        r.signedAt = live.signedDateTime;
      } else if (live.status === "declined") {
        r.status = "declined";
      } else if (live.status === "sent" || live.status === "delivered") {
        r.status = "sent";
      }
    }
  });

  await envelope.save();
  return envelope;
}

module.exports = { saveEnvelopeOnly, saveAndSendEnvelope, syncEnvelopeStatus };