const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
  dashboardId:    { type: String, required: true, unique: true },
  ownerUsername:  { type: String, required: true },
  fileId:         { type: mongoose.Schema.Types.ObjectId, ref: 'DataFile' },
  filename:       { type: String },
  dashboardType:  { type: String, default: 'manual' }, // 'ai' | 'manual'
  template:       { type: String, default: 'executive' },
  kpis:           { type: Array, default: [] },
  graphs:         { type: Array, default: [] },
  allColumns:     { type: Array, default: [] },
  totalRecords:   { type: Number, default: 0 },
  dataframeSample:{ type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Dashboard', dashboardSchema);
