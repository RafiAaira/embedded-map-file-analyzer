/**
 * Build Comparison Utilities
 * Compares two map file analysis results and computes detailed diffs
 */

/**
 * Compare two analysis results and compute detailed diff
 * @param {Object} analysisA - First analysis result
 * @param {Object} analysisB - Second analysis result
 * @param {Object} options - Comparison options
 * @returns {Object} Comparison result with sections, file groups, anomalies
 */
function compareAnalyses(analysisA, analysisB, options = {}) {
  const {
    topN = 20,
    anomalyThresholdPct = 20,
    anomalyThresholdBytes = 1024,
    includeUnchanged = false,
  } = options;

  // Create section lookup maps
  const sectionsA = new Map(analysisA.sections.map(s => [s.name, s]));
  const sectionsB = new Map(analysisB.sections.map(s => [s.name, s]));

  // Get all unique section names
  const allSectionNames = new Set([...sectionsA.keys(), ...sectionsB.keys()]);

  // Compute section-level diffs
  const sectionDiffs = [];
  for (const name of allSectionNames) {
    const secA = sectionsA.get(name);
    const secB = sectionsB.get(name);

    const sizeA = secA ? secA.size : 0;
    const sizeB = secB ? secB.size : 0;
    const delta = sizeB - sizeA;
    const deltaPct = sizeA > 0 ? ((delta / sizeA) * 100) : (sizeB > 0 ? 100 : 0);

    // Skip unchanged sections if not requested
    if (!includeUnchanged && delta === 0) {
      continue;
    }

    sectionDiffs.push({
      name,
      file: secB?.filePath || secA?.filePath || null,
      addressA: secA?.address || null,
      addressB: secB?.address || null,
      sizeA,
      sizeB,
      delta,
      deltaPct: parseFloat(deltaPct.toFixed(2)),
      status: sizeA === 0 ? 'added' : sizeB === 0 ? 'removed' : 'modified',
    });
  }

  // Compute file/object-level diffs
  const fileGroups = computeFileGroups(sectionDiffs);

  // Compute summary
  const totalFlashA = analysisA.sections
    .filter(s => s.name.startsWith('.text') || s.name.startsWith('.rodata'))
    .reduce((sum, s) => sum + s.size, 0);

  const totalFlashB = analysisB.sections
    .filter(s => s.name.startsWith('.text') || s.name.startsWith('.rodata'))
    .reduce((sum, s) => sum + s.size, 0);

  const totalRamA = analysisA.sections
    .filter(s => s.name.startsWith('.data') || s.name.startsWith('.bss'))
    .reduce((sum, s) => sum + s.size, 0);

  const totalRamB = analysisB.sections
    .filter(s => s.name.startsWith('.data') || s.name.startsWith('.bss'))
    .reduce((sum, s) => sum + s.size, 0);

  const flashDelta = totalFlashB - totalFlashA;
  const ramDelta = totalRamB - totalRamA;

  const summary = {
    totalFlashA,
    totalFlashB,
    totalRamA,
    totalRamB,
    flashDelta,
    flashDeltaPct: totalFlashA > 0 ? parseFloat(((flashDelta / totalFlashA) * 100).toFixed(2)) : 0,
    ramDelta,
    ramDeltaPct: totalRamA > 0 ? parseFloat(((ramDelta / totalRamA) * 100).toFixed(2)) : 0,
    totalSectionsA: analysisA.sections.length,
    totalSectionsB: analysisB.sections.length,
    sectionsAdded: sectionDiffs.filter(s => s.status === 'added').length,
    sectionsRemoved: sectionDiffs.filter(s => s.status === 'removed').length,
    sectionsModified: sectionDiffs.filter(s => s.status === 'modified').length,
  };

  // Sort by delta (descending for increases, ascending for decreases)
  const sortedByDelta = [...sectionDiffs].sort((a, b) => b.delta - a.delta);

  const topIncreases = sortedByDelta
    .filter(s => s.delta > 0)
    .slice(0, topN);

  const topDecreases = sortedByDelta
    .filter(s => s.delta < 0)
    .reverse()
    .slice(0, topN);

  // Detect anomalies
  const anomalies = detectAnomalies(
    sectionDiffs,
    fileGroups,
    anomalyThresholdPct,
    anomalyThresholdBytes
  );

  return {
    summary,
    sections: sectionDiffs.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
    fileGroups,
    topIncreases,
    topDecreases,
    anomalies,
    metadata: {
      comparedAt: new Date().toISOString(),
      optionsUsed: options,
    },
  };
}

