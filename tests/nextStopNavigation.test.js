const assert = require('assert');
const path = require('path');

const root = path.resolve(__dirname, '..');
const openedLocations = [];
const modals = [];
let pageDefinition;

global.getApp = () => ({ globalData: { careMode: false, env: '' } });
global.wx = {
  getStorageSync() { return {}; },
  setStorageSync() {},
  showToast() {},
  showModal(options) { modals.push(options); },
  openLocation(options) { openedLocations.push(options); },
  vibrateShort() {},
  cloud: null
};
global.Page = definition => {
  pageDefinition = definition;
};

const pagePath = path.join(root, 'miniprogram', 'pages', 'study-tour', 'index.js');
delete require.cache[require.resolve(pagePath)];
require(pagePath);

function createPage(data) {
  return {
    ...pageDefinition,
    data: { ...pageDefinition.data, ...data },
    setData(update) {
      Object.assign(this.data, update);
    }
  };
}

const first = { id: 'seg_2', name: '第一站', type: 'site' };
const second = { id: 'seg_3', name: '第二站', type: 'site' };
const tour = { segments: [first, second] };
const page = createPage({
  tour,
  siteSegments: [first, second],
  checkedIn: { seg_2: true },
  checkInCount: 1,
  totalSegments: 2
});

assert.strictEqual(page.getNextUncheckedSite().id, 'seg_3', 'must select first unchecked site');
page.onSegmentTap({ currentTarget: { dataset: { id: 'seg_3' } } });
assert.strictEqual(page.data.currentSegment, 1, 'short routes must use actual index, not original route order');
page.onSegmentTap({ currentTarget: { dataset: { id: 'missing' } } });
assert.strictEqual(page.data.currentSegment, 1, 'unknown segment must leave current card unchanged');
page.onNavigateToNext();
assert.strictEqual(page.data.currentSegment, 1, 'must switch swiper to next site card');
assert.strictEqual(openedLocations.length, 0, 'must not navigate to an unverified coordinate');
assert.strictEqual(modals.length, 1, 'must explain why navigation is unavailable');
assert(modals[0].content.includes('不提供推测导航'), 'must disclose coordinate safety boundary');

second.latitude = 26.6204;
second.longitude = 114.0465;
page.onNavigateToNext();
assert.strictEqual(openedLocations.length, 1, 'verified coordinate should open map navigation');
assert.strictEqual(openedLocations[0].name, '第二站');

let certificateCalls = 0;
page.data.checkedIn = { seg_2: true, seg_3: true };
page.onShowCertificate = () => { certificateCalls += 1; };
page.onNavigateToNext();
assert.strictEqual(certificateCalls, 1, 'completed route should open certificate flow');

const { studyTour, routePresets } = require(path.join(root, 'miniprogram', 'utils', 'data.js'));
assert(studyTour.totalDistance.includes('待实测'), 'tour total distance must disclose pending measurement');
assert(
  studyTour.segments.filter(segment => segment.distance).every(segment => segment.distance.includes('待实测')),
  'every segment distance must disclose pending measurement'
);
assert(
  routePresets.every(route => route.distance.includes('规划') && route.distance.includes('待实测')),
  'preset distances must be labeled as unverified planning references'
);

console.log('nextStopNavigation.test.js: next-site selection, safe navigation and distance disclosure passed');
