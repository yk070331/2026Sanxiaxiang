const localData = require('./data.js');

function isCloudReady() {
  try {
    const app = getApp();
    return Boolean(wx.cloud && app && app.globalData && app.globalData.env);
  } catch (error) {
    return false;
  }
}

function normalizeMedia(item) {
  return {
    id: item.id || item._id,
    category: item.category || 'revolutionary',
    categoryName: item.categoryName || '革命旧址',
    title: item.title || '未命名素材',
    src: item.src || item.fileId || '',
    desc: item.desc || item.description || '',
    date: item.date || item.capturedAtText || '时间待核验',
    available: item.available !== false && Boolean(item.src || item.fileId),
    sourceKind: item.sourceKind || '',
    scopeLabel: item.scopeLabel || '',
    creator: item.creator || '',
    license: item.license || '',
    licenseUrl: item.licenseUrl || '',
    sourceUrl: item.sourceUrl || '',
    changes: item.changes || ''
  };
}

async function listPublished(collection, fallbackData) {
  if (!isCloudReady()) {
    return {
      data: fallbackData,
      source: 'local',
      fallbackReason: 'cloud-not-configured'
    };
  }

  try {
    const result = await wx.cloud.callFunction({
      name: 'contentService',
      data: {
        action: 'listPublished',
        collection
      }
    });
    const response = result && result.result;
    if (!response || response.ok !== true || !Array.isArray(response.data)) {
      throw new Error('invalid-cloud-response');
    }
    return {
      data: response.data,
      source: 'cloud'
    };
  } catch (error) {
    console.warn(`[contentService] ${collection} 云端读取失败，已使用本地数据`, error);
    return {
      data: fallbackData,
      source: 'local',
      fallbackReason: error && error.message ? error.message : 'cloud-call-failed'
    };
  }
}

async function getPhotoGallery() {
  const result = await listPublished('media', localData.photoGallery);
  return {
    ...result,
    data: result.source === 'cloud'
      ? result.data.map(normalizeMedia).filter(item => item.src)
      : result.data
  };
}

module.exports = {
  getPhotoGallery,
  isCloudReady,
  listPublished
};

