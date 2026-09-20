const assert = require('assert');
const path = require('path');

const appPath = path.resolve(__dirname, '../miniprogram/app.js');
const envPath = path.resolve(__dirname, '../miniprogram/config/env.js');

function loadApp({ envId = '', cloudInitError = null, modernApis = true, platform = 'android' } = {}) {
  let appDefinition;
  let cloudInitCalls = 0;
  global.App = definition => {
    appDefinition = definition;
  };
  global.wx = {
    getStorageSync(key) {
      if (key === 'qiaolinCloudEnvId') return envId;
      if (key === 'qiaolinCareMode') return false;
      return '';
    },
    cloud: {
      init(options) {
        cloudInitCalls += 1;
        if (cloudInitError) throw cloudInitError;
        assert.equal(options.env, envId.trim());
        assert.equal(options.traceUser, true);
      }
    },
    getSystemInfoSync() {
      throw new Error('Deprecated API must not be called');
    },
    getWindowInfo: modernApis ? () => ({ statusBarHeight: 24, windowWidth: 390 }) : undefined,
    getDeviceInfo: modernApis ? () => ({ platform }) : undefined,
    getNetworkType({ success }) {
      success({ networkType: 'wifi' });
    },
    onNetworkStatusChange() {}
  };
  delete require.cache[appPath];
  delete require.cache[envPath];
  require(appPath);
  appDefinition.onLaunch.call(appDefinition);
  return { appDefinition, cloudInitCalls };
}

let result = loadApp();
assert.equal(result.cloudInitCalls, 0);
assert.equal(result.appDefinition.globalData.cloudReady, false);
assert.equal(result.appDefinition.globalData.env, '');
assert.equal(result.appDefinition.globalData.statusBarHeight, 24);
assert.equal(result.appDefinition.globalData.navBarHeight, 48);
assert.equal(result.appDefinition.globalData.systemInfo.windowWidth, 390);

result = loadApp({ platform: 'ios' });
assert.equal(result.appDefinition.globalData.navBarHeight, 44);
result = loadApp({ modernApis: false });
assert.equal(result.appDefinition.globalData.statusBarHeight, 20);
assert.equal(result.appDefinition.globalData.isOnline, true, 'missing optional APIs must not interrupt launch');

result = loadApp({ envId: ' cloud1-qiaolin ' });
assert.equal(result.cloudInitCalls, 1);
assert.equal(result.appDefinition.globalData.cloudReady, true);
assert.equal(result.appDefinition.globalData.env, 'cloud1-qiaolin');

result = loadApp({
  envId: 'cloud1-invalid',
  cloudInitError: new Error('invalid environment')
});
assert.equal(result.cloudInitCalls, 1);
assert.equal(result.appDefinition.globalData.cloudReady, false);
assert.equal(result.appDefinition.globalData.cloudInitError, 'invalid environment');

console.log('appCloudInit.test.js: local env, cloud init and fallback passed');
