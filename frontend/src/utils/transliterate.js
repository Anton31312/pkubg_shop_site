/**
 * Utility functions for text transliteration and slug generation
 */

/**
 * Transliterate Cyrillic text to Latin characters
 * @param {string} text - Text to transliterate
 * @returns {string} - Transliterated text
 */
export const transliterate = (text) => {
  const cyrillicToLatin = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };
  
  return text.split('').map(char => cyrillicToLatin[char] || char).join('');
};

/**
 * Generate URL-friendly slug from text
 * @param {string} text - Text to convert to slug
 * @param {number} maxLength - Maximum length of slug (default: 50)
 * @returns {string} - Generated slug
 */
export const generateSlug = (text, maxLength = 50) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return transliterate(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '')      // Remove leading and trailing hyphens
    .substring(0, maxLength);     // Limit to maxLength characters
};

/**
 * Validate slug format
 * @param {string} slug - Slug to validate
 * @returns {boolean} - Whether slug is valid
 */
export const isValidSlug = (slug) => {
  if (!slug || typeof slug !== 'string') {
    return false;
  }
  
  // Slug should only contain lowercase letters, numbers, and hyphens
  // Should not start or end with hyphen
  const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return slugPattern.test(slug);
};

/**
 * Clean and format slug input
 * @param {string} slug - Raw slug input
 * @returns {string} - Cleaned slug
 */
export const cleanSlug = (slug) => {
  if (!slug || typeof slug !== 'string') {
    return '';
  }
  
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')   // Remove invalid characters
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '');     // Remove leading and trailing hyphens
};

export default {
  transliterate,
  generateSlug,
  isValidSlug,
  cleanSlug
};