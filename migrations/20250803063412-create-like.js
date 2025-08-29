'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Likes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '点赞ID'
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '点赞用户ID'
      },
      noteId: {
        allowNull: true,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '点赞的笔记ID'
      },
      commentId: {
        allowNull: true,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '点赞的评论ID'
      },
      targetType: {
        allowNull: false,
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 1,
        comment: '点赞目标类型：1-笔记，2-评论'
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
    
    // 用户点赞记录查询（复合索引）
    await queryInterface.addIndex('Likes', {
      fields: ['userId', 'targetType', 'noteId'],
      name: 'likes_user_note_index'
    });
    
    await queryInterface.addIndex('Likes', {
      fields: ['userId', 'targetType', 'commentId'],
      name: 'likes_user_comment_index'
    });
    
    // 目标收到的点赞查询
    await queryInterface.addIndex('Likes', {
      fields: ['noteId', 'createdAt'],
      name: 'likes_note_created_at_index'
    });
    
    await queryInterface.addIndex('Likes', {
      fields: ['commentId', 'createdAt'],
      name: 'likes_comment_created_at_index'
    });
    
    // 唯一约束，防止重复点赞
    await queryInterface.addConstraint('Likes', {
      fields: ['userId', 'noteId'],
      type: 'unique',
      name: 'likes_user_note_unique',
      where: {
        noteId: {
          [Sequelize.Op.ne]: null
        }
      }
    });
    
    await queryInterface.addConstraint('Likes', {
      fields: ['userId', 'commentId'],
      type: 'unique',
      name: 'likes_user_comment_unique',
      where: {
        commentId: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Likes');
  }
};