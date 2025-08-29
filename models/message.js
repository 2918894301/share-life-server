'use strict';
const {
  Model
} = require('sequelize');
const moment = require('moment');
moment.locale('zh-cn');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 关联发送者
      Message.belongsTo(models.User, { 
        as: 'sender',
        foreignKey: 'senderId'
      });
      
      // 关联接收者
      Message.belongsTo(models.User, { 
        as: 'receiver',
        foreignKey: 'receiverId'
      });
    }
  }
  //消息列表，暂时未做
  Message.init({
    senderId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: {
          notNull: { msg: '发送者id必须填写。' },
          notEmpty: { msg: '发送者id不能为空。' },
          async isPresent(value) {
            const user = await sequelize.models.User.findByPk(value);
            if (!user) {
              throw new Error(`id为：${value} 的用户不存在。`);
            }
          },
        },
      },
    receiverId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: {
          notNull: { msg: '接收者id必须填写。' },
          notEmpty: { msg: '接收者id不能为空。' },
          async isPresent(value) {
            const user = await sequelize.models.User.findByPk(value);
            if (!user) {
              throw new Error(`id为：${value} 的用户不存在。`);
            }
          },
          notSelf(value) {
            if (this.senderId === value) {
              throw new Error('不能给自己发送消息。');
            }
          }
        },
      },
    conversationId: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: '会话ID必须填写。' },
        notEmpty: { msg: '会话ID不能为空。' },
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: { msg: '消息内容不能为空。' },
        notEmpty: { msg: '消息内容不能为空。' },
      }
    },
    contentType: {
      type: DataTypes.TINYINT.UNSIGNED,
      defaultValue: 0,
      validate: {
        isIn: {
          args: [[0, 1, 2, 3, 4]],
          msg: '内容类型无效，应为0-4之间的数字。'
        }
      }
    },
    mediaUrl: {
      type: DataTypes.STRING,
      validate: {
        isUrl: {
          msg: '媒体URL格式不正确。'
        },
        mediaUrlRequired() {
          // 如果内容类型不是文本，则媒体URL必填
          if (this.contentType > 0 && !this.mediaUrl) {
            throw new Error('非文本消息必须提供媒体URL。');
          }
        }
      }
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.TINYINT.UNSIGNED,
      defaultValue: 1,
      validate: {
        isIn: {
          args: [[0, 1]],
          msg: '状态值无效，应为0或1。'
        }
      }
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
    modelName: 'Message',
    hooks: {
      // 创建消息前，自动生成会话ID
      beforeValidate: (message) => {
        if (!message.conversationId && message.senderId && message.receiverId) {
          // 确保较小的ID在前，较大的ID在后，保证会话ID的唯一性
          const ids = [message.senderId, message.receiverId].sort((a, b) => a - b);
          message.conversationId = `${ids[0]}_${ids[1]}`;
        }
      }
    },
    indexes: [
      {
        fields: ['conversationId', 'createdAt']
      },
      {
        fields: ['receiverId', 'isRead']
      }
    ]
  });
  return Message;
};