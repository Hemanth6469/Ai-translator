// Transliteration / Romanization utility for non-Latin scripts (Greek, Cyrillic, etc.)

const greekMap = {
  'α': 'a', 'ά': 'á', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'έ': 'é',
  'ζ': 'z', 'η': 'i', 'ή': 'í', 'θ': 'th', 'ι': 'i', 'ί': 'í', 'ϊ': 'i', 'ΐ': 'í',
  'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'ό': 'ó',
  'π': 'p', 'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'ύ': 'ý', 'ϋ': 'y', 'ΰ': 'ý',
  'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o', 'ώ': 'ó',
  'Α': 'A', 'Ά': 'Á', 'Β': 'V', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Έ': 'É',
  'Ζ': 'Z', 'Η': 'I', 'Ή': 'Í', 'Θ': 'Th', 'Ι': 'I', 'Ί': 'Í', 'Ϊ': 'I',
  'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'Ν': 'N', 'Ξ': 'X', 'Ο': 'O', 'Ό': 'Ó',
  'Π': 'P', 'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y', 'Ύ': 'Ý', 'Ϋ': 'Y',
  'Φ': 'F', 'Χ': 'Ch', 'Ψ': 'Ps', 'Ω': 'O', 'Ώ': 'Ó'
};

const cyrillicMap = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
  'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
  'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
  'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Δ': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
  'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
  'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
  'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
};

export function getTransliteration(text, targetLang) {
  if (!text || typeof text !== 'string') return null;

  // Greek
  if (targetLang === 'el') {
    let result = '';
    for (let char of text) {
      result += greekMap[char] !== undefined ? greekMap[char] : char;
    }
    return result !== text ? result : null;
  }

  // Russian / Ukrainian / Bulgarian (Cyrillic)
  if (['ru', 'uk', 'bg', 'be', 'mk', 'sr'].includes(targetLang)) {
    let result = '';
    for (let char of text) {
      result += cyrillicMap[char] !== undefined ? cyrillicMap[char] : char;
    }
    return result !== text ? result : null;
  }

  return null;
}
