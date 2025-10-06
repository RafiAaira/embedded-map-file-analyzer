// Base colors for section types
const SECTION_BASE_COLORS: Record<string, string[]> = {
  // Flash sections - Purple variations
  '.text': ['#9b59b6', '#8e44ad', '#7d3c98', '#6c3483', '#5b2c6f'],
  '.rodata': ['#c0392b', '#e74c3c', '#ec7063', '#f1948a', '#f5b7b1'],
  '.init': ['#2980b9', '#3498db', '#5dade2', '#85c1e2', '#aed6f1'],
  '.fini': ['#16a085', '#1abc9c', '#48c9b0', '#76d7c4', '#a3e4d7'],

  // Data sections - Teal variations
  '.data': ['#00cec9', '#00b894', '#0abab5', '#00a896', '#009688'],
  '.sdata': ['#55efc4', '#4ecdc4', '#45b7af', '#3ca39a', '#338f85'],

  // BSS sections - Orange/Amber variations
  '.bss': ['#fdcb6e', '#f39c12', '#e67e22', '#d68910', '#c87404'],
  '.heap': ['#e17055', '#e74c3c', '#ec7063', '#e84118', '#c23616'],
  '.stack': ['#d63031', '#c0392b', '#a93226', '#922b21', '#7b241c'],

  // ARM specific - Pink variations
  '.ARM': ['#fd79a8', '#e84393', '#d63095', '#c81e8f', '#b10c89'],
};

// Fallback distinct colors
const FALLBACK_COLORS = [
  '#9b59b6', '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
  '#1abc9c', '#e67e22', '#9d3c72', '#16a085', '#d35400',
  '#8e44ad', '#2980b9', '#c0392b', '#27ae60', '#d68910',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getSectionColor(sectionName: string): string {
  // Extract parent section (e.g., .text from .text.main)
  const parts = sectionName.split('.');
  const parentSection = parts.length > 2 ? parts.slice(0, 2).join('.') : sectionName;

  // Check if we have a color palette for this parent section
  if (SECTION_BASE_COLORS[parentSection]) {
    const palette = SECTION_BASE_COLORS[parentSection];
    // Use hash of full section name to pick consistent color from palette
    const index = hashString(sectionName) % palette.length;
    return palette[index];
  }

  // For sections without a base palette, use fallback colors
  const index = hashString(sectionName) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[index];
}

// Generate a color palette for multiple sections
export function generateColorPalette(sections: string[]): string[] {
  return sections.map(section => getSectionColor(section));
}

// For pie chart - ensure distinct colors with good contrast
export const PIE_CHART_COLORS = [
  '#9b59b6', '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
  '#1abc9c', '#e67e22', '#9d3c72', '#16a085', '#d35400',
  '#8e44ad', '#2980b9', '#c0392b', '#27ae60', '#d68910',
  '#95a5a6', // Gray for "Other"
];
