const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const UNIT_COUNT = 72;
const WORD_SHAPE = 3;
const WORD_KEY_RE = /^[A-Za-z][A-Za-z .'-]*$/;

function loadGlobals(file, exportName) {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source}\nglobalThis.__value = ${exportName};`, context, { filename: file });
  return context.__value;
}

function spellingKey(word) {
  return String(word).toLowerCase().replace(/[^a-z]/g, '');
}

function isPhrase(word) {
  return /\s/.test(word);
}

function loc(ui, wi, word) {
  return `Unit ${ui + 1} word ${wi + 1} (${ui}-${wi}${word ? `, ${word}` : ''})`;
}

function addIssue(list, message) {
  list.push(message);
}

function main() {
  const errors = [];
  const warnings = [];
  const units = loadGlobals('data/units.js', 'UNITS');
  const ipa = loadGlobals('data/ipa.js', 'IPA');

  if (!Array.isArray(units)) addIssue(errors, 'UNITS must be an array.');
  if (!ipa || typeof ipa !== 'object' || Array.isArray(ipa)) addIssue(errors, 'IPA must be an object.');
  if (errors.length) return finish({ errors, warnings });

  if (units.length !== UNIT_COUNT) {
    addIssue(errors, `Expected ${UNIT_COUNT} units, found ${units.length}.`);
  }

  const ids = new Set();
  const exactWords = new Map();
  const lowerWords = new Map();
  const spellingKeys = new Map();
  const vocabKeys = new Set();
  let totalWords = 0;
  let phraseCount = 0;
  let punctuationCount = 0;
  let uppercaseCount = 0;

  units.forEach((unit, ui) => {
    if (!unit || typeof unit !== 'object') {
      addIssue(errors, `Unit ${ui + 1} must be an object.`);
      return;
    }
    if (typeof unit.l !== 'string' || !unit.l.trim()) addIssue(errors, `Unit ${ui + 1} has invalid lesson label.`);
    if (typeof unit.t !== 'string' || !unit.t.trim()) addIssue(errors, `Unit ${ui + 1} has invalid title.`);
    if (!Array.isArray(unit.w)) {
      addIssue(errors, `Unit ${ui + 1} words must be an array.`);
      return;
    }

    unit.w.forEach((entry, wi) => {
      totalWords++;
      const id = `${ui}-${wi}`;
      if (ids.has(id)) addIssue(errors, `Duplicate word id ${id}.`);
      ids.add(id);

      if (!Array.isArray(entry) || entry.length !== WORD_SHAPE) {
        addIssue(errors, `${loc(ui, wi)} must be [英文, 词性, 中文].`);
        return;
      }

      const [english, partOfSpeech, chinese] = entry;
      if (typeof english !== 'string' || !english.trim()) addIssue(errors, `${loc(ui, wi)} has invalid English text.`);
      if (typeof partOfSpeech !== 'string') addIssue(errors, `${loc(ui, wi, english)} has invalid part of speech.`);
      if (typeof chinese !== 'string' || !chinese.trim()) addIssue(errors, `${loc(ui, wi, english)} has invalid Chinese text.`);
      if (typeof english !== 'string') return;

      const word = english.trim();
      if (word !== english) addIssue(errors, `${loc(ui, wi, english)} has leading or trailing whitespace.`);
      if (!WORD_KEY_RE.test(word)) addIssue(errors, `${loc(ui, wi, word)} contains unsupported spelling characters.`);
      if (isPhrase(word)) phraseCount++;
      if (/[^A-Za-z]/.test(word)) punctuationCount++;
      if (/[A-Z]/.test(word)) uppercaseCount++;

      const exactKey = word;
      const priorExact = exactWords.get(exactKey);
      if (priorExact) addIssue(errors, `Duplicate English word "${word}" at ${loc(ui, wi, word)} and ${priorExact}.`);
      exactWords.set(exactKey, loc(ui, wi, word));
      const lowerKey = word.toLowerCase();
      const priorLower = lowerWords.get(lowerKey);
      if (priorLower) addIssue(warnings, `Same spelling with different case or meaning: "${word}" at ${loc(ui, wi, word)} and ${priorLower}.`);
      lowerWords.set(lowerKey, loc(ui, wi, word));
      vocabKeys.add(lowerKey);

      const answerKey = spellingKey(word);
      if (!answerKey) addIssue(errors, `${loc(ui, wi, word)} has empty normalized spelling answer.`);
      const priorAnswer = spellingKeys.get(answerKey);
      if (priorAnswer) {
        addIssue(warnings, `Same accepted spelling answer "${answerKey}" at ${loc(ui, wi, word)} and ${priorAnswer}.`);
      }
      spellingKeys.set(answerKey, loc(ui, wi, word));

      const hasIpa = Object.prototype.hasOwnProperty.call(ipa, lowerKey);
      if (!hasIpa && isPhrase(word)) {
        addIssue(warnings, `Phrase has no IPA and will skip phonics blocks: ${loc(ui, wi, word)}.`);
      } else if (!hasIpa) {
        addIssue(errors, `Missing IPA for ${loc(ui, wi, word)}.`);
      }
    });
  });

  Object.entries(ipa).forEach(([key, value]) => {
    if (key !== key.toLowerCase()) addIssue(errors, `IPA key must be lowercase: ${key}.`);
    if (typeof value !== 'string' || !value.trim()) addIssue(errors, `IPA value for "${key}" must be a non-empty string.`);
    if (value !== String(value).trim()) addIssue(errors, `IPA value for "${key}" has leading or trailing whitespace.`);
    if (!vocabKeys.has(key)) addIssue(warnings, `IPA entry is not used by the current vocabulary: ${key}.`);
  });

  return finish({
    errors,
    warnings,
    summary: {
      units: units.length,
      totalWords,
      ipaEntries: Object.keys(ipa).length,
      phrases: phraseCount,
      wordsWithPunctuation: punctuationCount,
      wordsWithUppercase: uppercaseCount,
    },
  });
}

function finish(result) {
  const { errors, warnings, summary } = result;
  if (summary) {
    console.log('Data validation summary');
    Object.entries(summary).forEach(([key, value]) => console.log(`- ${key}: ${value}`));
  }

  if (warnings.length) {
    console.log(`\nWarnings (${warnings.length})`);
    warnings.slice(0, 20).forEach((w) => console.log(`- ${w}`));
    if (warnings.length > 20) console.log(`- ... ${warnings.length - 20} more`);
  }

  if (errors.length) {
    console.error(`\nErrors (${errors.length})`);
    errors.forEach((e) => console.error(`- ${e}`));
    process.exitCode = 1;
    return;
  }

  console.log('\nData validation passed.');
}

main();
