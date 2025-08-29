'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Collection extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 关联用户
      Collection.belongsTo(models.User, { 
        foreignKey: 'userId',
        as: 'user'
      });
      
      // 关联笔记
      Collection.belongsTo(models.Note, { 
        foreignKey: 'noteId',
        as: 'note'
      });
    }
  }
  Collection.init({
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        notNull: { msg: '用户ID不能为空' },
        notEmpty: { msg: '用户ID不能为空' }
      },
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    noteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        notNull: { msg: '笔记ID不能为空' },
        notEmpty: { msg: '笔记ID不能为空' }
      },
      references: {
        model: 'Notes',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isIn: {
          args: [[0, 1]],
          msg: '状态只能是0或1'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Collection',
    hooks: {
      afterCreate: async (collection, options) => {
        const transaction = options.transaction;
        await sequelize.models.Note.increment(
          { collectCount: 1 },
          { 
            where: { id: collection.noteId },
            transaction
          }
        );
        
        // 更新笔记作者的获赞与收藏数
        const note = await sequelize.models.Note.findByPk(collection.noteId, { transaction });
        if (note) {
          await sequelize.models.User.increment(
            { likeCollectCount: 1 },
            { 
              where: { id: note.userId },
              transaction
            }
          );
        }
      },
      
      // 删除收藏前，更新笔记的收藏数
      beforeDestroy: async (collection, options) => {
        const transaction = options.transaction;
        await sequelize.models.Note.increment(
          { collectCount: -1 },
          { 
            where: { id: collection.noteId },
            transaction
          }
        );
        const note = await sequelize.models.Note.findByPk(collection.noteId, { transaction });
        if (note) {
          await sequelize.models.User.increment(
            { likeCollectCount: -1 },
            { 
              where: { id: note.userId },
              transaction
            }
          );
        }
      }
    }
  });
  return Collection;
};