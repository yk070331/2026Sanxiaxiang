const photoCollections = [
  { id: 'huangyangjie', title: '黄洋界纪念碑', count: 3, siteId: 'landmark_1', coverSrc: '/images/contributed/huangyangjie_monument.jpg' },
  { id: 'qiaolin_branch', title: '乔林乡党支部旧址', count: 2, siteId: 'site_5', coverSrc: '/images/contributed/qiaolin_branch_sign.jpg' },
  { id: 'nature', title: '竹林·梯田·水库·航拍', count: 6 },
  { id: 'reference', title: '井与题字（地点待核）', count: 2 }
];
module.exports = { photoCollections, contributedPhotoCount: photoCollections.reduce((sum, group) => sum + group.count, 0) };
