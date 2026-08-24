'use strict';

const assert = require('assert');
const path = require('path');

let pageDefinition;
let loadingShown = false;
let loadingHidden = false;
let exported = false;
let saved = false;
let toastTitle = '';

const canvasContext = {
  setFillStyle() {},
  fillRect() {},
  setStrokeStyle() {},
  setLineWidth() {},
  strokeRect() {},
  setTextAlign() {},
  setFontSize() {},
  fillText() {},
  beginPath() {},
  moveTo() {},
  lineTo() {},
  stroke() {},
  arc() {},
  fill() {},
  draw(reserve, callback) {
    assert.strictEqual(reserve, false);
    callback();
  }
};

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  showLoading() { loadingShown = true; },
  hideLoading() { loadingHidden = true; },
  showToast(options) { toastTitle = options.title; },
  createCanvasContext(canvasId) {
    assert.strictEqual(canvasId, 'certificateCanvas');
    return canvasContext;
  },
  canvasToTempFilePath(options) {
    exported = true;
    assert.strictEqual(options.destWidth, 1500);
    assert.strictEqual(options.destHeight, 2000);
    options.success({ tempFilePath: 'wxfile://certificate.png' });
  },
  saveImageToPhotosAlbum(options) {
    saved = true;
    assert.strictEqual(options.filePath, 'wxfile://certificate.png');
    options.success();
  }
};

const nativeSetTimeout = global.setTimeout;
global.setTimeout = callback => {
  callback();
  return 1;
};

require(path.join(__dirname, '..', 'miniprogram', 'pages', 'study-tour', 'index.js'));

const page = {
  ...pageDefinition,
  data: {
    ...pageDefinition.data,
    tour: { title: '60分钟研学线' },
    totalSegments: 6,
    checkInCount: 6
  },
  setData(changes) {
    this.data = { ...this.data, ...changes };
  }
};

try {
  page.onShowCertificate.call(page);
  assert(loadingShown, 'certificate generation should show loading');
  assert(loadingHidden, 'certificate generation should hide loading');
  assert(exported, 'certificate should export canvas to PNG');
  assert.strictEqual(page.data.certificateImage, 'wxfile://certificate.png');
  assert.strictEqual(page.data.certificateVisible, true);

  page.onSaveCertificate.call(page);
  assert(saved, 'certificate should be saved to album');
  assert.strictEqual(toastTitle, '证书已保存');
} finally {
  global.setTimeout = nativeSetTimeout;
}

console.log('certificatePosterRuntime.test.js: unlock, draw, export and save passed');
