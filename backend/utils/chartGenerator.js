const OpenAI = require('openai');

let openaiClient = null;

function getOpenAI() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

/**
 * Generate a Chart.js-compatible chart spec using OpenAI GPT.
 * @param {Object[]} records  - Array of row objects from the dataset
 * @param {string}   question - User's natural-language question
 * @param {string[]} columns  - Column names
 * @returns {{ chart: Object, insight: string } | { error: string }}
 */
async function generateAIChart(records, question, columns) {
  const openai = getOpenAI();
  if (!openai) {
    return { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to .env' };
  }

  // Build a small sample of the data for the prompt
  const sampleSize = Math.min(records.length, 20);
  const step = Math.max(1, Math.floor(records.length / sampleSize));
  const sample = records.filter((_, i) => i % step === 0).slice(0, 20);

  const prompt = `You are a data visualization expert. Given a dataset with columns: ${columns.join(', ')}.

Sample data (${records.length} total rows):
${JSON.stringify(sample.slice(0, 10), null, 2)}

User question: "${question}"

Generate a Chart.js v3 configuration object that best answers this question.
Return ONLY valid JSON with this exact structure:
{
  "type": "<bar|line|pie|doughnut|scatter|radar>",
  "data": {
    "labels": [...],
    "datasets": [{ "label": "...", "data": [...], "backgroundColor": [...], "borderColor": [...] }]
  },
  "options": {
    "responsive": true,
    "plugins": { "title": { "display": true, "text": "..." }, "legend": { "position": "top" } }
  },
  "insight": "One sentence explaining this chart."
}

Rules:
- Use ACTUAL data values from the sample, not placeholders  
- For bar/line charts: max 15 data points
- backgroundColor should be an array of HSL colors
- borderColor should be darker versions of backgroundColor
- insight should explain what the chart reveals`;

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);

    return {
      chart: {
        type: parsed.type || 'bar',
        data: parsed.data,
        options: parsed.options,
      },
      insight: parsed.insight || '',
    };
  } catch (err) {
    const isQuotaOrAuth = err?.status === 429 || err?.status === 401 ||
      (err?.message || '').includes('429') || (err?.message || '').includes('401') ||
      (err?.message || '').toLowerCase().includes('quota') ||
      (err?.message || '').toLowerCase().includes('billing');
    if (!isQuotaOrAuth) {
      console.error('OpenAI chart generation error:', err.message);
    }
    return { error: `AI chart generation failed: ${err.message}` };
  }
}

/**
 * Generate 10 suggested questions for a dataset using OpenAI.
 */
async function generateAISuggestions(columns, sampleRows, totalRows) {
  const openai = getOpenAI();
  if (!openai) {
    return getDefaultSuggestions(columns);
  }

  const prompt = `Given a dataset with ${totalRows} rows and columns: ${columns.join(', ')}.

Sample data:
${JSON.stringify(sampleRows.slice(0, 5), null, 2)}

Generate exactly 10 interesting analytical questions a data analyst would ask about this dataset.
Return ONLY a JSON array of 10 question strings. Each question should be specific and insightful.
Example: ["What is the distribution of X?", "Which Y has the highest Z?", ...]`;

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);
    const questions = parsed.questions || parsed.data || Object.values(parsed)[0] || [];
    if (Array.isArray(questions) && questions.length >= 5) {
      return questions.slice(0, 10);
    }
    return getDefaultSuggestions(columns);
  } catch (err) {
    const isQuotaOrAuth = err?.status === 429 || err?.status === 401 ||
      (err?.message || '').includes('429') || (err?.message || '').includes('401') ||
      (err?.message || '').toLowerCase().includes('quota') ||
      (err?.message || '').toLowerCase().includes('billing');
    if (!isQuotaOrAuth) {
      console.error('Suggestions error:', err.message);
    }
    return getDefaultSuggestions(columns);
  }
}

function getDefaultSuggestions(columns = []) {
  const col1 = columns[0] || 'values';
  const col2 = columns[1] || 'categories';
  return [
    `What is the overall distribution of ${col1}?`,
    `Which ${col2} has the highest ${col1}?`,
    `Show the trend of ${col1} over time`,
    `What are the top 5 records by ${col1}?`,
    `How does ${col1} vary across different ${col2}?`,
    `What is the average ${col1} per ${col2}?`,
    `Are there any outliers in ${col1}?`,
    `Compare ${col1} between groups`,
    `What is the total ${col1}?`,
    `Show summary statistics for the dataset`,
  ];
}

module.exports = { generateAIChart, generateAISuggestions, getDefaultSuggestions };
