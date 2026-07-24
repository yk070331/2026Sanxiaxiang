/**
 * 红韵乔林 - 井冈山红色文旅数据
 * 数据来源：驻村实地采集
 */

// ==================== 地图标记点 ====================
// 微信 map/openLocation 在中国大陆使用 GCJ-02 坐标。
// 乔林村村委会与乔林水库可达入口坐标来自腾讯地图分享位置（GCJ-02）；
// 村内旧址仍需用腾讯地图分享点或现场采集坐标逐点复核。

// 市级核心红色地标（红色五角星标注）
const redLandmarks = [
  {
    id: 'landmark_1',
    name: '黄洋界',
    type: 'landmark',
    latitude: 26.620297,
    longitude: 114.121860,
    coordinateSystem: 'gcj02',
    coordinateSource: '高德地图：黄洋界保卫战胜利纪念碑',
    address: '江西省吉安市井冈山市茅坪镇黄洋界保卫战胜利纪念碑',
    iconPath: '/images/icons/marker-red-star.png',
    width: 40,
    height: 40,
    summary: '井冈山五大哨口之一，黄洋界保卫战旧址',
    desc: '黄洋界位于井冈山北面，海拔1343米，是井冈山革命根据地五大哨口之一。1928年8月30日，著名的黄洋界保卫战在此打响，红军以不足一个营的兵力击退敌军四个团的进攻。毛泽东为此写下《西江月·井冈山》千古绝唱。'
  },
  {
    id: 'landmark_2',
    name: '八角楼',
    type: 'landmark',
    latitude: 26.680,
    longitude: 114.120,
    iconPath: '/images/icons/marker-red-star.png',
    width: 40,
    height: 40,
    summary: '毛泽东旧居，光辉著作诞生地',
    desc: '八角楼位于茅坪村，因楼上有一个八角形天窗而得名。1927年10月至1929年2月，毛泽东在此居住和办公。在八角楼的清油灯下，毛泽东写下了《中国的红色政权为什么能够存在？》和《井冈山的斗争》两篇光辉著作。'
  },
  {
    id: 'landmark_3',
    name: '井冈山革命烈士陵园',
    type: 'landmark',
    latitude: 26.578376,
    longitude: 114.165737,
    coordinateSystem: 'gcj02',
    coordinateSource: '高德地图：井冈山革命烈士陵园',
    address: '江西省吉安市井冈山市茨坪镇五井路87号',
    iconPath: '/images/icons/marker-red-star.png',
    width: 40,
    height: 40,
    summary: '缅怀井冈山斗争时期牺牲的革命先烈',
    desc: '井冈山革命烈士陵园位于茨坪北面的北岩峰上，1987年10月建成。陵园由纪念碑、纪念堂、雕塑园、碑林四部分组成，庄严肃穆，是缅怀井冈山革命先烈的重要场所。'
  },
  {
    id: 'landmark_4',
    name: '龙江书院',
    type: 'landmark',
    latitude: 26.700,
    longitude: 114.150,
    iconPath: '/images/icons/marker-red-star.png',
    width: 40,
    height: 40,
    summary: '朱毛红军会师旧址，红军军官教导队旧址',
    desc: '龙江书院建于清道光年间，1928年4月28日，朱德、陈毅率领的南昌起义余部和湘南农军与毛泽东领导的秋收起义部队在此胜利会师，史称"井冈山会师"。书院内设有红军军官教导队旧址。'
  },
  {
    id: 'landmark_5',
    name: '大井毛泽东旧居',
    type: 'landmark',
    latitude: 26.580,
    longitude: 114.105,
    iconPath: '/images/icons/marker-red-star.png',
    width: 40,
    height: 40,
    summary: '毛泽东、朱德、陈毅等领导人旧居',
    desc: '大井是井冈山大小五井中最大的一个村庄。1927年10月，毛泽东率领秋收起义部队上井冈山后在此居住。旧居内有毛泽东、朱德、陈毅等同志的旧居，以及红军医务所旧址。'
  },
  {
    id: 'landmark_6',
    name: '小井红军医院',
    type: 'landmark',
    latitude: 26.560,
    longitude: 114.130,
    iconPath: '/images/icons/marker-red-star.png',
    width: 40,
    height: 40,
    summary: '中国红军历史上第一所正规医院',
    desc: '小井红军医院建于1928年，原名"红光医院"，是红军历史上第一所正规医院。1929年1月，井冈山失守，130多名红军伤病员被敌人残忍杀害于医院附近的稻田中。'
  },
  {
    id: 'landmark_7',
    name: '茨坪革命旧址群',
    type: 'landmark',
    latitude: 26.568823,
    longitude: 114.168843,
    coordinateSystem: 'gcj02',
    coordinateSource: '高德地图：井冈山风景名胜区茨坪景区',
    address: '江西省吉安市井冈山市茨坪镇井冈山风景名胜区茨坪景区',
    iconPath: '/images/icons/marker-red-star.png',
    width: 40,
    height: 40,
    summary: '井冈山革命根据地党政军指挥中心',
    desc: '茨坪是井冈山革命根据地的中心，1927年至1929年间是红军最高指挥部所在地。旧址群包括毛泽东旧居、朱德旧居、红四军军部、中共井冈山前委等。'
  }
];

