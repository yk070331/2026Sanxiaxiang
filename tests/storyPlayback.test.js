'use strict';
const assert = require('assert');
let definition;
const app = { globalData: { careMode: true } };
const contexts = [];
const stored = {};
const toasts = [];
global.Page = value => { definition = value; };
global.getApp = () => app;
global.wx = {
  setStorageSync(key, value) { stored[key] = value; },
  showToast(value) { toasts.push(value.title); },
  createInnerAudioContext() {
    const handlers = {};
    const audio = {
      playbackRate: 1, currentTime: 0, duration: 120, srcAssignments: 0,
      set src(value) { this.source = value; this.srcAssignments++; this.currentTime = 0; },
      get src() { return this.source; },
      play() { handlers.Play(); },
      pause() { handlers.Pause(); },
      stop() { this.stopped = true; handlers.Stop(); },
      destroy() { this.destroyed = true; },
      seek(value) { this.currentTime = value; },
      emit(name, value) { handlers[name](value); }
    };
    for (const event of ['Play', 'Pause', 'Stop', 'Ended', 'TimeUpdate', 'Canplay', 'Error']) {
      audio['on' + event] = handler => { handlers[event] = handler; };
    }
    contexts.push(audio);
    return audio;
  }
};
require('../miniprogram/pages/red-stories/index.js');
const page = { ...definition, data: { ...definition.data }, setData(value) { Object.assign(this.data, value); } };
page.onLoad();
assert.strictEqual(page.data.careMode, true);
page.onToggleCare();
assert.strictEqual(app.globalData.careMode, false);
assert.strictEqual(stored.qiaolinCareMode, false);
app.globalData.careMode = true;
page.onShow();
assert.strictEqual(page.data.careMode, true, 'care preference must follow other pages');
const story = page.data.stories[0];
assert(story.text.startsWith(story.briefText.replace(/…$/, '')), 'brief must be an original excerpt');
assert(story.briefText.length <= 241);
page.openStory({ ...story, audioAvailable: false });
page.onReadingModeChange({ currentTarget: { dataset: { mode: 'full' } } });
assert.strictEqual(page.data.readingMode, 'full');
assert.strictEqual(page.data.currentStory.verificationStatus, story.verificationStatus);
page.playAudio();
assert.strictEqual(contexts.length, 0, 'missing recording must not create audio');
assert(toasts.pop().includes('暂未上传'));
page.openStory({ ...story, audioAvailable: true, audio: '/test-fixture.mp3' });
page.playAudio();
const first = contexts[0];
assert.strictEqual(page.data.isPlaying, true);
first.currentTime = 42;
first.emit('TimeUpdate');
page.pauseAudio();
assert.strictEqual(page.data.audioCurrentTime, '00:42', 'pause must retain displayed progress');
page.playAudio();
assert.strictEqual(first.srcAssignments, 1, 'resume must not reset src');
assert.strictEqual(first.currentTime, 42);
page.onPlaybackRateChange({ currentTarget: { dataset: { rate: '1.5' } } });
assert.strictEqual(first.playbackRate, 1.5);
page.onPlaybackRateChange({ currentTarget: { dataset: { rate: '99' } } });
assert.strictEqual(first.playbackRate, 1.5, 'invalid rate rejected');
page.onAudioSeek({ detail: { value: 150 } });
assert.strictEqual(first.currentTime, 120, 'seek bounded to duration');
first.duration = NaN;
page.onAudioSeek({ detail: { value: 50 } });
assert.strictEqual(first.currentTime, 120, 'unknown duration cannot seek');
page.openStory({ ...page.data.stories[1], audioAvailable: true, audio: '/second-fixture.mp3' });
assert(first.stopped && first.destroyed);
page.playAudio();
const second = contexts[1];
assert.strictEqual(second.playbackRate, 1.5, 'selected rate applies to new story');
first.emit('TimeUpdate');
first.emit('Play');
first.emit('Ended');
first.emit('Error', { errMsg: 'late callback' });
assert.strictEqual(page.data.playingStoryId, page.data.stories[1].id, 'old callbacks cannot change new story');
assert.strictEqual(page.data.isPlaying, true);
assert.strictEqual(page.data.audioCurrentTime, '00:00');
page.onHide();
assert.strictEqual(page.data.isPlaying, false, 'background must pause audio');
delete second.playbackRate;
page.onPlaybackRateChange({ currentTarget: { dataset: { rate: 0.75 } } });
assert.strictEqual(page.data.playbackRate, 1);
assert.strictEqual(page.data.rateSupported, false, 'unsupported device falls back explicitly');
page.onUnload();
assert(second.destroyed);
assert.strictEqual(page.innerAudioCtx, null);
assert.strictEqual(page.formatTime(Infinity), '00:00');
delete global.getApp;
page.onLoad({});
assert.strictEqual(page.data.careMode, false, 'standalone test must not require getApp');
console.log('storyPlayback.test.js: reading, care mode, missing assets, resume, rates, seek and stale callbacks passed');
