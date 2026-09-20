const assert = require('assert');
const nav = require('../miniprogram/utils/navigation');
const { redVillages, routePresets, studyTour } = require('../miniprogram/utils/data');
const storage = {};
const opened = [], modals = [], redirects = [], copied = [];
let definition;
global.Page = value => { definition = value; };
global.getApp = () => ({ globalData: { careMode: false, env: '' } });
global.wx = {
  getStorageSync: key => storage[key], setStorageSync: (key, value) => { storage[key] = value; },
  openLocation: value => opened.push(value), showModal: value => modals.push(value),
  setClipboardData: value => copied.push(value.data), redirectTo: value => redirects.push(value.url),
  navigateTo: value => redirects.push(value.url), showToast() {}, vibrateShort() {}, cloud: null
};
function page(modulePath) {
  delete require.cache[require.resolve(modulePath)]; require(modulePath);
  return { ...definition, data: JSON.parse(JSON.stringify(definition.data)), setData(value) { Object.assign(this.data, value); } };
}
const village = redVillages.find(v => v.id === 'village_1');
const arrival = nav.arrivalFor(village);
for (const target of [null, {}, { latitude: 99, longitude: 114 }, { latitude: 26, longitude: NaN }]) {
  assert.strictEqual(nav.hasCoordinates(target), false);
  assert.strictEqual(nav.openDestination(target), false);
}
nav.navigateWithArrival(village.sites[0], arrival);
assert.strictEqual(opened.length, 0, 'missing site coordinates must not silently open an unrelated destination');
assert(modals.at(-1).content.includes('集合点不等于该旧址'));
modals.at(-1).success({ confirm: false });
assert.strictEqual(opened.length, 0);
modals.at(-1).success({ confirm: true });
assert.strictEqual(opened.at(-1).latitude, village.latitude);
assert(opened.at(-1).name.includes('村委会'));
opened.at(-1).fail({ errMsg: 'openLocation:fail network unavailable' });
assert.strictEqual(modals.at(-1).title, '地图暂未打开');
modals.at(-1).success({ confirm: true });
assert(copied[0].includes('GCJ-02') && copied[0].includes('26.620306'));
assert(nav.locationFailure({ errMsg: 'getLocation:fail auth deny' }).settings);
assert(!nav.locationFailure({ errMsg: 'getLocation:fail api scope is not declared in the privacy agreement' }).settings);
assert(nav.locationFailure({ errMsg: 'getLocation:fail api scope is not declared in the privacy agreement' }).message.includes('隐私'));
assert(nav.locationFailure({ errMsg: 'getLocation:fail no permission' }).message.includes('后台'));
assert(nav.locationFailure({ errMsg: 'getLocation:fail timeout' }).message.includes('系统定位'));

storage.qiaolinStudyTourCheckIns = { seg_7: true };
for (const [index, preset] of routePresets.entries()) {
  const tour = page('../miniprogram/pages/study-tour/index');
  tour.onLoad({ preset: preset.id });
  assert.strictEqual(tour.data.routeChoiceIndex, index + 1);
  assert.deepStrictEqual(tour.data.tour.segments.map(s => s.id), preset.segmentIds);
  assert.deepStrictEqual(tour.data.siteSegments.map(s => s.stopNumber), tour.data.siteSegments.map((s, i) => i + 1));
  tour.onNavigateToStart();
  assert.strictEqual(opened.at(-1).latitude, arrival.latitude);
  assert(opened.at(-1).name.includes('村委会'));
  const prior = tour.data.routeChoiceIndex;
  const next = prior === 1 ? 2 : 1;
  tour.onRouteChange({ detail: { value: String(next) } });
  assert(redirects.at(-1).endsWith(`preset=${routePresets[next - 1].id}`));
  assert.strictEqual(storage.qiaolinStudyTourCheckIns.seg_7, true);
  const count = redirects.length;
  tour.onRouteChange({ detail: { value: '99' } });
  assert.strictEqual(redirects.length, count);
}
const full = page('../miniprogram/pages/study-tour/index');
full.onLoad({ preset: '' });
assert.strictEqual(full.data.totalSegments, 6);
assert(nav.hasCoordinates(studyTour.segments[0]));
const detail = page('../miniprogram/pages/village-detail/index');
detail.data.village = village;
const count = opened.length;
detail.onNavigate({ currentTarget: { dataset: { id: 'unknown-site' } } });
assert.strictEqual(opened.length, count);
detail.onSelectRoute({ currentTarget: { dataset: { id: 'beginner_30' } } });
assert(redirects.at(-1).endsWith('preset=beginner_30'));
console.log('navigationRoutes.test.js: arrival fallback consent, map failures, permission diagnosis and route switching passed');