// 红色村落标记（古村图标标注）
const redVillages = [
  {
    id: 'village_1',
    name: '乔林村',
    type: 'village',
    latitude: 26.620306,
    longitude: 114.046347,
    coordinateSystem: 'gcj02',
    coordinateStatus: '已按腾讯地图分享位置核准',
    coordinateSource: '腾讯地图：乔林村委会',
    iconPath: '/images/icons/marker-village.png',
    width: 36,
    height: 36,
    town: '茅坪镇',
    summary: '红色美丽村庄，古村风貌保存完好',
    population: 680,
    area: '5.2平方公里',
    partyMembers: 22,
    history: '乔林村位于井冈山北面的黄洋界脚下，现属井冈山市茅坪镇，是井冈山革命根据地的重要组成部分。村内保留多处革命旧址，红色文化底蕴深厚。',
    sites: [
      { id: 'site_1', name: '乔林红军标语墙', desc: '保存完好的红军时期宣传标语' },
      { id: 'site_2', name: '乔林苏维埃政府旧址', desc: '土地革命时期村苏维埃政府驻地' },
      { id: 'site_3', name: '红军粮仓旧址', desc: '红军后勤补给的重要粮仓' },
      { id: 'site_4', name: '乔林红军哨口遗址', desc: '扼守山道的军事防御工事' },
      { id: 'site_5', name: '中共乔林支部旧址', desc: '井冈山斗争时期最早的农村党支部之一' },
      { id: 'site_6', name: '红军井', desc: '红军为村民挖掘的水井，至今仍在使用' }
    ],
    farmland: '耕地面积 820 亩',
    forest: '林地面积 4200 亩',
    waterSource: '乔林溪、乔林水库',
    drinkingWater: '集中式供水，水源地为乔林水库',
    infrastructure: '通村公路硬化 4.2km，村内道路硬化率 95%',
    publicServices: '村级卫生室 1 所、文化活动中心 1 处'
  },
  {
    id: 'village_2',
    name: '茅坪村',
    type: 'village',
    latitude: 26.680,
    longitude: 114.105,
    iconPath: '/images/icons/marker-village.png',
    width: 36,
    height: 36,
    town: '茅坪镇',
    summary: '茅坪镇政府驻地，八角楼所在地',
    population: 1200,
    area: '7.8平方公里'
  },
  {
    id: 'village_3',
    name: '大陇村',
    type: 'village',
    latitude: 26.690,
    longitude: 114.085,
    iconPath: '/images/icons/marker-village.png',
    width: 36,
    height: 36,
    town: '茅坪镇',
    summary: '红色美丽村庄，红军被服厂旧址',
    population: 560,
    area: '4.5平方公里'
  },
  {
    id: 'village_4',
    name: '神山村',
    type: 'village',
    latitude: 26.650,
    longitude: 114.080,
    iconPath: '/images/icons/marker-village.png',
    width: 36,
    height: 36,
    town: '茅坪镇',
    summary: '习近平总书记2016年视察村庄，脱贫攻坚样板村',
    population: 230,
    area: '2.8平方公里'
  }
];

