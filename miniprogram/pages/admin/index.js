const { callAdmin, cloudConfigured } = require('../../utils/adminClient.js');

const COLLECTIONS = [
  { id: 'media', name: '图片与文物史实' },
  { id: 'places', name: '地图点位' },
  { id: 'stories', name: '红色故事' },
  { id: 'routes', name: '研学路线' },
  { id: 'villages', name: '村落资料' }
];

Page({
  data: {
    cloudReady: false,
    collections: COLLECTIONS,
    collectionIndex: 0,
    currentCollection: 'media',
    form: {
      title: '',
      description: '',
      source: ''
    },
    currentDraftId: '',
    queue: [],
    loading: false,
    message: ''
  },

  onLoad() {
    this.setData({ cloudReady: cloudConfigured() });
  },

  onCollectionChange(e) {
    const collectionIndex = Number(e.detail.value);
    const item = COLLECTIONS[collectionIndex];
    this.setData({
      collectionIndex,
      currentCollection: item.id,
      currentDraftId: '',
      queue: [],
      message: ''
    });
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  validateForm() {
    const form = this.data.form;
    if (!form.title.trim() || !form.description.trim() || !form.source.trim()) {
      wx.showToast({ title: '请完整填写标题、说明和来源', icon: 'none' });
      return false;
    }
    return true;
  },

  async onSaveDraft() {
    if (!this.validateForm() || this.data.loading) return;
    this.setData({ loading: true, message: '' });
    try {
      const result = await callAdmin('saveDraft', this.data.currentCollection, {
        payload: {
          title: this.data.form.title.trim(),
          description: this.data.form.description.trim(),
          source: this.data.form.source.trim()
        }
      });
      this.setData({
        currentDraftId: result._id,
        message: '草稿已保存，可提交审核'
      });
    } catch (error) {
      wx.showModal({
        title: '保存失败',
        content: error.message || '请稍后重试',
        showCancel: false
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  async onSubmitReview() {
    if (!this.data.currentDraftId || this.data.loading) {
      wx.showToast({ title: '请先保存草稿', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    try {
      await callAdmin('submitReview', this.data.currentCollection, {
        id: this.data.currentDraftId
      });
      this.setData({
        currentDraftId: '',
        form: { title: '', description: '', source: '' },
        message: '资料已提交审核'
      });
    } catch (error) {
      wx.showToast({ title: error.message || '提交失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async onLoadQueue() {
    if (this.data.loading) return;
    this.setData({ loading: true, message: '' });
    try {
      const queue = await callAdmin('listReviewQueue', this.data.currentCollection);
      this.setData({
        queue,
        message: queue.length ? '' : '当前没有待审核资料'
      });
    } catch (error) {
      wx.showToast({ title: error.message || '读取失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onApprove(e) {
    this.reviewItem(e.currentTarget.dataset.id, true);
  },

  onReject(e) {
    this.reviewItem(e.currentTarget.dataset.id, false);
  },

  async reviewItem(id, approved) {
    if (!id || this.data.loading) return;
    this.setData({ loading: true });
    try {
      await callAdmin('review', this.data.currentCollection, {
        id,
        approved,
        reviewNote: approved ? '资料来源已核验，同意发布' : '资料信息需补充核验'
      });
      wx.showToast({ title: approved ? '已发布' : '已驳回', icon: 'success' });
      this.setData({ loading: false });
      await this.onLoadQueue();
    } catch (error) {
      wx.showToast({ title: error.message || '审核失败', icon: 'none' });
      this.setData({ loading: false });
    }
  }
});
