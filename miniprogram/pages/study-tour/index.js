// pages/study-tour/index.js
const { studyTour, routePresets, mapPlaces } = require('../../utils/data.js');
const CHECK_IN_STORAGE_KEY = 'qiaolinStudyTourCheckIns';

Page({
  data: {
    tour: null,
    currentSegment: 0,
    checkedIn: {},  // { segmentId: true }
    checkInCount: 0,
    totalSegments: 0,
    siteSegments: [],
    careMode: false,
    activePresetId: ''
  },

  onLoad(options = {}) {
    const preset = routePresets.find(route => route.id === options.preset);
    const reservoir = mapPlaces.find(place => place.id === 'place_qiaolin_reservoir');
    const segments = preset
      ? preset.segmentIds.map(segmentId => {
        if (segmentId === 'nature_reservoir' && reservoir) {
          return {
            id: 'nature_reservoir',
            order: preset.segmentIds.indexOf(segmentId) + 1,
            name: reservoir.name,
            type: 'nature',
            latitude: reservoir.latitude,
            longitude: reservoir.longitude,
            description: reservoir.desc,
            tips: '水库点位为水面中心，导航时请以现场道路和安全提示为准。'
          };
        }
        return studyTour.segments.find(segment => segment.id === segmentId);
      }).filter(Boolean)
      : studyTour.segments;
    const activeTour = preset
      ? {
        ...studyTour,
        title: preset.title,
        totalDistance: preset.distance,
        estimatedTime: preset.duration,
        difficulty: preset.difficulty,
        description: preset.summary,
        segments
      }
      : studyTour;

    // 计算仅站点（排除起点终点）
    const siteSegments = activeTour.segments.filter(s => s.type === 'site');
    const totalSegments = siteSegments.length;
    const storedCheckIns = wx.getStorageSync(CHECK_IN_STORAGE_KEY) || {};
    const checkedIn = siteSegments.reduce((result, segment) => {
      if (storedCheckIns[segment.id]) result[segment.id] = true;
      return result;
    }, {});

    this.setData({
      tour: activeTour,
      totalSegments,
      siteSegments,
      checkedIn,
      checkInCount: Object.keys(checkedIn).length,
      careMode: Boolean(getApp().globalData.careMode),
      activePresetId: preset ? preset.id : ''
    });
  },

  onShow() {
    this.setData({ careMode: Boolean(getApp().globalData.careMode) });
  },

  // 切换当前查看的站点段
  onSegmentTap(e) {
    const order = Number(e.currentTarget.dataset.order);
    const segment = this.data.tour.segments.find(s => s.order === order);
    if (segment) {
      this.setData({ currentSegment: order - 1 });
    }
  },

  // 打卡
  onCheckIn(e) {
    const segmentId = e.currentTarget.dataset.id;
    this.markCheckIn(segmentId);
  },

  markCheckIn(segmentId, options = {}) {
    const isValidSite = this.data.siteSegments.some(segment => segment.id === segmentId);
    if (!isValidSite) {
      wx.showToast({ title: '未找到对应打卡点', icon: 'none' });
      return false;
    }
    const checkedIn = { ...this.data.checkedIn };

    if (checkedIn[segmentId]) {
      if (!options.silent) wx.showToast({ title: '已打卡，无需重复', icon: 'none' });
      return true;
    }

    checkedIn[segmentId] = true;
    const checkInCount = Object.keys(checkedIn).length;

    this.setData({ checkedIn, checkInCount });
    wx.setStorageSync(CHECK_IN_STORAGE_KEY, checkedIn);

    // 振动反馈
    wx.vibrateShort({ type: 'medium' });

    // 全部打卡完成提示
    if (checkInCount === this.data.totalSegments) {
      wx.showModal({
        title: '🎉 恭喜！',
        content: '您已完成乔林村红色研学路线的全部打卡点！',
        confirmText: '太棒了',
        showCancel: false
      });
    } else {
      if (!options.silent) wx.showToast({
        title: `已打卡 ${checkInCount}/${this.data.totalSegments}`,
        icon: 'success'
      });
    }
    return true;
  },

  // 扫描现场二维码。支持 qiaolin://site/site_1 或包含 ?id=site_1 的小程序码内容。
  onScanSiteCode() {
    wx.scanCode({
      onlyFromCamera: false,
      success: result => {
        const content = result.path || result.result || '';
        const match = content.match(/(?:qiaolin:\/\/site\/|[?&]id=)(site_\d+)/i);
        const siteId = match && match[1];
        const segment = this.data.siteSegments.find(item => item.siteId === siteId);
        if (!siteId || !segment) {
          wx.showModal({
            title: '无法识别',
            content: '这不是乔林村研学点二维码，请扫描现场正式标识。',
            showCancel: false
          });
          return;
        }
        this.markCheckIn(segment.id, { silent: true });
        const segmentIndex = this.data.tour.segments.findIndex(item => item.id === segment.id);
        if (segmentIndex >= 0) this.setData({ currentSegment: segmentIndex });
        wx.showToast({ title: '扫码打卡成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/site-detail/index?id=${encodeURIComponent(siteId)}`
          });
        }, 500);
      },
      fail: error => {
        if (!error || !String(error.errMsg || '').includes('cancel')) {
          wx.showToast({ title: '扫码失败，请重试', icon: 'none' });
        }
      }
    });
  },

  // 查看故事
  onViewStory(e) {
    const storyId = e.currentTarget.dataset.storyId;
    if (storyId) {
      wx.navigateTo({
        url: `/pages/red-stories/index?storyId=${storyId}`
      });
    }
  },

  // 一键导航到当前站点
  onNavigateToSegment(e) {
    const segmentId = e.currentTarget.dataset.id;
    const segment = this.data.tour.segments.find(item => item.id === segmentId);
    if (!segment || !Number.isFinite(segment.latitude) || !Number.isFinite(segment.longitude)) {
      wx.showToast({ title: '该点位坐标待核验', icon: 'none' });
      return;
    }
    wx.openLocation({
      latitude: segment.latitude,
      longitude: segment.longitude,
      name: segment.name,
      address: '江西省吉安市井冈山市茅坪镇乔林村',
      scale: 17
    });
  },

  // 导航到路线起点
  onNavigateToStart() {
    const start = this.data.tour.segments[0];
    if (!start || !Number.isFinite(start.latitude) || !Number.isFinite(start.longitude)) {
      wx.showToast({ title: '路线起点坐标待核验', icon: 'none' });
      return;
    }
    wx.openLocation({
      latitude: start.latitude,
      longitude: start.longitude,
      name: start.name,
      address: '江西省吉安市井冈山市茅坪镇乔林村',
      scale: 17
    });
  },

  onGoToRouteRecommend() {
    wx.navigateTo({ url: '/pages/route-recommend/index' });
  },

  onShowCertificate() {
    if (!this.data.totalSegments || this.data.checkInCount < this.data.totalSegments) {
      wx.showToast({ title: '完成全部旧址打卡后解锁', icon: 'none' });
      return;
    }
    const date = new Date();
    const dateText = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    wx.showModal({
      title: '乔林红色研学证书',
      content: `你已于${dateText}完成“${this.data.tour.title}”全部红色旧址打卡。`,
      confirmText: '完成',
      showCancel: false
    });
  },

  onToggleCare() {
    const app = getApp();
    const careMode = !this.data.careMode;
    app.globalData.careMode = careMode;
    wx.setStorageSync('qiaolinCareMode', careMode);
    this.setData({ careMode });
  },

  // 滑动切换
  onSwiperChange(e) {
    this.setData({ currentSegment: e.detail.current });
  },

  onShareAppMessage() {
    return {
      title: `红韵乔林 - ${this.data.tour ? this.data.tour.title : '乔林村研学路线'}`,
      path: `/pages/study-tour/index${this.data.activePresetId ? `?preset=${this.data.activePresetId}` : ''}`
    };
  }
});
