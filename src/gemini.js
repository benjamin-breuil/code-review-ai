const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `Tu es un expert en revue de code. On te donne le diff d'un fichier extrait d'une Pull Request GitHub.

Ton rôle : détecter les problèmes dans les lignes AJOUTÉES (préfixées par +).

Pour chaque problème trouvé, réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "issues": [
    {
      "type": "bug" | "code_smell" | "security" | "performance",
      "severity": "high" | "medium" | "low",
      "line_position": <numéro entier : position dans le diff (ligne du patch, commence à 1)>,
      "title": "<titre court du problème, max 80 chars>",
      "description": "<explication claire du problème>",
      "suggestion": "<code ou conseil concret pour corriger>"
    }
  ]
}

Règles strictes :
- Si aucun problème : réponds { "issues": [] }
- N'invente pas de problèmes. Ne signale que ce qui est clairement problématique.
- Concentre-toi sur : null pointers, injections, erreurs de logique, variables inutilisées, fonctions trop longues, sécurité.
- Ignore les problèmes de style (espaces, nommage de variables).
- line_position = index de la ligne dans le patch (patch complet, commence à 1, compte TOUTES les lignes y compris contexte).
- Réponds UNIQUEMENT avec le JSON, sans texte avant ni après, sans balises markdown.`;

/**
 * Analyse le diff d'un fichier avec Gemini 1.5 Flash (gratuit).
 * Retourne un tableau d'issues.
 */
async function analyzeFileDiff(filename, patch) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
    systemInstruction: SYSTEM_PROMPT,
  });

  const userMessage = `Fichier : ${filename}\n\nDiff :\n\`\`\`\n${patch}\n\`\`\``;

  try {
    const result = await model.generateContent(userMessage);
    const raw = result.response.text();

    // Nettoyage au cas où Gemini ajouterait des backticks malgré responseMimeType
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return parsed.issues || [];
  } catch (err) {
    console.error(`   ⚠️  Erreur Gemini pour ${filename}:`, err.message);
    return [];
  }
}

module.exports = { analyzeFileDiff };
