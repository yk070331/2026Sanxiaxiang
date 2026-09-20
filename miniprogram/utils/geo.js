/**
 * 轻量地理计算：仅用于距离与时间估算，不替代腾讯地图实时路线规划。
 */
function distanceKm(fromLatitude, fromLongitude, toLatitude, toLongitude) {
  const values = [fromLatitude, fromLongitude, toLatitude, toLongitude];
  if (!values.every(Number.isFinite)) return null;
  if (Math.abs(fromLatitude) > 90 || Math.abs(toLatitude) > 90
    || Math.abs(fromLongitude) > 180 || Math.abs(toLongitude) > 180) return null;

  const toRadians = degree => degree * Math.PI / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(toLatitude - fromLatitude);
  const longitudeDelta = toRadians(toLongitude - fromLongitude);
  const fromLatitudeRadians = toRadians(fromLatitude);
  const toLatitudeRadians = toRadians(toLatitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitudeRadians)
      * Math.cos(toLatitudeRadians)
      * Math.sin(longitudeDelta / 2) ** 2;

  const clamped = Math.max(0, Math.min(1, a));
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(clamped), Math.sqrt(1 - clamped));
}

function formatDistance(distance) {
  if (!Number.isFinite(distance) || distance < 0) return '待定位';
  if (distance < 1) return `${Math.round(distance * 1000)}米`;
  return `${distance.toFixed(distance < 10 ? 1 : 0)}公里`;
}

function estimateMinutes(distance, speedKmPerHour) {
  if (!Number.isFinite(distance) || distance < 0 || !Number.isFinite(speedKmPerHour) || speedKmPerHour <= 0) {
    return null;
  }
  return Math.ceil(distance / speedKmPerHour * 60);
}

function formatMinutes(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) return '待定位';
  if (minutes < 60) return `约${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `约${hours}小时${rest}分钟` : `约${hours}小时`;
}

module.exports = {
  distanceKm,
  formatDistance,
  estimateMinutes,
  formatMinutes
};
