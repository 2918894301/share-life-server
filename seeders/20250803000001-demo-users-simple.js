'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const users = [];
    
    for (let i = 1; i <= 10; i++) {
      users.push({
        id: i,
        username: `user${i}`,
        nickname: `用户${i}`,
        phone: `1380000${String(i).padStart(4, '0')}`,
        password: bcrypt.hashSync('123456', 10),
        gender: Math.floor(Math.random() * 3),
        avatar: `http://${process.env.HOST}:3000/avatar/avatar_${String(Math.floor(Math.random() * 40) + 1).padStart(2, '0')}.png`,
        birthday: new Date(),
        location: '未知',
        signature: '这个人很懒，什么都没留下',
        followCount: 0,
        fansCount: 0,
        likeCollectCount: 0,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Users', users, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
}; 