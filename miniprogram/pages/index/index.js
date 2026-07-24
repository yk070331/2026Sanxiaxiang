// pages/index/index.js
const { redLandmarks, redVillages, mapPlaces } = require('../../utils/data.js');
const qiaolinVillage = redVillages.find(village => village.id === 'village_1');
const DEFAULT_CENTER = {
  latitude: qiaolinVillage ? qiaolinVillage.latitude : 26.620306,
  longitude: qiaolinVillage ? qiaolinVillage.longitude : 114.046347
};

Page({
  data: {
    // 地图中心与乔林村数据使用同一坐标源，避免首页和导航位置不一致。
    latitude: DEFAULT_CENTER.latitude,
    longitude: DEFAULT_CENTER.longitude,
    scale: 13,
    showCompass: true,
    enableZoom: true,
    enableScroll: true,
    enableRotate: false,
    enableOverlooking: false,
    enableSatellite: false,
    enableTraffic: false,

    // 标记点
    markers: [],
    searchKeyword: '',
    activeLayer: 'all',
    layerOptions: [
      { id: 'all', name: '全部' },
      { id: 'landmark', name: '红色旧址' },
      { id: 'village', name: '红色名村' },
      { id: 'place', name: '生态资源' }
    ],
    isOnline: true,
    // 弹窗控制
    showPopup: false,
    popupData: null,
    popupType: '', // 'landmark' | 'village' | 'place'
    // 图例显示
    showLegend: true,
    // 全屏状态
    isFullscreen: true,
    // 状态栏高度（从全局获取）
    statusBarHeight: 44
  },

  onLoad() {
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 44,
      isOnline: app.globalData.isOnline !== false
    });
    this.networkListener = result => this.setData({ isOnline: result.isConnected });
    wx.onNetworkStatusChange(this.networkListener);
    this.buildMarkers();
    // 5 秒后自动收起图例
    this.legendTimer = setTimeout(() => {
      this.setData({ showLegend: false });
    }, 5000);
  },

  onReady() {
    // 创建地图上下文
    this.mapCtx = wx.createMapContext('hongyunMap', this);
    this.fitAllPoints();
  },

  /**
   * 构建地图标记点数据
   */
  buildMarkers() {
    const markers = [];
    let markerId = 1;

    // 红色地标（红色五角星）
    redLandmarks.forEach(landmark => {
      markers.push({
        id: markerId++,
        latitude: landmark.latitude,
        longitude: landmark.longitude,
        iconPath: landmark.iconPath,
        width: landmark.width,
        height: landmark.height,
        alpha: 1,
        callout: {
          content: landmark.name,
          color: '#CC0000',
          fontSize: 13,
          fontWeight: 'bold',
          borderRadius: 8,
          bgColor: '#ffffff',
          padding: 8,
          display: 'ALWAYS',
          textAlign: 'center',
          anchorY: -8
        },
        // 自定义属性，在点击时使用
        landmarkId: landmark.id,
        landmarkType: 'landmark'
      });
    });

    // 红色村落（古村图标）
    redVillages.forEach(village => {
      markers.push({
        id: markerId++,
        latitude: village.latitude,
        longitude: village.longitude,
        iconPath: village.iconPath,
        width: village.width,
        height: village.height,
        alpha: 1,
        callout: {
          content: village.name,
          color: '#8B4513',
          fontSize: 13,
          fontWeight: 'bold',
          borderRadius: 8,
          bgColor: '#FFF8E8',
          padding: 8,
          display: 'ALWAYS',
          textAlign: 'center',
          anchorY: -8
        },
        villageId: village.id,
        landmarkType: 'village'
      });
    });

    // 自然与公共地图点位
    mapPlaces.forEach(place => {
      markers.push({
        id: markerId++,
        latitude: place.latitude,
        longitude: place.longitude,
        iconPath: place.iconPath,
        width: place.width,
        height: place.height,
        alpha: 1,
        callout: {
          content: place.name,
          color: '#126E82',
          fontSize: 13,
          fontWeight: 'bold',
          borderRadius: 8,
          bgColor: '#EAF8FB',
          padding: 8,
          display: 'ALWAYS',
          textAlign: 'center',
          anchorY: -8
        },
        placeId: place.id,
        landmarkType: 'place'
      });
    });

    this.allMarkers = markers;
    this.setData({ markers });
    this.markerLookup = markers.reduce((lookup, marker) => {
      lookup[marker.id] = marker;
      return lookup;
    }, {});
    // 保存原始数据以便查找
    this.landmarkData = redLandmarks;
    this.villageData = redVillages;
    this.placeData = mapPlaces;
  },

  /**
   * 根据关键词和图层筛选地图标记。
   */
  applyMarkerFilters() {
    const keyword = this.data.searchKeyword.trim().toLowerCase();
    const layer = this.data.activeLayer;
    const markers = (this.allMarkers || []).filter(marker => {
      const layerMatched = layer === 'all' || marker.landmarkType === layer;
      const name = marker.callout && marker.callout.content
        ? marker.callout.content.toLowerCase()
        : '';
      return layerMatched && (!keyword || name.includes(keyword));
    });
    this.setData({ markers, showPopup: false });
    if (this.mapCtx && markers.length) {
      setTimeout(() => this.fitAllPoints(), 0);
    }
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value || '' }, () => this.applyMarkerFilters());
  },

  onClearSearch() {
    this.setData({ searchKeyword: '' }, () => this.applyMarkerFilters());
  },

  onLayerChange(e) {
    const layer = e.currentTarget.dataset.id || 'all';
    this.setData({ activeLayer: layer }, () => this.applyMarkerFilters());
  },

  /**
   * 地图标记点击事件
   */
  onMarkerTap(e) {
    const markerId = e.detail.markerId;
    const marker = this.markerLookup && this.markerLookup[markerId];
    if (!marker) return;

    let popupData = null;
    let popupType = '';

    if (marker.landmarkType === 'landmark') {
      popupData = this.landmarkData.find(l => l.id === marker.landmarkId);
      popupType = 'landmark';
    } else if (marker.landmarkType === 'village') {
      popupData = this.villageData.find(v => v.id === marker.villageId);
      popupType = 'village';
    } else if (marker.landmarkType === 'place') {
      popupData = this.placeData.find(place => place.id === marker.placeId);
      popupType = 'place';
    }

    if (popupData) {
      this.setData({
        showPopup: true,
        popupData,
        popupType
      });
    }
  },

  /**
   * 地图点击空白区域（非标记点）
   */
  onMapTap() {
    if (this.data.showPopup) {
      this.setData({ showPopup: false });
    }
  },

  /**
   * 关闭弹窗
   */
  onClosePopup() {
    this.setData({ showPopup: false });
  },

  /**
   * 跳转地标详情页
   */
  onGoToLandmarkDetail(e) {
    const id = e.currentTarget.dataset.id || (this.data.popupData && this.data.popupData.id);
    if (!id) return;
    this.setData({ showPopup: false });
    wx.navigateTo({
      url: `/pages/site-detail/index?id=${id}`
    });
  },

  /**
   * 跳转村内旧址详情页
   */
  onGoToVillageSite(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    this.setData({ showPopup: false });
    wx.navigateTo({
      url: `/pages/site-detail/index?id=${id}`
    });
  },

  /**
   * 跳转村落详情页
   */
  onGoToVillageDetail(e) {
    const id = e.currentTarget.dataset.id || (this.data.popupData && this.data.popupData.id);
    if (!id) return;
    this.setData({ showPopup: false });
    wx.navigateTo({
      url: `/pages/village-detail/index?id=${id}`
    });
  },

  /**
   * 打开自然/公共点位导航
   */
  onOpenPopupLocation() {
    const place = this.data.popupData;
    if (!place || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
      wx.showToast({ title: '该点位坐标待核验', icon: 'none' });
      return;
    }
    wx.openLocation({
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      address: place.address || '江西省吉安市井冈山市茅坪镇乔林村',
      scale: 17
    });
  },

  /**
   * 定位到乔林村
   */
  onLocateQiaolin() {
    // 乔林村坐标
    const qiaolin = this.villageData.find(v => v.id === 'village_1');
    if (qiaolin) {
      this.setData({
        latitude: qiaolin.latitude,
        longitude: qiaolin.longitude,
        scale: 16
      });
      // 延迟弹出乔林村详情
      if (this.locateTimer) clearTimeout(this.locateTimer);
      this.locateTimer = setTimeout(() => {
        this.setData({
          showPopup: true,
          popupData: qiaolin,
          popupType: 'village'
        });
        this.locateTimer = null;
      }, 800);
    }
  },

  /**
   * 定位到游客当前位置。
   */
  onLocateMe() {
    wx.getLocation({
      type: 'gcj02',
      success: location => {
        this.setData({
          latitude: location.latitude,
          longitude: location.longitude,
          scale: 16,
          showPopup: false
        });
      },
      fail: () => {
        wx.showToast({ title: '请允许位置权限后重试', icon: 'none' });
      }
    });
  },

  /**
   * 复位到全域地图
   */
  onResetMap() {
    this.setData({
      showPopup: false
    });
    this.fitAllPoints();
  },

  /**
   * 自动计算全域视野，确保所有标记点都在屏幕内。
   */
  fitAllPoints() {
    if (!this.mapCtx || !this.data.markers.length) return;
    const points = this.data.markers
      .filter(marker => Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude))
      .map(marker => ({
        latitude: marker.latitude,
        longitude: marker.longitude
      }));
    if (!points.length) return;
    this.mapCtx.includePoints({
      points,
      padding: [120, 40, 180, 40]
    });
  },

  /**
   * 地图区域变化事件
   */
  onRegionChange(e) {
    const center = e.detail && e.detail.centerLocation;
    if (e.type === 'end' && e.causedBy === 'drag' && center) {
      this.setData({
        latitude: center.latitude,
        longitude: center.longitude
      });
    }
  },

  /**
   * 切换图例显示
   */
  onToggleLegend() {
    this.setData({ showLegend: !this.data.showLegend });
  },

  /**
   * 跳转研学路线页
   */
  onGoToStudyTour() {
    this.setData({ showPopup: false });
    wx.navigateTo({
      url: '/pages/study-tour/index'
    });
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: '红韵乔林 - 井冈山红色文旅地图',
      path: '/pages/index/index'
    };
  },

  onUnload() {
    if (this.legendTimer) {
      clearTimeout(this.legendTimer);
      this.legendTimer = null;
    }
    if (this.locateTimer) {
      clearTimeout(this.locateTimer);
      this.locateTimer = null;
    }
    if (this.networkListener && wx.offNetworkStatusChange) {
      wx.offNetworkStatusChange(this.networkListener);
      this.networkListener = null;
    }
  }
});
