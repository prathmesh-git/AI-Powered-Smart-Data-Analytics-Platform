const router = require('express').Router();
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const genId = () => `dash-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
const DataFile = require('../models/DataFile');
const Dashboard = require('../models/Dashboard');
const { readFullData, readFileData, generateKPIs, generateAutoCharts } = require('../utils/dataAnalysis');

// In-memory cache (also persisted to MongoDB)
const DASHBOARD_CACHE = {};

// POST /api/dashboard/create
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { fileId, dashboardType = 'manual', template = 'executive', kpiCount = 6, chartCount = 6 } = req.body;

    if (!fileId) return res.status(400).json({ success: false, error: 'fileId is required' });

    const file = await DataFile.findById(fileId);
    if (!file) return res.status(404).json({ success: false, error: 'File not found' });
    if (file.ownerUsername !== req.user.username)
      return res.status(403).json({ success: false, error: 'Access denied' });

    const records = await readFullData(file.path);
    if (!records.length) return res.status(400).json({ success: false, error: 'File is empty' });

    const { header } = await readFileData(file.path, 0);
    const sampleRows = records.slice(0, 5);

    const dashboardId = genId();

    // Generate KPIs + charts
    const kpis   = generateKPIs(records, kpiCount);
    const graphs  = generateAutoCharts(records, chartCount);
    const allCols = Object.keys(records[0] || {});

    // Build a small sample for table preview
    const dataframeSample = {
      columns: header,
      rows: records.slice(0, 10),
    };

    const dashData = {
      dashboardId,
      ownerUsername: req.user.username,
      fileId,
      filename: file.originalName || file.name,
      dashboardType,
      template,
      kpis,
      graphs,
      allColumns: allCols,
      totalRecords: records.length,
      dataframeSample,
    };

    // Save to MongoDB
    const dashDoc = await Dashboard.create(dashData);

    // Cache
    DASHBOARD_CACHE[dashboardId] = dashData;

    res.json({
      success: true,
      dashboardId,
      dashboard: dashData,
    });
  } catch (err) {
    console.error('Dashboard create error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/dashboard/:dashboardId
router.get('/:dashboardId', requireAuth, async (req, res) => {
  try {
    const { dashboardId } = req.params;

    // Check cache first
    if (DASHBOARD_CACHE[dashboardId]) {
      return res.json({ success: true, dashboard: DASHBOARD_CACHE[dashboardId] });
    }

    // Fetch from MongoDB
    const dash = await Dashboard.findOne({ dashboardId });
    if (!dash) return res.status(404).json({ success: false, error: 'Dashboard not found' });
    if (dash.ownerUsername !== req.user.username)
      return res.status(403).json({ success: false, error: 'Access denied' });

    DASHBOARD_CACHE[dashboardId] = dash.toObject();
    res.json({ success: true, dashboard: dash });
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/dashboard  — list all dashboards for a user
router.get('/', requireAuth, async (req, res) => {
  try {
    const dashboards = await Dashboard.find({ ownerUsername: req.user.username })
      .sort({ createdAt: -1 })
      .select('dashboardId filename template dashboardType createdAt totalRecords');
    res.json({ success: true, dashboards });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
