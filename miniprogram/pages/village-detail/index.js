// pages/village-detail/index.js
const { redVillages, redStories, mapPlaces, routePresets } = require('../../utils/data.js');
const { hasCoordinates, locationFailure, arrivalFor, openDestination, navigateWithArrival } = require('../../utils/navigation.js');
const {
  distanceKm,
  formatDistance,
  estimateMinutes,
  formatMinutes
} = require('../../utils/geo.js');

Page({
  data: {
    village: null,
    currentTab: 0,
    tabs: [
      { id: 0, name: '村情信息', icon: '📋' },
      { id: 1, name: '红色故事', icon: '📖' },
      { id: 2, name: '实景相册', icon: '📷' },
      { id: 3, name: '研学导览', icon: '🚩' }
    ],
    relatedStories: [],
    careMode: false,
    isOnline: true,
    locating: false,
    locationSettingsNeeded: false,
    routeChoices: routePresets,
    distanceText: '点击测算',
    walkTimeText: '待定位',
    driveTimeText: '待定位',
    locationMessage: '获取当前位置后显示到村距离与预计时间'
  },

  onLoad(options) {
    const id = options.id || 'village_1';
    const village = redVillages.find(v => v.id === id);
    if (!village) {
      wx.showToast({ title: '村落信息未找到', icon: 'none' });
      return;
    }
    // 查找该村相关的红色故事
    const relatedStories = redStories.filter(s =>
      s.relatedSite && village.sites && village.sites.some(site => site.name === s.relatedSite)
    );
    const app = getApp();
    this.setData({
      village: { ...village, sites: (village.sites || []).map(site => ({ ...site, canNavigate: hasCoordinates(site) })) },
      relatedStories,
      careMode: Boolean(app.globalData.careMode),
      isOnline: app.globalData.isOnline !== false
    });
    this.networkListener = result => this.setData({ isOnline: result.isConnected });
    wx.onNetworkStatusChange(this.networkListener);
  },

  onShow() {
    const app = getApp();
    this.setData({ careMode: Boolean(app.globalData.careMode) });
  },

  onTabChange(e) {
    const tabId = e.currentTarget.dataset.id;
    this.setData({ currentTab: tabId });
  },

  onSwiperChange(e) {
    this.setData({ currentTab: e.detail.current });
  },

  // 跳转到红色故事详情
  onGoToStory(e) {
    const storyId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: storyId
        ? `/pages/red-stories/index?storyId=${encodeURIComponent(storyId)}`
        : '/pages/red-stories/index'
    });
  },

  // 跳转到相册
  onGoToGallery() {
    wx.navigateTo({
      url: '/assets/gallery/index?category=all'
    });
  },

  // 跳转到研学路线
  onGoToStudyTour() {
    wx.navigateTo({
      url: '/pages/study-tour/index'
    });
  },

  // 根据游客偏好推荐路线
  onGoToRouteRecommend() {
    wx.navigateTo({
      url: '/pages/route-recommend/index'
    });
  },

  onSelectRoute(e) {
    const id = e.currentTarget.dataset.id;
    if (routePresets.some(route => route.id === id)) {
      wx.navigateTo({ url: `/pages/study-tour/index?preset=${encodeURIComponent(id)}` });
    }
  },

  // 跳转到村情信息
  onGoToVillageInfo() {
    wx.navigateTo({
      url: '/pages/village-info/index?id=' + this.data.village.id
    });
  },

  // 跳转旧址详情
  onGoToSite(e) {
    const siteId = e.currentTarget.dataset.id;
    if (!siteId) return;
    wx.navigateTo({
      url: `/pages/site-detail/index?id=${encodeURIComponent(siteId)}`
    });
  },

  // 一键导航（打开微信地图）
  onNavigate(e) {
    const v = this.data.village;
    if (!v) return;
    const siteId = e && e.currentTarget && e.currentTarget.dataset.id;
    const site = siteId && v.sites
      ? v.sites.find(item => item.id === siteId)
      : null;
    if (siteId && !site) return;
    const arrival = arrivalFor(v);
    navigateWithArrival(site || arrival, arrival);
  },

  // 获取游客位置并估算到村距离。时间为本地估算，实时路线以地图导航为准。
  onLocateMe() {
    const village = this.data.village;
    if (!village || this.data.locating) return;
    this.setData({ locating: true, locationSettingsNeeded: false, distanceText: '待定位', walkTimeText: '待定位', driveTimeText: '待定位', locationMessage: '正在获取当前位置…' });
    wx.getLocation({
      type: 'gcj02',
      success: location => {
        const distance = distanceKm(
          location.latitude,
          location.longitude,
          village.latitude,
          village.longitude
        );
        this.setData({
          locating: false,
          distanceText: formatDistance(distance),
          walkTimeText: formatMinutes(estimateMinutes(distance, 4.5)),
          driveTimeText: formatMinutes(estimateMinutes(distance, 30)),
          locationMessage: distance === null
            ? '未取得有效坐标，请重试定位'
            : '为直线距离与本地估算（步行4.5公里/小时、驾车30公里/小时）；非实际路线耗时'
        });
      },
      fail: error => {
        const issue = locationFailure(error);
        this.setData({
          locating: false,
          distanceText: '待定位', walkTimeText: '待定位', driveTimeText: '待定位',
          locationMessage: issue.message,
          locationSettingsNeeded: issue.settings
        });
        wx.showToast({ title: '定位未完成，请查看提示', icon: 'none' });
      }
    });
  },

  onOpenLocationSettings() {
    wx.openSetting({
      success: result => { if (result.authSetting && result.authSetting['scope.userLocation']) this.onLocateMe(); },
      fail: () => wx.showToast({ title: '请从右上角菜单打开设置', icon: 'none' })
    });
  },

  onNavigateToReservoir() {
    const reservoir = mapPlaces.find(place => place.id === 'place_qiaolin_reservoir');
    if (!reservoir) return;
    openDestination(reservoir);
  },

  onToggleCare() {
    const app = getApp();
    const careMode = !this.data.careMode;
    app.globalData.careMode = careMode;
    wx.setStorageSync('qiaolinCareMode', careMode);
    this.setData({ careMode });
  },

  onUnload() {
    if (this.networkListener && wx.offNetworkStatusChange) {
      wx.offNetworkStatusChange(this.networkListener);
      this.networkListener = null;
    }
  },

  onShareAppMessage() {
    return {
      title: `红韵乔林 - ${this.data.village ? this.data.village.name : '村落详情'}`,
      path: `/pages/village-detail/index?id=${this.data.village ? this.data.village.id : ''}`
    };
  }
});
