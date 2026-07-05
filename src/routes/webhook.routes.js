const express = require("express");
const router = express.Router();
const { docusignWebhook } = require("../controllers/webhook.controller");

router.post("/docusign", docusignWebhook);

module.exports = router;

