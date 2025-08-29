'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const collections = [];
    
    // 生成随机的收藏记录，确保不重复
    const collectionPairs = new Set();
    
    for (let i = 1; i <= 10; i++) {
      let userId, noteId;
      
      // 确保不重复的收藏记录
      do {
        userId = Math.floor(Math.random() * 10) + 1;
        noteId = Math.floor(Math.random() * 10) + 1;
      } while (collectionPairs.has(`${userId}-${noteId}`));
      
      collectionPairs.add(`${userId}-${noteId}`);
      
      collections.push({
        id: i,
        userId: userId,
        noteId: noteId,
        status: 1, // 有效收藏
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Collections', collections, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Collections', null, {});
  }
}; 