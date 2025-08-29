'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      username: {
        allowNull: false,
        type: Sequelize.STRING,
        comment: '用户名，唯一标识'
      },
      nickname: {
        allowNull: false,
        type: Sequelize.STRING,
        comment: '昵称'
      },
      phone: {
        allowNull: false,
        type: Sequelize.STRING,
        comment: '手机号码'
      },
      password: {
        allowNull: false,
        type: Sequelize.STRING,
        comment: '密码'
      },
      gender: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.TINYINT.UNSIGNED,
        comment: '性别：0-未知，1-男，2-女'
      },
      avatar: {
        type: Sequelize.STRING,
        comment: '头像URL'
      },
      birthday: {
        type: Sequelize.DATE,
        comment: '生日'
      },
      location: {
        type: Sequelize.STRING,
        comment: '位置信息'
      },
      signature: {
        type: Sequelize.TEXT,
        comment: '个性签名'
      },
      followCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        comment: '关注数'
      },
      fansCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        comment: '粉丝数'
      },
      likeCollectCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        comment: '获赞与收藏数'
      },
      status: {
        allowNull: false,
        defaultValue: 1,
        type: Sequelize.TINYINT.UNSIGNED,
        comment: '状态：0-禁用，1-启用'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      
    });
    // 唯一索引
    await queryInterface.addIndex('Users', {
      fields: ['phone'],
      unique: true,
      name: 'users_phone_unique'
    });
    await queryInterface.addIndex('Users', {
      fields: ['username'],
      unique: true,
      name: 'users_username_unique'
    });
    
    // 普通索引，用于提高查询效率
    await queryInterface.addIndex('Users', {
      fields: ['nickname'],
      name: 'users_nickname_index'
    });
    await queryInterface.addIndex('Users', {
      fields: ['status'],
      name: 'users_status_index'
    });
    await queryInterface.addIndex('Users', {
      fields: ['createdAt'],
      name: 'users_created_at_index'
    });
    
    // 复合索引，用于按粉丝数排序等场景
    await queryInterface.addIndex('Users', {
      fields: ['fansCount', 'createdAt'],
      name: 'users_fans_count_created_at_index'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};