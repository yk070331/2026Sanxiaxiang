// app.js
const { resolveCloudEnvId } = require('./config/env.js');

App({
  onLaunch() {
    const env = resolveCloudEnvId();
    this.globalData = {
      env,
      cloudReady: false,
      cloudInitError: '',
      careMode: Boolean(wx.getStorageSync('qiaolinCareMode')),
      isOnline: true,
      networkType: 'unknown',
      // 腾讯地图“乔林村委会”分享位置（GCJ-02）
      mapCenter: {
        latitude: 26.620306,
        longitude: 114.046347
      }
    };

    // 未配置云环境时保留完整本地体验；配置错误也不阻断小程序启动。
    if (wx.cloud && env) {
      try {
        wx.cloud.init({ env, traceUser: true });
        this.globalData.cloudReady = true;
      } catch (error) {
        this.globalData.cloudInitError = error && error.message
          ? error.message
          : 'cloud-init-failed';
        console.warn('[app] 云开发初始化失败，已切换本地模式', error);
      }
    }

    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    this.globalData.statusBarHeight = systemInfo.statusBarHeight;
    this.globalData.navBarHeight = systemInfo.platform === 'android' ? 48 : 44;

    // 网络状态用于提示地图和远程素材可能不可用。
    wx.getNetworkType({
      success: result => {
        this.globalData.networkType = result.networkType;
        this.globalData.isOnline = result.networkType !== 'none';
      }
    });
    wx.onNetworkStatusChange(result => {
      this.globalData.networkType = result.networkType;
      this.globalData.isOnline = result.isConnected;
    });
  },

  globalData: {}
});