// 自然与公共地图点位
const mapPlaces = [
  {
    id: 'place_qiaolin_reservoir',
    name: '乔林水库',
    type: 'water',
    latitude: 26.619332,
    longitude: 114.046397,
    coordinateSystem: 'gcj02',
    coordinateStatus: '已按腾讯地图分享位置核准',
    coordinateSource: '腾讯地图：乔林水库可到达入口/大坝',
    address: '江西省吉安市井冈山市茅坪镇乔林村',
    iconPath: '/images/icons/marker-village.png',
    width: 30,
    height: 30,
    summary: '乔林村旁的小（1）型水库',
    desc: '地图点位采用腾讯地图分享的乔林水库可到达入口/大坝位置；实际通行请以现场道路和安全提示为准。'
  }
];

// 村内旧址原坐标随旧村中心整体偏移，现不提供导航，待腾讯地图分享点逐项核准。

// ==================== 红色故事 ====================
const redStories = [
  {
    id: 'story_1',
    title: '八角楼的灯光',
    author: '乔林村老党员 李德胜（口述）',
    date: '2025年7月采录',
    category: '革命往事',
    text: '1927年冬天，井冈山的夜晚格外寒冷。在茅坪八角楼里，毛泽东同志常常工作到深夜。楼上的清油灯虽然只有一根灯芯，却照亮了中国革命的道路。\n\n当时物资极度匮乏，按照规定，毛泽东晚上办公可以使用三根灯芯，但他坚持只点一根。就是在这样昏暗的灯光下，他写下了《中国的红色政权为什么能够存在？》和《井冈山的斗争》两篇光辉著作，回答了"红旗到底能打多久"的疑问。\n\n我们村的老人们口口相传：八角楼的灯光虽小，却是穷人的希望之光。附近村子的群众夜里看到八角楼的灯光，就知道毛委员还在为穷人操劳。\n\n这盏灯，一直亮在每个井冈山人的心里。',
    audio: '/assets/audio/story_bajiaolou.mp3',
    audioDuration: '4分32秒',
    image: '/assets/images/story_bajiaolou.jpg',
    relatedSite: '八角楼'
  },
  {
    id: 'story_2',
    title: '乔林村的红军标语',
    author: '乔林村文化员 周玉兰（口述）',
    date: '2025年6月采录',
    category: '革命往事',
    text: '在乔林村的古墙上，至今保存着十余条红军时期留下的标语。"打土豪、分田地""红军是穷人的队伍""工农革命军万岁"……这些用石灰水刷写的标语历经九十多年风雨，字迹依然可辨。\n\n我的祖父当年亲眼看到红军宣传员在墙上刷写标语。他说那些宣传员都是二十岁左右的年轻人，他们白天帮老乡干活，晚上就在墙上写字。标语写完后，全村男女老少都围过来，不识字的就听识字的人念。\n\n这些标语让老百姓明白了红军是做什么的，为什么要革命。很多年轻人就是看了这些标语，才报名参加红军的。我们乔林村当年就有17名青年参加红军，后来大部分都牺牲了。\n\n这些标语墙，是我们村最珍贵的红色记忆。',
    audio: '/assets/audio/story_biaoyu.mp3',
    audioDuration: '3分18秒',
    image: '/assets/images/story_biaoyu.jpg',
    relatedSite: '乔林红军标语墙'
  },
  {
    id: 'story_3',
    title: '乔林党支部——井冈山最早的农村党支部之一',
    author: '乔林村党支部书记 刘建国（口述）',
    date: '2025年6月采录',
    category: '红色人物',
    text: '1928年春天，井冈山革命根据地进入蓬勃发展时期。为了加强农村基层组织建设，毛泽东同志派党员深入乡村发展党组织。\n\n乔林村党支部就是在这样的背景下成立的——井冈山斗争时期最早建立的农村党支部之一。第一批党员只有5人，第一任支部书记叫谢桂标，是个识字的贫农。\n\n党支部成立后，做了三件大事：一是组织农民协会，二是开展分田运动，三是动员青年参军。在党员的带动下，乔林村成为井冈山根据地的模范村。\n\n谢桂标后来在战斗中牺牲，年仅27岁。但他创建的党支部一直延续至今。现在，我们村党支部有22名党员，依然传承着革命先辈的精神。',
    audio: '/assets/audio/story_dangzhibu.mp3',
    audioDuration: '5分05秒',
    image: '/assets/images/story_dangzhibu.jpg',
    relatedSite: '中共乔林支部旧址'
  },
  {
    id: 'story_4',
    title: '红军井——鱼水深情的见证',
    author: '乔林村老人 张春生（口述）',
    date: '2025年7月采录',
    category: '革命往事',
    text: '乔林村中央有一口老井，村里人都叫它"红军井"。井口不大，水却一年四季清澈甘甜。\n\n这口井是1928年秋天红军帮村里挖的。在这之前，村民要到三里外的溪边挑水，来回要一个多小时，遇到雨天路滑更是艰难。\n\n红军驻扎乔林村期间，看到村民吃水困难，就组织战士们用半个月时间挖了这口井。井挖成那天，全村人比过年还高兴，纷纷拿出家里仅有的红薯、南瓜来感谢红军，但红军战士们说什么也不肯收。\n\n九十多年过去了，这口井至今仍在使用。村里通了自来水，但很多老人还是喜欢喝井水。他们说，这水是红军留下的，喝着心里暖和。',
    audio: '/assets/audio/story_hongjun_jing.mp3',
    audioDuration: '3分45秒',
    image: '/assets/images/story_hongjun_jing.jpg',
    relatedSite: '红军井'
  },
  {
    id: 'story_5',
    title: '黄洋界上炮声隆',
    author: '井冈山革命博物馆研究员 陈山',
    date: '2025年5月采录',
    category: '革命往事',
    text: '"黄洋界上炮声隆，报道敌军宵遁。"毛泽东同志的这句诗，记录了井冈山斗争史上最著名的一场战斗。\n\n1928年8月30日，湘赣两省敌军趁红军主力远在湘南之际，集中四个团的兵力进攻井冈山。留守部队不足一个营，在黄洋界哨口与敌人展开激战。\n\n红军凭借有利地形和群众的支援，用仅有的一门迫击炮和几发炮弹，打退了敌人的多次进攻。当最后一发炮弹在敌指挥所附近爆炸时，敌军以为红军主力已经返回，慌忙撤退。\n\n这场漂亮的保卫战，保住了井冈山革命根据地，极大地鼓舞了军民的斗志。毛泽东同志回师井冈山后，写下了《西江月·井冈山》这首千古绝唱。',
    audio: '/assets/audio/story_huangyangjie.mp3',
    audioDuration: '5分20秒',
    image: '/assets/images/story_huangyangjie.jpg',
    relatedSite: '黄洋界'
  },
  {
    id: 'story_6',
    title: '朱德的扁担',
    author: '井冈山革命博物馆',
    date: '历史文献整理',
    category: '红色人物',
    text: '井冈山斗争时期，由于敌人对根据地实行严密的经济封锁，粮食供应十分困难。红军指战员除了打仗，还要下山到宁冈等地挑粮上山。\n\n从宁冈到井冈山，走一趟要翻过海拔1300多米的黄洋界哨口，往返六十多里山路。朱德同志当时已经42岁，是红四军军长，但他坚持和战士们一起下山挑粮。\n\n战士们为了照顾朱军长，把他的扁担藏了起来。朱德发现后，就自己削了一根新扁担，还在扁担上刻了"朱德记"三个字，意思是这是我的专用扁担，谁也别想拿走。\n\n从此，"朱德的扁担"成为井冈山艰苦奋斗精神的象征，流传至今。',
    audio: '/assets/audio/story_zhude_biandan.mp3',
    audioDuration: '4分10秒',
    image: '/assets/images/story_zhude_biandan.jpg',
    relatedSite: '黄洋界'
  }
];

