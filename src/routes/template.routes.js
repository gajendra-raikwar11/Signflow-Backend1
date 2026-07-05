const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const {
  createTemplate,
  saveEnvelopeAsTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
} = require("../controllers/template.controller");

router.post("/", authMiddleware, requireRole("admin", "sender"), createTemplate);
router.post("/from-envelope/:envelopeId", authMiddleware, requireRole("admin", "sender"), saveEnvelopeAsTemplate);
router.get("/", authMiddleware, listTemplates);
router.get("/:id", authMiddleware, getTemplate);
router.put("/:id", authMiddleware, requireRole("admin", "sender"), updateTemplate);
router.delete("/:id", authMiddleware, requireRole("admin"), deleteTemplate);

module.exports = router;