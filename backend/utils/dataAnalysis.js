const fs   = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');

/**
 * Read a CSV or Excel file and return header + rows (trimmed to maxRows).
 * @returns {{ header: string[], rows: any[][], totalRows: number }}
 */
async function readFileData(filePath, maxRows = 50) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  const ext = path.extname(filePath).toLowerCase();
  let header = [], rows = [], totalRows = 0;

  if (ext === '.csv' || ext === '.tsv') {
    const delimiter = ext === '.tsv' ? '\t' : ',';
    const content = fs.readFileSync(filePath, 'utf8');
    const records = parse(content, {
      delimiter,
      skip_empty_lines: true,
      relax_column_count: true,
    });
    if (records.length > 0) {
      header = records[0].map(String);
      totalRows = records.length - 1;
      rows = records.slice(1, maxRows + 1).map(r => r.map(v => v ?? ''));
    }
  } else if (['.xlsx', '.xls'].includes(ext)) {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (json.length > 0) {
      header = json[0].map(String);
      totalRows = json.length - 1;
      rows = json.slice(1, maxRows + 1).map(r => r.map ? r.map(v => v ?? '') : []);
    }
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  return { header, rows, totalRows };
}

/**
 * Read the full dataset as an array of objects {col: value}.
 */
async function readFullData(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  const ext = path.extname(filePath).toLowerCase();
  let records = [];

  if (ext === '.csv' || ext === '.tsv') {
    const delimiter = ext === '.tsv' ? '\t' : ',';
    const content = fs.readFileSync(filePath, 'utf8');
    records = parse(content, {
      delimiter,
      skip_empty_lines: true,
      columns: true,
      relax_column_count: true,
      cast: true,
    });
  } else if (['.xlsx', '.xls'].includes(ext)) {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    records = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  return records;
}

/**
 * Detect column types: numeric or categorical.
 */
function detectColumnTypes(records) {
  if (!records.length) return { numericCols: [], catCols: [] };
  const cols = Object.keys(records[0]);
  const numericCols = [];
  const catCols = [];

  for (const col of cols) {
    const nonNull = records.map(r => r[col]).filter(v => v !== '' && v !== null && v !== undefined);
    const numCount = nonNull.filter(v => !isNaN(parseFloat(v)) && isFinite(v)).length;
    if (nonNull.length > 0 && numCount / nonNull.length > 0.7) {
      numericCols.push(col);
    } else {
      catCols.push(col);
    }
  }
  return { numericCols, catCols };
}

/**
 * Internal data analysis (no API) — answers common questions about a dataset.
 */
function analyzeDataInternally(records, question) {
  const q = question.toLowerCase();
  const { numericCols, catCols } = detectColumnTypes(records);
  const n = records.length;

  let explanation = `📊 Dataset Analysis\n\n`;
  explanation += `Total records: ${n} | Columns: ${Object.keys(records[0] || {}).length}\n\n`;

  try {
    if (/total|sum|overall/.test(q) && numericCols.length) {
      const col = numericCols[0];
      const total = records.reduce((acc, r) => acc + (parseFloat(r[col]) || 0), 0);
      explanation += `✓ Total ${col}: ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}\n`;
    } else if (/average|mean|avg/.test(q) && numericCols.length) {
      const col = numericCols[0];
      const avg = records.reduce((acc, r) => acc + (parseFloat(r[col]) || 0), 0) / n;
      explanation += `✓ Average ${col}: ${avg.toFixed(2)}\n`;
    } else if (/count|how many|number of/.test(q)) {
      if (catCols.length) {
        const col = catCols[0];
        const counts = {};
        records.forEach(r => { const v = String(r[col]); counts[v] = (counts[v] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        explanation += `✓ ${col} Distribution:\n`;
        sorted.forEach(([k, v]) => explanation += `  - ${k}: ${v} (${(v / n * 100).toFixed(1)}%)\n`);
      } else {
        explanation += `✓ Total records: ${n}\n`;
      }
    } else if (/distribution|spread|range/.test(q) && numericCols.length) {
      const col = numericCols[0];
      const values = records.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
      values.sort((a, b) => a - b);
      const min = values[0], max = values[values.length - 1];
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const median = values[Math.floor(values.length / 2)];
      explanation += `✓ Distribution of ${col}:\n  Min: ${min.toFixed(2)}\n  Max: ${max.toFixed(2)}\n  Mean: ${mean.toFixed(2)}\n  Median: ${median.toFixed(2)}\n`;
    } else if (/trend|change|growth/.test(q) && numericCols.length) {
      const col = numericCols[0];
      const first = parseFloat(records[0]?.[col]) || 0;
      const last = parseFloat(records[n - 1]?.[col]) || 0;
      const change = first !== 0 ? ((last - first) / Math.abs(first) * 100) : 0;
      explanation += `✓ Trend in ${col}: ${change >= 0 ? '📈 increasing' : '📉 decreasing'} (${change >= 0 ? '+' : ''}${change.toFixed(1)}%)\n`;
    } else if (/(top|highest|maximum|best)/.test(q) && numericCols.length) {
      const col = numericCols[0];
      const values = records.map(r => ({ val: parseFloat(r[col]) || 0, rec: r }));
      values.sort((a, b) => b.val - a.val);
      explanation += `✓ Top 5 by ${col}:\n`;
      values.slice(0, 5).forEach((item, i) => {
        const label = catCols.length ? item.rec[catCols[0]] : `Row ${i + 1}`;
        explanation += `  ${i + 1}. ${label}: ${item.val.toFixed(2)}\n`;
      });
    } else if (/(lowest|minimum|worst)/.test(q) && numericCols.length) {
      const col = numericCols[0];
      const values = records.map(r => ({ val: parseFloat(r[col]) || 0, rec: r }));
      values.sort((a, b) => a.val - b.val);
      explanation += `✓ Bottom 5 by ${col}:\n`;
      values.slice(0, 5).forEach((item, i) => {
        const label = catCols.length ? item.rec[catCols[0]] : `Row ${i + 1}`;
        explanation += `  ${i + 1}. ${label}: ${item.val.toFixed(2)}\n`;
      });
    } else if (/compare|difference|vs/.test(q) && numericCols.length >= 2) {
      const [col1, col2] = numericCols;
      const avg1 = records.reduce((a, r) => a + (parseFloat(r[col1]) || 0), 0) / n;
      const avg2 = records.reduce((a, r) => a + (parseFloat(r[col2]) || 0), 0) / n;
      explanation += `✓ Comparison:\n  Avg ${col1}: ${avg1.toFixed(2)}\n  Avg ${col2}: ${avg2.toFixed(2)}\n  Difference: ${Math.abs(avg1 - avg2).toFixed(2)}\n`;
    } else {
      // Default overview
      explanation += `📋 Quick Summary:\n`;
      const allCols = Object.keys(records[0] || {}).slice(0, 6);
      allCols.forEach(col => {
        if (numericCols.includes(col)) {
          const values = records.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
          const avg = values.reduce((a, b) => a + b, 0) / (values.length || 1);
          const min = Math.min(...values);
          const max = Math.max(...values);
          explanation += `  • ${col}: avg=${avg.toFixed(2)}, range=[${min.toFixed(0)}, ${max.toFixed(0)}]\n`;
        } else {
          const unique = new Set(records.map(r => r[col])).size;
          explanation += `  • ${col}: ${unique} unique values\n`;
        }
      });
    }

    explanation += `\n✨ Ask more specific questions about your data!`;
  } catch (err) {
    explanation += `\nDataset loaded successfully. Ask specific questions about your data.`;
  }

  return explanation;
}

/**
 * Build a simple chart data structure from the dataset for a given question.
 * Parses the question to select the appropriate chart type and columns.
 */
function buildSimpleChart(records, question) {
  const q = question.toLowerCase();
  const { numericCols, catCols } = detectColumnTypes(records);
  const allCols = Object.keys(records[0] || {});

  if (!records.length) return null;

  // Find columns explicitly mentioned in the question
  const mentionedCols = allCols.filter(col => q.includes(col.toLowerCase()));
  const mentionedNumCols = mentionedCols.filter(c => numericCols.includes(c));
  const mentionedCatCols = mentionedCols.filter(c => catCols.includes(c));

  // Best-fit columns: prefer mentioned, fall back to first detected
  const targetNumCol = mentionedNumCols[0] || numericCols[0];
  const targetCatCol = mentionedCatCols[0] || catCols[0];

  // Helper: group records by a categorical column and aggregate a numeric column
  function groupAndAggregate(catCol, numCol, agg = 'avg', limit = 15) {
    const grouped = {};
    records.forEach(r => {
      const k = String(r[catCol]);
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(parseFloat(r[numCol]) || 0);
    });
    const entries = Object.entries(grouped).map(([k, vals]) => {
      const total = vals.reduce((a, b) => a + b, 0);
      return [k, agg === 'sum' ? total : total / vals.length];
    });
    return entries.slice(0, limit);
  }

  // ── TOP / HIGHEST / RANKING ─────────────────────────────────────────────────
  if (/(top|highest|maximum|best|rank|most)/.test(q)) {
    const topN = parseInt(q.match(/top\s*(\d+)/)?.[1] || q.match(/(\d+)\s*record/)?.[1]) || 5;
    if (targetCatCol && targetNumCol) {
      const entries = groupAndAggregate(targetCatCol, targetNumCol, 'avg', 50)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN);
      return {
        type: 'bar',
        data: {
          labels: entries.map(([k]) => k),
          datasets: [{
            label: `Top ${topN} ${targetCatCol} by ${targetNumCol}`,
            data: entries.map(([, v]) => parseFloat(v.toFixed(2))),
            backgroundColor: entries.map((_, i) => `hsl(${(i * 360 / entries.length)}, 70%, 60%)`),
          }],
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } } },
      };
    }
  }

  // ── TREND / TIME SERIES ─────────────────────────────────────────────────────
  if (/(trend|over time|time series|growth|change)/.test(q)) {
    const timeCol = allCols.find(c => /time|date|year|month|period|quarter/i.test(c)) || targetCatCol;
    const valueCol = targetNumCol;
    if (timeCol && valueCol) {
      const grouped = {};
      records.forEach(r => {
        const k = String(r[timeCol]);
        if (!grouped[k]) grouped[k] = [];
        grouped[k].push(parseFloat(r[valueCol]) || 0);
      });
      const labels = Object.keys(grouped).sort().slice(0, 30);
      const values = labels.map(k => {
        const arr = grouped[k];
        return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
      });
      return {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: `${valueCol} over ${timeCol}`,
            data: values,
            borderColor: 'rgba(99, 102, 241, 1)',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            fill: true,
            tension: 0.4,
          }],
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } } },
      };
    }
  }

  // ── DISTRIBUTION / PIE / COUNT ──────────────────────────────────────────────
  if (/(distribution|spread|pie|count|how many|number of)/.test(q)) {
    const col = mentionedCatCols[0] || catCols[0];
    if (col) {
      const counts = {};
      records.forEach(r => { const k = String(r[col]); counts[k] = (counts[k] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      return {
        type: 'pie',
        data: {
          labels: sorted.map(([k]) => k),
          datasets: [{
            data: sorted.map(([, v]) => v),
            backgroundColor: sorted.map((_, i) => `hsl(${i * 36}, 70%, 60%)`),
          }],
        },
        options: { responsive: true, plugins: { legend: { position: 'right' } } },
      };
    }
  }

  // ── AVERAGE / MEAN ──────────────────────────────────────────────────────────
  if (/(average|mean|avg)/.test(q) && targetCatCol && targetNumCol) {
    const entries = groupAndAggregate(targetCatCol, targetNumCol, 'avg', 15);
    return {
      type: 'bar',
      data: {
        labels: entries.map(([k]) => k),
        datasets: [{
          label: `Avg ${targetNumCol} by ${targetCatCol}`,
          data: entries.map(([, v]) => parseFloat(v.toFixed(2))),
          backgroundColor: entries.map((_, i) => `hsl(${(i * 360 / entries.length)}, 70%, 60%)`),
        }],
      },
      options: { responsive: true, plugins: { legend: { position: 'top' } } },
    };
  }

  // ── TOTAL / SUM ─────────────────────────────────────────────────────────────
  if (/(total|sum|overall)/.test(q) && targetCatCol && targetNumCol) {
    const entries = groupAndAggregate(targetCatCol, targetNumCol, 'sum', 15)
      .sort((a, b) => b[1] - a[1]);
    return {
      type: 'bar',
      data: {
        labels: entries.map(([k]) => k),
        datasets: [{
          label: `Total ${targetNumCol} by ${targetCatCol}`,
          data: entries.map(([, v]) => parseFloat(v.toFixed(2))),
          backgroundColor: entries.map((_, i) => `hsl(${(i * 360 / entries.length)}, 65%, 55%)`),
        }],
      },
      options: { responsive: true, plugins: { legend: { position: 'top' } } },
    };
  }

  // ── COMPARE / VARY / CORRELATION ────────────────────────────────────────────
  if (/(compar|var|differ|vs |versus|correlat)/.test(q)) {
    if (numericCols.length >= 2) {
      const xCol = mentionedNumCols[1] || numericCols[1];
      const yCol = mentionedNumCols[0] || numericCols[0];
      const sampleSize = Math.min(records.length, 100);
      const step = Math.max(1, Math.floor(records.length / sampleSize));
      const sampled = records.filter((_, i) => i % step === 0);
      return {
        type: 'scatter',
        data: {
          datasets: [{
            label: `${yCol} vs ${xCol}`,
            data: sampled.map(r => ({ x: parseFloat(r[xCol]) || 0, y: parseFloat(r[yCol]) || 0 })),
            backgroundColor: 'rgba(99, 102, 241, 0.6)',
          }],
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } } },
      };
    }
    if (targetCatCol && targetNumCol) {
      const entries = groupAndAggregate(targetCatCol, targetNumCol, 'avg', 15);
      return {
        type: 'bar',
        data: {
          labels: entries.map(([k]) => k),
          datasets: [{
            label: `${targetNumCol} by ${targetCatCol}`,
            data: entries.map(([, v]) => parseFloat(v.toFixed(2))),
            backgroundColor: entries.map((_, i) => `hsl(${(i * 360 / entries.length)}, 70%, 60%)`),
          }],
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } } },
      };
    }
  }

  // ── OUTLIER / ANOMALY ───────────────────────────────────────────────────────
  if (/(outlier|anomal|unusual|extreme)/.test(q) && targetNumCol) {
    const values = records.map(r => parseFloat(r[targetNumCol])).filter(v => !isNaN(v));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.map(v => (v - mean) ** 2).reduce((a, b) => a + b, 0) / values.length);
    const step = Math.max(1, Math.floor(records.length / 100));
    const sampled = records.filter((_, i) => i % step === 0).slice(0, 100);
    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${targetNumCol} (outliers highlighted)`,
          data: sampled.map((r, i) => ({ x: i + 1, y: parseFloat(r[targetNumCol]) || 0 })),
          backgroundColor: sampled.map(r => {
            const v = parseFloat(r[targetNumCol]) || 0;
            return Math.abs(v - mean) > 2 * std ? 'rgba(239,68,68,0.8)' : 'rgba(99,102,241,0.4)';
          }),
          pointRadius: 5,
        }],
      },
      options: { responsive: true, plugins: { legend: { position: 'top' } } },
    };
  }

  // ── DEFAULT FALLBACK: use detected columns but vary by which cols are present ─
  if (catCols.length && numericCols.length) {
    // If a specific cat column is mentioned use it, otherwise pick from question context
    const useCatCol = mentionedCatCols[0] || catCols[0];
    const useNumCol = mentionedNumCols[0] || numericCols[0];
    const entries = groupAndAggregate(useCatCol, useNumCol, 'avg', 15);
    return {
      type: 'bar',
      data: {
        labels: entries.map(([k]) => k),
        datasets: [{
          label: `Avg ${useNumCol} by ${useCatCol}`,
          data: entries.map(([, v]) => parseFloat(v.toFixed(2))),
          backgroundColor: entries.map((_, i) => `hsl(${(i * 360 / entries.length)}, 70%, 60%)`),
        }],
      },
      options: { responsive: true, plugins: { legend: { position: 'top' } } },
    };
  }

  if (numericCols.length >= 2) {
    const [xCol, yCol] = numericCols;
    const sampleSize = Math.min(records.length, 100);
    const step = Math.max(1, Math.floor(records.length / sampleSize));
    const sampled = records.filter((_, i) => i % step === 0);
    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${yCol} vs ${xCol}`,
          data: sampled.map(r => ({ x: parseFloat(r[xCol]) || 0, y: parseFloat(r[yCol]) || 0 })),
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
        }],
      },
      options: { responsive: true },
    };
  }

  if (numericCols.length === 1) {
    const col = numericCols[0];
    const values = records.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
    return {
      type: 'line',
      data: {
        labels: values.map((_, i) => i + 1),
        datasets: [{
          label: col,
          data: values.slice(0, 100),
          borderColor: 'rgba(99, 102, 241, 1)',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          fill: true,
        }],
      },
      options: { responsive: true },
    };
  }

  return null;
}

