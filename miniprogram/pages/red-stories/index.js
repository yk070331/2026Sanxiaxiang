// pages/red-stories/index.js
const { redStories } = require('../../utils/data.js');

// 史料状态单独维护，防止未经核验的村级口述在界面中被误读为确定史实。
const verificationProfiles = {
  story_1: {
    verificationStatus: '基础史实已核验',
    verificationClass: 'verified',
    verificationNote: '八角楼相关基础史实可依据公开权威资料核对；当前口述人姓名、采录日期和原声音频仍待提供原始记录。'
  },
  story_2: {
    verificationStatus: '村级口述待审核',
    verificationClass: 'pending',
    verificationNote: '需补充标语原文照片、口述授权、采访原始记录及村级或文旅部门审核意见。'
  },
  story_3: {
    verificationStatus: '村级史料待审核',
    verificationClass: 'pending',
    verificationNote: '党支部成立时间、首任书记及相关人物信息需以地方党史、档案或审核材料为准。'
  },
  story_4: {
    verificationStatus: '村级口述待审核',
    verificationClass: 'pending',
    verificationNote: '需补充红军井现场铭牌、口述授权、采访原始记录和审核单位。'
  },
  story_5: {
    verificationStatus: '基础史实已核验',
    verificationClass: 'verified',
    verificationNote: '黄洋界保卫战基础史实可依据权威公开资料核对；当前署名与采录日期仍需原始材料确认。'
  },
  story_6: {
    verificationStatus: '基础史实已核验',
    verificationClass: 'verified',
    verificationNote: '“朱德的扁担”基础史实可依据权威公开资料核对，后续应补充具体版本来源。'
  }
};

function buildDisplayStories(stories) {
  return stories.map(story => ({
    ...story,
    excerpt: story.text.slice(0, 80) + (story.text.length > 80 ? '…' : ''),
    briefText: story.text.length > 240 ? story.text.slice(0, 240) + '…' : story.text,
    ...(verificationProfiles[story.id] || {
      verificationStatus: '待审核',
      verificationClass: 'pending',
      verificationNote: '尚未录入审核依据，不作为确定史实发布。'
    })
  }));
}

const displayStories = buildDisplayStories(redStories);
const playbackRates = [0.75, 1, 1.25, 1.5];

function currentApp() {
  return typeof getApp === 'function' ? getApp() : null;
}

