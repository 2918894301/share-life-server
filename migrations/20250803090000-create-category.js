'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Categories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '分类ID'
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
        comment: '分类名称'
      },
      icon: {
        type: Sequelize.STRING,
        comment: '分类图标URL'
      },
      sort: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        comment: '排序权重，值越大越靠前'
      },
      parentId: {
        type: Sequelize.INTEGER.UNSIGNED,
        comment: '父分类ID，用于多级分类'
      },
      level: {
        type: Sequelize.TINYINT.UNSIGNED,
        defaultValue: 1,
        comment: '分类层级，1为一级分类'
      },
      description: {
        type: Sequelize.TEXT,
        comment: '分类描述'
      },
      status: {
        allowNull: false,
        defaultValue: 1,
        type: Sequelize.TINYINT.UNSIGNED,
        comment: '状态：0-禁用，1-启用'
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
    await queryInterface.addIndex('Categories', {
      fields: ['name'],
      unique: true,
      name: 'categories_name_unique'
    });

    await queryInterface.addIndex('Categories', {
      fields: ['parentId'],
      name: 'categories_parent_id_index'
    });

    await queryInterface.addIndex('Categories', {
      fields: ['sort'],
      name: 'categories_sort_index'
    });

    await queryInterface.addIndex('Categories', {
      fields: ['status'],
      name: 'categories_status_index'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Categories');
  }
};