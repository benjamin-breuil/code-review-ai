const axios = require("axios");

const github = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  },
});

/**
 * Récupère la liste des fichiers modifiés dans une PR.
 * Retourne un tableau de { filename, patch, status, additions, deletions }
 */
async function getPRFiles(owner, repo, prNumber) {
  const { data } = await github.get(
    `/repos/${owner}/${repo}/pulls/${prNumber}/files`
  );

  // On filtre les fichiers supprimés et les fichiers sans diff (binaires, etc.)
  return data.filter(
    (f) => f.status !== "removed" && f.patch && f.patch.length > 0
  );
}

/**
 * Poste un commentaire inline sur une ligne précise d'un fichier dans la PR.
 * @param {string} body       - Texte du commentaire (markdown)
 * @param {string} path       - Chemin du fichier (ex: src/auth.js)
 * @param {number} position   - Position dans le diff (index de ligne dans le patch)
 * @param {string} commitSha  - SHA du dernier commit de la PR
 */
async function postInlineComment(owner, repo, prNumber, { body, path, position, commitSha }) {
  try {
    await github.post(`/repos/${owner}/${repo}/pulls/${prNumber}/comments`, {
      body,
      path,
      position,
      commit_id: commitSha,
    });
    console.log(`   ✅ Commentaire posté sur ${path} (position ${position})`);
  } catch (err) {
    console.error(
      `   ❌ Échec du commentaire sur ${path}:`,
      err.response?.data?.message || err.message
    );
  }
}

/**
 * Poste un commentaire général (non inline) sur la PR.
 * Utilisé pour le résumé global de l'analyse.
 */
async function postPRComment(owner, repo, prNumber, body) {
  await github.post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
    body,
  });
}

module.exports = { getPRFiles, postInlineComment, postPRComment };
