const express = require('express');
const router = express.Router();
const { Category,  Sequelize } = require('../models');
const { success, failure } = require('../utils/responses');
const { Op } = Sequelize;

/**
 * 获取所有分类
 * GET /categories
 */
router.get('/', async (req, res) => {
  try {
    const { parentId, includeChildren } = req.query;
    const where = { status: 1 }; // 只获取状态为启用的分类
    
    // 如果指定了parentId，则查询该父分类下的子分类
    if (parentId !== undefined) {
      where.parentId = parentId === 'null' ? null : parentId;
    }
    
    // 基本查询选项
    const queryOptions = {
      where,
      order: [['sort', 'ASC'], ['id', 'ASC']], 
      attributes: ['id', 'name', 'icon', 'sort', 'parentId', 'level', 'description']
    };
    
    // 如果需要包含子分类，添加关联查询
    if (includeChildren === 'true') {
      queryOptions.include = [{
        model: Category,
        as: 'children',
        where: { status: 1 }, 
        required: false, 
        attributes: ['id', 'name', 'icon', 'sort', 'parentId', 'level', 'description']
      }];
    }
    const categories = await Category.findAll(queryOptions);
    success(res, '获取分类列表成功', categories);
  } catch (error) {
    console.error('获取分类列表失败:', error);
    failure(res, error);
  }
});
module.exports = router;
