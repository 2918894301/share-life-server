const express = require('express');
const router = express.Router();
const { Note, Like, User, Follow, Collection, sequelize } = require('../models');
const { success, failure } = require('../utils/responses');
const { NotFound, BadRequest } = require('http-errors');
const { Op } = require('sequelize');
const { singleAvatarUpload } = require('../utils/aliyun');
/**
 * 获取当前登录用户的详细信息
 * 包括用户基本信息（昵称、头像等）、统计数据（关注数、粉丝数、获赞收藏数）
 * 以及用户发布的笔记列表（仅包含封面图和点赞数）
 * @route GET /users/me
 * @returns {Object} 用户详细信息和笔记列表
 */
router.get('/me', async function (req, res, next) {
  try {
    const id = req.userId;
    // 查询用户基本信息
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFound(`ID:${id}的用户没有找到`);
    }
    // 查询用户发布的笔记列表（只获取封面和点赞数）
    const notes = await Note.findAll({
      where: {
        userId: id,
        status: 1
      },
      attributes: ['id','title', 'coverImageUrl', 'likeCount'],
      order: [['createdAt', 'DESC']],
      limit: 10 // 只获取最近的10条笔记
    });
    // 构建简化的笔记列表
    const noteList = notes.map(note => ({
      id: note.id,
      title:note.title,
      coverImageUrl: note.coverImageUrl,
      likeCount: note.likeCount
    }));
    // 构建返回数据（直接使用用户表中的统计数据）
    const data = {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
      avatar: user.avatar || null,
      gender: user.gender,
      signature: user.signature || '踏遍山海，把日子过成诗。不赶浪潮，自有星辰为我掌灯，风作马。',
      location: user.location || '成都',
      stats: {
        followCount: user.followCount,         // 关注数
        fansCount: user.fansCount,             // 粉丝数
        likeCollectCount: user.likeCollectCount // 获赞和收藏数
      },
      notes: noteList,  // 用户发布的笔记列表（封面和点赞数）
      createdAt: user.createdAt
    };
    success(res, '获取用户信息成功', data);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    failure(res, error);
  }
});
/**
 * 获取当前登录用户发布的笔记列表
 * @route GET /users/noteList
 * @param {number} page 
 * @param {number} pageSize 
 * @param {string} sortBy 
 * @param {string} order 
 * @returns {Object}
 */
router.get('/noteList', async function (req, res, next) {
  try {
    const id = req.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sortBy = ['createdAt', 'likeCount'].includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const order = req.query.order === 'ASC' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFound(`ID:${id}的用户没有找到`);
    }
    const whereCondition = {
      userId: id,
      status: 1
    };
    const total = await Note.count({
      where: whereCondition
    });
    
    const notes = await Note.findAll({
      where: whereCondition,
      attributes: ['id', 'title', 'coverImageUrl', 'videoUrl', 'likeCount', 'commentCount', 'createdAt'],
      order: [[sortBy, order]],
      offset,
      limit: pageSize
    });
    // 计算这些笔记是否被当前用户点赞
    let likedSet = new Set();
    if (notes.length > 0) {
      const noteIds = notes.map(n => n.id);
      const likes = await Like.findAll({
        where: {
          userId: id,
          targetType: 1,
          noteId: { [Op.in]: noteIds }
        },
        attributes: ['noteId']
      });
      likedSet = new Set(likes.map(l => l.noteId));
    }

    const noteList = notes.map(note => ({
      id: note.id,
      title: note.title,
      coverImageUrl: note.coverImageUrl,
      likeCount: note.likeCount,
      commentCount: note.commentCount,
      createdAt: note.createdAt,
      isLiked: likedSet.has(note.id),
      isVideo: !!note.videoUrl
    }));
    // 构建分页信息
    const pagination = {
      total,
      pageSize,
      current: page,
      totalPages: Math.ceil(total / pageSize)
    };
    const userInfo = {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
      avatar: user.avatar ,
      gender: user.gender,
      signature: user.signature || '踏遍山海，把日子过成诗。不赶浪潮，自有星辰为我掌灯，风作马。',
      location: user.location || '成都',
      stats: {
        followCount: user.followCount,         // 关注数
        fansCount: user.fansCount,             // 粉丝数
        likeCollectCount: user.likeCollectCount // 获赞和收藏数
      }
    };
    success(res, '获取用户笔记列表成功', {
      user: userInfo,
      notes: noteList,
      pagination
    });
  } catch (error) {
    console.error('获取用户笔记列表失败:', error);
    failure(res, error);
  }
});

