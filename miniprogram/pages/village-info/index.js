// pages/village-info/index.js
const { villageBasicInfo } = require('../../utils/data.js');

// Key 到中文标签的映射
const LABEL_MAP = {
  name: '村名', administrative: '行政区划', longitude: '经度', latitude: '纬度',
  elevation: '海拔', area: '总面积', population: '人口', partyMembers: '党员人数',
  villageGroups: '村民小组', established: '建村时间', revolutionaryPeriod: '革命时期归属',
  totalArea: '土地总面积', farmland: '耕地', forest: '林地',
  waterSurface: '水域面积', construction: '建设用地', unused: '未利用地',
  mainCrops: '主要农作物', forestProducts: '林产品',
  mainSource: '主要水源', reservoir: '水库', drinkingWater: '饮用水',
  waterQuality: '水质', irrigation: '灌溉方式', floodControl: '防洪',
  road: '道路交通', electricity: '电力', telecom: '通信网络',
  sanitation: '垃圾处理', sewage: '污水处理', publicLighting: '公共照明',
  clinic: '医疗卫生', culture: '文化设施', sports: '体育设施',
  education: '教育', elderly: '养老服务',
  collectiveIncome: '集体年收入', mainIndustries: '主导产业',
  perCapitaIncome: '人均可支配收入', cooperatives: '专业合作社',
  featuredProducts: '特色产品',
  sitesCount: '红色旧址', storiesCount: '红色故事',
  oldPartyMembers: '健在老党员', oralHistory: '口述史资料'
};

Page({
  data: {
    info: null,
    sections: [
      { id: 'basic', name: '基本村情', icon: '🏘️' },
      { id: 'land', name: '土地资源', icon: '🌾' },
      { id: 'water', name: '水利水源', icon: '💧' },
      { id: 'infrastructure', name: '基础设施', icon: '🔧' },
      { id: 'publicServices', name: '公共服务', icon: '🏥' },
      { id: 'economy', name: '集体经济', icon: '💰' },
      { id: 'redResources', name: '红色资源', icon: '🔴' }
    ],
    currentSection: 'basic',
    currentSectionName: '基本村情',
    rows: []  // [{label, value}]
  },

  onLoad(options) {
    const villageId = options.id || 'village_1';
    const info = villageBasicInfo[villageId] || villageBasicInfo.qiaolin;
    const rows = this.buildRows(info.basic);
    this.setData({ info, rows });
  },

  // 切换分类
  onSectionChange(e) {
    const sectionId = e.currentTarget.dataset.id;
    const sectionName = e.currentTarget.dataset.name;
    const info = this.data.info;
    const rows = this.buildRows(info[sectionId] || {});
    this.setData({
      currentSection: sectionId,
      currentSectionName: sectionName,
      rows
    });
  },

  // 将对象转换为 {label, value} 数组
  buildRows(data) {
    if (!data) return [];
    return Object.keys(data).map(key => ({
      label: LABEL_MAP[key] || key,
      value: data[key]
    }));
  },

  onShareAppMessage() {
    return {
      title: '红韵乔林 - 乔林村情信息',
      path: '/pages/village-info/index'
    };
  }
});