// 当前仓库未包含口述音频；上传对应 MP3 后，将单条故事的 audioAvailable 改为 true。
redStories.forEach(story => {
  story.audioAvailable = false;
});

// ==================== 实景相册 ====================
const photoGallery = [
  // 革命旧址类
  {
    id: 'photo_1',
    category: 'revolutionary',
    categoryName: '革命旧址',
    title: '八角楼正面全景',
    src: '/assets/images/gallery_bajiaolou_1.jpg',
    desc: '茅坪八角楼全貌，青砖灰瓦的赣西民居建筑',
    date: '2025年6月'
  },
  {
    id: 'photo_2',
    category: 'revolutionary',
    categoryName: '革命旧址',
    title: '八角楼内毛泽东卧室',
    src: '/assets/images/gallery_bajiaolou_2.jpg',
    desc: '八角楼二层毛泽东旧居内景，清油灯与书桌',
    date: '2025年6月'
  },
  {
    id: 'photo_3',
    category: 'revolutionary',
    categoryName: '革命旧址',
    title: '乔林红军标语墙',
    src: '/assets/images/gallery_biaoyu_qiang.jpg',
    desc: '村内古建筑外墙上保存至今的红军标语',
    date: '2025年6月'
  },
  {
    id: 'photo_4',
    category: 'revolutionary',
    categoryName: '革命旧址',
    title: '乔林苏维埃政府旧址',
    src: '/assets/images/gallery_suweiai.jpg',
    desc: '土地革命时期乔林村苏维埃政府驻地旧址',
    date: '2025年6月'
  },
  {
    id: 'photo_5',
    category: 'revolutionary',
    categoryName: '革命旧址',
    title: '红军井',
    src: '/assets/images/gallery_hongjun_jing.jpg',
    desc: '红军为村民挖的水井，至今仍在使用',
    date: '2025年7月'
  },
  {
    id: 'photo_6',
    category: 'revolutionary',
    categoryName: '革命旧址',
    title: '黄洋界哨口纪念碑',
    src: '/assets/images/gallery_huangyangjie.jpg',
    desc: '黄洋界保卫战胜利纪念碑及迫击炮雕塑',
    date: '2025年7月'
  },
  // 古村落类
  {
    id: 'photo_7',
    category: 'village',
    categoryName: '古村落',
    title: '乔林村全景（航拍）',
    src: '/assets/images/gallery_qiaolin_hangpai.jpg',
    desc: '乔林村依山傍水，古树环绕的村落全景',
    date: '2025年6月'
  },
  {
    id: 'photo_8',
    category: 'village',
    categoryName: '古村落',
    title: '乔林古祠堂',
    src: '/assets/images/gallery_citang.jpg',
    desc: '建于清代的乔林村宗祠，精美的木雕和石雕',
    date: '2025年6月'
  },
  {
    id: 'photo_9',
    category: 'village',
    categoryName: '古村落',
    title: '古巷道',
    src: '/assets/images/gallery_xiangdao.jpg',
    desc: '鹅卵石铺就的古巷道，两侧是百年老宅',
    date: '2025年7月'
  },
  {
    id: 'photo_10',
    category: 'village',
    categoryName: '古村落',
    title: '村口古樟树',
    src: '/assets/images/gallery_gushu.jpg',
    desc: '村口500年树龄的古樟树，村民视为风水树',
    date: '2025年7月'
  },
  // 水源/山林类
  {
    id: 'photo_11',
    category: 'nature',
    categoryName: '水源山林',
    title: '乔林溪',
    src: '/assets/images/gallery_qiaolinxi.jpg',
    desc: '流经村庄的溪流，清澈见底，两岸绿树成荫',
    date: '2025年6月'
  },
  {
    id: 'photo_12',
    category: 'nature',
    categoryName: '水源山林',
    title: '乔林水库',
    src: '/assets/images/gallery_shuiku.jpg',
    desc: '乔林村饮用水源地，群山环抱的碧水',
    date: '2025年7月'
  },
  {
    id: 'photo_13',
    category: 'nature',
    categoryName: '水源山林',
    title: '竹林深处',
    src: '/assets/images/gallery_zhulin.jpg',
    desc: '村后山茂密的毛竹林，是村民重要的经济来源',
    date: '2025年6月'
  },
  {
    id: 'photo_14',
    category: 'nature',
    categoryName: '水源山林',
    title: '梯田风光',
    src: '/assets/images/gallery_titian.jpg',
    desc: '村南的梯田，春天油菜花盛开时最为壮观',
    date: '2025年6月'
  }
];

