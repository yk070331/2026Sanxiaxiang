const PENDING_CORRECTIONS_KEY = 'qiaolinPendingCorrections';

function isCloudReady() {
  try {
    const app = getApp();
    return Boolean(wx.cloud && app && app.globalData && app.globalData.env);
  } catch (error) {
    return false;
  }
}

function readQueue() {
  const queue = wx.getStorageSync(PENDING_CORRECTIONS_KEY);
  return Array.isArray(queue) ? queue : [];
}

function writeQueue(queue) {
  wx.setStorageSync(PENDING_CORRECTIONS_KEY, queue.slice(-50));
}

function queueCorrection(record) {
  const queue = readQueue();
  queue.push({
    ...record,
    localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    queuedAt: Date.now()
  });
  writeQueue(queue);
  return queue.length;
}

async function callSubmit(record) {
  const result = await wx.cloud.callFunction({
    name: 'visitorRecords',
    data: {
      action: 'submitCorrection',
      targetType: record.targetType,
      targetId: record.targetId,
      errorType: record.errorType,
      description: record.description,
      attachmentFileIds: record.attachmentFileIds || []
    }
  });
  const response = result && result.result;
  if (!response || response.ok !== true) {
    throw new Error(response && response.message ? response.message : '纠错提交失败');
  }
  return response.data;
}

async function submitCorrection(record) {
  if (!isCloudReady()) {
    queueCorrection(record);
    return { submitted: false, queued: true, reason: 'cloud-not-configured' };
  }
  try {
    const data = await callSubmit(record);
    return { submitted: true, queued: false, data };
  } catch (error) {
    queueCorrection(record);
    return {
      submitted: false,
      queued: true,
      reason: error && error.message ? error.message : 'cloud-call-failed'
    };
  }
}

async function flushPendingCorrections() {
  const queue = readQueue();
  if (!queue.length || !isCloudReady()) {
    return { synced: 0, remaining: queue.length };
  }
  const remaining = [];
  let synced = 0;
  for (const record of queue) {
    try {
      await callSubmit(record);
      synced += 1;
    } catch (error) {
      remaining.push(record);
    }
  }
  writeQueue(remaining);
  return { synced, remaining: remaining.length };
}

module.exports = {
  PENDING_CORRECTIONS_KEY,
  flushPendingCorrections,
  isCloudReady,
  queueCorrection,
  submitCorrection
};
