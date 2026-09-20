// 用户提供的原片仅做等比例缩小/JPEG编码，未进行生成式编辑。
// 接收日期不是拍摄日期；地点线索不等同于GPS坐标核验。
const photos = [
  { id: 'huangyangjie_inscription', group: 'huangyangjie', title: '黄洋界题名墙', desc: '题名墙及周边环境。用户标注为黄洋界哨口纪念碑组照。', locationLabel: '黄洋界 · 用户标注', siteId: 'landmark_1' },
  { id: 'huangyangjie_poem', group: 'huangyangjie', title: '黄洋界碑刻', desc: '纪念碑组照中的横向碑刻，保留原图文字与构图。', locationLabel: '黄洋界 · 用户标注', siteId: 'landmark_1' },
  { id: 'huangyangjie_monument', group: 'huangyangjie', title: '黄洋界纪念碑全景', desc: '高碑与台阶全景，可见“星星之火，可以燎原”题字。', locationLabel: '黄洋界 · 用户标注', siteId: 'landmark_1' },
  { id: 'qiaolin_branch_sign', group: 'qiaolin_branch', title: '乔林乡党支部旧址门牌', desc: '照片门牌可见“乔林乡党支部旧址”。可用于旧址影像展示，尚不能提供精确导航位置。', locationLabel: '乔林乡党支部旧址 · 门牌可见', siteId: 'site_5' },
  { id: 'qiaolin_branch_interior', group: 'qiaolin_branch', title: '支部旧址室内陈设', desc: '与门牌照片同批提供的室内画面，可见旗帜、桌椅及器物；具体陈设年代未核验。', locationLabel: '支部旧址组照 · 用户提供', siteId: 'site_5' },
  { id: 'forest_steps', group: 'nature', title: '竹林深处·林间石阶', desc: '树木、苔藓石块与林间石阶。具体拍摄地点待补充。', locationLabel: '地点待补充' },
  { id: 'bamboo_path', group: 'nature', title: '竹林深处·竹林步道', desc: '竹林环绕的石阶步道，按用户提供的“竹林深处”主题收录。', locationLabel: '地点待补充' },
  { id: 'bamboo_canopy', group: 'nature', title: '竹林深处·仰望竹冠', desc: '从林下仰望竹冠与天空，画面下方可见木质休憩设施。', locationLabel: '地点待补充' },
  { id: 'terraces', group: 'nature', title: '梯田风光', desc: '梯田、村居与道路的俯瞰画面。不能仅凭照片确定村名或拍摄日期。', locationLabel: '地点待补充' },
  { id: 'reservoir', group: 'nature', title: '水库远景', desc: '山林环绕的水面与岸边道路。按用户提供的“水库”主题收录，具体水库名称待补充。', locationLabel: '水库名称待补充' },
  { id: 'aerial_village', group: 'nature', title: '航拍全景', desc: '水面、村居及山林的俯瞰画面。保留原图清晰度，不做生成式补绘。', locationLabel: '地点待补充' },
  { id: 'well_inscription', group: 'reference', title: '井口与纪念碑', desc: '碑文可见“吃水不忘挖井人，时刻想念毛主席”及“沙洲坝人民敬立”。此图不作为乔林村红军井实拍证据。', locationLabel: '碑文署“沙洲坝” · 具体地点待确认' },
  { id: 'rural_slogan', group: 'reference', title: '乡村题字墙', desc: '墙上可见“农村是一个广阔的天地，在那里是可以大有作为的”。地点和建造年代待确认，不作为红军时期标语的证据。', locationLabel: '地点与年代待确认' }
].map(photo => ({ ...photo, src: `/contributions/images/${photo.id}.jpg`, thumbnailSrc: `/images/contributed/${photo.id}.jpg`, sourceKind: 'user-provided', sourceLabel: '来源：用户提供', capturedAt: '拍摄日期待补充' }));
module.exports = { photos };
