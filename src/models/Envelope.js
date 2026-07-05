const mongoose = require("mongoose");
const recipientSchema = require("./Recipient");
const tabSchema = require("./Tab");

const envelopeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "sent", "completed", "voided"],
      default: "draft",
    },
    routingType: { type: String, enum: ["sequential", "parallel"], default: "sequential" },

    sourceFileName: { type: String, required: true }, // original uploaded file name
    sourceFileBase64: { type: String }, // the actual PDF, stored as base64 (or store a file path / S3 URL instead, if you don't want big docs in Mongo)

    recipients: [recipientSchema],
    tabs: [tabSchema],

    docusignEnvelopeId: { type: String }, // filled in after DocuSign creates it
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Envelope", envelopeSchema);