/**
 * Utility to find Gmail labels with flexible matching
 * Handles case-insensitive matching and space/hyphen variations
 */

function findLabelFlexible(labels, searchTerm) {
  if (!searchTerm || !labels || !Array.isArray(labels)) {
    return null;
  }

  // Try exact match first (by ID or name)
  let match = labels.find(l => l.id === searchTerm || l.name === searchTerm);
  if (match) return match;

  // Normalize the search term
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  // Try case-insensitive match
  match = labels.find(l => l.name.toLowerCase() === normalizedSearch);
  if (match) return match;

  // Try with space/hyphen variations
  const searchWithSpaces = normalizedSearch.replace(/-/g, ' ');
  const searchWithHyphens = normalizedSearch.replace(/\s+/g, '-');
  
  match = labels.find(l => {
    const labelLower = l.name.toLowerCase();
    return labelLower === searchWithSpaces || 
           labelLower === searchWithHyphens ||
           labelLower.replace(/-/g, ' ') === searchWithSpaces ||
           labelLower.replace(/\s+/g, '-') === searchWithHyphens;
  });
  
  if (match) return match;

  // Try partial match as last resort
  match = labels.find(l => 
    l.name.toLowerCase().includes(normalizedSearch) ||
    normalizedSearch.includes(l.name.toLowerCase())
  );
  
  return match || null;
}

module.exports = { findLabelFlexible };