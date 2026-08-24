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
  '../miniprogram/utils/visitorSync.js'
);

async function run() {
  delete require.cache[servicePath];
  const visitorSync = require(servicePath);

  const missing = await visitorSync.syncCheckIn({ routeId: 'study_60' });
  assert.equal(missing.queued, false);
  assert.equal(missing.reason, 'missing-place-id');

  const first = await visitorSync.syncCheckIn({
    routeId: 'study_60',
    placeId: 'site_1',
    method: 'scan'
  });
  assert.equal(first.queued, true);
  assert.equal(storage[visitorSync.PENDING_SYNC_KEY].length, 1);

  await visitorSync.syncCheckIn({
    routeId: 'study_60',
    placeId: 'site_1',
    method: 'scan'
  });
  assert.equal(storage[visitorSync.PENDING_SYNC_KEY].length, 1);

  global.getApp = () => ({ globalData: { env: 'test-env' } });
  global.wx.cloud = {
    async callFunction() {
      return { result: { ok: true, data: { _id: 'cloud-checkin' } } };
    }
  };

  const flushed = await visitorSync.flushPendingCheckIns();
  assert.equal(flushed.synced, 1);
  assert.equal(flushed.remaining, 0);

  const online = await visitorSync.syncCheckIn({
    routeId: 'study_60',
    placeId: 'site_2',
    method: 'manual'
  });
  assert.equal(online.synced, true);
  assert.equal(online.queued, false);

  console.log('visitorSync.test.js: all tests passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

