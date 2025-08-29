'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Like extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 关联用户
      Like.belongsTo(models.User, { 
        foreignKey: 'userId',
        as: 'user'
      });
      
      // 关联笔记
      Like.belongsTo(models.Note, { 
        foreignKey: 'noteId',
        as: 'note'
      });
      
      // 关联评论
      Like.belongsTo(models.Comment, { 
        foreignKey: 'commentId',
        as: 'comment'
      });
    }
  }
  Like.init({
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
      allowNull: true,
      references: {
        model: 'Notes',
        key: 'id'
      }
    },
    commentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'Comments',
        key: 'id'
      }
    },
    targetType: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isIn: {
          args: [[1, 2]],
          msg: '目标类型只能是1或2'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Like',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'noteId'],
        where: {
          noteId: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        unique: true,
        fields: ['userId', 'commentId'],
        where: {
          commentId: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      }
    ],
    hooks: {
      // 创建点赞后，更新目标的点赞数
      afterCreate: async (like, options) => {
        const transaction = options.transaction;  //获取事务对象
        if (like.targetType === 1 && like.noteId) {
          await sequelize.models.Note.increment(
            { likeCount: 1 },
            { 
              where: { id: like.noteId },
              transaction
            }
          );
          const note = await sequelize.models.Note.findByPk(like.noteId, { transaction });
          if (note) {
            await sequelize.models.User.increment(
              { likeCollectCount: 1 },
              { 
                where: { id: note.userId },
                transaction
              }
            );
          }
        } 
        else if (like.targetType === 2 && like.commentId) {
          await sequelize.models.Comment.increment(
            { likeCount: 1 },
            { 
              where: { id: like.commentId },
              transaction
            }
          );
        }
      },
      beforeDestroy: async (like, options) => {
        const transaction = options.transaction;
        
        if (like.targetType === 1 && like.noteId) {
          await sequelize.models.Note.increment(
            { likeCount: -1 },
            { 
              where: { id: like.noteId },
              transaction
            }
          );
          const note = await sequelize.models.Note.findByPk(like.noteId, { transaction });
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
        else if (like.targetType === 2 && like.commentId) {
          await sequelize.models.Comment.increment(
            { likeCount: -1 },
            { 
              where: { id: like.commentId },
              transaction
            }
          );
        }
      },
      beforeValidate: (like, options) => {
        if (like.targetType === 1) {
          like.commentId = null;
          if (!like.noteId) {
            throw new Error('点赞笔记时必须提供笔记ID');
          }
        } else if (like.targetType === 2) {
          like.noteId = null;
          if (!like.commentId) {
            throw new Error('点赞评论时必须提供评论ID');
          }
        }
      }
    }
  });
  return Like;
};