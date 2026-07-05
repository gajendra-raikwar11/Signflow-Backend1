const mongoose = require("mongoose");
const tabSchema = require("./Tab");

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sourceFileName: { type: String, required: true },
    sourceFileBase64: { type: String },
    tabsLayout: [tabSchema], // saved tab positions, without recipient binding yet
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Template", templateSchema);