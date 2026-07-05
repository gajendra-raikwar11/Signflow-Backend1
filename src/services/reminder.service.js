const Envelope = require("../models/Envelope");
const { sendReminder } = require("../integrations/docusign/sendReminder");
const AuditLog = require("../models/AuditLog");

async function remindPendingRecipients(envelopeIdOrDocusignId) {
  const envelope = await Envelope.findOne({
    $or: [
      { docusignEnvelopeId: envelopeIdOrDocusignId },
      ...(envelopeIdOrDocusignId.match(/^[0-9a-fA-F]{24}$/)
        ? [{ _id: envelopeIdOrDocusignId }]
        : []),
    ],
  });

  if (!envelope || !envelope.docusignEnvelopeId) {
    throw new Error("Envelope not found or not sent yet");
  }

  await sendReminder(envelope.docusignEnvelopeId);

  await AuditLog.create({
    envelopeId: envelope._id,
    action: "reminder_sent",
    actor: "system",
    details: { docusignEnvelopeId: envelope.docusignEnvelopeId },
  });

  return { message: "Reminder sent to pending recipients" };
}

module.exports = { remindPendingRecipients };