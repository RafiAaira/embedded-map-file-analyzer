const fs = require('fs');

/**
 * Parse .map file to extract memory configuration and sections with file paths
 * @param {string} filePath - Path to the .map file
 * @returns {Object} Parsed data with memory regions and detailed sections
 */
function parseMapFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = {
    memory: {},
    sections: []
  };

  // Parse Memory Configuration section
  const memoryRegex = /Memory Configuration\s+([\s\S]*?)(?=\n\n|\nLinker script)/;
  const memoryMatch = content.match(memoryRegex);

  if (memoryMatch) {
    const memorySection = memoryMatch[1];
    // Match lines like: FLASH            0x0000000008000000 0x0000000000100000 xr
    const memoryLineRegex = /^([A-Z_]+)\s+0x([0-9a-fA-F]+)\s+0x([0-9a-fA-F]+)/gm;
    let match;

    while ((match = memoryLineRegex.exec(memorySection)) !== null) {
      const name = match[1];
      const origin = match[2];
      const length = match[3];

      result.memory[name] = {
        origin: '0x' + origin,
        length: '0x' + length,
        lengthBytes: parseInt(length, 16)
      };
    }
  }

  // Parse Linker script and memory map section - PRESERVE ALL SUBSECTIONS
  // Pattern to match: .section_name  0xaddress  0xsize  filepath
  // Example: .text.main    0x00000778    0x00000c00  main.o
  const lines = content.split('\n');
  const sections = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match section lines with address and size
    // Pattern: .section_name   0xaddress   0xsize   [optional_file_path]
    const sectionMatch = line.match(/^\s*(\.[a-zA-Z0-9_\.]+)\s+0x([0-9a-fA-F]+)\s+0x([0-9a-fA-F]+)(?:\s+(.+))?/);

    if (sectionMatch) {
      const name = sectionMatch[1];
      const address = '0x' + sectionMatch[2];
      const sizeHex = sectionMatch[3];
      const size = parseInt(sizeHex, 16);
      let filePath = sectionMatch[4] ? sectionMatch[4].trim() : '';

      // Extract just the filename from path (e.g., "path/to/main.o" -> "main.o")
      if (filePath && filePath.includes('/')) {
        filePath = filePath.split('/').pop();
      }
      if (filePath && filePath.includes('\\')) {
        filePath = filePath.split('\\').pop();
      }

      // Only include non-zero sized sections
      if (size > 0) {
        sections.push({
          name,
          address,
          size,
          filePath: filePath || null
        });
      }
    }
  }

  console.log(`Parsed ${sections.length} sections from map file`);

  // Sort by size descending
  result.sections = sections.sort((a, b) => b.size - a.size);

  return result;
}

/**
 * Aggregate sections by parent name (e.g., all .text.* → .text)
 * @param {Array} sections - Array of detailed sections
 * @returns {Array} Aggregated sections
 */
function aggregateSections(sections) {
  const aggregated = new Map();

  sections.forEach(section => {
    // Extract parent section name (e.g., .text from .text.main)
    const parentName = section.name.split('.').slice(0, 2).join('.');

    if (aggregated.has(parentName)) {
      const existing = aggregated.get(parentName);
      existing.size += section.size;
      existing.subsections = (existing.subsections || 0) + 1;
    } else {
      aggregated.set(parentName, {
        name: parentName,
        size: section.size,
        subsections: 1,
        filePath: null // Aggregated sections don't have a single file
      });
    }
  });

  return Array.from(aggregated.values())
    .sort((a, b) => b.size - a.size);
}

module.exports = { parseMapFile, aggregateSections };
