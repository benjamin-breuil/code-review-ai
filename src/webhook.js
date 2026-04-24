const crypto = require("crypto");
const { analyzePR } = require("./analyzer");

/**
 * Vérifie que la requête vient bien de GitHub via la signature HMAC.
 */
function verifySignature(req) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const signature = req.headers["x-hub-signature-256"];

  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(req.rawBody);
  const expected = "sha256=" + hmac.digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

/**
 * Handler principal du webhook GitHub.
 */
async function handleWebhook(req, res) {
  // 1. Vérification de la signature
  if (!verifySignature(req)) {
    console.warn("⚠️  Signature invalide — requête rejetée");
    return res.status(401).json({ error: "Signature invalide" });
  }

  const event = req.headers["x-github-event"];
  const payload = req.body;

  // 2. On ne traite que les événements pull_request opened ou synchronize
  if (event !== "pull_request") {
    return res.status(200).json({ message: `Événement ignoré : ${event}` });
  }

  const action = payload.action;
  if (action !== "opened" && action !== "synchronize") {
    return res.status(200).json({ message: `Action ignorée : ${action}` });
  }

  const pr = payload.pull_request;
  const repo = payload.repository;

  console.log(`\n📥 Nouvelle PR détectée : #${pr.number} — "${pr.title}"`);
  console.log(`   Repo : ${repo.full_name}`);
  console.log(`   Auteur : ${pr.user.login}`);

  // 3. Réponse immédiate à GitHub (obligatoire < 10s)
  res.status(200).json({ message: "Analyse en cours..." });

  // 4. Analyse asynchrone
  try {
    await analyzePR({
      owner: repo.owner.login,
      repo: repo.name,
      prNumber: pr.number,
      prTitle: pr.title,
      commitSha: pr.head.sha,
    });
  } catch (err) {
    console.error("❌ Erreur pendant l'analyse :", err.message);
  }
}

module.exports = { handleWebhook };
