// pages/photo-gallery/index.js
const { getPhotoGallery } = require('../../utils/contentService.js');
const { photos: contributedPhotos } = require('../../utils/contributedPhotos.js');

Page({
  data: {
    categories: [
      { id: 'all', name: '全部' },
      { id: 'contributed', name: '补充照片' },
      { id: 'licensed', name: '开放图片' },
      { id: 'revolutionary', name: '革命旧址' },
      { id: 'heritage', name: '文物史实' },
      { id: 'village', name: '古村落' },
      { id: 'nature', name: '水源山林' }
    ],
    currentCategory: 'all',
    allPhotos: [],
    photos: [],
    dataSource: 'local',
    loading: true,
    showPending: false,
    availableCount: 0,
    pendingCount: 0,
    // 大图浏览
    showPreview: false,
    previewIndex: 0,
    previewPhotos: [],
    previewItems: []
  },

  async onLoad(options = {}) {
    const category = options.category || 'all';
    this.setData({ currentCategory: category, loading: true });
    const result = await getPhotoGallery();
    this.setData({
      allPhotos: result.data,
      availableCount: result.data.filter(photo => photo.available).length,
      pendingCount: result.data.filter(photo => !photo.available).length,
      dataSource: result.source,
      loading: false
    });
    this.filterPhotos(category);
  },

  // 分类切换
  onCategoryChange(e) {
    const category = e.currentTarget.dataset.id;
    this.setData({ currentCategory: category });
    this.filterPhotos(category);
  },

  filterPhotos(category) {
    const allPhotos = this.data.allPhotos || [];
    const selected = category === 'all'
      ? allPhotos
      : allPhotos.filter(photo => category === 'licensed' ? photo.sourceKind === 'open-license' : category === 'contributed' ? photo.sourceKind === 'user-provided' : photo.category === category);
    const photos = selected.filter(photo => this.data.showPending || photo.available)
      .sort((a, b) => Number(Boolean(b.available)) - Number(Boolean(a.available))
        || Number(b.sourceKind === 'user-provided') - Number(a.sourceKind === 'user-provided')
        || Number(b.sourceKind === 'open-license') - Number(a.sourceKind === 'open-license'));
    this.setData({ photos });
  },

  onTogglePending() {
    this.setData({ showPending: !this.data.showPending });
    this.filterPhotos(this.data.currentCategory);
  },

  onCopyCredit(e) {
    const photo = this.data.previewItems[this.data.previewIndex];
    const field = e.currentTarget.dataset.field;
    if (!photo || !['sourceUrl', 'licenseUrl'].includes(field)) return;
    const value = photo[field];
    if (typeof value === 'string' && value.startsWith('https://')) wx.setClipboardData({ data: value });
  },

  // 点击图片进入大图浏览
  onPhotoTap(e) {
    const index = Number(e.currentTarget.dataset.index);
    const photo = this.data.photos[index];
    if (!photo || photo.available === false) {
      wx.showToast({ title: '实景照片待上传', icon: 'none' });
      return;
    }
    const contributed = contributedPhotos.find(item => item.id === photo.collectionPhotoId);
    if (contributed) {
      wx.navigateTo({ url: `/contributions/gallery/index?group=${contributed.group}&photo=${contributed.id}` });
      return;
    }
    const previewItems = this.data.photos.filter(item => item.available !== false && !item.collectionPhotoId);
    const previewIndex = previewItems.findIndex(item => item.id === photo.id);
    this.setData({
      showPreview: true,
      previewIndex,
      previewPhotos: previewItems.map(item => item.src),
      previewItems
    });
  },

  // 轮播图切换
  onPreviewChange(e) {
    this.setData({ previewIndex: e.detail.current });
  },

  // 关闭大图浏览
  onClosePreview() {
    this.setData({ showPreview: false });
  },

  // 预览图片（使用微信原生）
  onPreviewImage(e) {
    const src = e.currentTarget.dataset.src;
    const urls = this.data.photos
      .filter(photo => photo.available !== false && !photo.collectionPhotoId)
      .map(photo => photo.src);
    wx.previewImage({ current: src, urls });
  },

  // 阻止冒泡（空函数）
  onStopPropagation() {},

  onShareAppMessage() {
    return {
      title: '红韵乔林 - 实景相册',
      path: '/assets/gallery/index'
    };
  }
});
