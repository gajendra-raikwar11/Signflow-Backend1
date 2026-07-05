const mongoose = require("mongoose");

const recipientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ["signer", "approver", "viewer"], default: "signer" },
  routingOrder: { type: Number, required: true, default: 1 }, // 1 = signs first
  status: {
    type: String,
    enum: ["pending", "sent", "signed", "declined"],
    default: "pending",
  },
  signedAt: { type: Date },
  docusignRecipientId: { type: String }, // DocuSign assigns its own recipientId per envelope
});

module.exports = recipientSchema; // also a sub-schema, embedded in Envelope