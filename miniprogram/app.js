// app.js
App({
  onLaunch: function () {
    this.globalData = {
      env: "",
      careMode: Boolean(wx.getStorageSync('qiaolinCareMode')),
      isOnline: true,
      networkType: 'unknown',
      // 腾讯地图“乔林村委会”分享位置（GCJ-02）
      mapCenter: {
        latitude: 26.620306,
        longitude: 114.046347
      }
    };

    // 当前版本全部使用本地数据；配置云环境 ID 后再初始化，避免空 env 启动报错。
    if (wx.cloud && this.globalData.env) {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true
      });
    }

    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    this.globalData.statusBarHeight = systemInfo.statusBarHeight;
    this.globalData.navBarHeight = systemInfo.platform === 'android' ? 48 : 44;

    // 核心文字数据均为本地数据；网络状态用于提示地图和远程素材可能不可用。
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
