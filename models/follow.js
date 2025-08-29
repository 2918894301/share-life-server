'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Follow extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 关联关注者用户
      Follow.belongsTo(models.User, { 
        as: 'follower', 
        foreignKey: 'followerId' 
      });
      
      // 关联被关注者用户
      Follow.belongsTo(models.User, { 
        as: 'following', 
        foreignKey: 'followingId' 
      });
    }
  }
  Follow.init({
    followerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        notNull: { msg: '关注者ID不能为空' },
        notEmpty: { msg: '关注者ID不能为空' }
      },
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    followingId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        notNull: { msg: '被关注者ID不能为空' },
        notEmpty: { msg: '被关注者ID不能为空' }
      },
      references: {
        model: 'Users',
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
          msg: '关注状态只能是0或1'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Follow',
    indexes: [
      {
        unique: true,
        fields: ['followerId', 'followingId']
      }
    ],
    hooks: {
      // 创建关注关系后，更新用户的关注数和粉丝数
      afterCreate: async (follow, options) => {
        if (follow.status === 1) {
          const transaction = options.transaction;
          await sequelize.models.User.increment(
            { followCount: 1 },
            { 
              where: { id: follow.followerId },
              transaction
            }
          );
          await sequelize.models.User.increment(
            { fansCount: 1 },
            { 
              where: { id: follow.followingId },
              transaction
            }
          );
        }
      },
      afterUpdate: async (follow, options) => {
        const transaction = options.transaction;
        if (follow.changed('status')) {
          const increment = follow.status === 1 ? 1 : -1;
          await sequelize.models.User.increment(
            { followCount: increment },
            { 
              where: { id: follow.followerId },
              transaction
            }
          );
          await sequelize.models.User.increment(
            { fansCount: increment },
            { 
              where: { id: follow.followingId },
              transaction
            }
          );
        }
      }
    }
  });
  return Follow;
};