const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function success(data) {
  return { ok: true, data };
}

function failure(code, message) {
  return { ok: false, code, message };
}

function validId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const action = event && event.action;

  if (!OPENID) {
    return failure('UNAUTHENTICATED', '无法识别当前微信用户');
  }

  try {
    if (action === 'saveCheckin') {
      const routeId = event.routeId || 'default';
      const placeId = event.placeId;
      if (!validId(routeId) || !validId(placeId)) {
        return failure('INVALID_PARAMETER', '路线或点位参数不正确');
      }

      const existing = await db.collection('checkins').where({
        _openid: OPENID,
        routeId,
        placeId
      }).limit(1).get();

      if (existing.data.length) {
        return success(existing.data[0]);
      }

      const record = {
        _openid: OPENID,
        routeId,
        placeId,
        method: event.method === 'scan' ? 'scan' : 'manual',
        checkedAt: db.serverDate()
      };
      const result = await db.collection('checkins').add({ data: record });
      return success({ _id: result._id, ...record });
    }

    if (action === 'listMyCheckins') {
      const result = await db.collection('checkins')
        .where({ _openid: OPENID })
        .orderBy('checkedAt', 'desc')
        .limit(100)
        .get();
      return success(result.data);
    }

    if (action === 'submitCorrection') {
      const targetType = event.targetType;
      const targetId = event.targetId;
      const description = typeof event.description === 'string'
        ? event.description.trim().slice(0, 1000)
        : '';
      const allowedTargetTypes = ['village', 'place', 'story', 'media', 'route'];

      if (!allowedTargetTypes.includes(targetType) || !validId(targetId)) {
        return failure('INVALID_TARGET', '纠错对象不正确');
      }
      if (!event.errorType || description.length < 5) {
        return failure('INVALID_CONTENT', '请填写完整的纠错说明');
      }

      const record = {
        _openid: OPENID,
        targetType,
        targetId,
        errorType: String(event.errorType).slice(0, 50),
        description,
        attachmentFileIds: Array.isArray(event.attachmentFileIds)
          ? event.attachmentFileIds.slice(0, 5)
          : [],
        status: 'pending',
        submittedAt: db.serverDate()
      };
      const result = await db.collection('corrections').add({ data: record });
      return success({ _id: result._id });
    }

    return failure('INVALID_ACTION', '不支持的操作');
  } catch (error) {
    console.error('[visitorRecords]', error);
    return failure('SERVICE_ERROR', '服务暂时不可用');
  }
};

