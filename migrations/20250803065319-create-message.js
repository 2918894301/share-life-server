'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '消息ID'
      },
      senderId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '发送者用户ID'
      },
      receiverId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '接收者用户ID'
      },
      conversationId: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '会话ID，由两个用户ID组合而成，用于快速查询两人之间的对话'
      },
      content: {
        allowNull: false,
        type: Sequelize.TEXT,
        comment: '消息内容'
      },
      contentType: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 0,
        comment: '内容类型：0-文本，1-图片，2-语音，3-视频，4-文件'
      },
      mediaUrl: {
        type: Sequelize.STRING,
        comment: '媒体文件URL，适用于图片、语音、视频等'
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: '是否已读'
      },
      status: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 1,
        comment: '状态：0-已删除，1-正常'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        comment: '创建时间'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        comment: '更新时间'
      }
    });
    
    // 发送者索引
    await queryInterface.addIndex('Messages', {
      fields: ['senderId'],
      name: 'messages_sender_id_index'
    });
    
    // 接收者索引
    await queryInterface.addIndex('Messages', {
      fields: ['receiverId'],
      name: 'messages_receiver_id_index'
    });
    
    // 会话索引，用于快速查询两人之间的对话
    await queryInterface.addIndex('Messages', {
      fields: ['conversationId', 'createdAt'],
      name: 'messages_conversation_id_created_at_index'
    });
    
    // 未读消息索引
    await queryInterface.addIndex('Messages', {
      fields: ['receiverId', 'isRead'],
      name: 'messages_receiver_unread_index'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Messages');
  }
};