const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const DataFile = require('../models/DataFile');
const { readFullData, analyzeDataInternally, buildSimpleChart } = require('../utils/dataAnalysis');
const { generateAIChart } = require('../utils/chartGenerator');

// POST /api/charts/ai/:fileId  — AI chart generation using OpenAI
router.post('/ai/:fileId', requireAuth, async (req, res) => {
  try {
    const file = await DataFile.findById(req.params.fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.ownerUsername !== req.user.username)
      return res.status(403).json({ error: 'Access denied' });

    const { question } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'Question is required' });

    const records = await readFullData(file.path);
    if (!records.length) return res.status(400).json({ error: 'File is empty or unreadable' });

    const columns = Object.keys(records[0]);
    const result = await generateAIChart(records, question, columns);

    if (result.error) {
      // Fallback to simple chart
      const fallback = buildSimpleChart(records, question);
      const q = question.toLowerCase();
      let insight = 'Auto-generated chart';
      if (/(top|highest|best|rank)/.test(q)) insight = `Top results for: "${question}"`;
      else if (/(trend|over time|growth)/.test(q)) insight = `Trend chart for: "${question}"`;
      else if (/(distribution|spread|pie|count)/.test(q)) insight = `Distribution chart for: "${question}"`;
      else if (/(average|mean|avg)/.test(q)) insight = `Average values for: "${question}"`;
      else if (/(total|sum)/.test(q)) insight = `Totals for: "${question}"`;
      else if (/(compar|var|differ)/.test(q)) insight = `Comparison chart for: "${question}"`;
      else if (/(outlier|anomal)/.test(q)) insight = `Outlier analysis for: "${question}"`;
      return res.json({ chart: fallback, insight, success: true, fallback: true });
    }

    res.json({ chart: result.chart, insight: result.insight, success: true });
  } catch (err) {
    console.error('AI chart error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/charts/lite  — internal analysis (no OpenAI)
router.post('/lite', requireAuth, async (req, res) => {
  try {
    const { fileId, question } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'Question is required' });
    if (!fileId) return res.status(400).json({ error: 'fileId is required' });

    const file = await DataFile.findById(fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.ownerUsername !== req.user.username)
      return res.status(403).json({ error: 'Access denied' });

    const records = await readFullData(file.path);
    if (!records.length) return res.status(400).json({ error: 'File is empty' });

    const explanation = analyzeDataInternally(records, question);
    const chart = buildSimpleChart(records, question);

    res.json({ explanation, chart, success: true });
  } catch (err) {
    console.error('Lite chart error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
