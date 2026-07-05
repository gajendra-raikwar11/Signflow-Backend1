const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const { createEnvelope, getStatus, remind, createFromTemplate, listEnvelopes, sendDraftEnvelope, getEnvelopeById } = require("../controllers/envelope.controller");

router.post("/", authMiddleware, requireRole("admin", "sender"), createEnvelope);
router.get("/:id/status", authMiddleware, getStatus);
router.post("/:id/remind", authMiddleware, requireRole("admin", "sender"), remind);
router.post("/from-template/:templateId", authMiddleware, requireRole("admin", "sender"), createFromTemplate);
router.get("/", authMiddleware, listEnvelopes);
router.patch("/:id/send", authMiddleware, requireRole("admin", "sender"), sendDraftEnvelope);
router.get("/:id", authMiddleware, getEnvelopeById);

module.exports = router;