/**
 * 获取当前登录用户收藏过的笔记列表
 * @route GET /users/collections
 * @param {number} page - 页码，默认为1
 * @param {number} pageSize - 每页数量，默认为10
 * @returns {Object} 收藏的笔记列表和分页信息
 */
router.get('/collectionList', async function (req, res, next) {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const collections = await Collection.findAll({
      where: {
        userId: userId,
        status: 1  // Collection模型有status字段
      },
      attributes: ['noteId'],
      order: [['createdAt', 'DESC']],
      offset,
      limit: pageSize
    });
    
    // 获取收藏的笔记ID列表
    const noteIds = collections.map(collection => collection.noteId);
    // 如果没有收藏的笔记，直接返回空列表
    if (noteIds.length === 0) {
      return success(res, '查询收藏笔记列表成功', {
        notes: [],
        pagination: {
          total: 0,
          pageSize,
          current: page,
          totalPages: 0
        }
      });
    }
    // 查询收藏的笔记详情
    const notes = await Note.findAll({
      where: {
        id: {
          [Op.in]: noteIds
        },
        status: 1
      },
      attributes: ['id', 'title', 'coverImageUrl', 'videoUrl', 'likeCount', 'commentCount', 'createdAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'username']
        }
      ]
    });
    let likedSetCollections = new Set();
    if (noteIds.length > 0) {
      const likes = await Like.findAll({
        where: {
          userId: userId,
          targetType: 1,
          noteId: { [Op.in]: noteIds }
        },
        attributes: ['noteId']
      });
      likedSetCollections = new Set(likes.map(l => l.noteId));
    }
    // 按照收藏顺序重新排序笔记
    const orderedNotes = [];
    noteIds.forEach(noteId => {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        orderedNotes.push(note);
      }
    });
    // 构建笔记列表数据
    const noteList = orderedNotes.map(note => ({
      id: note.id,
      title: note.title,
      coverImageUrl: note.coverImageUrl,
      likeCount: note.likeCount,
      commentCount: note.commentCount,
      createdAt: note.createdAt,
      isLiked: likedSetCollections.has(note.id),
      isVideo: !!note.videoUrl,
      author: note.user ? {
        id: note.user.id,
        nickname: note.user.nickname || note.user.username,
        avatar: note.user.avatar
      } : null
    }));
    // 查询收藏总数
    const total = await Collection.count({
      where: {
        userId: userId,
        status: 1
      }
    });
    // 构建分页信息
    const pagination = {
      total,
      pageSize,
      current: page,
      totalPages: Math.ceil(total / pageSize)
    };
    success(res, '查询收藏笔记列表成功', {
      notes: noteList,
      pagination
    });
  } catch (error) {
    console.error('查询收藏笔记列表失败:', error);
    failure(res, error);
  }
});
/**
 * 获取当前登录用户赞过的笔记列表
 * @route GET /users/likes
 * @param {number} page - 页码，默认为1
 * @param {number} pageSize - 每页数量，默认为10
 * @returns {Object} 赞过的笔记列表和分页信息
 */
