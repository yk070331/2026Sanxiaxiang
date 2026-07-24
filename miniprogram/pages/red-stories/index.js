// pages/red-stories/index.js
const { redStories } = require('../../utils/data.js');

const audioManager = wx.getBackgroundAudioManager ? wx.getBackgroundAudioManager() : null;

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
    audioProgress: 0
  },

  onLoad(options) {
    this.setData({ stories: redStories });

    // 如果传入了指定故事ID，直接打开
    if (options.storyId) {
      const story = redStories.find(s => s.id === options.storyId);
      if (story) {
        this.openStory(story);
      }
    }
  },

  // 分类切换
  onCategoryChange(e) {
    const category = e.currentTarget.dataset.id;
    this.setData({ currentCategory: category });
  },

  // 打开故事详情
  openStory(story) {
    this.setData({
      currentStory: story,
      storyId: story.id,
      isPlaying: false,
      playingStoryId: '',
      audioCurrentTime: '00:00',
      audioProgress: 0
    });
  },

  onStoryTap(e) {
    const id = e.currentTarget.dataset.id;
    const story = redStories.find(s => s.id === id);
    if (story) this.openStory(story);
  },

  // 关闭故事详情
  onCloseStory() {
    this.stopAudio();
    this.setData({ currentStory: null, storyId: '' });
  },

  // 阻止冒泡
  onStopPropagation() {},

  // 音频播放控制
  onToggleAudio() {
    if (this.data.isPlaying) {
      this.pauseAudio();
    } else {
      this.playAudio();
    }
  },

  playAudio() {
    const story = this.data.currentStory;
    if (!story || !story.audio) {
      wx.showToast({ title: '音频资源暂未上传', icon: 'none' });
      return;
    }

    // 使用 InnerAudioContext 播放
    if (!this.innerAudioCtx) {
      this.innerAudioCtx = wx.createInnerAudioContext();
      this.innerAudioCtx.onPlay(() => {
        this.setData({ isPlaying: true, playingStoryId: story.id });
      });
      this.innerAudioCtx.onPause(() => {
        this.setData({ isPlaying: false });
      });
      this.innerAudioCtx.onStop(() => {
        this.setData({ isPlaying: false });
      });
      this.innerAudioCtx.onEnded(() => {
        this.setData({ isPlaying: false, audioProgress: 0, audioCurrentTime: '00:00' });
      });
      this.innerAudioCtx.onTimeUpdate(() => {
        const current = this.innerAudioCtx.currentTime;
        const duration = this.innerAudioCtx.duration || 1;
        this.setData({
          audioCurrentTime: this.formatTime(current),
          audioProgress: Math.round((current / duration) * 100)
        });
      });
      this.innerAudioCtx.onError((err) => {
        console.error('音频播放失败:', err);
        wx.showToast({ title: '音频播放失败', icon: 'none' });
        this.setData({ isPlaying: false });
      });
    }

    this.innerAudioCtx.src = story.audio;
    // 显示音频时长
    if (story.audioDuration) {
      this.setData({ audioDuration: story.audioDuration });
    }
    this.innerAudioCtx.play();
  },

  pauseAudio() {
    if (this.innerAudioCtx) {
      this.innerAudioCtx.pause();
    }
  },

  stopAudio() {
    if (this.innerAudioCtx) {
      this.innerAudioCtx.stop();
    }
  },

  // 音频进度条拖动
  onAudioSeek(e) {
    if (!this.innerAudioCtx) return;
    const percent = e.detail.value;
    const duration = this.innerAudioCtx.duration || 1;
    this.innerAudioCtx.seek((percent / 100) * duration);
  },

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  onUnload() {
    this.stopAudio();
    if (this.innerAudioCtx) {
      this.innerAudioCtx.destroy();
      this.innerAudioCtx = null;
    }
  },

  onShareAppMessage() {
    return {
      title: `红韵乔林 - ${this.data.currentStory ? this.data.currentStory.title : '红色故事'}`,
      path: `/pages/red-stories/index?storyId=${this.data.storyId}`
    };
  }
});
