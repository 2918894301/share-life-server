'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const notes = [];
    const titles = [
      '今天的美食分享',
      '旅行中的美好瞬间',
      '时尚搭配心得',
      '科技产品体验',
      '运动健身记录',
      '音乐分享时刻',
      '电影观后感',
      '读书笔记分享',
      '宠物日常记录',
      '手工制作过程'
    ];
    const contents = [
      '今天尝试了一家新开的餐厅，味道真的很不错！推荐给大家。',
      '这次旅行去了很多地方，看到了很多美丽的风景，心情特别好。',
      '最近买了几件新衣服，搭配起来效果还不错，分享一下。',
      '新买的电子产品用了一段时间，感觉性能很不错，值得推荐。',
      '坚持运动一个月了，感觉身体状态越来越好，继续加油！',
      '最近听了很多好听的音乐，分享给大家，希望你们也喜欢。',
      '看了一部很不错的电影，剧情很精彩，推荐大家去看。',
      '最近读了一本很有意义的书，收获很多，分享给大家。',
      '我家的小宠物今天特别可爱，拍了很多照片，分享给大家。',
      '今天做了一个手工制品，虽然不是很完美，但是很有成就感。'
    ];
    const categories = ['美食', '旅行', '时尚', '科技', '运动', '音乐', '电影', '读书', '宠物', '手工'];

    for (let i = 1; i <= 10; i++) {
      const userId = Math.floor(Math.random() * 10) + 1;
      const categoryIndex = Math.floor(Math.random() * categories.length);
      const titleIndex = Math.floor(Math.random() * titles.length);
      const contentIndex = Math.floor(Math.random() * contents.length);
      const articleIndex = Math.floor(Math.random() * 20) + 1;
      const imageCount = Math.floor(Math.random() * 5) + 1; // 1-5张图片
      
      // 生成随机图片数组
      const images = [];
      for (let j = 1; j <= imageCount; j++) {
        const imgIndex = Math.floor(Math.random() * 5) + 1;
        images.push(`http://${process.env.HOST}:3000/article/article${String(articleIndex).padStart(2, '0')}/img_${String(imgIndex).padStart(2, '0')}.jpg`);
      }

      notes.push({
        id: i,
        userId: userId,
        title: titles[titleIndex],
        content: contents[contentIndex],
        coverImageUrl: images[0], // 第一张图片作为封面
        images: JSON.stringify(images),
        tags: JSON.stringify([categories[categoryIndex], '分享', '生活']),
        category: categories[categoryIndex],
        locationName: '未知',
        likeCount: Math.floor(Math.random() * 100),
        commentCount: Math.floor(Math.random() * 50),
        shareCount: Math.floor(Math.random() * 20),
        collectCount: Math.floor(Math.random() * 30),
        viewCount: Math.floor(Math.random() * 1000),
        visibility: 1, // 公开
        status: 1, // 已发布
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // 随机时间
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Notes', notes, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Notes', null, {});
  }
}; 