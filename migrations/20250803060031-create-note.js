'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Notes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '笔记ID'
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '作者ID（关联用户表）'
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING,
        comment: '笔记标题'
      },
      content: {
        type: Sequelize.TEXT,
        comment: '文字内容'
      },
      coverImageUrl: {
        type: Sequelize.STRING,
        comment: '封面图片URL'
      },
      images: {
        type: Sequelize.JSON,
        comment: '图片数组，存储多张图片的URL'
      },
      videoUrl: {
        type: Sequelize.STRING,
        comment: '视频地址'
      },
      tags: {
        type: Sequelize.JSON,
        comment: '标签数组'
      },
      categoryId: {
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '分类ID'
      },
      locationName: {
        type: Sequelize.STRING,
        comment: '位置名称'
      },
      likeCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        comment: '点赞数'
      },
      commentCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        comment: '评论数'
      },
      shareCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        comment: '分享数'
      },
      collectCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        comment: '收藏数'
      },
      viewCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        comment: '浏览数'
      },
      visibility: {
        allowNull: false,
        defaultValue: 1,
        type: Sequelize.TINYINT.UNSIGNED,
        comment: '可见性：0-私密，1-公开，2-好友可见'
      },
      status: {
        allowNull: false,
        defaultValue: 1,
        type: Sequelize.TINYINT.UNSIGNED,
        comment: '状态：0-草稿，1-已发布，2-审核中，3-已删除'
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
    // 基础索引
    await queryInterface.addIndex('Notes', {
      fields: ['userId'],
      name: 'notes_user_id_index'
    });
    
    
    // 按状态和创建时间查询的索引
    await queryInterface.addIndex('Notes', {
      fields: ['status', 'createdAt'],
      name: 'notes_status_created_at_index'
    });
    
    // 按分类查询的索引
    await queryInterface.addIndex('Notes', {
      fields: ['categoryId'],
      name: 'notes_category_id_index'
    });
    
    // 按热度查询的复合索引
    await queryInterface.addIndex('Notes', {
      fields: ['likeCount', 'createdAt'],
      name: 'notes_like_count_created_at_index'
    });
    

    


  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Notes');
  }
};