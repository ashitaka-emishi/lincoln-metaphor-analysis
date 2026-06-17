'use strict';

const fs = require('fs');

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readExistingJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function generatedDateForFile(filePath) {
  const existing = readExistingJSON(filePath);
  if (existing && /^\d{4}-\d{2}-\d{2}$/.test(existing.generated || '')) {
    return existing.generated;
  }
  return today();
}

function pipelineLogForFile(filePath, entry) {
  const existing = readExistingJSON(filePath);
  if (existing && Array.isArray(existing.pipeline_log) && existing.pipeline_log.length > 0) {
    return existing.pipeline_log;
  }

  return [
    {
      ...entry,
      date: generatedDateForFile(filePath)
    }
  ];
}

module.exports = {
  generatedDateForFile,
  pipelineLogForFile
};
