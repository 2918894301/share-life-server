'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const follows = [];
    
    // 生成随机的关注关系，确保不重复
    const followPairs = new Set();
    
    for (let i = 1; i <= 10; i++) {
      let followerId, followingId;
      
      // 确保不重复的关注关系
      do {
        followerId = Math.floor(Math.random() * 10) + 1;
        followingId = Math.floor(Math.random() * 10) + 1;
      } while (followerId === followingId || followPairs.has(`${followerId}-${followingId}`));
      
      followPairs.add(`${followerId}-${followingId}`);
      
      follows.push({
        id: i,
        followerId: followerId,
        followingId: followingId,
        status: 1, // 有效关注
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Follows', follows, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Follows', null, {});
  }
}; 