// pages/site-detail/index.js
const { redLandmarks, redVillages, redStories } = require('../../utils/data.js');
const { hasCoordinates, arrivalFor, navigateWithArrival } = require('../../utils/navigation.js');

function safeDecode(value) {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

Page({
  data: {
    site: null,
    source: '', // 'landmark' or 'village_site'
    relatedStories: [],
    canNavigate: false
  },

  onLoad(options) {
    const { id, name, desc } = options;
    let site = null;
    let source = '';

    // 先查找是否是市级红色地标
    if (id) {
      site = redLandmarks.find(l => l.id === id);
      if (site) source = 'landmark';
    }

    // 如果不是地标，查找是否是村落内的旧址
    if (!site) {
      for (const village of redVillages) {
        if (village.sites) {
          const found = village.sites.find(s => s.name === name || s.id === id);
          if (found) {
            site = {
              ...found,
              villageName: village.name,
              villageId: village.id,
              address: `江西省吉安市井冈山市${village.town}${village.name}`
            };
            source = 'village_site';
            break;
          }
        }
      }
    }

    // 如果提供了 desc 参数（从村落页跳转过来），覆盖默认描述
    if (desc && site) {
      site.desc = safeDecode(desc);
    }

    if (!site) {
      // fallback: 从参数直接构建
      site = {
        name: safeDecode(name) || '旧址',
        desc: desc ? safeDecode(desc) : '暂无详细介绍',
        summary: ''
      };
      source = 'village_site';
    }

    // 查找相关红色故事
    const relatedStories = redStories.filter(s =>
      s.relatedSite && site && s.relatedSite === site.name
    );

    const canNavigate = hasCoordinates(site);
    this.setData({ site, source, relatedStories, canNavigate });
  },

  // 跳转到红色故事详情
  onGoToStory(e) {
    const storyId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/red-stories/index?storyId=${storyId}`
    });
  },

  // 一键导航
  onNavigate() {
    const s = this.data.site;
    if (!s) return;
    const village = redVillages.find(item => item.id === s.villageId);
    navigateWithArrival(s, arrivalFor(village));
  },

  // 跳转实景相册
  onGoToGallery() {
    wx.navigateTo({
      url: '/assets/gallery/index?category=revolutionary'
    });
  },

  // 返回村落详情
  onGoToVillage() {
    const s = this.data.site;
    if (s && s.villageId) {
      wx.redirectTo({
        url: `/pages/village-detail/index?id=${s.villageId}`
      });
    } else {
      wx.navigateBack();
    }
  },

  onShareAppMessage() {
    return {
      title: `红韵乔林 - ${this.data.site ? this.data.site.name : '旧址详情'}`,
      path: `/pages/site-detail/index?id=${this.data.site ? this.data.site.id || '' : ''}`
    };
  }
});
