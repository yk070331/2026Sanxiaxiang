const {
  flushPendingCorrections,
  submitCorrection
} = require('../../utils/correctionService.js');

const ERROR_TYPES = ['地图位置错误', '史实内容错误', '图片归属错误', '文字错漏', '其他问题'];
const ALLOWED_TARGET_TYPES = ['village', 'place', 'story', 'media', 'route'];

function decode(value) {
  try {
    return decodeURIComponent(value || '');
  } catch (error) {
    return value || '';
  }
}

Page({
  data: {
    errorTypes: ERROR_TYPES,
    errorTypeIndex: 0,
    description: '',
    targetType: 'place',
    targetId: '',
    targetName: '当前资料',
    submitting: false,
    completed: false,
    queued: false
  },

  onLoad(options = {}) {
    const targetType = ALLOWED_TARGET_TYPES.includes(options.targetType)
      ? options.targetType
      : 'place';
    this.setData({
      targetType,
      targetId: options.targetId || '',
      targetName: decode(options.targetName) || '当前资料'
    });
    flushPendingCorrections().then(result => {
      if (result.synced > 0) {
        wx.showToast({ title: `已补传${result.synced}条纠错`, icon: 'success' });
      }
    }).catch(() => {});
  },

  onTypeChange(e) {
    this.setData({ errorTypeIndex: Number(e.detail.value) });
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail.value || '' });
  },

  async onSubmit() {
    if (this.data.submitting) return;
    const description = this.data.description.trim();
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(this.data.targetId)) {
      wx.showToast({ title: '纠错对象参数无效', icon: 'none' });
      return;
    }
    if (description.length < 5) {
      wx.showToast({ title: '请至少填写5个字的说明', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    try {
      const result = await submitCorrection({
        targetType: this.data.targetType,
        targetId: this.data.targetId,
        errorType: this.data.errorTypes[this.data.errorTypeIndex],
        description,
        attachmentFileIds: []
      });
      this.setData({
        submitting: false,
        completed: true,
        queued: result.queued
      });
    } catch (error) {
      this.setData({ submitting: false });
      wx.showToast({ title: error.message || '提交失败', icon: 'none' });
    }
  },

  onBack() {
    wx.navigateBack();
  }
});
