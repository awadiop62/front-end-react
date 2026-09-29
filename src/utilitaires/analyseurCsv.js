/**
 * Analyse et valide un contenu CSV pour la liste électorale.
 * Colonnes obligatoires : nom, prenom, email
 */
export function parseAndValidateCsv(csvText, existingEmails = []) {
  if (!csvText || typeof csvText !== 'string' || !csvText.trim()) {
    return {
      isValid: false,
      errors: ['Le fichier CSV est vide. Veuillez fournir un fichier contenant des données.'],
      warnings: [],
      records: [],
    };
  }

  const errors = [];
  const warnings = [];
  const records = [];
  const seenFileEmails = new Set();
  const normalizedExisting = new Set(existingEmails.map((e) => e.toLowerCase().trim()));

  const rawLines = csvText.split(/\r?\n/);
  const nonEmptyLines = rawLines
    .map((line, idx) => ({ text: line.trim(), lineNumber: idx + 1 }))
    .filter((l) => l.text.length > 0);

  if (nonEmptyLines.length === 0) {
    return {
      isValid: false,
      errors: ['Le fichier ne contient aucune ligne valide.'],
      warnings: [],
      records: [],
    };
  }

  // Déterminer le séparateur (, ou ;)
  const headerLine = nonEmptyLines[0].text;
  const separator = headerLine.includes(';') ? ';' : ',';

  // Parser les colonnes de l'en-tête
  const rawHeaders = headerLine
    .split(separator)
    .map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

  // Vérifier la présence d'en-tête
  const colIndex = {
    nom: rawHeaders.findIndex((h) => h === 'nom' || h === 'last_name' || h === 'lastname'),
    prenom: rawHeaders.findIndex((h) => h === 'prenom' || h === 'prénom' || h === 'first_name' || h === 'firstname'),
    email: rawHeaders.findIndex((h) => h === 'email' || h === 'e-mail' || h === 'mail' || h === 'courriel'),
  };

  let dataStartIndex = 1;
  const hasStandardHeader = colIndex.email !== -1 && colIndex.nom !== -1 && colIndex.prenom !== -1;

  if (!hasStandardHeader) {
    // Si pas d'en-tête explicite, vérifier si la 1ère ligne est déjà une donnée
    if (headerLine.includes('@')) {
      colIndex.nom = 0;
      colIndex.prenom = 1;
      colIndex.email = 2;
      dataStartIndex = 0;
      warnings.push("En-tête manquant : format par défaut appliqué (nom, prenom, email).");
    } else {
      errors.push(
        `En-tête CSV invalide. Les colonnes obligatoires sont : "nom", "prenom", "email". En-tête détecté : [${rawHeaders.join(', ')}]`
      );
      return { isValid: false, errors, warnings, records: [] };
    }
  }

  // Valider chaque ligne de données
  const dataLines = nonEmptyLines.slice(dataStartIndex);
  if (dataLines.length === 0) {
    errors.push('Le fichier contient un en-tête mais aucun étudiant à importer.');
    return { isValid: false, errors, warnings, records: [] };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  for (const { text, lineNumber } of dataLines) {
    const cols = text
      .split(separator)
      .map((c) => c.trim().replace(/^["']|["']$/g, ''));

    if (cols.length < 3) {
      errors.push(
        `Ligne ${lineNumber} mal formée : au moins 3 colonnes attendues (nom, prénom, email), seulement ${cols.length} trouvée(s) : "${text}".`
      );
      continue;
    }

    const nom = colIndex.nom >= 0 ? (cols[colIndex.nom] || '') : (cols[0] || '');
    const prenom = colIndex.prenom >= 0 ? (cols[colIndex.prenom] || '') : (cols[1] || '');
    const email = colIndex.email >= 0 ? (cols[colIndex.email] || '') : (cols[2] || '');

    if (!nom) {
      errors.push(`Ligne ${lineNumber} : Le champ "nom" est obligatoire et ne peut être vide.`);
    }
    if (!prenom) {
      errors.push(`Ligne ${lineNumber} : Le champ "prénom" est obligatoire et ne peut être vide.`);
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      errors.push(`Ligne ${lineNumber} : L'adresse e-mail est vide.`);
    } else if (!emailRegex.test(cleanEmail)) {
      errors.push(
        `Ligne ${lineNumber} : Format d'adresse e-mail invalide ("${email}"). Exemple attendu : etudiant@esp.sn`
      );
    } else if (seenFileEmails.has(cleanEmail)) {
      warnings.push(`Ligne ${lineNumber} : Doublon dans le fichier pour l'e-mail "${cleanEmail}" (ignoré).`);
    } else {
      if (normalizedExisting.has(cleanEmail)) {
        warnings.push(`Ligne ${lineNumber} : L'étudiant (${cleanEmail}) est déjà présent dans la whitelist.`);
      }
      seenFileEmails.add(cleanEmail);
      records.push({
        nom,
        prenom,
        email: cleanEmail,
        lineNumber,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    records,
  };
}
