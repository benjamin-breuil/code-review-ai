# CodeReview AI — PoC
### Module 245 — Benjamin Breuil — DEVA4A i245

Assistant IA qui analyse automatiquement les Pull Requests GitHub pour détecter bugs et code smells, et publie des commentaires inline directement sur les lignes problématiques.

---

## Comment ça marche

```
PR ouverte sur GitHub
       ↓
Webhook envoyé à ton serveur
       ↓
Récupération du diff via l'API GitHub
       ↓
Analyse de chaque fichier par GPT-4o-mini
       ↓
Publication de commentaires inline sur les lignes
       ↓
Commentaire de résumé global sur la PR
```

---

## Prérequis

- Node.js 18+ installé
- Un compte OpenAI avec une clé API (https://platform.openai.com/api-keys)
- Un compte GitHub avec un token personnel
- **ngrok** pour exposer ton serveur local (voir étape 4)

---

## Installation

### 1. Clone et installe les dépendances

```bash
git clone https://github.com/TON_USERNAME/code-review-ai.git
cd code-review-ai
npm install
```

### 2. Configure les variables d'environnement

```bash
cp .env.example .env
```

Ouvre le fichier `.env` et remplis :

```env
OPENAI_API_KEY=sk-...         # Ta clé OpenAI
GITHUB_TOKEN=ghp_...          # Ton token GitHub
GITHUB_WEBHOOK_SECRET=...     # Un mot de passe que TU choisis (ex: "monSecret2024!")
PORT=3000
```

**Créer le token GitHub :**
1. Va sur https://github.com/settings/tokens
2. Clique "Generate new token (classic)"
3. Coche les droits : `repo` (tout cocher)
4. Copie le token dans `.env`

### 3. Lance le serveur

```bash
npm run dev
```

Tu dois voir :
```
🚀 Serveur démarré sur http://localhost:3000
📡 Webhook endpoint : http://localhost:3000/webhook
```

### 4. Expose ton serveur avec ngrok

Dans un **nouveau terminal** :

```bash
# Si tu n'as pas ngrok, installe-le : https://ngrok.com/download
ngrok http 3000
```

Tu obtiens une URL publique du style :
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copie cette URL** (ex: `https://abc123.ngrok-free.app`), tu en as besoin à l'étape suivante.

### 5. Configure le Webhook GitHub

1. Va dans ton repo GitHub → **Settings** → **Webhooks** → **Add webhook**
2. Remplis :
   - **Payload URL** : `https://abc123.ngrok-free.app/webhook`
   - **Content type** : `application/json`
   - **Secret** : le même que `GITHUB_WEBHOOK_SECRET` dans ton `.env`
   - **Events** : sélectionne "Let me select individual events" → coche **Pull requests**
3. Clique **Add webhook**

---

## Test

1. Ouvre une Pull Request sur ton repo
2. Regarde les logs dans ton terminal — tu verras l'analyse en direct
3. Les commentaires apparaissent directement sur les lignes de code dans la PR

---

## Structure du projet

```
code-review-ai/
├── src/
│   ├── index.js       # Serveur Express, point d'entrée
│   ├── webhook.js     # Réception et vérification du webhook GitHub
│   ├── analyzer.js    # Orchestration de l'analyse complète
│   ├── github.js      # Client API GitHub (récupération diff + publication commentaires)
│   ├── openai.js      # Appels à GPT-4o-mini pour l'analyse du code
│   └── formatter.js   # Formatage des commentaires en Markdown
├── .env.example       # Template des variables d'environnement
├── .gitignore
├── package.json
└── README.md
```

---

## Critères de succès PoC

| Critère | Objectif | Statut |
|---|---|---|
| Détection bugs évidents | ≥ 70% | À mesurer |
| Faux positifs | ≤ 30% | Température 0.1 pour limiter |
| Temps d'analyse | ≤ 2 min | ~30-90s selon taille |
| Intégration GitHub | Fonctionnelle | ✅ |

---

## Dépannage

**Le webhook n'arrive pas :**
- Vérifie que ngrok est bien démarré
- Vérifie l'URL dans les settings GitHub (elle change à chaque redémarrage de ngrok)
- Dans GitHub → Settings → Webhooks → clique sur ton webhook → "Recent Deliveries" pour voir les erreurs

**Erreur 401 :**
- Le `GITHUB_WEBHOOK_SECRET` dans `.env` ne correspond pas à celui configuré sur GitHub

**Pas de commentaires postés :**
- Vérifie que `GITHUB_TOKEN` a bien les droits `repo`
- Regarde les logs dans le terminal pour les erreurs

**Erreur OpenAI :**
- Vérifie que ta clé `OPENAI_API_KEY` est valide et que tu as du crédit

---

## Technologies utilisées

- **Node.js + Express** — Serveur webhook
- **OpenAI GPT-4o-mini** — Analyse du code (rapide et peu coûteux)
- **API GitHub REST** — Récupération des diffs et publication des commentaires
- **ngrok** — Tunnel pour exposer le serveur en local
# code-review-ai
