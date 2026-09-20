// Navigation targets use GCJ-02; missing coordinates must never become a guessed pin.
function hasCoordinates(target) {
  return Boolean(target && Number.isFinite(target.latitude) && Number.isFinite(target.longitude)
    && Math.abs(target.latitude) <= 90 && Math.abs(target.longitude) <= 180);
}

function locationFailure(error) {
  const message = String(error && error.errMsg || '');
  if (/privacy|privacy agreement|隐私/i.test(message)) {
    return { message: '位置服务需要完成隐私授权；若仍失败，请联系维护者检查小程序隐私保护指引。', settings: false };
  }
  if (/api.*permission|no permission|not declared|not in.*requiredPrivateInfos|permission.*interface/i.test(message)) {
    return { message: '当前版本的位置服务尚未开通，请联系维护者检查微信后台接口权限。', settings: false };
  }
  if (/auth deny|auth denied|authorize|permission/i.test(message)) {
    return { message: '未获得位置权限，请在小程序设置中允许定位，并确认手机已允许微信使用位置。', settings: true };
  }
  return { message: '定位暂不可用，请检查系统定位和网络后重试。仍可尝试打开到村集合点地图。', settings: false };
}

function arrivalFor(village) {
  if (!village) return null;
  return {
    ...village,
    name: village.id === 'village_1' ? '乔林村委会（到村集合点）' : village.name,
    address: `江西省吉安市井冈山市${village.town || ''}${village.name}`
  };
}

function openDestination(target) {
  if (!hasCoordinates(target)) return false;
  wx.openLocation({
    latitude: target.latitude, longitude: target.longitude,
    name: target.name, address: target.address || '江西省吉安市井冈山市茅坪镇乔林村', scale: 17,
    fail(error) {
      if (/cancel/i.test(String(error && error.errMsg || ''))) return;
      const issue = locationFailure(error);
      wx.showModal({
        title: '地图暂未打开',
        content: `${issue.message}\n目的地：${target.name}。可复制坐标到地图中查找。`,
        confirmText: '复制位置', cancelText: '关闭',
        success(result) {
          if (result.confirm) wx.setClipboardData({ data: `${target.name}\n${target.address || ''}\nGCJ-02 纬度 ${target.latitude}，经度 ${target.longitude}` });
        }
      });
    }
  });
  return true;
}

function navigateWithArrival(target, arrival, title) {
  if (openDestination(target)) return;
  const canArrive = hasCoordinates(arrival);
  wx.showModal({
    title: title || '旧址位置待核验',
    content: `${target ? target.name : '此点位'}尚无核验坐标，当前不提供推测导航。${canArrive ? '可先导航到' + arrival.name + '，到村后按现场标识或向工作人员确认旧址位置。集合点不等于该旧址。' : '请按现场标识确认位置。'}`,
    showCancel: canArrive, confirmText: canArrive ? '到村集合点' : '知道了', cancelText: '留在此页',
    success(result) { if (result.confirm && canArrive) openDestination(arrival); }
  });
}

module.exports = { hasCoordinates, locationFailure, arrivalFor, openDestination, navigateWithArrival };
