const mongoose = require("mongoose");

const tabSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["sign_here", "initial_here", "date_signed", "text", "checkbox", "dropdown", "company_title"],
    required: true,
  },
  page: { type: Number, required: true, default: 1 },
  x: { type: Number, required: true }, // pixel offset from left
  y: { type: Number, required: true }, // pixel offset from top
  recipientEmail: { type: String, required: true }, // which recipient this tab belongs to
  label: { type: String }, // optional, e.g. "Sign Here — Sanjay"
});

module.exports = tabSchema; // sub-schema, embedded inside Envelope (not its own collection)