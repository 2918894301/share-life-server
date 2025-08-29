'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const likes = [];
    
    // 生成随机的点赞记录，确保不重复
    const likePairs = new Set();
    
    for (let i = 1; i <= 10; i++) {
      let userId, noteId;
      
      // 确保不重复的点赞记录
      do {
        userId = Math.floor(Math.random() * 10) + 1;
        noteId = Math.floor(Math.random() * 10) + 1;
      } while (likePairs.has(`${userId}-${noteId}`));
      
      likePairs.add(`${userId}-${noteId}`);
      
      likes.push({
        id: i,
        userId: userId,
        noteId: noteId,
        commentId: null, // 只点赞笔记，不点赞评论
        targetType: 1, // 1:笔记, 2:评论
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Likes', likes, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Likes', null, {});
  }
}; 