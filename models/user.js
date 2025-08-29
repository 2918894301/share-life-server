'use strict';
const {
  Model
} = require('sequelize');
const { BadRequest } = require('http-errors');
const bcrypt = require('bcryptjs');
const moment = require('moment');
moment.locale('zh-cn');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 显式指定外键，避免默认使用 UserId/NoteId 等不匹配的列名
      models.User.hasMany(models.Note, { as: 'notes', foreignKey: 'userId' });
      models.User.hasMany(models.Comment, { as: 'comments', foreignKey: 'authorId' });
      models.User.hasMany(models.Like, { as: 'likes', foreignKey: 'userId' });
      models.User.hasMany(models.Collection, { as: 'collections', foreignKey: 'userId' });
      // 关注关系
      models.User.hasMany(models.Follow, { as: 'following', foreignKey: 'followerId' });
      models.User.hasMany(models.Follow, { as: 'followers', foreignKey: 'followingId' });
      // 消息关系
      models.User.hasMany(models.Message, { as: 'sentMessages', foreignKey: 'senderId' });
      models.User.hasMany(models.Message, { as: 'receivedMessages', foreignKey: 'receiverId' });
    }
  }
  User.init({
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: '用户名必须填写。' },
          notEmpty: { msg: '用户名不能为空。' },
          len: { args: [2, 45], msg: '用户名长度必须是2 ~ 45之间。' },
          async isUnique(value) {
            const user = await User.findOne({ where: { username: value } });
            if (user) {
              throw new Error('用户名已经存在。');
            }
          },
        },
      },
    nickname: DataTypes.STRING,
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: '手机必须填写。' },
          notEmpty: { msg: '手机不能为空。' },
          isPhone(value) {
            const phoneReg = /^1[3-9]\d{9}$/;
            if (!phoneReg.test(value)) {
              throw new Error('请输入有效的手机号');
            }
          },
          async isUnique(value) {
            const user = await User.findOne({ where: { phone: value } });
            if (user) {
              throw new Error('手机号已存在，请直接登录。');
            }
          },
        },
      },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        if (!value) {
          throw new BadRequest('密码必须填写。');
        }
        if (value.length < 6 || value.length > 45) {
          throw new BadRequest('密码长度必须是6 ~ 45之间。');
        }
        // 如果通过所有验证，进行hash处理并设置值
        this.setDataValue('password', bcrypt.hashSync(value, 10));
      },
    },
    gender: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        validate: {
          notNull: { msg: '性别必须填写。' },
          notEmpty: { msg: '性别不能为空。' },
          isIn: { args: [[0, 1, 2]], msg: '性别的值必须是，男性：1 女性：2 未选择：0。' },
        },
      },
    avatar: {
        type: DataTypes.STRING,
        validate: {
          isUrl: { msg: '图片地址不正确。' },
        },
      },
    birthday: {
      type: DataTypes.DATE,
      get() {
        return moment(this.getDataValue('createdAt')).format('LL');
      },
    },
    location: DataTypes.STRING,
    signature: DataTypes.TEXT,
    followCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },
    fansCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },
    likeCollectCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },
    status: DataTypes.TINYINT.UNSIGNED,
    createdAt: {
      type: DataTypes.DATE,
      get() {
        return moment(this.getDataValue('createdAt')).format('LL');
      },
    },
    updatedAt: {
      type: DataTypes.DATE,
      get() {
        return moment(this.getDataValue('updatedAt')).format('LL');
      },
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};