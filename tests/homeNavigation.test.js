const assert = require('assert');
const { routePresets, studyTour } = require('../miniprogram/utils/data');
const appConfig = require('../miniprogram/app.json');
const storage = {};
const app = { globalData: { careMode: false, env: '' } };
const modals = [];
const toasts = [];
let definition;
global.getApp = () => app;
global.Page = value => { definition = value; };
global.wx = {
  getStorageSync: key => storage[key],
  setStorageSync: (key, value) => { storage[key] = value; },
  showToast: value => toasts.push(value),
  showModal: value => modals.push(value),
  vibrateShort() {},
  cloud: null
};
function loadPage(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  require(modulePath);
  return { ...definition, data: JSON.parse(JSON.stringify(definition.data)), setData(value) { Object.assign(this.data, value); } };
}
const home = loadPage('../miniprogram/pages/index/index');
const pages = appConfig.pages.concat(appConfig.subPackages.flatMap(pkg => pkg.pages.map(p => `${pkg.root}/${p}`)));
home.data.quickEntries.forEach(entry => assert(pages.includes(entry.url.slice(1).split('?')[0]), `${entry.title} must open a registered page`));
home.onToggleCare();
assert.strictEqual(app.globalData.careMode, true);
assert.strictEqual(storage.qiaolinCareMode, true);
app.globalData.careMode = false;
home.onShow();
assert.strictEqual(home.data.careMode, false, 'home must reflect changes made on other pages');

const short = routePresets.find(p => p.segmentIds.filter(id => studyTour.segments.some(s => s.id === id && s.type === 'site')).length < 6);
assert(short);
const first = loadPage('../miniprogram/pages/study-tour/index');
first.onLoad({ preset: short.id });
assert.strictEqual(storage.qiaolinActiveRoutePreset, short.id);
const next = loadPage('../miniprogram/pages/study-tour/index');
next.onLoad({ action: 'next' });
assert.strictEqual(next.data.activePresetId, short.id, 'home shortcut must resume chosen route');
next.onReady();
assert.strictEqual(next.data.tour.segments[next.data.currentSegment].id, next.data.nextSiteId);
assert(modals.at(-1).content.includes('不提供推测导航'), 'shortcut must preserve unverified-coordinate protection');
const modalCount = modals.length;
next.onReady();
assert.strictEqual(modals.length, modalCount, 'entry action must run only once');

const locked = loadPage('../miniprogram/pages/study-tour/index');
locked.onLoad({ action: 'certificate' });
locked.onReady();
assert.strictEqual(locked.data.certificateVisible, false);
assert(toasts.at(-1).title.includes('解锁'), 'certificate shortcut must not bypass completion');
const outside = studyTour.segments.find(s => s.type === 'site' && !short.segmentIds.includes(s.id));
assert(outside);
storage.qiaolinStudyTourCheckIns = { [outside.id]: true };
locked.markCheckIn(locked.data.siteSegments[0].id);
assert.strictEqual(storage.qiaolinStudyTourCheckIns[outside.id], true, 'short-route check-in must retain other-route progress');
storage.qiaolinStudyTourCheckIns = Object.fromEntries(locked.data.siteSegments.map(s => [s.id, true]));
const completed = loadPage('../miniprogram/pages/study-tour/index');
completed.onLoad({ action: 'certificate' });
completed.data.certificateImage = '/cached-certificate.png';
completed.onReady();
assert.strictEqual(completed.data.certificateVisible, true);
storage.qiaolinActiveRoutePreset = 'deleted-preset';
const fallback = loadPage('../miniprogram/pages/study-tour/index');
fallback.onLoad();
assert.strictEqual(fallback.data.activePresetId, '');
assert.strictEqual(fallback.data.totalSegments, 6);
console.log('homeNavigation.test.js: shortcut routes, care mode, route resume, safe next stop, certificate gating and progress retention passed');
