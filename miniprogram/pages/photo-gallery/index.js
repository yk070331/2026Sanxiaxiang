// pages/photo-gallery/index.js
const { photoGallery } = require('../../utils/data.js');

Page({
  data: {
    categories: [
      { id: 'all', name: '全部' },
      { id: 'revolutionary', name: '革命旧址' },
      { id: 'village', name: '古村落' },
      { id: 'nature', name: '水源山林' }
    ],
    currentCategory: 'all',
    photos: [],
    // 大图浏览
    showPreview: false,
    previewIndex: 0,
    previewPhotos: []
  },

  onLoad(options) {
    const category = options.category || 'all';
    this.setData({ currentCategory: category });
    this.filterPhotos(category);
  },

  // 分类切换
  onCategoryChange(e) {
    const category = e.currentTarget.dataset.id;
    this.setData({ currentCategory: category });
    this.filterPhotos(category);
  },

  filterPhotos(category) {
    let photos;
    if (category === 'all') {
      photos = photoGallery;
    } else {
      photos = photoGallery.filter(p => p.category === category);
    }
    this.setData({ photos });
  },

  // 点击图片进入大图浏览
  onPhotoTap(e) {
    const index = Number(e.currentTarget.dataset.index);
    const photo = this.data.photos[index];
    if (!photo || photo.available === false) {
      wx.showToast({ title: '实景照片待上传', icon: 'none' });
      return;
    }
    this.setData({
      showPreview: true,
      previewIndex: index,
      previewPhotos: this.data.photos.map(p => p.src)
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
    const urls = this.data.photos.map(p => p.src);
    wx.previewImage({
      current: src,
      urls: urls
    });
  },

  // 阻止冒泡（空函数）
  onStopPropagation() {},

  onShareAppMessage() {
    return {
      title: '红韵乔林 - 实景相册',
      path: '/pages/photo-gallery/index'
    };
  }
});
