const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const ALLOWED_COLLECTIONS = new Set([
  'villages', 'places', 'stories', 'media', 'routes'
]);
const WRITABLE_ROLES = new Set(['recorder', 'teamAdmin', 'reviewer']);

function success(data) {
  return { ok: true, data };
}

function failure(code, message) {
  return { ok: false, code, message };
}

async function getRole(openid) {
  const result = await db.collection('adminRoles')
    .where({ openid, enabled: true })
    .limit(1)
    .get();
  return result.data[0] || null;
}

function cleanPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }
  const blocked = new Set([
    '_id', '_openid', 'status', 'createdAt', 'updatedAt',
    'reviewedAt', 'reviewedBy', 'submittedBy'
  ]);
  const cleaned = {};
  Object.keys(payload).slice(0, 50).forEach(key => {
    if (!blocked.has(key)) cleaned[key] = payload[key];
  });
  return cleaned;
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const action = event && event.action;
  const collectionName = event && event.collection;

  try {
    const roleRecord = await getRole(OPENID);
    if (!roleRecord || !WRITABLE_ROLES.has(roleRecord.role)) {
      return failure('FORBIDDEN', '当前账号没有资料管理权限');
    }
    if (!ALLOWED_COLLECTIONS.has(collectionName)) {
      return failure('INVALID_COLLECTION', '不允许管理该数据集合');
    }

    if (action === 'saveDraft') {
      const payload = cleanPayload(event.payload);
      if (!payload) return failure('INVALID_PAYLOAD', '资料内容不正确');
      const record = {
        ...payload,
        status: 'draft',
        submittedBy: OPENID,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      };
      const result = await db.collection(collectionName).add({ data: record });
      return success({ _id: result._id });
    }

    if (action === 'submitReview') {
      const id = event && event.id;
      if (!id) return failure('MISSING_ID', '缺少资料ID');
      const ownership = roleRecord.role === 'recorder'
        ? { submittedBy: OPENID }
        : {};
      const result = await db.collection(collectionName).where({
        _id: id,
        ...ownership,
        status: db.command.in(['draft', 'rejected'])
      }).update({
        data: {
          status: 'reviewing',
          updatedAt: db.serverDate()
        }
      });
      if (!result.stats.updated) {
        return failure('NOT_EDITABLE', '该资料不存在或当前状态不可提交');
      }
      return success({ updated: result.stats.updated });
    }

    if (action === 'listReviewQueue') {
      if (!['teamAdmin', 'reviewer'].includes(roleRecord.role)) {
        return failure('FORBIDDEN', '当前账号没有审核权限');
      }
      const result = await db.collection(collectionName)
        .where({ status: 'reviewing' })
        .orderBy('updatedAt', 'asc')
        .limit(100)
        .get();
      return success(result.data);
    }

    if (action === 'review') {
      if (roleRecord.role !== 'reviewer') {
        return failure('FORBIDDEN', '只有审核员可以正式发布资料');
      }
      const id = event && event.id;
      const approved = event && event.approved === true;
      if (!id) return failure('MISSING_ID', '缺少资料ID');
      const result = await db.collection(collectionName).where({
        _id: id,
        status: 'reviewing'
      }).update({
        data: {
          status: approved ? 'published' : 'rejected',
          reviewNote: String(event.reviewNote || '').slice(0, 500),
          reviewedBy: OPENID,
          reviewedAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      });
      if (!result.stats.updated) {
        return failure('NOT_REVIEWABLE', '该资料不存在或不在待审核状态');
      }
      return success({ updated: result.stats.updated });
    }

    return failure('INVALID_ACTION', '不支持的操作');
  } catch (error) {
    console.error('[contentAdmin]', error);
    return failure('SERVICE_ERROR', '资料管理服务暂时不可用');
  }
};

