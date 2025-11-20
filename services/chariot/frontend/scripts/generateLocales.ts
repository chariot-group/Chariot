import fs from "fs";
import path from "path";

// Fonction pour générer l'emoji du drapeau à partir du code langue
const generateFlagEmoji = (locale: string): string => {
  const codePoints = locale
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0)); // 127397 est la base Unicode pour les régions
  return String.fromCodePoint(...codePoints);
};

const messagesDir = path.join(process.cwd(), "messages");
const localesFile = path.join(process.cwd(), "src/i18n/locales.generated.ts");

// 📌 Lire les fichiers JSON pour détecter les langues disponibles
const locales = fs
  .readdirSync(messagesDir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => path.basename(file, ".json"));

console.log("📌 Locales détectées :", locales);

// 📌 Mise à jour des fichiers JSON
locales.forEach((locale) => {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!content.LocaleSwitcher || !content.LocaleSwitcher.locale) {
    console.warn(`⚠️ ${locale}.json n'a pas de LocaleSwitcher.locale, il sera ignoré.`);
    return;
  }

  // 📌 Extraire les langues déjà présentes
  const existingLocales = content.LocaleSwitcher.locale;
  const localeRegex = /(\w+)\s*{\s*([^}]+)\s*}/g;
  const managedLocales: Record<string, string> = {};
  let otherLocale = "🏴‍☠️ Unknown"; // Valeur par défaut pour "other"

  let match;
  while ((match = localeRegex.exec(existingLocales)) !== null) {
    if (match[1] === "other") {
      otherLocale = match[2]; // Garder la valeur existante de "other"
    } else {
      managedLocales[match[1]] = match[2]; // Ex: "fr": "🇫🇷 French"
    }
  }

  // 📌 Ajouter uniquement les nouvelles langues détectées
  let hasChanges = false;
  locales.forEach((lang) => {
    if (!managedLocales[lang]) {
      const flagEmoji = generateFlagEmoji(lang); // Génére l'emoji du drapeau
      managedLocales[lang] = `${flagEmoji} ${lang}`; // Ajout de l'emoji et du code
      hasChanges = true;
    }
  });

  // 📌 Générer la nouvelle structure si des changements ont été faits
  if (hasChanges) {
    const newLocaleSwitcher = `{locale, select, ${Object.entries(managedLocales)
      .map(([key, value]) => `${key} {${value}}`)
      .join(" ")} other {${otherLocale}}}`;

    content.LocaleSwitcher.locale = newLocaleSwitcher;

    // 📌 Réécriture du fichier JSON
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf8");
    console.log(`✅ Fichier ${locale}.json mis à jour.`);
  }
});

// 📌 Génération de locales.generated.ts
const localesTsContent = `// 🚀 Fichier généré automatiquement, ne pas modifier manuellement
export const locales = ${JSON.stringify(locales, null, 2)} as const;

export type Locale = typeof locales[number];
`;

fs.writeFileSync(localesFile, localesTsContent, "utf8");
console.log("✅ Fichier locales.generated.ts mis à jour.");

console.log("🚀 Mise à jour terminée !");