// 当前仓库未包含实景照片，避免点击后打开空白预览。
// 上传对应文件后，将单张照片的 available 改为 true。
photoGallery.forEach(photo => {
  photo.available = false;
});

// ==================== 研学路线 ====================
const studyTour = {
  id: 'tour_1',
  title: '乔林村红色研学路线',
  totalDistance: '2.3公里',
  estimatedTime: '约2小时',
  difficulty: '轻松（含少量缓坡）',
  description: '本路线串联乔林村6处红色旧址，途经古村落核心区和自然景观带，全面展示乔林村的红色历史、古村风貌和自然生态。建议从村口古樟树出发，按顺序依次打卡。',
  segments: [
    {
      id: 'seg_1',
      order: 1,
      name: '起点：村口古樟树',
      type: 'start',
      description: '500年树龄的古樟树是乔林村的标志，树下立有"乔林村简介"牌，可在此集合、了解村庄概况。',
      tips: '请注意保护古树，不要在树干上刻画。'
    },
    {
      id: 'seg_2',
      order: 2,
      name: '第一站：中共乔林支部旧址',
      type: 'site',
      siteId: 'site_5',
      distance: '150m',
      description: '井冈山斗争时期最早建立的农村党支部之一，1928年春成立，首批党员5人。旧址为土木结构民房，保存较为完整。',
      tips: '重点参观党支部成立时的会议间和党员名册展板。',
      storyId: 'story_3'
    },
    {
      id: 'seg_3',
      order: 3,
      name: '第二站：乔林红军标语墙',
      type: 'site',
      siteId: 'site_1',
      distance: '120m',
      description: '保存十余条红军时期标语，内容涉及土地革命、参军动员等，是研究红军基层宣传工作的珍贵实物。',
      tips: '标语在古建筑外墙，请注意光线角度以便拍照记录。',
      storyId: 'story_2'
    },
    {
      id: 'seg_4',
      order: 4,
      name: '第三站：乔林苏维埃政府旧址',
      type: 'site',
      siteId: 'site_2',
      distance: '200m',
      description: '土地革命时期村苏维埃政府办公场所，内设土地部、粮食部、妇女部等部门，是当时村级政权建设的典范。',
      tips: '注意观察室内展出的分田登记册原件复制品。'
    },
    {
      id: 'seg_5',
      order: 5,
      name: '第四站：红军粮仓旧址',
      type: 'site',
      siteId: 'site_3',
      distance: '250m',
      description: '红军在乔林村设立的后勤补给粮仓，采用赣西传统粮仓建筑形式，通风防潮设计精巧。',
      tips: '粮仓内部展示了当年使用的度量衡器具，可以互动体验。'
    },
    {
      id: 'seg_6',
      order: 6,
      name: '第五站：红军井',
      type: 'site',
      siteId: 'site_6',
      distance: '180m',
      description: '1928年秋红军为村民挖的水井，至今水质清冽。井旁立有"红军井"石碑和故事介绍牌。',
      tips: '可以取水体验，但请勿污染井水。',
      storyId: 'story_4'
    },
    {
      id: 'seg_7',
      order: 7,
      name: '第六站：乔林红军哨口遗址',
      type: 'site',
      siteId: 'site_4',
      distance: '350m',
      description: '位于村西北山脊上的红军防御工事遗址，视野开阔，可俯瞰整个乔林村及周边山谷。哨口保留有战壕、瞭望台遗迹。',
      tips: '此处为制高点，全程唯一有缓坡路段，请注意安全。山顶视野极佳，是合影留念的最佳位置。'
    },
    {
      id: 'seg_8',
      order: 8,
      name: '终点：乔林村文化广场',
      type: 'end',
      distance: '450m（从哨口返回）',
      description: '研学路线终点，设有红色文化主题展廊和休息区，可在此交流研学心得、集体合影。',
      tips: '文化广场有村史展板和特产展示区，不要错过。'
    }
  ]
};

