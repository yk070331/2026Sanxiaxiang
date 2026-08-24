'use strict';

const assert = require('assert');
const path = require('path');

let pageDefinition;
global.Page = definition => {
  pageDefinition = definition;
};

require(path.join(__dirname, '..', 'miniprogram', 'pages', 'red-stories', 'index.js'));

const page = {
  ...pageDefinition,
  data: { ...pageDefinition.data },
  setData(changes) {
    this.data = { ...this.data, ...changes };
  }
};

page.onLoad.call(page, {});

assert.strictEqual(page.data.stories.length, 6, 'all stories should be available');
for (const story of page.data.stories) {
  assert.ok(story.verificationStatus, `${story.id} missing verificationStatus`);
  assert.ok(['verified', 'pending'].includes(story.verificationClass), `${story.id} invalid verificationClass`);
  assert.ok(story.verificationNote.length >= 20, `${story.id} verification note is too short`);
}

assert.strictEqual(
  page.data.stories.filter(story => story.verificationClass === 'verified').length,
  3,
  'three public-history stories should be marked as basic facts verified'
);
assert.strictEqual(
  page.data.stories.filter(story => story.verificationClass === 'pending').length,
  3,
  'three local oral-history stories should remain pending review'
);

console.log('storyVerification.test.js: all stories expose explicit review status');
