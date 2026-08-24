'use strict';

const assert = require('assert');
const path = require('path');

let pageDefinition;
global.Page = definition => { pageDefinition = definition; };

const modulePath = path.join(__dirname, '..', 'miniprogram', 'pages', 'privacy', 'index.js');
const privacyModule = require(modulePath);

const summary = privacyModule.buildLocalDataSummary({
  qiaolinStudyTourCheckIns: { seg_1: true, seg_2: false, seg_3: true },
  qiaolinPendingCheckInSync: [{ id: 1 }],
  qiaolinPendingCorrections: [{ id: 2 }, { id: 3 }],
  qiaolinQuizHighScore: '80',
  qiaolinCareMode: true
});

assert.deepStrictEqual(summary, {
  checkInCount: 2,
  pendingCheckInCount: 1,
  pendingCorrectionCount: 2,
  highScore: 80,
  careMode: true,
  storedItemCount: 5
});
assert.strictEqual(privacyModule.USER_STORAGE_KEYS.length, 5);
assert.ok(pageDefinition.onClearLocalData, 'privacy page must expose local deletion');
assert.ok(pageDefinition.onOpenSettings, 'privacy page must expose permission settings');

console.log('privacyCenter.test.js: data summary and user controls passed');