// 个性化路线推荐（第一版采用可解释的条件匹配，不依赖外部算法服务）
const routePresets = [
  {
    id: 'beginner_30',
    title: '30分钟初心线',
    duration: '30分钟',
    durationValue: '30',
    distance: '约0.8公里',
    difficulty: '轻松',
    mode: '步行',
    themes: ['革命历史', '红色人物'],
    audiences: ['亲子家庭', '老年游客', '普通游客'],
    segmentIds: ['seg_1', 'seg_2', 'seg_3', 'seg_8'],
    storyCount: 2,
    summary: '聚焦核心旧址与代表性故事，适合时间较短或行动节奏较慢的游客。'
  },
  {
    id: 'study_60',
    title: '60分钟研学线',
    duration: '1小时',
    durationValue: '60',
    distance: '约1.5公里',
    difficulty: '标准',
    mode: '步行',
    themes: ['革命历史', '红色人物', '古村文化'],
    audiences: ['学生团队', '亲子家庭', '普通游客'],
    segmentIds: ['seg_1', 'seg_2', 'seg_3', 'seg_4', 'seg_5', 'seg_6', 'seg_8'],
    storyCount: 4,
    summary: '串联主要红色旧址，兼顾讲解、观察和研学记录，适合团队教学。'
  },
  {
    id: 'village_halfday',
    title: '半日乡村深度线',
    duration: '半天',
    durationValue: 'halfday',
    distance: '约2.3公里',
    difficulty: '深度',
    mode: '步行',
    themes: ['革命历史', '古村文化', '生态乡村'],
    audiences: ['学生团队', '普通游客'],
    segmentIds: ['seg_1', 'seg_2', 'seg_3', 'seg_4', 'seg_5', 'seg_6', 'seg_7', 'seg_8', 'nature_reservoir'],
    storyCount: 6,
    summary: '完成6处旧址研学，并延伸至乔林水库开展乡村生态观察。'
  }
];

