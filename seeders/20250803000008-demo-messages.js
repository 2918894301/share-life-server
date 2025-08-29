'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const messages = [];
    const messageContents = [
      '你好，很高兴认识你！',
      '你的分享很棒，想和你交流一下。',
      '请问可以加个好友吗？',
      '你的内容很有价值，谢谢分享。',
      '想请教你一些问题，方便吗？',
      '你的想法很有创意，支持！',
      '可以和你讨论一下这个话题吗？',
      '你的经验对我很有帮助，谢谢。',
      '想和你学习一下，可以吗？',
      '你的作品很棒，继续加油！'
    ];
    
    for (let i = 1; i <= 10; i++) {
      const senderId = Math.floor(Math.random() * 10) + 1;
      let receiverId;
      
      // 确保发送者和接收者不是同一个人
      do {
        receiverId = Math.floor(Math.random() * 10) + 1;
      } while (senderId === receiverId);
      
      const contentIndex = Math.floor(Math.random() * messageContents.length);
      
      messages.push({
        id: i,
        senderId: senderId,
        receiverId: receiverId,
        conversationId: `${Math.min(senderId, receiverId)}_${Math.max(senderId, receiverId)}`,
        content: messageContents[contentIndex],
        contentType: 0, // 0:文本消息
        status: 1, // 已发送
        isRead: Math.random() > 0.5, // 随机已读/未读
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Messages', messages, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Messages', null, {});
  }
}; 