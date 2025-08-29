'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Follows', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '关系ID'
      },
      followerId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '关注者ID'
      },
      followingId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '被关注者ID'
      },
      status: {
        allowNull: false,
        defaultValue: 1,
        type: Sequelize.TINYINT.UNSIGNED,
        comment: '关注状态：0-已取消，1-已关注'
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
    
    // 添加索引
    await queryInterface.addIndex('Follows', {
      fields: ['followerId'],
      name: 'follows_follower_id_index'
    });
    
    await queryInterface.addIndex('Follows', {
      fields: ['followingId'],
      name: 'follows_following_id_index'
    });
    
    // 添加唯一复合索引，防止重复关注
    await queryInterface.addIndex('Follows', {
      fields: ['followerId', 'followingId'],
      unique: true,
      name: 'follows_follower_following_unique'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Follows');
  }
};