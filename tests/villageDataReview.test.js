'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'miniprogram', 'pages');
const pages = [
  path.join(root, 'index', 'index.wxml'),
  path.join(root, 'village-detail', 'index.wxml'),
  path.join(root, 'village-info', 'index.wxml')
];

for (const file of pages) {
  const source = fs.readFileSync(file, 'utf8');
  assert(source.includes('待村委复核'), `${path.relative(root, file)} must disclose pending village review`);
}

const villageInfo = fs.readFileSync(path.join(root, 'village-info', 'index.wxml'), 'utf8');
assert(villageInfo.includes('不作为官方统计发布') || villageInfo.includes('最终审核数据为准'));

console.log('villageDataReview.test.js: review notices cover all public village-data views');
