'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'miniprogram/pages/study-tour/index.js'), 'utf8');
const wxml = fs.readFileSync(path.join(root, 'miniprogram/pages/study-tour/index.wxml'), 'utf8');
const app = JSON.parse(fs.readFileSync(path.join(root, 'miniprogram/app.json'), 'utf8'));

for (const method of ['drawCertificatePoster', 'onSaveCertificate', 'onCloseCertificate']) {
  assert(new RegExp(`\\b${method}\\s*\\(`).test(js), `missing ${method}`);
}
assert(js.includes("wx.createCanvasContext('certificateCanvas'"), 'certificate canvas context missing');
assert(js.includes('wx.canvasToTempFilePath'), 'certificate export missing');
assert(js.includes('wx.saveImageToPhotosAlbum'), 'certificate album save missing');
assert(wxml.includes('canvas-id="certificateCanvas"'), 'certificate canvas missing');
assert(wxml.includes('certificate-preview'), 'certificate preview missing');
assert(app.permission && app.permission['scope.writePhotosAlbum'], 'album permission purpose missing');

console.log('certificatePoster.test.js: generate, preview and save flow passed');
