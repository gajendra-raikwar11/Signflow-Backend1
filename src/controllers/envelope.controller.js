const { saveEnvelopeOnly, saveAndSendEnvelope, syncEnvelopeStatus } = require("../services/envelope.service");

const { remindPendingRecipients } = require("../services/reminder.service");

const Template = require("../models/Template");


async function createEnvelope(req, res) {
  try {
    const { sendNow, ...envelopeData } = req.body;

    const envelope = sendNow
      ? await saveAndSendEnvelope(envelopeData)
      : await saveEnvelopeOnly(envelopeData);

    res.status(201).json({ success: true, envelope });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}


async function getStatus(req, res) {
  try {
    const envelope = await syncEnvelopeStatus(req.params.id);
    res.json({ success: true, envelope });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}


async function remind(req, res) {
  try {
    const result = await remindPendingRecipients(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createFromTemplate(req, res) {
  try {
    const template = await Template.findById(req.params.templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    const { title, recipients, sendNow } = req.body;

    // Map template's tabsLayout to actual tabs by matching with provided recipients
    // (template stores tab positions; you bind them to real recipient emails here)
    const tabs = template.tabsLayout.map((t) => ({
      type: t.type,
      page: t.page,
      x: t.x,
      y: t.y,
      recipientEmail: t.recipientEmail, // frontend should remap this to chosen recipients
      label: t.label,
    }));

    const envelopeData = {
      title: title || template.name,
      routingType: "sequential",
      sourceFileName: template.sourceFileName,
      sourceFileBase64: template.sourceFileBase64,
      recipients,
      tabs,
      createdBy: req.user.id,
    };

    const { saveEnvelopeOnly, saveAndSendEnvelope } = require("../services/envelope.service");

    const envelope = sendNow
      ? await saveAndSendEnvelope(envelopeData)
      : await saveEnvelopeOnly(envelopeData);

    // bump usage count
    template.usageCount += 1;
    await template.save();

    res.status(201).json({ success: true, envelope });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
  async function listEnvelopes(req, res) {
    try {
      const Envelope = require("../models/Envelope");
      const { status, from, to, search } = req.query;

      const query = {};

      if (status && status !== "all") query.status = status;
      if (search) query.title = { $regex: search, $options: "i" };
      if (from || to) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = new Date(from);
        if (to) query.createdAt.$lte = new Date(to + "T23:59:59");
      }

      const envelopes = await Envelope.find(query)
        .sort({ createdAt: -1 })
        .select("-sourceFileBase64");

      res.json({ success: true, envelopes });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

async function sendDraftEnvelope(req, res) {
  try {
    const Envelope = require("../models/Envelope");
    const { createEnvelopeInDocuSign } = require("../integrations/docusign/createEnvelope");

    const envelope = await Envelope.findById(req.params.id);
    if (!envelope) return res.status(404).json({ success: false, message: "Not found" });
    if (envelope.status !== "draft") {
      return res.status(400).json({ success: false, message: "Already sent" });
    }

    const docusignEnvelopeId = await createEnvelopeInDocuSign(envelope);
    envelope.docusignEnvelopeId = docusignEnvelopeId;
    envelope.status = "sent";
    envelope.sentAt = new Date();
    await envelope.save();

    res.json({ success: true, envelope });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getEnvelopeById(req, res) {
  try {
    const Envelope = require("../models/Envelope");
    const envelope = await Envelope.findById(req.params.id);
    if (!envelope) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, envelope });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { createEnvelope, getStatus, remind, createFromTemplate, listEnvelopes, sendDraftEnvelope, getEnvelopeById };