/**
 * Group sections by object file and compute totals
 */
function computeFileGroups(sectionDiffs) {
  const fileMap = new Map();

  for (const section of sectionDiffs) {
    const fileName = section.file || 'unknown';

    if (!fileMap.has(fileName)) {
      fileMap.set(fileName, {
        file: fileName,
        sizeA: 0,
        sizeB: 0,
        delta: 0,
        deltaPct: 0,
        sectionCount: 0,
        sections: [],
      });
    }

    const group = fileMap.get(fileName);
    group.sizeA += section.sizeA;
    group.sizeB += section.sizeB;
    group.delta += section.delta;
    group.sectionCount++;
    group.sections.push(section.name);
  }

  // Compute percentages
  const fileGroups = Array.from(fileMap.values()).map(group => ({
    ...group,
    deltaPct: group.sizeA > 0
      ? parseFloat(((group.delta / group.sizeA) * 100).toFixed(2))
      : (group.sizeB > 0 ? 100 : 0),
  }));

  return fileGroups.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

/**
 * Detect anomalies in the comparison
 */
function detectAnomalies(sectionDiffs, fileGroups, thresholdPct, thresholdBytes) {
  const anomalies = [];

  // Check individual sections for large changes
  for (const section of sectionDiffs) {
    const reasons = [];

    // Large percentage change
    if (Math.abs(section.deltaPct) > thresholdPct) {
      reasons.push(`${Math.abs(section.deltaPct).toFixed(1)}% change exceeds threshold`);
    }

    // Large absolute change
    if (Math.abs(section.delta) > thresholdBytes) {
      reasons.push(`${Math.abs(section.delta)} bytes change exceeds threshold`);
    }

    // New large section
    if (section.status === 'added' && section.sizeB > thresholdBytes * 2) {
      reasons.push(`New section with ${section.sizeB} bytes`);
    }

    // Removed large section
    if (section.status === 'removed' && section.sizeA > thresholdBytes * 2) {
      reasons.push(`Removed section had ${section.sizeA} bytes`);
    }

    if (reasons.length > 0) {
      anomalies.push({
        type: 'section',
        name: section.name,
        file: section.file,
        severity: Math.abs(section.delta) > thresholdBytes * 10 ? 'high' : 'medium',
        reasons,
        delta: section.delta,
        deltaPct: section.deltaPct,
      });
    }
  }

  // Check file groups for suspicious patterns
  for (const group of fileGroups) {
    const reasons = [];

    // Many small increases in same file (potential memory leak pattern)
    const smallIncreases = sectionDiffs.filter(
      s => s.file === group.file && s.delta > 0 && s.delta < thresholdBytes
    );

    if (smallIncreases.length > 5) {
      reasons.push(`${smallIncreases.length} small increases detected (potential fragmentation)`);
    }

    // Large file-level change
    if (Math.abs(group.delta) > thresholdBytes * 5) {
      reasons.push(`Total file change of ${group.delta} bytes`);
    }

    if (reasons.length > 0) {
      anomalies.push({
        type: 'file',
        name: group.file,
        severity: Math.abs(group.delta) > thresholdBytes * 20 ? 'high' : 'low',
        reasons,
        delta: group.delta,
        deltaPct: group.deltaPct,
        affectedSections: group.sectionCount,
      });
    }
  }

  // Check for suspicious .bss growth (potential uninitialized data issue)
  const bssSections = sectionDiffs.filter(s => s.name.startsWith('.bss'));
  const totalBssDelta = bssSections.reduce((sum, s) => sum + s.delta, 0);

  if (totalBssDelta > thresholdBytes * 5) {
    anomalies.push({
      type: 'pattern',
      name: '.bss sections',
      severity: 'medium',
      reasons: [`Significant .bss growth of ${totalBssDelta} bytes (check uninitialized globals)`],
      delta: totalBssDelta,
      affectedSections: bssSections.filter(s => s.delta > 0).length,
    });
  }

  // Sort by severity and delta
  return anomalies.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return Math.abs(b.delta) - Math.abs(a.delta);
  });
}

module.exports = {
  compareAnalyses,
  computeFileGroups,
  detectAnomalies,
};
