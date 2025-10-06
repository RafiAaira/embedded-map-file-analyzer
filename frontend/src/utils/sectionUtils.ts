import type { Section } from '../types/index';

export function aggregateSections(sections: Section[]): Section[] {
  const aggregated = new Map<string, Section>();

  sections.forEach(section => {
    // Extract parent section name (e.g., .text from .text.main)
    const parts = section.name.split('.');
    const parentName = parts.length > 2 ? parts.slice(0, 2).join('.') : section.name;

    if (aggregated.has(parentName)) {
      const existing = aggregated.get(parentName)!;
      existing.size += section.size;
      existing.subsections = (existing.subsections || 1) + 1;
    } else {
      aggregated.set(parentName, {
        name: parentName,
        size: section.size,
        subsections: parts.length > 2 ? 1 : undefined,
        filePath: parts.length > 2 ? null : section.filePath,
      });
    }
  });

  return Array.from(aggregated.values())
    .sort((a, b) => b.size - a.size);
}
