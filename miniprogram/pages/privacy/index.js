// pages/privacy/index.js
const USER_STORAGE_KEYS = [
  'qiaolinStudyTourCheckIns',
  'qiaolinPendingCheckInSync',
  'qiaolinPendingCorrections',
  'qiaolinQuizHighScore',
  'qiaolinCareMode',
  'qiaolinActiveRoutePreset'
];

function hasMeaningfulValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return value !== '' && value !== null && value !== undefined && value !== false;
}

function buildLocalDataSummary(storage) {
  const checkIns = storage.qiaolinStudyTourCheckIns || {};
  const pendingCheckIns = storage.qiaolinPendingCheckInSync || [];
  const pendingCorrections = storage.qiaolinPendingCorrections || [];
  return {
    checkInCount: Object.keys(checkIns).filter(key => checkIns[key]).length,
    pendingCheckInCount: Array.isArray(pendingCheckIns) ? pendingCheckIns.length : 0,
    pendingCorrectionCount: Array.isArray(pendingCorrections) ? pendingCorrections.length : 0,
    highScore: Number(storage.qiaolinQuizHighScore) || 0,
    careMode: Boolean(storage.qiaolinCareMode),
    storedItemCount: USER_STORAGE_KEYS.filter(key => hasMeaningfulValue(storage[key])).length
  };
}

Page({
  data: {
    summary: buildLocalDataSummary({}),
    locationAuthorized: false,
    cloudEnabled: false,
    lastRefreshedAt: ''
  },

  onShow() {
    this.refreshStatus();
  },

  refreshStatus() {
    const storage = USER_STORAGE_KEYS.reduce((result, key) => {
      result[key] = wx.getStorageSync(key);
      return result;
    }, {});
    const app = getApp();
    const update = setting => {
      this.setData({
        summary: buildLocalDataSummary(storage),
        locationAuthorized: Boolean(setting && setting.authSetting && setting.authSetting['scope.userLocation']),
        cloudEnabled: Boolean(app.globalData.cloudReady),
        lastRefreshedAt: this.formatTime(new Date())
      });
    };
    wx.getSetting({
      success: update,
      fail: () => update(null)
    });
  },

  formatTime(date) {
    const pad = value => String(value).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  },

  onOpenSettings() {
    wx.openSetting({
      success: () => this.refreshStatus(),
      fail: () => wx.showToast({ title: '未能打开权限设置', icon: 'none' })
    });
  },

  onClearLocalData() {
    wx.showModal({
      title: '清除本地学习记录',
      content: '将删除本机打卡、待同步记录、纠错草稿、答题最高分和关怀模式设置。已经提交到云端的记录不会被删除。',
      confirmText: '确认清除',
      confirmColor: '#B3261E',
      success: result => {
        if (!result.confirm) return;
        USER_STORAGE_KEYS.forEach(key => wx.removeStorageSync(key));
        const app = getApp();
        app.globalData.careMode = false;
        this.refreshStatus();
        wx.showToast({ title: '本地记录已清除', icon: 'success' });
      }
    });
  },

  onGoToCorrection() {
    wx.navigateTo({ url: '/pages/correction/index?sourceType=privacy&sourceId=privacy-center' });
  },

  onShareAppMessage() {
    return {
      title: '红韵乔林 - 可信与隐私说明',
      path: '/pages/privacy/index'
    };
  }
});

module.exports = {
  USER_STORAGE_KEYS,
  buildLocalDataSummary
};
