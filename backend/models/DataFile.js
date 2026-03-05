const mongoose = require('mongoose');

const dataFileSchema = new mongoose.Schema({
  ownerUsername: { type: String, required: true, index: true },
  name:          { type: String, required: true },
  originalName:  { type: String },
  ext:           { type: String, default: 'csv' },
  path:          { type: String, required: true },  // absolute path on disk
  size:          { type: Number, default: 0 },
  source:        { type: String, default: 'upload' }, // upload | google_sheet | sharepoint | mysql | postgres | oracle
}, { timestamps: true });

module.exports = mongoose.model('DataFile', dataFileSchema);
