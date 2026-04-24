const { getPRFiles, postInlineComment, postPRComment } = require("./github");
const { analyzeFileDiff } = require("./gemini");
const { formatInlineComment, formatSummaryComment } = require("./formatter");

// Extensions de fichiers à analyser
const SUPPORTED_EXTENSIONS = [
  ".js", ".ts", ".jsx", ".tsx",
  ".py", ".java", ".go", ".rb",
  ".php", ".cs", ".cpp", ".c",
  ".swift", ".kt", ".rs",
];

// Taille max d'un patch à envoyer à l'API (évite les diffs trop gros = coût + erreurs)
const MAX_PATCH_CHARS = 8000;

/**
 * Point d'entrée : analyse complète d'une PR.
 */
async function analyzePR({ owner, repo, prNumber, prTitle, commitSha }) {
  const startTime = Date.now();
  console.log(`\n🔍 Début de l'analyse de PR #${prNumber}...`);

  // 1. Récupération des fichiers modifiés
  let files;
  try {
    files = await getPRFiles(owner, repo, prNumber);
  } catch (err) {
    console.error("❌ Impossible de récupérer les fichiers :", err.message);
    return;
  }

  // 2. Filtrage sur les extensions supportées
  const filesToAnalyze = files.filter((f) => {
    const ext = "." + f.filename.split(".").pop();
    return SUPPORTED_EXTENSIONS.includes(ext);
  });

  console.log(
    `   ${files.length} fichier(s) modifié(s), ${filesToAnalyze.length} analysé(s)`
  );

  if (filesToAnalyze.length === 0) {
    console.log("   Aucun fichier supporté — analyse annulée.");
    return;
  }

  // 3. Analyse fichier par fichier
  const allResults = [];

  for (const file of filesToAnalyze) {
    console.log(`   📄 Analyse de ${file.filename}...`);

    // Tronquer le patch si trop long
    const patch =
      file.patch.length > MAX_PATCH_CHARS
        ? file.patch.substring(0, MAX_PATCH_CHARS) + "\n... (diff tronqué)"
        : file.patch;

    const issues = await analyzeFileDiff(file.filename, patch);

    if (issues.length > 0) {
      console.log(`      → ${issues.length} problème(s) détecté(s)`);
      allResults.push({ filename: file.filename, issues });
    } else {
      console.log(`      → Aucun problème`);
    }

    // Petite pause pour respecter les rate limits OpenAI
    await sleep(500);
  }

  // 4. Publication des commentaires inline
  let postedCount = 0;
  for (const result of allResults) {
    for (const issue of result.issues) {
      // On ignore les issues sans position valide
      if (!issue.line_position || issue.line_position < 1) continue;

      const body = formatInlineComment(issue);

      await postInlineComment(owner, repo, prNumber, {
        body,
        path: result.filename,
        position: issue.line_position,
        commitSha,
      });

      postedCount++;
      await sleep(300); // Anti rate-limit GitHub
    }
  }

  // 5. Commentaire de résumé global
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const totalIssues = allResults.reduce((acc, r) => acc + r.issues.length, 0);

  const summary = formatSummaryComment({
    prTitle,
    prNumber,
    filesAnalyzed: filesToAnalyze.length,
    totalIssues,
    results: allResults,
    elapsedSeconds: elapsed,
  });

  await postPRComment(owner, repo, prNumber, summary);

  console.log(`\n✅ Analyse terminée en ${elapsed}s`);
  console.log(`   ${totalIssues} problème(s) détecté(s), ${postedCount} commentaire(s) posté(s)\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { analyzePR };
