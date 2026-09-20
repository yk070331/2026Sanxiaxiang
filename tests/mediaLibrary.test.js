const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { photoGallery, redStories } = require('../miniprogram/utils/data');
const miniRoot = path.join(__dirname, '../miniprogram');
const openPhotos = photoGallery.filter(p => p.sourceKind === 'open-license');
assert.strictEqual(openPhotos.length, 5);
for (const p of openPhotos) {
  assert(p.creator && p.license === 'CC BY-SA 4.0');
  assert(p.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:'));
  assert(p.licenseUrl.startsWith('https://creativecommons.org/licenses/by-sa/4.0'));
  assert(p.desc.includes('非乔林') || p.desc.includes('并非乔林'));
  const bytes = fs.readFileSync(path.join(miniRoot, p.src));
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex'), p.sha256);
  assert(bytes.length < 200 * 1024);
}
const record = require('../参赛材料/合成讲解制作记录.json');
for (const story of redStories) {
  assert(story.audioAvailable && story.audioKind === 'synthetic');
  assert(story.audioSourceLabel.includes('非真人口述'));
  assert(story.audioScript.startsWith('这是人工智能合成讲解，不是真人口述。'));
  const media = record.find(item => item.id === story.id);
  const bytes = fs.readFileSync(path.join(miniRoot, story.audio));
  assert(media && media.durationSeconds > 15 && media.durationSeconds < 90);
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex'), media.sha256);
}
let definition;
global.Page = value => { definition = value; };
const copied = [];
global.wx = { setClipboardData: data => copied.push(data.data), showToast() {} };
require('../miniprogram/assets/gallery/index');
const gallery = { ...definition, data: { ...definition.data, allPhotos: photoGallery }, setData(value) { Object.assign(this.data, value); } };
gallery.filterPhotos('all');
assert.strictEqual(gallery.data.photos.length, 34, 'default gallery hides missing photographs');
gallery.filterPhotos('licensed');
assert.strictEqual(gallery.data.photos.length, 5);
gallery.onPhotoTap({ currentTarget: { dataset: { index: 0 } } });
assert.strictEqual(gallery.data.previewItems.length, 5);
gallery.onCopyCredit({ currentTarget: { dataset: { field: 'sourceUrl' } } });
assert.strictEqual(copied[0], gallery.data.previewItems[0].sourceUrl);
gallery.onCopyCredit({ currentTarget: { dataset: { field: 'src' } } });
assert.strictEqual(copied.length, 1, 'credit copying accepts only documented URL fields');
gallery.onTogglePending();
assert.strictEqual(gallery.data.photos.length, 41);
gallery.filterPhotos('nature');
assert(gallery.data.photos.every(p => p.category === 'nature'));
console.log('mediaLibrary.test.js: licensed-image provenance, synthetic narration, asset checksums, gallery filters and credits passed');
