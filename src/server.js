process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { getAuthenticatedClient } = require("./integrations/docusign/docusignClient");
const envelopeRoutes = require("./routes/envelope.routes");
const authRoutes = require("./routes/auth.routes");
const templateRoutes = require("./routes/template.routes");
const webhookRoutes = require("./routes/webhook.routes");

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://YOUR-VERCEL-URL.vercel.app"
  ],
  credentials: true
}));

// Raw body capture — webhook + express.json dono ke liye
app.use((req, res, next) => {
  let data = "";
  req.on("data", (chunk) => (data += chunk));
  req.on("end", () => {
    req.rawBody = data;
    // Manually parse JSON for non-webhook routes
    if (data && req.headers["content-type"]?.includes("application/json")) {
      try {
        req.body = JSON.parse(data);
      } catch (e) {
        // ignore parse error, express.json will handle it
      }
    }
    next();
  });
});


// Test route
app.get("/api/test/docusign", async (req, res) => {
  try {
    const { accountId, baseUri } = await getAuthenticatedClient();
    res.json({ 
      success: true,
      message: "DocuSign authenticated successfully",
      accountId,
      baseUri,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/envelopes", envelopeRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/webhooks", webhookRoutes);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});