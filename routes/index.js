const express = require('express');
const router = express.Router();
const { Unauthorized,BadRequest } = require('http-errors');
const { Note, User, Follow, Like, Collection, Sequelize } = require('../models');
const { success, failure } = require('../utils/responses');
const { Op } = Sequelize;
const userAuth = require('../middlewares/user-auth');
/**
 * 分页查询笔记表中的数据
 * GET /latest?categoryId=1&page=1&size=10
 */
router.get('/latest', async function (req, res, next) {
  try {
    const currentPage = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 50);
    const offset = (currentPage - 1) * pageSize;
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;

    const where = {
      status: 1,
      visibility: 1
    };
    if (categoryId) where.categoryId = categoryId;

    const notes = await Note.findAndCountAll({
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
      where,
      order: [['createdAt', 'DESC']],
      offset,
      limit: pageSize
    });
    // 若用户已登录，查询这些笔记是否被当前用户点赞
    let likedNoteIdSet = null;
    if (req.query.userId && notes.rows.length > 0) {
      const noteIds = notes.rows.map(n => n.id);
      const likes = await Like.findAll({
        where: {
          userId: req.query.userId,
          targetType: 1,
          noteId: { [Op.in]: noteIds }
        },
        attributes: ['noteId']
      });
      likedNoteIdSet = new Set(likes.map(l => l.noteId));
    }
    success(res, '查询笔记成功', {
      total: notes.count,
      currentPage,
      pageSize,
      totalPages: Math.ceil(notes.count / pageSize),
      data: notes.rows.map(note => ({
        id: note.id,
        title: note.title,
        coverImageUrl: note.coverImageUrl,
        likeCount: note.likeCount,
        commentCount: note.commentCount,
        createdAt: note.createdAt,
        isLiked: likedNoteIdSet ? likedNoteIdSet.has(note.id) : false,
        isVideo: !!note.videoUrl,
        author: note.user ? {
          id: note.user.id,
          nickname: note.user.nickname || note.user.username,
          avatar: note.user.avatar
        } : null
      }))
    });
  } catch (error) {
    console.error('查询分类笔记失败:', error);
    failure(res, error);
  }
});

/**
 * 分页查询用户关注的人发布的笔记
 * GET /following?page=1&size=10
 * 需要用户登录
 */
router.get('/following', userAuth, async function (req, res, next) {
  try {
    console.log('Following API called, userId:', req.userId);
    // 用户认证已经在路由中间件中处理，此处可以直接使用 req.userId
    if (!req.userId) {
      console.error('用户未登录，但通过了中间件');
      throw new Unauthorized('需要登录才能查看关注的内容');
    }
    const query = req.query;
    const currentPage = Math.abs(Number(query.page)) || 1;
    const pageSize = Math.abs(Number(query.size)) || 10;
    const offset = (currentPage - 1) * pageSize;
    // 查询用户关注的人
    console.log('查询关注的用户，followerId:', req.userId);
    let followings;
    try {
      followings = await Follow.findAll({
        where: {
          followerId: req.userId,
          status: 1 // 有效关注
        },
        attributes: ['followingId']
      });
      console.log('关注的用户数量:', followings.length);
    } catch (err) {
      console.error('查询关注用户失败:', err);
      return failure(res, err);
    }
    const followingIds = followings.map(follow => follow.followingId);
    // 如果用户没有关注任何人，返回空结果
    if (followingIds.length === 0) {
      return success(res, '查询关注的笔记成功', {
        total: 0,
        currentPage,
        pageSize,
        totalPages: 0,
        data: []
      });
    }
    // 查询关注的人发布的笔记
    const notes = await Note.findAndCountAll({
      attributes: [
        'id', 'title', 'content', 'coverImageUrl', 'images', 
        'likeCount', 'commentCount', 'collectCount', 'viewCount',
        'createdAt'
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar'],
        }
      ],
      where: {
        userId: {
          [Op.in]: followingIds
        },
        status: 1, // 已发布状态
        visibility: 1 // 公开可见
      },
      order: [['createdAt', 'DESC']],
      offset,
      limit: pageSize
    });
    // 查询用户对这些笔记的点赞和收藏信息
    const likes = await Like.findAll({
      where: {
        userId: req.userId,
        targetType: 1, // 笔记类型的点赞
        noteId: {
          [Op.in]: notes.rows.map(note => note.id)
        }
      }
    });
    const collections = await Collection.findAll({
      where: {
        userId: req.userId,
        status: 1, // 有效收藏
        noteId: {
          [Op.in]: notes.rows.map(note => note.id)
        }
      }
    });
    // 构建用户交互信息
    const userInteractions = {
      likes: likes.map(like => like.noteId),
      collections: collections.map(collection => collection.noteId)
    };
    const result = {
      total: notes.count,
      currentPage,
      pageSize,
      totalPages: Math.ceil(notes.count / pageSize),
      data: notes.rows.map(note => {
        const noteJson = note.toJSON();
        noteJson.isLiked = userInteractions.likes.includes(note.id);
        noteJson.isCollected = userInteractions.collections.includes(note.id);
        // 添加一个综合字段，表示用户是否与笔记有交互（点赞或收藏）
        noteJson.hasInteraction = noteJson.isLiked || noteJson.isCollected;
        return noteJson;
      })
    };

    success(res, '查询关注的笔记成功', result);
  } catch (error) {
    console.error('Following API error:', error);
    failure(res, error);
  }
});