router.get('/likedList', async function (req, res, next) {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    // 查询用户点赞的笔记ID列表
    const likes = await Like.findAll({
      where: {
        userId: userId,
        targetType: 1, // 只查询笔记点赞
        noteId: {
          [Op.ne]: null
        }
      },
      attributes: ['noteId'],
      order: [['createdAt', 'DESC']],
      offset,
      limit: pageSize
    });
    // 获取点赞的笔记ID列表
    const noteIds = likes.map(like => like.noteId);
    // 如果没有点赞的笔记，直接返回空列表
    if (noteIds.length === 0) {
      return success(res, '查询点赞笔记列表成功', {
        notes: [],
        pagination: {
          total: 0,
          pageSize,
          current: page,
          totalPages: 0
        }
      });
    }
    // 查询点赞的笔记详情
    const notes = await Note.findAll({
      where: {
        id: {
          [Op.in]: noteIds
        },
        status: 1
      },
      attributes: ['id', 'title', 'coverImageUrl', 'videoUrl', 'likeCount', 'commentCount', 'createdAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'username']
        }
      ]
    });
    // 按照点赞顺序重新排序笔记
    const orderedNotes = [];
    noteIds.forEach(noteId => {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        orderedNotes.push(note);
      }
    });
    // 构建笔记列表数据
    const noteList = orderedNotes.map(note => ({
      id: note.id,
      title: note.title,
      coverImageUrl: note.coverImageUrl,
      likeCount: note.likeCount,
      commentCount: note.commentCount,
      createdAt: note.createdAt,
      isLiked: true,
      isVideo: !!note.videoUrl,
      author: note.user ? {
        id: note.user.id,
        nickname: note.user.nickname || note.user.username,
        avatar: note.user.avatar
      } : null
    }));
    // 查询点赞总数
    const total = await Like.count({
      where: {
        userId: userId,
        targetType: 1,
        noteId: {
          [Op.ne]: null
        }
      }
    });
    // 构建分页信息
    const pagination = {
      total,
      pageSize,
      current: page,
      totalPages: Math.ceil(total / pageSize)
    };
    success(res, '查询点赞笔记列表成功', {
      notes: noteList,
      pagination
    });
  } catch (error) {
    console.error('查询点赞笔记列表失败:', error);
    failure(res, error);
  }
});
/**
 * 更新用户个人信息（昵称、签名、头像等）
 * @route POST /users/updateUserInfo
 * @param {string} nickname - 用户昵称
 * @param {string} signature - 个性签名
 * @param {string} location - 用户所在地
 * @param {number} gender - 用户性别
 * @param {file} avatar - 用户头像文件（可选）
 * @returns {Object} 更新后的用户信息
 */
router.post('/updateUserInfo', async function (req, res, next) {
  // 使用中间件处理文件上传
  singleAvatarUpload(req, res, async function(err) {
    try {
      if (err) {
        console.error('文件上传失败:', err);
        return failure(res, err);
      }
      const userId = req.userId;
      // 查询用户是否存在
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFound(`ID:${userId}的用户没有找到`);
      }
      // 构建更新数据对象
      const updateData = {};
      // 从表单数据中获取文本字段
      const { nickname, signature, location, gender } = req.body;
      // 只更新提供的文本字段
      if (nickname !== undefined) updateData.nickname = nickname;
      if (signature !== undefined) updateData.signature = signature;
      if (location !== undefined) updateData.location = location;
      if (gender !== undefined) updateData.gender = parseInt(gender);
      // 如果有上传头像，则更新头像URL
      if (req.file && req.file.url) {
        updateData.avatar = req.file.url;
      }
      // 如果没有任何更新字段，返回错误
      if (Object.keys(updateData).length === 0) {
        return failure(res, new BadRequest('没有提供任何需要更新的信息'));
      }
      await user.update(updateData);
      const updatedUser = {
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
        avatar: user.avatar,
        gender: user.gender,
        signature: user.signature || '踏遍山海，把日子过成诗。不赶浪潮，自有星辰为我掌灯，风作马。',
        location: user.location || '成都',
        stats: {
          followCount: user.followCount,
          fansCount: user.fansCount,
          likeCollectCount: user.likeCollectCount
        }
      };
      // 根据是否上传了头像返回不同的成功消息
      const message = req.file ? '更新用户信息和头像成功' : '更新用户信息成功';
      success(res, message, updatedUser);
    } catch (error) {
      console.error('更新用户信息失败:', error);
      failure(res, error);
    }
  });
});
module.exports = router;