Page({
  data: {
    stories: [],
    currentStory: null,
    storyId: '',
    currentCategory: 'all',
    categories: [
      { id: 'all', name: '全部' },
      { id: '革命往事', name: '革命往事' },
      { id: '红色人物', name: '红色人物' }
    ],
    isPlaying: false,
    playingStoryId: '',
    audioCurrentTime: '00:00',
    audioDuration: '00:00',
    audioProgress: 0,
    careMode: false,
    readingMode: 'brief',
    playbackRate: 1,
    playbackRates,
    rateSupported: true
  },

  onLoad(options = {}) {
    this.setData({ stories: displayStories });
    this.onShow();
    if (options.storyId) {
      const story = displayStories.find(item => item.id === options.storyId);
      if (story) this.openStory(story);
    }
  },

  onShow() {
    const app = currentApp();
    this.setData({ careMode: Boolean(app && app.globalData && app.globalData.careMode) });
  },

  onToggleCare() {
    const careMode = !this.data.careMode;
    const app = currentApp();
    if (app && app.globalData) app.globalData.careMode = careMode;
    this.setData({ careMode });
    try { wx.setStorageSync('qiaolinCareMode', careMode); }
    catch (error) { wx.showToast({ title: '已切换，本机设置暂未保存', icon: 'none' }); }
  },

  onReadingModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    if (mode === 'brief' || mode === 'full') this.setData({ readingMode: mode });
  },

  onCategoryChange(e) {
    this.setData({ currentCategory: e.currentTarget.dataset.id });
  },

  openStory(story) {
    this.disposeAudio();
    this.setData({
      currentStory: story,
      storyId: story.id,
      isPlaying: false,
      playingStoryId: '',
      audioCurrentTime: '00:00',
      audioDuration: '00:00',
      audioProgress: 0,
      readingMode: 'brief'
    });
  },

  onStoryTap(e) {
    const story = displayStories.find(item => item.id === e.currentTarget.dataset.id);
    if (story) this.openStory(story);
  },

  onCloseStory() {
    this.disposeAudio();
    this.setData({ currentStory: null, storyId: '' });
  },

  onStopPropagation() {},

  onToggleAudio() {
    if (this.data.isPlaying) this.pauseAudio();
    else this.playAudio();
  },

  playAudio() {
    const story = this.data.currentStory;
    if (!story || !story.audio || !story.audioAvailable) {
      wx.showToast({ title: '音频资源暂未上传', icon: 'none' });
      return;
    }

    if (!this.innerAudioCtx) {
      const context = wx.createInnerAudioContext();
      this.innerAudioCtx = context;
      // 旧实例的延迟回调不得修改新故事的播放状态。
      const active = () => this.innerAudioCtx === context
        && this.data.currentStory && this.data.currentStory.id === story.id;
      context.onPlay(() => {
        if (!active()) return;
        this.setData({ isPlaying: true, playingStoryId: story.id });
      });
      context.onPause(() => { if (active()) this.setData({ isPlaying: false }); });
      context.onStop(() => { if (active()) this.setData({ isPlaying: false }); });
      context.onEnded(() => {
        if (!active()) return;
        this.setData({ isPlaying: false, audioProgress: 0, audioCurrentTime: '00:00' });
      });
      const updateProgress = () => {
        if (!active()) return;
        const current = Number.isFinite(context.currentTime) ? Math.max(0, context.currentTime) : 0;
        const duration = Number.isFinite(context.duration) && context.duration > 0 ? context.duration : 0;
        this.setData({
          audioCurrentTime: this.formatTime(current),
          audioDuration: this.formatTime(duration),
          audioProgress: duration ? Math.min(100, Math.round(current / duration * 100)) : 0
        });
      };
      context.onTimeUpdate(updateProgress);
      context.onCanplay(updateProgress);
      context.onError(error => {
        if (!active()) return;
        console.error('音频播放失败:', error);
        this.disposeAudio();
        wx.showToast({ title: '音频加载失败，请重试或阅读文字', icon: 'none' });
      });
      context.src = story.audio;
    }

    // 暂停续播时不重新赋 src，保留原播放位置。
    this.applyPlaybackRate(this.data.playbackRate);
    this.innerAudioCtx.play();
  },

  onPlaybackRateChange(e) {
    const rate = Number(e.currentTarget.dataset.rate);
    if (!playbackRates.includes(rate)) return;
    this.applyPlaybackRate(rate);
  },

  applyPlaybackRate(rate) {
    const context = this.innerAudioCtx;
    if (context) {
      try {
        if (!('playbackRate' in context)) throw new Error('unsupported');
        context.playbackRate = rate;
        if (context.playbackRate !== rate) throw new Error('unsupported');
      } catch (error) {
        try { context.playbackRate = 1; } catch (ignored) { /* 原速降级 */ }
        this.setData({ playbackRate: 1, rateSupported: false });
        if (rate !== 1) wx.showToast({ title: '当前设备暂不支持倍速，使用原速', icon: 'none' });
        return;
      }
    }
    this.setData({ playbackRate: rate, rateSupported: true });
  },

  pauseAudio() {
    if (this.innerAudioCtx) this.innerAudioCtx.pause();
    this.setData({ isPlaying: false });
  },

  stopAudio() {
    if (this.innerAudioCtx) this.innerAudioCtx.stop();
    this.setData({ isPlaying: false, playingStoryId: '', audioCurrentTime: '00:00', audioProgress: 0 });
  },

  disposeAudio() {
    const context = this.innerAudioCtx;
    this.innerAudioCtx = null;
    if (context) {
      context.stop();
      context.destroy();
    }
    this.setData({ isPlaying: false, playingStoryId: '', audioCurrentTime: '00:00', audioDuration: '00:00', audioProgress: 0 });
  },

  onAudioSeek(e) {
    if (!this.innerAudioCtx) return;
    const duration = this.innerAudioCtx.duration;
    const value = Number(e.detail.value);
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(value)) return;
    const percent = Math.max(0, Math.min(100, value));
    const seconds = percent / 100 * duration;
    this.innerAudioCtx.seek(seconds);
    this.setData({ audioProgress: percent, audioCurrentTime: this.formatTime(seconds) });
  },

  formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  },

  onHide() { this.pauseAudio(); },

  onUnload() { this.disposeAudio(); },

  onShareAppMessage() {
    return {
      title: `红韵乔林 - ${this.data.currentStory ? this.data.currentStory.title : '红色故事'}`,
      path: `/pages/red-stories/index?storyId=${this.data.storyId}`
    };
  }
});