/**
 * 分页查询当前地区的笔记
 * GET /nearby?page=1&size=10&location=北京
 */
router.get('/nearby', async function (req, res, next) {
  try {
    const query = req.query;
    const currentPage = Math.abs(Number(query.page)) || 1;
    const pageSize = Math.abs(Number(query.size)) || 10;
    const offset = (currentPage - 1) * pageSize;
    // 获取查询的地区，如果没有提供，则使用用户的地区（如果用户已登录）
    let location = query.location;
    if (!location && req.userId) {
      const currentUser = await User.findByPk(req.userId);
      if (currentUser && currentUser.location) {
        location = currentUser.location;
      }
    }
    // 如果没有地区信息，使用默认查询（不按地区筛选）
    if (!location) {
      console.log('未提供地区信息，返回默认数据');
      // 查询所有公开笔记
      const notes = await Note.findAndCountAll({
        attributes: [
          'id', 'title', 'content', 'coverImageUrl', 'images', 
          'likeCount', 'commentCount', 'collectCount', 'viewCount',
          'locationName', 'createdAt'
        ],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'nickname', 'avatar', 'location'],
          }
        ],
        where: {
          status: 1, // 已发布状态
          visibility: 1 // 公开可见
        },
        order: [['createdAt', 'DESC']],
        offset,
        limit: pageSize
      });
      // 如果当前用户已登录，查询用户的点赞和收藏信息
      let userInteractions = { likes: [], collections: [] };
      if (req.userId) {
        // 查询用户对这些笔记的点赞信息
        const likes = await Like.findAll({
          where: {
            userId: req.userId,
            noteId: {
              [Op.in]: notes.rows.map(note => note.id)
            }
          }
        });
        // 查询用户对这些笔记的收藏信息
        const collections = await Collection.findAll({
          where: {
            userId: req.userId,
            noteId: {
              [Op.in]: notes.rows.map(note => note.id)
            }
          }
        });
        userInteractions = {
          likes: likes.map(like => like.noteId),
          collections: collections.map(collection => collection.noteId)
        };
      }
      // 构建响应数据
      const result = {
        total: notes.count,
        currentPage,
        pageSize,
        totalPages: Math.ceil(notes.count / pageSize),
        location: '全部',
        data: notes.rows.map(note => {
          const noteJson = note.toJSON();
          // 如果用户已登录，添加用户交互信息
          if (req.userId) {
            noteJson.isLiked = userInteractions.likes.includes(note.id);
            noteJson.isCollected = userInteractions.collections.includes(note.id);
          }
          return noteJson;
        })
      };
      return success(res, '查询笔记成功', result);
    }
    // 查询指定地区的笔记
    const notes = await Note.findAndCountAll({
      attributes: [
        'id', 'title', 'content', 'coverImageUrl', 'images', 
        'likeCount', 'commentCount', 'collectCount', 'viewCount',
        'locationName', 'createdAt'
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar', 'location']
        }
      ],
      where: {
        status: 1, // 已发布状态
        visibility: 1, // 公开可见
        locationName: {
          [Op.like]: `%${location}%`
        }
      },
      order: [['createdAt', 'DESC']],
      offset,
      limit: pageSize
    });
    // 如果当前用户已登录，查询用户的点赞和收藏信息
    let userInteractions = { likes: [], collections: [] };
    if (req.userId) {
      // 查询用户对这些笔记的点赞信息
      const likes = await Like.findAll({
        where: {
          userId: req.userId,
          noteId: {
            [Op.in]: notes.rows.map(note => note.id)
          }
        }
      });
      // 查询用户对这些笔记的收藏信息
      const collections = await Collection.findAll({
        where: {
          userId: req.userId,
          noteId: {
            [Op.in]: notes.rows.map(note => note.id)
          }
        }
      });
      userInteractions = {
        likes: likes.map(like => like.noteId),
        collections: collections.map(collection => collection.noteId)
      };
    }
    // 构建响应数据
    const result = {
      total: notes.count,
      currentPage,
      pageSize,
      totalPages: Math.ceil(notes.count / pageSize),
      location,
      data: notes.rows.map(note => {
        const noteJson = note.toJSON();
        // 如果用户已登录，添加用户交互信息
        if (req.userId) {
          noteJson.isLiked = userInteractions.likes.includes(note.id);
          noteJson.isCollected = userInteractions.collections.includes(note.id);
        }
        return noteJson;
      })
    };
    success(res, '查询附近笔记成功', result);
  } catch (error) {
    console.error('Following API error:', error);
    failure(res, error);
  }
});

module.exports = router;
