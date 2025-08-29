'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 关联笔记
      Comment.belongsTo(models.Note, { 
        foreignKey: 'noteId',
        as: 'note'
      });
      
      // 关联作者
      Comment.belongsTo(models.User, { 
        foreignKey: 'authorId',
        as: 'author'
      });
      
      // 关联回复的评论
      Comment.belongsTo(models.Comment, { 
        foreignKey: 'replyToId',
        as: 'replyTo'
      });
      
      // 关联根评论
      Comment.belongsTo(models.Comment, { 
        foreignKey: 'rootCommentId',
        as: 'rootComment'
      });
      
      // 子评论关系
      Comment.hasMany(models.Comment, { 
        foreignKey: 'rootCommentId',
        as: 'replies'
      });
      
      // 点赞关系
      Comment.hasMany(models.Like, { 
        foreignKey: 'commentId',
        as: 'likes'
      });
    }
  }
  Comment.init({
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
    authorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        notNull: { msg: '作者ID不能为空' },
        notEmpty: { msg: '作者ID不能为空' }
      },
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: { msg: '评论内容不能为空' },
        notEmpty: { msg: '评论内容不能为空' },
        len: {
          args: [1, 1000],
          msg: '评论内容长度应在1-1000字符之间'
        }
      }
    },
    replyToId: {
      type: DataTypes.INTEGER.UNSIGNED,
      references: {
        model: 'Comments',
        key: 'id'
      }
    },
    rootCommentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      references: {
        model: 'Comments',
        key: 'id'
      }
    },
    likeCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },
    status: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isIn: {
          args: [[0, 1, 2]],
          msg: '状态值无效'
        }
      }
    },
    level: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isIn: {
          args: [[1, 2]],
          msg: '评论层级只能是1或2'
        }
      }
    },
    imageUrl: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Comment',
    hooks: {
      // 创建评论后，更新笔记的评论数
      afterCreate: async (comment, options) => {
        if (comment.status === 1) { 
          const transaction = options.transaction;
          await sequelize.models.Note.increment(
            { commentCount: 1 },
            { 
              where: { id: comment.noteId },
              transaction
            }
          );
        }
      },
      afterUpdate: async (comment, options) => {
        if (comment.changed('status')) {
          const transaction = options.transaction;
          let increment = 0;
          if (comment.previous('status') !== 1 && comment.status === 1) {
            increment = 1;
          }
          else if (comment.previous('status') === 1 && comment.status !== 1) {
            increment = -1;
          }
          if (increment !== 0) {
            await sequelize.models.Note.increment(
              { commentCount: increment },
              { 
                where: { id: comment.noteId },
                transaction
              }
            );
          }
        }
      },
      // 删除评论前，更新笔记的评论数
      beforeDestroy: async (comment, options) => {
        if (comment.status === 1) {  
          const transaction = options.transaction;
          await sequelize.models.Note.increment(
            { commentCount: -1 },
            { 
              where: { id: comment.noteId },
              transaction
            }
          );
        }
      },
      beforeCreate: async (comment, options) => {
        if (comment.replyToId) {
          const replyTo = await Comment.findByPk(comment.replyToId);
          if (replyTo) {
            comment.level = 2;
            if (replyTo.level === 1) {
              comment.rootCommentId = replyTo.id;
            } 
            else {
              comment.rootCommentId = replyTo.rootCommentId;
            }
          }
        } else {
          comment.level = 1;
        }
      }
    }
  });
  return Comment;
};