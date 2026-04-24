require("dotenv").config();
const express = require("express");
const { handleWebhook } = require("./webhook");

const app = express();
const PORT = process.env.PORT || 3000;

// On garde le body brut pour vérifier la signature GitHub
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "CodeReview AI — PoC opérationnel" });
});

app.post("/webhook", handleWebhook);

app.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📡 Webhook endpoint : http://localhost:${PORT}/webhook`);
  console.log(`\nEn attente d'événements GitHub...\n`);
});
