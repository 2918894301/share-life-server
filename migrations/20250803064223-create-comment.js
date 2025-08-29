'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Comments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '评论ID'
      },
      noteId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '关联的笔记ID'
      },
      authorId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '评论作者ID'
      },
      content: {
        allowNull: false,
        type: Sequelize.TEXT,
        comment: '评论内容'
      },
      replyToId: {
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '回复的评论ID（可选）'
      },
      rootCommentId: {
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '根评论ID（用于多级评论）'
      },
      likeCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        comment: '点赞数'
      },
      status: {
        allowNull: false,
        defaultValue: 1,
        type: Sequelize.TINYINT.UNSIGNED,
        comment: '状态：0-审核中，1-已发布，2-已删除'
      },
      level: {
        allowNull: false,
        defaultValue: 1,
        type: Sequelize.TINYINT.UNSIGNED,
        comment: '评论层级：1-一级评论，2-二级评论'
      },
      imageUrl: {
        type: Sequelize.STRING,
        comment: '评论附带的图片URL'
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
    
    // 按笔记ID和创建时间查询
    await queryInterface.addIndex('Comments', {
      fields: ['noteId', 'createdAt'],
      name: 'comments_note_created_at_index'
    });
    
    // 按作者和创建时间查询
    await queryInterface.addIndex('Comments', {
      fields: ['authorId', 'createdAt'],
      name: 'comments_author_created_at_index'
    });
    
    // 按根评论和创建时间查询
    await queryInterface.addIndex('Comments', {
      fields: ['rootCommentId', 'createdAt'],
      name: 'comments_root_comment_created_at_index'
    });
    
    // 状态索引，用于筛选已发布评论
    await queryInterface.addIndex('Comments', {
      fields: ['status'],
      name: 'comments_status_index'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Comments');
  }
};