// ==================== 村情基础信息 ====================
const villageBasicInfo = {
  // 乔林村 - 标准化台账数据
  qiaolin: {
    basic: {
      name: '乔林村',
      administrative: '江西省吉安市井冈山市茅坪镇',
      longitude: '114°02\'23"E（WGS84）',
      latitude: '26°37\'06"N（WGS84）',
      elevation: '560-780米',
      area: '5.2平方公里',
      population: '680人（202户）',
      partyMembers: '22人',
      villageGroups: '6个村民小组',
      established: '始建于明代嘉靖年间（约1550年）',
      revolutionaryPeriod: '1927-1929年为井冈山革命根据地辖区'
    },
    land: {
      totalArea: '5.2平方公里（7800亩）',
      farmland: '820亩（其中水田560亩，旱地260亩）',
      forest: '4200亩（毛竹林2800亩，杉木林1000亩，阔叶林400亩）',
      waterSurface: '含乔林水库水面（面积待村委核验）',
      construction: '180亩',
      unused: '2480亩',
      mainCrops: '水稻、油菜、红薯、蔬菜',
      forestProducts: '毛竹、杉木、茶油、竹笋干、香菇'
    },
    water: {
      mainSource: '乔林溪（发源于村北山林）',
      reservoir: '乔林水库（小（1）型水库）',
      drinkingWater: '集中式供水，水源地乔林水库，供水覆盖率100%',
      waterQuality: '经检测达到《生活饮用水卫生标准》（GB5749-2022）',
      irrigation: '乔林溪自流灌溉为主，配套小型引水渠3条',
      floodControl: '乔林溪河道已治理2.1公里，防洪标准10年一遇'
    },
    infrastructure: {
      road: '通村公路硬化4.2公里（宽4.5米），村内道路硬化率95%',
      electricity: '农村电网改造完成，供电可靠率99.8%',
      telecom: '4G网络全覆盖，光纤到村，宽带入户率65%',
      sanitation: '生活垃圾分类收集，集中转运至镇垃圾中转站',
      sewage: '建成集中式污水处理设施1座，处理能力50吨/日',
      publicLighting: '安装太阳能路灯86盏，覆盖主要道路和公共区域'
    },
    publicServices: {
      clinic: '村级卫生室1所，建筑面积120平方米，乡村医生1名',
      culture: '村级文化活动中心1处，含图书室（藏书3000册）、多功能活动厅',
      sports: '村民健身广场1处，配备健身器材10套',
      education: '村内无学校，学龄儿童至茅坪镇中心小学就读（距离4公里，校车接送）',
      elderly: '农村幸福院1所，为留守老人提供日间照料服务'
    },
    economy: {
      collectiveIncome: '村集体经济年收入约18万元',
      mainIndustries: '毛竹加工、乡村旅游、特色种养',
      perCapitaIncome: '村民人均可支配收入约1.8万元/年',
      cooperatives: '乔林毛竹专业合作社、乔林乡村旅游合作社',
      featuredProducts: '竹笋干、土蜂蜜、茶油、红米、农家酿酒'
    },
    redResources: {
      sitesCount: '6处红色旧址',
      storiesCount: '采集整理红色故事12篇',
      oldPartyMembers: '健在老党员3人（年龄85-92岁）',
      oralHistory: '采集口述历史音频资料8份，总时长约45分钟'
    }
  }
};

// 页面路由使用 village_1，保留 qiaolin 旧键并提供同一份数据。
villageBasicInfo.village_1 = villageBasicInfo.qiaolin;

module.exports = {
  redLandmarks,
  redVillages,
  mapPlaces,
  redStories,
  photoGallery,
  studyTour,
  routePresets,
  villageBasicInfo
};