/**
 * Generate KPI cards from dataset statistics.
 */
function generateKPIs(records, count = 6) {
  const { numericCols, catCols } = detectColumnTypes(records);
  const n = records.length;
  const kpis = [];

  kpis.push({ label: 'Total Records', value: n.toLocaleString(), icon: 'database', color: 'blue' });

  numericCols.slice(0, 3).forEach(col => {
    const values = records.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
    if (!values.length) return;
    const total = values.reduce((a, b) => a + b, 0);
    const avg = total / values.length;
    kpis.push({
      label: `Avg ${col}`,
      value: avg.toFixed(2),
      icon: 'trending-up',
      color: 'green',
    });
    kpis.push({
      label: `Total ${col}`,
      value: total.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      icon: 'bar-chart',
      color: 'purple',
    });
  });

  catCols.slice(0, 2).forEach(col => {
    const unique = new Set(records.map(r => r[col])).size;
    kpis.push({ label: `Unique ${col}`, value: unique.toLocaleString(), icon: 'tag', color: 'orange' });
  });

  return kpis.slice(0, count);
}

/**
 * Generate multiple chart specs automatically from the dataset.
 */
function generateAutoCharts(records, count = 6) {
  const { numericCols, catCols } = detectColumnTypes(records);
  const charts = [];

  // Bar charts: each cat col vs each numeric col
  for (const catCol of catCols.slice(0, 2)) {
    for (const numCol of numericCols.slice(0, 3)) {
      if (charts.length >= count) break;
      const grouped = {};
      records.forEach(r => {
        const k = String(r[catCol]);
        if (!grouped[k]) grouped[k] = [];
        grouped[k].push(parseFloat(r[numCol]) || 0);
      });
      const labels = Object.keys(grouped).slice(0, 15);
      const values = labels.map(k => {
        const arr = grouped[k];
        return arr.reduce((a, b) => a + b, 0) / arr.length;
      });
      charts.push({
        id: `chart-${charts.length}`,
        title: `${numCol} by ${catCol}`,
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: `Avg ${numCol}`,
            data: values,
            backgroundColor: labels.map((_, i) => `hsl(${i * 25 + 200}, 70%, 55%)`),
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }
  }

  // Line chart: first numeric col over record index
  if (numericCols.length && charts.length < count) {
    const col = numericCols[0];
    const step = Math.max(1, Math.floor(records.length / 50));
    const sampled = records.filter((_, i) => i % step === 0).slice(0, 50);
    charts.push({
      id: `chart-${charts.length}`,
      title: `${col} Trend`,
      type: 'line',
      data: {
        labels: sampled.map((_, i) => i + 1),
        datasets: [{
          label: col,
          data: sampled.map(r => parseFloat(r[col]) || 0),
          borderColor: 'rgba(139, 92, 246, 1)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4,
        }],
      },
      options: { responsive: true },
    });
  }

  // Pie chart: most categorical col
  if (catCols.length && charts.length < count) {
    const catCol = catCols[0];
    const counts = {};
    records.forEach(r => { const k = String(r[catCol]); counts[k] = (counts[k] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    charts.push({
      id: `chart-${charts.length}`,
      title: `${catCol} Distribution`,
      type: 'pie',
      data: {
        labels: sorted.map(([k]) => k),
        datasets: [{
          data: sorted.map(([, v]) => v),
          backgroundColor: sorted.map((_, i) => `hsl(${i * 45}, 65%, 55%)`),
        }],
      },
      options: { responsive: true },
    });
  }

  // Scatter: two numeric cols
  if (numericCols.length >= 2 && charts.length < count) {
    const [xCol, yCol] = numericCols;
    const sampleSize = Math.min(records.length, 80);
    const step = Math.max(1, Math.floor(records.length / sampleSize));
    charts.push({
      id: `chart-${charts.length}`,
      title: `${yCol} vs ${xCol}`,
      type: 'scatter',
      data: {
        datasets: [{
          label: `${yCol} vs ${xCol}`,
          data: records.filter((_, i) => i % step === 0).slice(0, 80)
            .map(r => ({ x: parseFloat(r[xCol]) || 0, y: parseFloat(r[yCol]) || 0 })),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
        }],
      },
      options: { responsive: true },
    });
  }

  return charts.slice(0, count);
}

module.exports = { readFileData, readFullData, detectColumnTypes, analyzeDataInternally, buildSimpleChart, generateKPIs, generateAutoCharts };
