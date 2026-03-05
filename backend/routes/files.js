const router = require('express').Router();
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const https  = require('https');
const http   = require('http');
const { requireAuth } = require('../middleware/auth');
const DataFile = require('../models/DataFile');
const { readFileData } = require('../utils/dataAnalysis');

// ─── Multer config ────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', req.user.username);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    // Keep original name but prevent collisions
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls', '.tsv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`Only ${allowed.join(', ')} files are allowed`));
  },
});

// POST /api/files/upload
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).replace('.', '').toLowerCase();
    const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname));

    const dataFile = await DataFile.create({
      ownerUsername: req.user.username,
      name: baseName,
      originalName: req.file.originalname,
      ext,
      path: req.file.path,
      size: req.file.size,
    });

    res.json({ success: true, file: dataFile });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/files  — list all files for the logged-in user
router.get('/', requireAuth, async (req, res) => {
  try {
    const files = await DataFile.find({ ownerUsername: req.user.username }).sort({ createdAt: -1 });
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/files/:id  — file detail with first 50 rows
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const file = await DataFile.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.ownerUsername !== req.user.username)
      return res.status(403).json({ error: 'Access denied' });

    const { header, rows, totalRows } = await readFileData(file.path, 50);
    res.json({ file, header, rows, totalRows });
  } catch (err) {
    console.error('File detail error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/files/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const file = await DataFile.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.ownerUsername !== req.user.username)
      return res.status(403).json({ error: 'Access denied' });

    // Remove from disk
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    await file.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Helper: fetch a URL and save to disk ─────────────────────────
function downloadToFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file  = fs.createWriteStream(destPath);
    proto.get(url, res => {
      // Follow one redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return downloadToFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error(`HTTP ${res.statusCode} while fetching URL`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', err => { fs.unlink(destPath, () => {}); reject(err); });
    }).on('error', err => { fs.unlink(destPath, () => {}); reject(err); });
  });
}

// POST /api/files/import-source
router.post('/import-source', requireAuth, async (req, res) => {
  const { source, dataset_name, sheet_url, host, port, database, service, username, password, query } = req.body;

  if (!source || !dataset_name) {
    return res.status(400).json({ error: 'source and dataset_name are required' });
  }

  const userDir = path.join(__dirname, '..', 'uploads', req.user.username);
  fs.mkdirSync(userDir, { recursive: true });

  const safeName = dataset_name.replace(/[^a-z0-9_\-]/gi, '_');
  const destPath = path.join(userDir, `${Date.now()}-${safeName}.csv`);

  try {
    if (source === 'google_sheet') {
      if (!sheet_url) return res.status(400).json({ error: 'sheet_url is required' });

      // Convert Google Sheets URL to CSV export URL
      const match = sheet_url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) return res.status(400).json({ error: 'Invalid Google Sheets URL' });
      const sheetId = match[1];
      const csvUrl  = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&id=${sheetId}`;

      await downloadToFile(csvUrl, destPath);
    } else if (source === 'sharepoint') {
      if (!sheet_url) return res.status(400).json({ error: 'sheet_url is required' });
      await downloadToFile(sheet_url, destPath);
    } else if (['mysql', 'postgres', 'oracle'].includes(source)) {
      return res.status(501).json({
        error: `Direct ${source.toUpperCase()} connection is not yet configured on this server. Please export your query results as CSV and upload the file instead.`,
      });
    } else {
      return res.status(400).json({ error: `Unknown source: ${source}` });
    }

    const stat = fs.statSync(destPath);
    const dataFile = await DataFile.create({
      ownerUsername: req.user.username,
      name: dataset_name,
      originalName: `${safeName}.csv`,
      ext: 'csv',
      path: destPath,
      size: stat.size,
      source,
    });

    res.json({ success: true, file: dataFile });
  } catch (err) {
    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    console.error('Import-source error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
