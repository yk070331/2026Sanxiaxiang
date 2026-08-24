/**
 * 微信云开发环境配置。
 *
 * DEFAULT_ENV_ID 可以填写正式云环境 ID。环境 ID 不是云密钥，但发布前仍应
 * 确认仓库与小程序使用的是正确环境。开发调试时也可在开发者工具控制台执行：
 * wx.setStorageSync('qiaolinCloudEnvId', 'cloud1-xxxxxxxx')
 * 然后重新编译；本地存储优先于默认值，不会写入 Git 仓库。
 */
const DEFAULT_ENV_ID = '';
const STORAGE_KEY = 'qiaolinCloudEnvId';

function normalizeEnvId(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveCloudEnvId() {
  try {
    const localEnvId = normalizeEnvId(wx.getStorageSync(STORAGE_KEY));
    return localEnvId || normalizeEnvId(DEFAULT_ENV_ID);
  } catch (error) {
    return normalizeEnvId(DEFAULT_ENV_ID);
  }
}

module.exports = {
  DEFAULT_ENV_ID,
  STORAGE_KEY,
  normalizeEnvId,
  resolveCloudEnvId
};
