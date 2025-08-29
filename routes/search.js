const express = require('express');
const router = express.Router();
const { success, failure } = require('../utils/responses');
const { BadRequest } = require('http-errors');
const { Note, User, Sequelize } = require('../models');
const { Op } = Sequelize;

/**
 * 根据笔记标题搜索笔记
 * GET /search?keyword=关键词&page=1&pageSize=10
 * 支持分页查询，默认每页10条记录
 */
router.get('/', async function (req, res) {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query;
    
    // 验证搜索关键词
    if (!keyword || keyword.trim() === '') {
      return failure(res, new BadRequest('搜索关键词不能为空'));
    }
    const searchKeyword = keyword.trim();
    const currentPage = Math.max(parseInt(page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(pageSize) || 10, 1), 50); // 限制每页最多50条
    const offset = (currentPage - 1) * limit;
    // 执行搜索查询
    const searchResult = await Note.findAndCountAll({
      attributes: [
        'id', 'title', 'coverImageUrl', 'videoUrl',
        'likeCount', 'commentCount', 'createdAt'
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'username']
        }
      ],
      where: {
        status: 1, // 只搜索正常状态的笔记
        visibility: 1, // 只搜索公开的笔记
        title: {
          [Op.like]: `%${searchKeyword}%` // 模糊匹配标题
        }
      },
      order: [
        ['createdAt', 'DESC'] // 按创建时间倒序排列
      ],
      offset,
      limit,
      distinct: true // 确保计数准确
    });
    // 格式化返回数据
    const formattedNotes = searchResult.rows.map(note => ({
      id: note.id,
      title: note.title,
      coverImageUrl: note.coverImageUrl,
      likeCount: note.likeCount,
      createdAt: note.createdAt,
      isLiked: false,
      isVideo: !!note.videoUrl,
      author: note.user ? {
        id: note.user.id,
        nickname: note.user.nickname || note.user.username,
        avatar: note.user.avatar
      } : null
    }));
    const totalPages = Math.ceil(searchResult.count / limit);
    success(res, '搜索成功', {
      keyword: searchKeyword,
      total: searchResult.count,
      currentPage,
      pageSize: limit,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      notes: formattedNotes
    });
    
  } catch (error) {
    console.error('搜索失败:', error);
    failure(res, error);
  }
});

/**
 * 综合搜索接口（标题 + 内容）
 * GET /search/comprehensive?keyword=关键词&page=1&pageSize=10
 * 同时搜索笔记标题和内容
 */
router.get('/comprehensive', async function (req, res) {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query;
    // 验证搜索关键词
    if (!keyword || keyword.trim() === '') {
      return failure(res, new BadRequest('搜索关键词不能为空'));
    }
    const searchKeyword = keyword.trim();
    const currentPage = Math.max(parseInt(page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(pageSize) || 10, 1), 50);
    const offset = (currentPage - 1) * limit;
    // 执行综合搜索查询（标题或内容包含关键词）
    const searchResult = await Note.findAndCountAll({
      attributes: [
        'id', 'title', 'content', 'coverImageUrl', 'videoUrl',
        'likeCount', 'commentCount', 'createdAt'
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'username']
        }
      ],
      where: {
        status: 1,
        visibility: 1,
        [Op.or]: [
          {
            title: {
              [Op.like]: `%${searchKeyword}%`
            }
          },
          {
            content: {
              [Op.like]: `%${searchKeyword}%`
            }
          }
        ]
      },
      order: [
        ['createdAt', 'DESC']
      ],
      offset,
      limit,
      distinct: true
    });
    // 格式化返回数据
    const formattedNotes = searchResult.rows.map(note => ({
      id: note.id,
      title: note.title,
      coverImageUrl: note.coverImageUrl,
      likeCount: note.likeCount,
      commentCount: note.commentCount,
      createdAt: note.createdAt,
      isLiked: false,
      isVideo: !!note.videoUrl,
      author: note.user ? {
        id: note.user.id,
        nickname: note.user.nickname || note.user.username,
        avatar: note.user.avatar
      } : null
    }));
    const totalPages = Math.ceil(searchResult.count / limit);
    success(res, '综合搜索成功', {
      keyword: searchKeyword,
      total: searchResult.count,
      currentPage,
      pageSize: limit,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      notes: formattedNotes
    });
    
  } catch (error) {
    console.error('综合搜索失败:', error);
    failure(res, error);
  }
});

/**
 * 热门搜索关键词接口
 * GET /search/hot
 * 返回最近热门的搜索关键词（这里返回模拟数据，实际应该基于搜索日志统计）
 */
router.get('/hot', async function (req, res) {
  try {
    // 模拟热门搜索关键词数据
    // 实际项目中应该基于搜索日志或者热门笔记标题统计
    const hotKeywords = [
      { keyword: '美食', count: 1250 },
      { keyword: '旅行', count: 980 },
      { keyword: '穿搭', count: 856 },
      { keyword: '护肤', count: 742 },
      { keyword: '健身', count: 689 },
      { keyword: '摄影', count: 567 },
      { keyword: '读书', count: 445 },
      { keyword: '宠物', count: 398 }
    ];
    success(res, '获取热门搜索成功', {
      hotKeywords
    });
  } catch (error) {
    console.error('获取热门搜索失败:', error);
    failure(res, error);
  }
});

module.exports = router;
