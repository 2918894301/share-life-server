'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Collections', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '收藏ID'
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '收藏用户ID'
      },
      noteId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '收藏的笔记ID'
      },
      status: {
        allowNull: false,
        defaultValue: 1,
        type: Sequelize.TINYINT.UNSIGNED,
        comment: '状态：0-私密，1-公开'
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
    
    // 按用户ID和创建时间查询
    await queryInterface.addIndex('Collections', {
      fields: ['userId', 'createdAt'],
      name: 'collections_user_created_at_index'
    });
    
    // 按笔记ID和创建时间查询
    await queryInterface.addIndex('Collections', {
      fields: ['noteId', 'createdAt'],
      name: 'collections_note_created_at_index'
    });
    
    
    // 唯一约束，防止重复收藏
    await queryInterface.addConstraint('Collections', {
      fields: ['userId', 'noteId'],
      type: 'unique',
      name: 'collections_user_note_unique'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Collections');
  }
};