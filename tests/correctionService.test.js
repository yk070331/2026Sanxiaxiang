const assert = require('assert');
const path = require('path');

const storage = {};
global.getApp = () => ({ globalData: { env: '' } });
global.wx = {
  getStorageSync(key) {
    return storage[key];
  },
  setStorageSync(key, value) {
    storage[key] = value;
  }
};

const servicePath = path.resolve(
  __dirname,
  '../miniprogram/utils/correctionService.js'
);

async function run() {
  delete require.cache[servicePath];
  const correctionService = require(servicePath);

  const queued = await correctionService.submitCorrection({
    targetType: 'place',
    targetId: 'site_1',
    errorType: '地图位置错误',
    description: '现场入口应位于道路东侧',
    attachmentFileIds: []
  });
  assert.equal(queued.queued, true);
  assert.equal(storage[correctionService.PENDING_CORRECTIONS_KEY].length, 1);

  global.getApp = () => ({ globalData: { env: 'test-env' } });
  const submittedPayloads = [];
  global.wx.cloud = {
    async callFunction(request) {
      submittedPayloads.push(request.data);
      return { result: { ok: true, data: { _id: 'correction_1' } } };
    }
  };

  const flushed = await correctionService.flushPendingCorrections();
  assert.equal(flushed.synced, 1);
  assert.equal(flushed.remaining, 0);
  assert.equal(submittedPayloads[0].action, 'submitCorrection');
  assert.equal(submittedPayloads[0].targetId, 'site_1');

  const online = await correctionService.submitCorrection({
    targetType: 'media',
    targetId: 'photo_1',
    errorType: '图片归属错误',
    description: '该图片拍摄点位需要重新核验',
    attachmentFileIds: []
  });
  assert.equal(online.submitted, true);
  assert.equal(online.queued, false);

  console.log('correctionService.test.js: offline queue and cloud flush passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
