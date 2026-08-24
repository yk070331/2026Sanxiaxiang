function cloudConfigured() {
  try {
    const app = getApp();
    return Boolean(wx.cloud && app && app.globalData && app.globalData.env);
  } catch (error) {
    return false;
  }
}

async function callAdmin(action, collection, payload = {}) {
  if (!cloudConfigured()) {
    throw new Error('请先配置微信云开发环境');
  }
  const result = await wx.cloud.callFunction({
    name: 'contentAdmin',
    data: {
      action,
      collection,
      ...payload
    }
  });
  const response = result && result.result;
  if (!response || response.ok !== true) {
    throw new Error(response && response.message
      ? response.message
      : '资料管理服务调用失败');
  }
  return response.data;
}

module.exports = {
  callAdmin,
  cloudConfigured
};

