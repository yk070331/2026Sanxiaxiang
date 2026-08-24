const assert = require('assert');
const { knowledgeQuestions } = require('../miniprogram/utils/quizData.js');

assert(Array.isArray(knowledgeQuestions), 'questions must be an array');
assert(knowledgeQuestions.length >= 5, 'at least five questions are required for the demo');

const ids = new Set();
for (const question of knowledgeQuestions) {
  assert(/^[a-zA-Z0-9_-]+$/.test(question.id), `invalid question id: ${question.id}`);
  assert(!ids.has(question.id), `duplicate question id: ${question.id}`);
  ids.add(question.id);
  assert(question.question.length >= 8, `${question.id} question is too short`);
  assert.strictEqual(question.options.length, 4, `${question.id} must have four options`);
  assert(
    Number.isInteger(question.answerIndex)
      && question.answerIndex >= 0
      && question.answerIndex < question.options.length,
    `${question.id} answer index is invalid`
  );
  assert(question.explanation.length >= 15, `${question.id} explanation is incomplete`);
  assert(question.source.length >= 10, `${question.id} source is missing`);
}

assert(
  knowledgeQuestions.every(question => !/AI生成|网络传闻/.test(question.source)),
  'unreviewed source labels must not be used'
);

console.log('quizData.test.js: all questions include valid answers, explanations and sources');
