/**
 * Script : generate-summary.js
 * Objectif : générer un rapport Markdown clair à partir des résultats de scan
 * Auteur : Hugo Piedanna (Chariot)
 */

import fs from "fs";
import path from "path";

// === CONFIGURATION ===
const reportsDir = path.resolve("security/reports");
const outputPath = path.join(reportsDir, "summary.md");
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

// === INFOS GITHUB ===
const repo = process.env.GITHUB_REPOSITORY || "local";
const sha = (process.env.GITHUB_SHA || "").slice(0, 7);
const actor = process.env.GITHUB_ACTOR || "unknown";
const branch = process.env.GITHUB_REF_NAME || "unknown";
const runId = process.env.GITHUB_RUN_ID || "";
const serverUrl = process.env.GITHUB_SERVER_URL || "https://github.com";

// === VARIABLES DE SORTIE ===
let summary = `# 🔒 Rapport de Sécurité

**Date :** ${new Date().toISOString()}  
**Branch :** \`${branch}\`  
**Commit :** [\`${sha}\`](${serverUrl}/${repo}/commit/${sha})  
**Auteur :** @${actor}

`;

// === TABLEAU GLOBAL DES ÉTATS ===
const statuses = {
    dependencies: process.env.HAS_CRITICAL_DEP === "true" ? "⚠️" : "✅",
    docker: process.env.HAS_CRITICAL_DOCKER === "true" ? "⚠️" : "✅",
    secrets: process.env.HAS_SECRETS === "true" ? "⚠️" : "✅",
    sast: process.env.SAST_STATUS === "failure" ? "⚠️" : "✅",
};

const globalStatus =
    statuses.dependencies === "⚠️" ||
        statuses.docker === "⚠️" ||
        statuses.secrets === "⚠️" ||
        statuses.sast === "⚠️"
        ? "critical"
        : "success";

summary += `## 📊 Résultats des Scans

| Type de Scan | Frontend | Backend | Statut Global |
|--------------|----------|---------|---------------|
| 📦 Dépendances | ${statuses.dependencies} | ${statuses.dependencies} | ${statuses.dependencies === "⚠️" ? "failure" : "success"} |
| 🔍 SAST (Code) | ${statuses.sast} | ${statuses.sast} | ${statuses.sast === "⚠️" ? "failure" : "success"} |
| 🐳 Docker | ${statuses.docker} | ${statuses.docker} | ${statuses.docker === "⚠️" ? "failure" : "success"} |
| 🔑 Secrets | - | - | ${statuses.secrets} |

## 🎯 Niveau de sévérité : **${globalStatus.toUpperCase()}**

`;

if (globalStatus === "critical") {
    summary += `## ⚠️ Actions Requises

- 🚨 Des vulnérabilités **CRITIQUES** ont été détectées.
- 📧 Une notification email a été envoyée.
- 🔒 Correction **urgente** requise avant tout merge.

`;
}

// === DÉTAIL DES VULNÉRABILITÉS ===
summary += `## 📝 Détail des vulnérabilités CRITIQUES détectées\n\n`;

let foundCritical = false;

for (const file of fs.readdirSync(reportsDir)) {
    if (file.startsWith("trivy-") && file.endsWith(".json")) {
        const json = JSON.parse(fs.readFileSync(path.join(reportsDir, file), "utf8"));
        const criticals = [];

        for (const result of json.Results || []) {
            for (const vuln of result.Vulnerabilities || []) {
                if (vuln.Severity === "CRITICAL") {
                    criticals.push({
                        pkg: vuln.PkgName || "N/A",
                        version: vuln.InstalledVersion || "N/A",
                        cve: vuln.VulnerabilityID || "N/A",
                        link: vuln.PrimaryURL || "N/A",
                    });
                }
            }
        }

        if (criticals.length > 0) {
            foundCritical = true;
            summary += `### 🧩 ${file.replace(".json", "")}\n`;
            summary += `| Package | Version | CVE | Lien |\n`;
            summary += `|----------|----------|------|------|\n`;
            for (const c of criticals) {
                const link = c.link && c.link !== "N/A" ? `[${c.cve}](${c.link})` : c.cve;
                summary += `| ${c.pkg} | ${c.version} | ${link} | ${c.link} |\n`;
            }
            summary += "\n";
        }
    }
}

if (!foundCritical) {
    summary += `_Aucune vulnérabilité critique détectée._\n`;
}

summary += `
---

**[📊 Voir les détails complets](${serverUrl}/${repo}/actions/runs/${runId})**  
**[🔒 GitHub Security](${serverUrl}/${repo}/security)**
`;

fs.writeFileSync(outputPath, summary, "utf8");
console.log("✅ Rapport de sécurité généré :", outputPath);