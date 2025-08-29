'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 自关联，处理父子分类关系
      Category.belongsTo(models.Category, { as: 'parent', foreignKey: 'parentId' });
      Category.hasMany(models.Category, { as: 'children', foreignKey: 'parentId' });
      
      // 分类与笔记的关系
      Category.hasMany(models.Note, { foreignKey: 'categoryId' });
    }
  }
  Category.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: '分类名称不能为空' },
        notEmpty: { msg: '分类名称不能为空字符串' }
      }
    },
    icon: DataTypes.STRING,
    sort: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },
    parentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      references: {
        model: 'Categories',
        key: 'id'
      }
    },
    level: {
      type: DataTypes.TINYINT.UNSIGNED,
      defaultValue: 1
    },
    description: DataTypes.TEXT,
    status: {
      type: DataTypes.TINYINT.UNSIGNED,
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
    modelName: 'Category',
  });
  return Category;
};