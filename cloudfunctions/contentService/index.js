const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const ALLOWED_COLLECTIONS = new Set([
  'villages', 'places', 'stories', 'media', 'routes'
]);

function success(data) {
  return { ok: true, data };
}

function failure(code, message) {
  return { ok: false, code, message };
}

exports.main = async event => {
  const action = event && event.action;
  const collectionName = event && event.collection;

  if (!ALLOWED_COLLECTIONS.has(collectionName)) {
    return failure('INVALID_COLLECTION', '不允许访问该数据集合');
  }

  try {
    if (action === 'listPublished') {
      const result = await db.collection(collectionName)
        .where({ status: 'published' })
        .limit(100)
        .get();
      return success(result.data);
    }

    if (action === 'getPublishedById') {
      const id = event && event.id;
      if (!id) return failure('MISSING_ID', '缺少数据ID');
      const result = await db.collection(collectionName)
        .where({ _id: id, status: 'published' })
        .limit(1)
        .get();
      return success(result.data[0] || null);
    }

    return failure('INVALID_ACTION', '不支持的操作');
  } catch (error) {
    console.error('[contentService]', error);
    return failure('DATABASE_ERROR', '数据服务暂时不可用');
  }
};

