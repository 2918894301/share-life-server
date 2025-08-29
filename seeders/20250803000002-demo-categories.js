'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const categories = [
      {
        id: 1,
        name: '美食',
        icon: '🍕',
        sort: 1,
        level: 1,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: '旅行',
        icon: '✈️',
        sort: 2,
        level: 1,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: '时尚',
        icon: '👗',
        sort: 3,
        level: 1,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        name: '科技',
        icon: '💻',
        sort: 4,
        level: 1,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        name: '运动',
        icon: '🏃',
        sort: 5,
        level: 1,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        name: '音乐',
        icon: '🎵',
        sort: 6,
        level: 1,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 7,
        name: '电影',
        icon: '🎬',
        sort: 7,
        level: 1,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 8,
        name: '读书',
        icon: '📚',
        sort: 8,
        level: 1,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 9,
        name: '宠物',
        icon: '🐕',
        sort: 9,
        level: 1,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 10,
        name: '手工',
        icon: '🎨',
        sort: 10,
        level: 1,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Categories', categories, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Categories', null, {});
  }
}; 