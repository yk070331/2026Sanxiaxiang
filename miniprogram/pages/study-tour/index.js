// pages/study-tour/index.js
const { studyTour, routePresets, mapPlaces, redVillages } = require('../../utils/data.js');
const { hasCoordinates, arrivalFor, navigateWithArrival, openDestination } = require('../../utils/navigation.js');
const { flushPendingCheckIns, syncCheckIn } = require('../../utils/visitorSync.js');
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
    activePresetId: '',
    routeChoices: [{ id: '', title: '完整研学线（约2小时）' }, ...routePresets],
    routeChoiceIndex: 0,
    certificateVisible: false,
    certificateImage: '',
    certificateDate: '',
    generatingCertificate: false,
    nextSiteId: '',
    nextSiteName: '正在计算下一站'
  },

  onLoad(options = {}) {
    // 首页的打卡、下一站和证书入口继续最近选择的路线。
    const presetId = options.preset === undefined
      ? wx.getStorageSync('qiaolinActiveRoutePreset')
      : options.preset;
    const preset = routePresets.find(route => route.id === presetId);
    this.entryAction = options.action;
    try { wx.setStorageSync('qiaolinActiveRoutePreset', preset ? preset.id : ''); }
    catch (error) { wx.showToast({ title: '路线已打开，暂未保存选择', icon: 'none' }); }
    const reservoir = mapPlaces.find(place => place.id === 'place_qiaolin_reservoir');
    const selectedSegments = preset
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
            tips: '点位为腾讯地图核验的可到达入口/大坝，请遵守现场道路与安全提示。'
          };
        }
        return studyTour.segments.find(segment => segment.id === segmentId);
      }).filter(Boolean)
      : studyTour.segments;
    const village = redVillages.find(item => item.id === 'village_1');
    let stopNumber = 0;
    const segments = selectedSegments.map(segment => {
      const site = village.sites.find(item => item.id === segment.siteId);
      const target = site ? { ...segment, latitude: site.latitude, longitude: site.longitude } : { ...segment };
      if (target.type === 'site') stopNumber += 1;
      return { ...target, canNavigate: hasCoordinates(target), stopNumber,
        displayName: target.name.replace(/^(起点|终点|第[一二三四五六]站)：/, '') };
    });
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
      : { ...studyTour, segments };

    // 计算仅站点（排除起点终点）
    const siteSegments = activeTour.segments.filter(segment => segment.type === 'site');
    const totalSegments = siteSegments.length;
    const storedCheckIns = wx.getStorageSync(CHECK_IN_STORAGE_KEY) || {};
    const checkedIn = siteSegments.reduce((result, segment) => {
      if (storedCheckIns[segment.id]) result[segment.id] = true;
      return result;
    }, {});
    const nextSite = siteSegments.find(segment => !checkedIn[segment.id]);

    this.setData({
      tour: activeTour,
      totalSegments,
      siteSegments,
      checkedIn,
      checkInCount: Object.keys(checkedIn).length,
      careMode: Boolean(getApp().globalData.careMode),
      activePresetId: preset ? preset.id : '',
      routeChoiceIndex: preset ? routePresets.findIndex(route => route.id === preset.id) + 1 : 0,
      nextSiteId: nextSite ? nextSite.id : '',
      nextSiteName: nextSite ? nextSite.name : '全部旧址已完成'
    });

    // 恢复网络后自动补传游客此前离线完成的打卡。
    flushPendingCheckIns().then(result => {
      if (result.synced > 0) {
        wx.showToast({ title: `已同步${result.synced}条打卡`, icon: 'success' });
      }
    }).catch(() => {});
  },

  onShow() {
    this.setData({ careMode: Boolean(getApp().globalData.careMode) });
  },

  onReady() {
    const action = this.entryAction;
    this.entryAction = '';
    if (action === 'next') this.onNavigateToNext();
    if (action === 'certificate') this.onShowCertificate();
  },

  onRouteChange(e) {
    if (this.data.generatingCertificate) return;
    const choice = this.data.routeChoices[Number(e.detail.value)];
    if (!choice || choice.id === this.data.activePresetId) return;
    wx.redirectTo({ url: `/pages/study-tour/index?preset=${encodeURIComponent(choice.id)}` });
  },

  // 切换当前查看的站点段
  onSegmentTap(e) {
    const id = e.currentTarget.dataset.id;
    const index = this.data.tour.segments.findIndex(item => item.id === id);
    if (index >= 0) {
      this.setData({ currentSegment: index });
    }
  },

  // 打卡
  onCheckIn(e) {
    const segmentId = e.currentTarget.dataset.id;
    this.markCheckIn(segmentId, { method: 'manual' });
  },

  markCheckIn(segmentId, options = {}) {
    const segment = this.data.siteSegments.find(item => item.id === segmentId);
    if (!segment) {
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

    const nextSite = this.getNextUncheckedSite(checkedIn);
    this.setData({
      checkedIn,
      checkInCount,
      nextSiteId: nextSite ? nextSite.id : '',
      nextSiteName: nextSite ? nextSite.name : '全部旧址已完成'
    });
    // 切换短路线后打卡仍保留其他路线已经完成的站点。
    wx.setStorageSync(CHECK_IN_STORAGE_KEY, {
      ...(wx.getStorageSync(CHECK_IN_STORAGE_KEY) || {}),
      ...checkedIn
    });

    // 云端不可用时自动加入补传队列，不影响现场弱网打卡。
    syncCheckIn({
      routeId: this.data.activePresetId || 'qiaolin_full',
      placeId: segment.siteId || segment.id,
      method: options.method || 'manual'
    }).catch(() => {});

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
    } else if (!options.silent) {
      wx.showToast({
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
        this.markCheckIn(segment.id, { silent: true, method: 'scan' });
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

  getNextUncheckedSite(checkedIn = this.data.checkedIn) {
    return this.data.siteSegments.find(segment => !checkedIn[segment.id]) || null;
  },

  // 前往下一处尚未打卡的旧址。坐标未核验时只切换卡片，不发起错误导航。
  onNavigateToNext() {
    const segment = this.getNextUncheckedSite();
    if (!segment) {
      this.onShowCertificate();
      return;
    }
    const segmentIndex = this.data.tour.segments.findIndex(item => item.id === segment.id);
    if (segmentIndex >= 0) this.setData({ currentSegment: segmentIndex });
    navigateWithArrival(segment, arrivalFor(redVillages.find(item => item.id === 'village_1')), `下一站：${segment.name}`);
  },

  openSegmentLocation(segment) {
    openDestination(segment);
  },

  // 一键导航到当前站点
  onNavigateToSegment(e) {
    const segmentId = e.currentTarget.dataset.id;
    const segment = this.data.tour.segments.find(item => item.id === segmentId);
    if (!segment) return;
    navigateWithArrival(segment, arrivalFor(redVillages.find(item => item.id === 'village_1')));
  },

  // 导航到路线起点
  onNavigateToStart() {
    const start = this.data.tour.segments[0];
    navigateWithArrival(start, arrivalFor(redVillages.find(item => item.id === 'village_1')));
  },

  onGoToRouteRecommend() {
    wx.navigateTo({ url: '/pages/route-recommend/index' });
  },

  onShowCertificate() {
    if (!this.data.totalSegments || this.data.checkInCount < this.data.totalSegments) {
      wx.showToast({ title: '完成全部旧址打卡后解锁', icon: 'none' });
      return;
    }
    if (this.data.certificateImage) {
      this.setData({ certificateVisible: true });
      return;
    }
    const date = new Date();
    const dateText = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    this.setData({ generatingCertificate: true, certificateDate: dateText });
    wx.showLoading({ title: '正在生成证书' });
    this.drawCertificatePoster(dateText);
  },

  drawCertificatePoster(dateText) {
    const width = 750;
    const height = 1000;
    const context = wx.createCanvasContext('certificateCanvas', this);
    const tourTitle = this.data.tour ? this.data.tour.title : '乔林村红色研学路线';

    context.setFillStyle('#F7F0DF');
    context.fillRect(0, 0, width, height);
    context.setFillStyle('#8B0000');
    context.fillRect(0, 0, width, 190);
    context.setFillStyle('#B78A2F');
    context.fillRect(28, 28, width - 56, 8);
    context.fillRect(28, height - 36, width - 56, 8);
    context.setStrokeStyle('#B78A2F');
    context.setLineWidth(3);
    context.strokeRect(28, 28, width - 56, height - 56);
    context.strokeRect(44, 44, width - 88, height - 88);

    context.setTextAlign('center');
    context.setFillStyle('#FFFFFF');
    context.setFontSize(30);
    context.fillText('红韵乔林 · 井冈山红色研学', width / 2, 76);
    context.setFontSize(64);
    context.fillText('研 学 证 书', width / 2, 148);

    context.setFillStyle('#7A1111');
    context.setFontSize(30);
    context.fillText('CERTIFICATE OF COMPLETION', width / 2, 245);
    context.setFillStyle('#2D2722');
    context.setFontSize(38);
    context.fillText('授予：研学参与者', width / 2, 325);

    context.setStrokeStyle('#C9AE72');
    context.setLineWidth(2);
    context.beginPath();
    context.moveTo(150, 352);
    context.lineTo(600, 352);
    context.stroke();

    context.setFillStyle('#4E463D');
    context.setFontSize(28);
    context.fillText('已完成', width / 2, 418);
    context.setFillStyle('#8B0000');
    context.setFontSize(40);
    const displayTitle = tourTitle.length > 16 ? `${tourTitle.slice(0, 16)}…` : tourTitle;
    context.fillText(`“${displayTitle}”`, width / 2, 476);
    context.setFillStyle('#4E463D');
    context.setFontSize(28);
    context.fillText(`全部 ${this.data.totalSegments} 处红色旧址学习与打卡`, width / 2, 535);

    const badges = ['寻访旧址', '聆听故事', '完成打卡'];
    badges.forEach((badge, index) => {
      const x = 188 + index * 188;
      context.setFillStyle('#FFF9EC');
      context.setStrokeStyle('#B78A2F');
      context.setLineWidth(2);
      context.beginPath();
      context.arc(x, 635, 58, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.setFillStyle('#8B0000');
      context.setFontSize(24);
      context.fillText(badge, x, 644);
    });

    context.setStrokeStyle('#B01919');
    context.setLineWidth(6);
    context.beginPath();
    context.arc(580, 785, 76, 0, Math.PI * 2);
    context.stroke();
    context.setLineWidth(2);
    context.beginPath();
    context.arc(580, 785, 64, 0, Math.PI * 2);
    context.stroke();
    context.setFillStyle('#B01919');
    context.setFontSize(25);
    context.fillText('红韵乔林', 580, 780);
    context.setFontSize(20);
    context.fillText('研学纪念', 580, 815);

    context.setTextAlign('left');
    context.setFillStyle('#564D43');
    context.setFontSize(25);
    context.fillText(`完成日期：${dateText}`, 90, 780);
    context.fillText('地点：江西省井冈山市茅坪镇乔林村', 90, 828);
    context.setFillStyle('#8B7B67');
    context.setFontSize(20);
    context.fillText('本证书为研学纪念凭证，打卡记录保存在当前设备或已配置云端。', 90, 900);

    context.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: 'certificateCanvas',
          width,
          height,
          destWidth: 1500,
          destHeight: 2000,
          fileType: 'png',
          quality: 1,
          success: result => {
            wx.hideLoading();
            this.setData({
              generatingCertificate: false,
              certificateImage: result.tempFilePath,
              certificateVisible: true
            });
          },
          fail: () => {
            wx.hideLoading();
            this.setData({ generatingCertificate: false });
            wx.showToast({ title: '证书生成失败，请重试', icon: 'none' });
          }
        }, this);
      }, 100);
    });
  },

  onStopPropagation() {},

  onCloseCertificate() {
    this.setData({ certificateVisible: false });
  },

  onSaveCertificate() {
    if (!this.data.certificateImage) return;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.certificateImage,
      success: () => wx.showToast({ title: '证书已保存', icon: 'success' }),
      fail: error => {
        const denied = error && /auth deny|authorize/i.test(error.errMsg || '');
        if (!denied) {
          wx.showToast({ title: '保存失败，请重试', icon: 'none' });
          return;
        }
        wx.showModal({
          title: '需要相册权限',
          content: '请在微信设置中允许保存图片，之后再次点击保存。',
          confirmText: '去设置',
          success: result => {
            if (result.confirm) wx.openSetting();
          }
        });
      }
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
