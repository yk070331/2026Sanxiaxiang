// pages/route-recommend/index.js
const { routePresets, studyTour, mapPlaces } = require('../../utils/data.js');

const OPTION_GROUPS = [
  {
    id: 'durationValue',
    name: '游览时长',
    options: [
      { value: '30', name: '30分钟' },
      { value: '60', name: '1小时' },
      { value: 'halfday', name: '半天' }
    ]
  },
  {
    id: 'theme',
    name: '游览主题',
    options: [
      { value: '革命历史', name: '革命历史' },
      { value: '红色人物', name: '红色人物' },
      { value: '古村文化', name: '古村文化' },
      { value: '生态乡村', name: '生态乡村' }
    ]
  },
  {
    id: 'audience',
    name: '游客类型',
    options: [
      { value: '学生团队', name: '学生团队' },
      { value: '亲子家庭', name: '亲子家庭' },
      { value: '普通游客', name: '普通游客' },
      { value: '老年游客', name: '老年游客' }
    ]
  },
  {
    id: 'mode',
    name: '出行方式',
    options: [
      { value: '步行', name: '步行' },
      { value: '自驾', name: '自驾到村·村内步行' }
    ]
  },
  {
    id: 'difficulty',
    name: '路线难度',
    options: [
      { value: '轻松', name: '轻松' },
      { value: '标准', name: '标准' },
      { value: '深度', name: '深度' }
    ]
  }
];

function buildOptionGroups(selections) {
  return OPTION_GROUPS.map(group => ({
    ...group,
    options: group.options.map(option => ({
      ...option,
      selected: selections[group.id] === option.value
    }))
  }));
}

function resolveStopName(segmentId) {
  if (segmentId === 'nature_reservoir') {
    const reservoir = mapPlaces.find(place => place.id === 'place_qiaolin_reservoir');
    return reservoir ? reservoir.name : '乔林水库';
  }
  const segment = studyTour.segments.find(item => item.id === segmentId);
  return segment ? segment.name.replace(/^(起点|终点|第[一二三四五六]站)：/, '') : segmentId;
}

Page({
  data: {
    careMode: false,
    selections: {
      durationValue: '60',
      theme: '革命历史',
      audience: '学生团队',
      mode: '步行',
      difficulty: '标准'
    },
    optionGroups: buildOptionGroups({
      durationValue: '60',
      theme: '革命历史',
      audience: '学生团队',
      mode: '步行',
      difficulty: '标准'
    }),
    recommendedRoute: null
  },

  onLoad() {
    const app = getApp();
    this.setData({ careMode: Boolean(app.globalData.careMode) });
    this.updateRecommendation();
  },

  onOptionTap(e) {
    const group = e.currentTarget.dataset.group;
    const value = e.currentTarget.dataset.value;
    if (!group || !value) return;
    const selections = {
      ...this.data.selections,
      [group]: value
    };
    this.setData({
      selections,
      optionGroups: buildOptionGroups(selections)
    }, () => this.updateRecommendation());
  },

  updateRecommendation() {
    const selected = this.data.selections;
    const ranked = routePresets.map(route => {
      let score = 0;
      if (route.durationValue === selected.durationValue) score += 6;
      if (route.themes.includes(selected.theme)) score += 3;
      if (route.audiences.includes(selected.audience)) score += 2;
      if (route.mode === selected.mode || selected.mode === '自驾') score += 1;
      if (route.difficulty === selected.difficulty) score += 2;
      return { route, score };
    }).sort((left, right) => right.score - left.score);

    const route = ranked[0].route;
    this.setData({
      recommendedRoute: {
        ...route,
        stopNames: route.segmentIds.map(resolveStopName)
      }
    });
  },

  onUseRoute() {
    const route = this.data.recommendedRoute;
    if (!route) return;
    wx.navigateTo({
      url: `/pages/study-tour/index?preset=${encodeURIComponent(route.id)}`
    });
  },

  onToggleCare() {
    const app = getApp();
    const careMode = !this.data.careMode;
    app.globalData.careMode = careMode;
    wx.setStorageSync('qiaolinCareMode', careMode);
    this.setData({ careMode });
  },

  onShareAppMessage() {
    return {
      title: `红韵乔林 - ${this.data.recommendedRoute ? this.data.recommendedRoute.title : '路线推荐'}`,
      path: '/pages/route-recommend/index'
    };
  }
});
