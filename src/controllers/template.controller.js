const Template = require("../models/Template");
const Envelope = require("../models/Envelope");

// Save a new template directly
async function createTemplate(req, res) {
  try {
    const { name, sourceFileName, sourceFileBase64, tabsLayout } = req.body;

    const template = await Template.create({
      name,
      sourceFileName,
      sourceFileBase64,
      tabsLayout: tabsLayout || [],
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Save an existing envelope's layout AS a template (reuse what you already built)
async function saveEnvelopeAsTemplate(req, res) {
  try {
    const envelope = await Envelope.findById(req.params.envelopeId);
    if (!envelope) {
      return res.status(404).json({ success: false, message: "Envelope not found" });
    }

    const template = await Template.create({
      name: req.body.name || envelope.title,
      sourceFileName: envelope.sourceFileName,
      sourceFileBase64: envelope.sourceFileBase64,
      tabsLayout: envelope.tabs, // reuse the same tab positions
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// List all templates
async function listTemplates(req, res) {
  try {
    const templates = await Template.find().sort({ createdAt: -1 });
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Get one template (used when "Use template" is clicked, to pre-fill the create-envelope form)
async function getTemplate(req, res) {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Edit a template (name, tab positions, etc.)
async function updateTemplate(req, res) {
  try {
    const template = await Template.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Delete a template
async function deleteTemplate(req, res) {
  try {
    await Template.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Template deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  createTemplate,
  saveEnvelopeAsTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
};