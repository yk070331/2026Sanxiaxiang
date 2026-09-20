const { photos } = require('../../utils/contributedPhotos.js');
const { photoCollections } = require('../../utils/photoCollections.js');
Page({
  data: {
    groups: [{ id: 'all', title: '全部', count: photos.length }, ...photoCollections],
    currentGroup: 'all', photos: [], totalCount: photos.length, showPreview: false, previewIndex: 0
  },
  onLoad(options = {}) {
    this.selectGroup(options.group || 'all');
    const selected = this.data.photos.find(photo => photo.id === options.photo);
    if (selected) this.setData({ photos: [selected, ...this.data.photos.filter(photo => photo.id !== selected.id)] });
  },
  selectGroup(id) {
    const group = this.data.groups.find(item => item.id === id) || this.data.groups[0];
    this.setData({ currentGroup: group.id, photos: photos.filter(photo => group.id === 'all' || photo.group === group.id), showPreview: false, previewIndex: 0 });
  },
  onGroupChange(e) { this.selectGroup(e.currentTarget.dataset.id); },
  onPreview(e) {
    const photo = this.data.photos.find(item => item.id === e.currentTarget.dataset.id);
    if (!photo) return;
    this.setData({ showPreview: true, previewIndex: this.data.photos.findIndex(item => item.id === photo.id) });
  },
  onPreviewChange(e) { this.setData({ previewIndex: e.detail.current }); },
  onClosePreview() { this.setData({ showPreview: false }); },
  onShareAppMessage() {
    return { title: '红韵乔林 · 补充照片', path: `/contributions/gallery/index?group=${this.data.currentGroup}` };
  }
});
