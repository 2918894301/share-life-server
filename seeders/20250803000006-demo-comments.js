'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const comments = [];
    const commentContents = [
      '写得很好，学习了！',
      '感谢分享，很有用的信息。',
      '看起来很不错，我也想试试。',
      '支持一下，继续加油！',
      '这个想法很棒，谢谢分享。',
      '学到了很多，感谢。',
      '很有创意，喜欢！',
      '分享得很详细，谢谢。',
      '这个经验很有价值。',
      '支持原创，继续努力！'
    ];
    
    for (let i = 1; i <= 10; i++) {
      const userId = Math.floor(Math.random() * 10) + 1;
      const noteId = Math.floor(Math.random() * 10) + 1;
      const contentIndex = Math.floor(Math.random() * commentContents.length);
      
      comments.push({
        id: i,
        noteId: noteId,
        authorId: userId,
        content: commentContents[contentIndex],
        replyToId: null, // 一级评论
        rootCommentId: null, // 根评论ID
        likeCount: Math.floor(Math.random() * 20),
        status: 1, // 已发布
        level: 1, // 一级评论
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Comments', comments, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Comments', null, {});
  }
}; 