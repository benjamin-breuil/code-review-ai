/**
 * Icônes et labels selon le type de problème.
 */
const TYPE_META = {
  bug:          { icon: "🐛", label: "Bug" },
  security:     { icon: "🔒", label: "Sécurité" },
  performance:  { icon: "⚡", label: "Performance" },
  code_smell:   { icon: "🧹", label: "Code smell" },
};

const SEVERITY_META = {
  high:   { label: "Haute",   badge: "🔴" },
  medium: { label: "Moyenne", badge: "🟡" },
  low:    { label: "Faible",  badge: "🟢" },
};

/**
 * Formate un commentaire inline GitHub pour un problème donné.
 */
function formatInlineComment(issue) {
  const type = TYPE_META[issue.type] || { icon: "⚠️", label: issue.type };
  const sev  = SEVERITY_META[issue.severity] || { label: issue.severity, badge: "⚪" };

  return [
    `### ${type.icon} ${type.label} — ${issue.title}`,
    ``,
    `**Sévérité :** ${sev.badge} ${sev.label}`,
    ``,
    `**Problème :**`,
    `${issue.description}`,
    ``,
    issue.suggestion
      ? `**Suggestion :**\n\`\`\`\n${issue.suggestion}\n\`\`\``
      : "",
    ``,
    `---`,
    `*🤖 Généré par [CodeReview AI](https://github.com) — Module 245 PoC*`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/**
 * Formate le commentaire de résumé global posté sur la PR.
 */
function formatSummaryComment({ prTitle, prNumber, filesAnalyzed, totalIssues, results, elapsedSeconds }) {
  const bugCount      = countByType(results, "bug");
  const secCount      = countByType(results, "security");
  const perfCount     = countByType(results, "performance");
  const smellCount    = countByType(results, "code_smell");

  const highCount   = countBySeverity(results, "high");
  const medCount    = countBySeverity(results, "medium");
  const lowCount    = countBySeverity(results, "low");

  const statusIcon = totalIssues === 0 ? "✅" : highCount > 0 ? "❌" : "⚠️";
  const statusText = totalIssues === 0
    ? "Aucun problème détecté"
    : highCount > 0
      ? `${highCount} problème(s) critique(s) à corriger`
      : "Problèmes mineurs détectés";

  const lines = [
    `## ${statusIcon} CodeReview AI — Analyse de la PR #${prNumber}`,
    ``,
    `> **${statusText}**`,
    ``,
    `### 📊 Résumé`,
    ``,
    `| Métrique | Valeur |`,
    `|---|---|`,
    `| Fichiers analysés | ${filesAnalyzed} |`,
    `| Problèmes détectés | ${totalIssues} |`,
    `| Temps d'analyse | ${elapsedSeconds}s |`,
    ``,
  ];

  if (totalIssues > 0) {
    lines.push(`### 🗂️ Par type`);
    lines.push(``);
    lines.push(`| Type | Nombre |`);
    lines.push(`|---|---|`);
    if (bugCount)    lines.push(`| 🐛 Bugs | ${bugCount} |`);
    if (secCount)    lines.push(`| 🔒 Sécurité | ${secCount} |`);
    if (perfCount)   lines.push(`| ⚡ Performance | ${perfCount} |`);
    if (smellCount)  lines.push(`| 🧹 Code smells | ${smellCount} |`);
    lines.push(``);

    lines.push(`### 🎯 Par sévérité`);
    lines.push(``);
    lines.push(`| Sévérité | Nombre |`);
    lines.push(`|---|---|`);
    if (highCount)  lines.push(`| 🔴 Haute | ${highCount} |`);
    if (medCount)   lines.push(`| 🟡 Moyenne | ${medCount} |`);
    if (lowCount)   lines.push(`| 🟢 Faible | ${lowCount} |`);
    lines.push(``);

    lines.push(`### 📄 Fichiers concernés`);
    lines.push(``);
    for (const r of results) {
      if (r.issues.length > 0) {
        lines.push(`- \`${r.filename}\` — ${r.issues.length} problème(s)`);
      }
    }
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(`*🤖 Généré automatiquement par **CodeReview AI** — Module 245 PoC · Benjamin Breuil*`);

  return lines.join("\n");
}

function countByType(results, type) {
  return results.reduce(
    (acc, r) => acc + r.issues.filter((i) => i.type === type).length,
    0
  );
}

function countBySeverity(results, severity) {
  return results.reduce(
    (acc, r) => acc + r.issues.filter((i) => i.severity === severity).length,
    0
  );
}

module.exports = { formatInlineComment, formatSummaryComment };
