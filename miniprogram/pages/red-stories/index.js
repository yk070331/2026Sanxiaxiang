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
    ...(verificationProfiles[story.id] || {
      verificationStatus: '待审核',
      verificationClass: 'pending',
      verificationNote: '尚未录入审核依据，不作为确定史实发布。'
    })
  }));
}

const displayStories = buildDisplayStories(redStories);

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
    this.setData({ stories: displayStories });
    if (options.storyId) {
      const story = displayStories.find(item => item.id === options.storyId);
      if (story) this.openStory(story);
    }
  },

  onCategoryChange(e) {
    this.setData({ currentCategory: e.currentTarget.dataset.id });
  },

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
    const story = displayStories.find(item => item.id === e.currentTarget.dataset.id);
    if (story) this.openStory(story);
  },

  onCloseStory() {
    this.stopAudio();
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
      this.innerAudioCtx = wx.createInnerAudioContext();
      this.innerAudioCtx.onPlay(() => {
        this.setData({ isPlaying: true, playingStoryId: story.id });
      });
      this.innerAudioCtx.onPause(() => this.setData({ isPlaying: false }));
      this.innerAudioCtx.onStop(() => this.setData({ isPlaying: false }));
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
      this.innerAudioCtx.onError(error => {
        console.error('音频播放失败:', error);
        wx.showToast({ title: '音频播放失败', icon: 'none' });
        this.setData({ isPlaying: false });
      });
    }

    this.innerAudioCtx.src = story.audio;
    if (story.audioDuration) this.setData({ audioDuration: story.audioDuration });
    this.innerAudioCtx.play();
  },

  pauseAudio() {
    if (this.innerAudioCtx) this.innerAudioCtx.pause();
  },

  stopAudio() {
    if (this.innerAudioCtx) this.innerAudioCtx.stop();
  },

  onAudioSeek(e) {
    if (!this.innerAudioCtx) return;
    const duration = this.innerAudioCtx.duration || 1;
    this.innerAudioCtx.seek((e.detail.value / 100) * duration);
  },

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
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
