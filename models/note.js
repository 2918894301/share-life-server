'use strict';
const {
  Model
} = require('sequelize');
const moment = require('moment');
moment.locale('zh-cn');
module.exports = (sequelize, DataTypes) => {
  class Note extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 显式指定外键，避免 Sequelize 使用默认的 UserId/NoteId 列名
      models.Note.belongsTo(models.User, { as: 'user', foreignKey: 'userId' });
      models.Note.belongsTo(models.Category, { as: 'category', foreignKey: 'categoryId' });
      models.Note.hasMany(models.Comment, { as: 'comments', foreignKey: 'noteId' });
      models.Note.hasMany(models.Like, { as: 'likes', foreignKey: 'noteId' });
      models.Note.hasMany(models.Collection, { as: 'collections', foreignKey: 'noteId' });
    }
  }
  Note.init({
    userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: {
          notNull: { msg: '用户id必须填写。' },
          notEmpty: { msg: '用户id不能为空。' },
          async isPresent(value) {
            const user = await sequelize.models.User.findByPk(value);
            if (!user) {
              throw new Error(`id为：${value} 的用户不存在。`);
            }
          },
        },
      },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: '标题必须填写。' },
        notEmpty: { msg: '标题不能为空。' },
        len: { args: [2, 45], msg: '标题长度必须是2 ~ 45之间。' },
      },
    },
    
    content: DataTypes.TEXT,
    coverImageUrl: DataTypes.STRING,
    images: DataTypes.JSON,
    videoUrl: DataTypes.STRING,
    tags: DataTypes.JSON,
    categoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      validate: {
        async isPresent(value) {
          if (value == null) return;
          const category = await sequelize.models.Category.findByPk(value);
          if (!category) throw new Error(`id为：${value} 的分类不存在。`);
        },
      },
    },
    locationName: DataTypes.STRING,
    visibility: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isIn: { args: [[0, 1, 2]], msg: '可见性：0-私密，1-公开，2-好友可见' },
      },
    },
    status: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    likeCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },
    commentCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },
    shareCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },
    collectCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },
    viewCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },
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
    modelName: 'Note',
  });
  return Note;
};