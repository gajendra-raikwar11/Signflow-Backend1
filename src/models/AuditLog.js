const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: "Envelope" },
    action: { type: String, required: true }, // e.g. "envelope_created", "reminder_sent", "recipient_signed"
    actor: { type: String }, // user email or "system"
    details: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);