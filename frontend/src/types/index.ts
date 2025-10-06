export type MemoryRegion = {
  origin: string;
  length: string;
  lengthBytes: number;
}

export type Section = {
  name: string;
  address?: string;
  size: number;
  filePath?: string | null;
  subsections?: number; // For aggregated view
}

export type AnalysisResult = {
  memory: Record<string, MemoryRegion>;
  sections: Section[];
}

export type MemorySummary = {
  totalFlash: number;
  usedFlash: number;
  totalRAM: number;
  usedRAM: number;
  flashUsagePercent: number;
  ramUsagePercent: number;
}

// Comparison types
export type SectionDiff = {
  name: string;
  file: string | null;
  addressA: string | null;
  addressB: string | null;
  sizeA: number;
  sizeB: number;
  delta: number;
  deltaPct: number;
  status: 'added' | 'removed' | 'modified';
}

export type FileGroup = {
  file: string;
  sizeA: number;
  sizeB: number;
  delta: number;
  deltaPct: number;
  sectionCount: number;
  sections: string[];
}

export type Anomaly = {
  type: 'section' | 'file' | 'pattern';
  name: string;
  file?: string;
  severity: 'high' | 'medium' | 'low';
  reasons: string[];
  delta: number;
  deltaPct?: number;
  affectedSections?: number;
}

export type CompareSummary = {
  totalFlashA: number;
  totalFlashB: number;
  totalRamA: number;
  totalRamB: number;
  flashDelta: number;
  flashDeltaPct: number;
  ramDelta: number;
  ramDeltaPct: number;
  totalSectionsA: number;
  totalSectionsB: number;
  sectionsAdded: number;
  sectionsRemoved: number;
  sectionsModified: number;
}

export type CompareResult = {
  compareId?: string;
  summary: CompareSummary;
  sections: SectionDiff[];
  fileGroups: FileGroup[];
  topIncreases: SectionDiff[];
  topDecreases: SectionDiff[];
  anomalies: Anomaly[];
  metadata: {
    comparedAt: string;
    optionsUsed: {
      topN: number;
      anomalyThresholdPct: number;
      anomalyThresholdBytes: number;
      includeUnchanged: boolean;
    };
  };
}

// Enhanced Diff Types
export type DiffEntry = {
  name: string;
  filePath: string | null;
  sizeV1: number;
  sizeV2: number;
  sizeDiff: number;
  sizeDiffPct: number;
  addressV1: string | null;
  addressV2: string | null;
  addressDiff: number | null;
  addressShifted: boolean;
  status: 'added' | 'removed' | 'growth' | 'shrink' | 'same';
  region: 'FLASH' | 'RAM' | 'OTHER';
}

export type DiffAnomaly = DiffEntry & {
  reasons: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export type DiffSummary = {
  totalSectionsV1: number;
  totalSectionsV2: number;
  sectionsAdded: number;
  sectionsRemoved: number;
  sectionsGrowth: number;
  sectionsShrink: number;
  sectionsUnchanged: number;
  totalSizeV1: number;
  totalSizeV2: number;
  totalSizeDiff: number;
  totalSizeDiffPct: number;
  anomalyCount: number;
}

export type DiffResult = {
  diffId?: string;
  summary: DiffSummary;
  diff: DiffEntry[];
  anomalies: DiffAnomaly[];
  metadata: {
    comparedAt: string;
    options: {
      anomalyGrowthThreshold: number;
      anomalyShrinkThreshold: number;
      addressShiftThreshold: number;
    };
  };
}
