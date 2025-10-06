/**
 * Memory Diff Utility - Advanced comparison with anomaly detection
 */

/**
 * Align and compare two map file analyses
 * @param {Object} analysisV1 - First analysis (baseline)
 * @param {Object} analysisV2 - Second analysis (new version)
 * @param {Object} options - Comparison options
 * @returns {Object} Detailed diff with anomalies
 */
function computeMemoryDiff(analysisV1, analysisV2, options = {}) {
  const {
    anomalyGrowthThreshold = 10, // % growth threshold
    anomalyShrinkThreshold = 10, // % shrink threshold
    addressShiftThreshold = 0x1000, // 4KB address shift threshold
  } = options;

  // Create lookup maps for alignment
  const sectionsV1 = new Map();
  const sectionsV2 = new Map();

  analysisV1.sections.forEach(s => {
    const key = `${s.name}:${s.filePath || ''}`;
    sectionsV1.set(key, s);
  });

  analysisV2.sections.forEach(s => {
    const key = `${s.name}:${s.filePath || ''}`;
    sectionsV2.set(key, s);
  });

  // Get all unique section keys
  const allKeys = new Set([...sectionsV1.keys(), ...sectionsV2.keys()]);

  const diffResults = [];
  const anomalies = [];

  for (const key of allKeys) {
    const v1 = sectionsV1.get(key);
    const v2 = sectionsV2.get(key);

    const [name, filePath] = key.split(':');

    let status = 'same';
    let sizeV1 = v1 ? v1.size : 0;
    let sizeV2 = v2 ? v2.size : 0;
    let sizeDiff = sizeV2 - sizeV1;
    let sizeDiffPct = sizeV1 > 0 ? ((sizeDiff / sizeV1) * 100) : (sizeV2 > 0 ? 100 : 0);

    // Determine status
    if (!v1 && v2) {
      status = 'added';
    } else if (v1 && !v2) {
      status = 'removed';
    } else if (sizeDiff > 0) {
      status = 'growth';
    } else if (sizeDiff < 0) {
      status = 'shrink';
    } else {
      status = 'same';
    }

    // Address diff
    const addrV1 = v1?.address || null;
    const addrV2 = v2?.address || null;
    let addressDiff = null;
    let addressShifted = false;

    if (addrV1 && addrV2) {
      const addr1Num = parseInt(addrV1, 16);
      const addr2Num = parseInt(addrV2, 16);
      addressDiff = addr2Num - addr1Num;
      addressShifted = Math.abs(addressDiff) > addressShiftThreshold;
    }

    const diffEntry = {
      name,
      filePath: filePath || null,
      sizeV1,
      sizeV2,
      sizeDiff,
      sizeDiffPct: parseFloat(sizeDiffPct.toFixed(2)),
      addressV1: addrV1,
      addressV2: addrV2,
      addressDiff,
      addressShifted,
      status,
      region: determineRegion(name),
    };

    diffResults.push(diffEntry);

    // Detect anomalies
    const anomalyReasons = [];

    if (status === 'added' && sizeV2 > 1024) {
      anomalyReasons.push(`New section with ${formatBytes(sizeV2)}`);
    }

    if (status === 'removed' && sizeV1 > 1024) {
      anomalyReasons.push(`Removed section had ${formatBytes(sizeV1)}`);
    }

    if (status === 'growth' && sizeDiffPct > anomalyGrowthThreshold) {
      anomalyReasons.push(`Grew by ${sizeDiffPct.toFixed(1)}% (${formatBytes(sizeDiff)})`);
    }

    if (status === 'shrink' && Math.abs(sizeDiffPct) > anomalyShrinkThreshold) {
      anomalyReasons.push(`Shrunk by ${Math.abs(sizeDiffPct).toFixed(1)}% (${formatBytes(Math.abs(sizeDiff))})`);
    }

    if (addressShifted) {
      anomalyReasons.push(`Address shifted by ${formatBytes(Math.abs(addressDiff))}`);
    }

    if (anomalyReasons.length > 0) {
      anomalies.push({
        ...diffEntry,
        reasons: anomalyReasons,
        severity: determineSeverity(status, sizeDiffPct, Math.abs(sizeDiff)),
      });
    }
  }

  // Compute summary statistics
  const summary = {
    totalSectionsV1: analysisV1.sections.length,
    totalSectionsV2: analysisV2.sections.length,
    sectionsAdded: diffResults.filter(d => d.status === 'added').length,
    sectionsRemoved: diffResults.filter(d => d.status === 'removed').length,
    sectionsGrowth: diffResults.filter(d => d.status === 'growth').length,
    sectionsShrink: diffResults.filter(d => d.status === 'shrink').length,
    sectionsUnchanged: diffResults.filter(d => d.status === 'same').length,
    totalSizeV1: analysisV1.sections.reduce((sum, s) => sum + s.size, 0),
    totalSizeV2: analysisV2.sections.reduce((sum, s) => sum + s.size, 0),
    totalSizeDiff: 0,
    anomalyCount: anomalies.length,
  };

  summary.totalSizeDiff = summary.totalSizeV2 - summary.totalSizeV1;
  summary.totalSizeDiffPct = summary.totalSizeV1 > 0
    ? parseFloat(((summary.totalSizeDiff / summary.totalSizeV1) * 100).toFixed(2))
    : 0;

  return {
    summary,
    diff: diffResults.sort((a, b) => Math.abs(b.sizeDiff) - Math.abs(a.sizeDiff)),
    anomalies: anomalies.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    }),
    metadata: {
      comparedAt: new Date().toISOString(),
      options,
    },
  };
}

/**
 * Determine memory region from section name
 */
function determineRegion(sectionName) {
  if (sectionName.startsWith('.text') || sectionName.startsWith('.rodata')) {
    return 'FLASH';
  }
  if (sectionName.startsWith('.data') || sectionName.startsWith('.bss')) {
    return 'RAM';
  }
  return 'OTHER';
}

/**
 * Determine anomaly severity
 */
function determineSeverity(status, sizeDiffPct, sizeDiffAbs) {
  if (status === 'added' || status === 'removed') {
    return sizeDiffAbs > 10240 ? 'critical' : 'high';
  }

  if (Math.abs(sizeDiffPct) > 50) {
    return 'critical';
  }
  if (Math.abs(sizeDiffPct) > 25) {
    return 'high';
  }
  if (Math.abs(sizeDiffPct) > 10) {
    return 'medium';
  }
  return 'low';
}

/**
 * Format bytes to human-readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

module.exports = {
  computeMemoryDiff,
  determineRegion,
  determineSeverity,
};
