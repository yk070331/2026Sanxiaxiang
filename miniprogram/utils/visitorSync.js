const CHECK_IN_STORAGE_KEY = 'qiaolinStudyTourCheckIns';
const PENDING_SYNC_KEY = 'qiaolinPendingCheckInSync';

function isCloudReady() {
  try {
    const app = getApp();
    return Boolean(wx.cloud && app && app.globalData && app.globalData.env);
  } catch (error) {
    return false;
  }
}

function readPendingQueue() {
  const queue = wx.getStorageSync(PENDING_SYNC_KEY);
  return Array.isArray(queue) ? queue : [];
}

function writePendingQueue(queue) {
  wx.setStorageSync(PENDING_SYNC_KEY, queue.slice(-100));
}

function queueCheckIn(record) {
  const queue = readPendingQueue();
  const key = `${record.routeId}:${record.placeId}`;
  const exists = queue.some(item => `${item.routeId}:${item.placeId}` === key);
  if (!exists) {
    queue.push({ ...record, queuedAt: Date.now() });
    writePendingQueue(queue);
  }
  return queue.length;
}

async function callSaveCheckIn(record) {
  const result = await wx.cloud.callFunction({
    name: 'visitorRecords',
    data: {
      action: 'saveCheckin',
      routeId: record.routeId,
      placeId: record.placeId,
      method: record.method
    }
  });
  const response = result && result.result;
  if (!response || response.ok !== true) {
    throw new Error(response && response.message
      ? response.message
      : 'checkin-sync-failed');
  }
  return response.data;
}

async function syncCheckIn({ routeId, placeId, method = 'manual' }) {
  const record = {
    routeId: routeId || 'default',
    placeId,
    method: method === 'scan' ? 'scan' : 'manual'
  };
  if (!placeId) {
    return { synced: false, queued: false, reason: 'missing-place-id' };
  }

  if (!isCloudReady()) {
    queueCheckIn(record);
    return { synced: false, queued: true, reason: 'cloud-not-configured' };
  }

  try {
    const data = await callSaveCheckIn(record);
    return { synced: true, queued: false, data };
  } catch (error) {
    queueCheckIn(record);
    return {
      synced: false,
      queued: true,
      reason: error && error.message ? error.message : 'cloud-call-failed'
    };
  }
}

async function flushPendingCheckIns() {
  const queue = readPendingQueue();
  if (!queue.length || !isCloudReady()) {
    return { synced: 0, remaining: queue.length };
  }

  const remaining = [];
  let synced = 0;
  for (const record of queue) {
    try {
      await callSaveCheckIn(record);
      synced += 1;
    } catch (error) {
      remaining.push(record);
    }
  }
  writePendingQueue(remaining);
  return { synced, remaining: remaining.length };
}

module.exports = {
  CHECK_IN_STORAGE_KEY,
  PENDING_SYNC_KEY,
  flushPendingCheckIns,
  isCloudReady,
  queueCheckIn,
  syncCheckIn
};

