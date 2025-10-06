const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parseMapFile } = require('./parser/parseMapFile');
const { compareAnalyses } = require('./utils/compareAnalysis');
const { storeComparison, getComparison, getStats } = require('./utils/compareStorage');
const { computeMemoryDiff } = require('./utils/memoryDiff');

const app = express();
const PORT = 5000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());

// POST /analyze endpoint
app.post('/analyze', upload.single('mapFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = parseMapFile(req.file.path);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json(result);
  } catch (error) {
    console.error('Error parsing map file:', error);
    res.status(500).json({ error: 'Failed to parse map file', details: error.message });
  }
});

// POST /compare endpoint - Compare two map files
app.post('/compare', upload.fields([
  { name: 'fileA', maxCount: 1 },
  { name: 'fileB', maxCount: 1 }
]), (req, res) => {
  try {
    if (!req.files || !req.files.fileA || !req.files.fileB) {
      return res.status(400).json({ error: 'Both fileA and fileB are required' });
    }

    const fileA = req.files.fileA[0];
    const fileB = req.files.fileB[0];

    // Parse both files
    const analysisA = parseMapFile(fileA.path);
    const analysisB = parseMapFile(fileB.path);

    // Get comparison options from query params
    const options = {
      topN: parseInt(req.query.topN) || 20,
      anomalyThresholdPct: parseFloat(req.query.anomalyThresholdPct) || 20,
      anomalyThresholdBytes: parseInt(req.query.anomalyThresholdBytes) || 1024,
      includeUnchanged: req.query.includeUnchanged === 'true',
    };

    // Compute comparison
    const compareResult = compareAnalyses(analysisA, analysisB, options);

    // Store the result and get an ID
    const compareId = storeComparison(compareResult);

    // Clean up uploaded files
    fs.unlinkSync(fileA.path);
    fs.unlinkSync(fileB.path);

    // Return result with ID
    res.json({
      compareId,
      ...compareResult,
    });
  } catch (error) {
    console.error('Error comparing map files:', error);

    // Clean up files if they exist
    try {
      if (req.files?.fileA?.[0]?.path) fs.unlinkSync(req.files.fileA[0].path);
      if (req.files?.fileB?.[0]?.path) fs.unlinkSync(req.files.fileB[0].path);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    res.status(500).json({
      error: 'Failed to compare map files',
      details: error.message
    });
  }
});

// GET /compare/:id - Retrieve a stored comparison result
app.get('/compare/:id', (req, res) => {
  try {
    const compareId = req.params.id;
    const result = getComparison(compareId);

    if (!result) {
      return res.status(404).json({
        error: 'Comparison not found or expired',
        compareId
      });
    }

    res.json({
      compareId,
      ...result,
    });
  } catch (error) {
    console.error('Error retrieving comparison:', error);
    res.status(500).json({
      error: 'Failed to retrieve comparison',
      details: error.message
    });
  }
});

// GET /compare - Get storage statistics
app.get('/compare', (req, res) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      details: error.message
    });
  }
});

// POST /diff - Enhanced memory diff with anomaly detection
app.post('/diff', upload.fields([
  { name: 'fileV1', maxCount: 1 },
  { name: 'fileV2', maxCount: 1 }
]), (req, res) => {
  try {
    if (!req.files || !req.files.fileV1 || !req.files.fileV2) {
      return res.status(400).json({ error: 'Both fileV1 and fileV2 are required' });
    }

    const fileV1 = req.files.fileV1[0];
    const fileV2 = req.files.fileV2[0];

    // Parse both files
    const analysisV1 = parseMapFile(fileV1.path);
    const analysisV2 = parseMapFile(fileV2.path);

    // Get diff options
    const options = {
      anomalyGrowthThreshold: parseFloat(req.query.growthThreshold) || 10,
      anomalyShrinkThreshold: parseFloat(req.query.shrinkThreshold) || 10,
      addressShiftThreshold: parseInt(req.query.addressShift) || 0x1000,
    };

    // Compute enhanced diff
    const diffResult = computeMemoryDiff(analysisV1, analysisV2, options);

    // Store with TTL
    const diffId = storeComparison(diffResult);

    // Clean up
    fs.unlinkSync(fileV1.path);
    fs.unlinkSync(fileV2.path);

    res.json({
      diffId,
      ...diffResult,
    });
  } catch (error) {
    console.error('Error computing diff:', error);

    // Cleanup
    try {
      if (req.files?.fileV1?.[0]?.path) fs.unlinkSync(req.files.fileV1[0].path);
      if (req.files?.fileV2?.[0]?.path) fs.unlinkSync(req.files.fileV2[0].path);
    } catch (e) {}

    res.status(500).json({
      error: 'Failed to compute diff',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  POST /analyze - Analyze a single map file`);
  console.log(`  POST /compare - Compare two map files`);
  console.log(`  POST /diff - Enhanced diff with anomaly detection`);
  console.log(`  GET /compare/:id - Retrieve comparison result`);
  console.log(`  GET /compare - Get storage statistics`);
});
