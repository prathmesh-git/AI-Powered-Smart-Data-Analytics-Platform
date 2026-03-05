const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const DataFile = require('../models/DataFile');
const { readFileData, readFullData } = require('../utils/dataAnalysis');
const { generateAISuggestions, getDefaultSuggestions } = require('../utils/chartGenerator');

// GET /api/suggestions?fileId=<id>
router.get('/', requireAuth, async (req, res) => {
  try {
    const { fileId } = req.query;

    if (!fileId) {
      return res.json({ questions: getDefaultSuggestions() });
    }

    const file = await DataFile.findById(fileId).catch(() => null);
    if (!file || file.ownerUsername !== req.user.username) {
      return res.json({ questions: getDefaultSuggestions() });
    }

    // Read a small sample for the prompt
    const { header, rows, totalRows } = await readFileData(file.path, 5);
    const sampleRows = rows.map(r => {
      const obj = {};
      header.forEach((h, i) => { obj[h] = r[i]; });
      return obj;
    });

    const questions = await generateAISuggestions(header, sampleRows, totalRows);
    res.json({ questions });
  } catch (err) {
    console.error('Suggestions error:', err);
    res.json({ questions: getDefaultSuggestions() });
  }
});

module.exports = router;
