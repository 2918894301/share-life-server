const express = require('express');
const router = express.Router();
const { success, failure } = require('../utils/responses');
const { BadRequest, NotFound, Unauthorized } = require('http-errors');
const { Note, Follow,User, Sequelize } = require('../models');
const { Op } = Sequelize;

/**
 * 查询当前登录用户是否关注了笔记作者
 * GET /follow/status?noteId=123
 * 需要认证（从 req.userId 读取当前用户ID）
 */
router.get('/status', async function (req, res) {
  try {
    const noteId = parseInt(req.query.noteId);
    const userId = req.userId; 

    if (!userId) return failure(res, new Unauthorized('请先登录'));
    if (!noteId) return failure(res, new BadRequest('noteId 必填'));

    // 获取笔记，拿到作者ID
    const note = await Note.findByPk(noteId, { attributes: ['id', 'userId'] });
    if (!note) return failure(res, new NotFound(`ID为${noteId}的笔记不存在`));

    const authorId = note.userId;
    if (authorId === userId) {
      // 自己不统计为关注对象
      return success(res, '查询成功', { isFollowing: false, authorId });
    }
    const follow = await Follow.findOne({
      where: {
        followerId: userId,
        followingId: authorId,
        status: 1
      }
    });
    success(res, '查询成功', { isFollowing: !!follow, authorId });
  } catch (error) {
    failure(res, error);
  }
});
/**
 * 关注或取消关注用户
 * @route POST /follow
 * @param {number} followingId - 要关注的用户ID
 * @returns {Object} 关注/取消关注结果
 */
router.post('/', async function (req, res) {
  try {
    const followerId = req.userId; // 当前登录用户ID
    const { followingId } = req.body; // 要关注的用户ID
    
    if (!followingId) {
      throw new BadRequest('用户ID不能为空');
    }
    if (followerId === parseInt(followingId)) {
      throw new BadRequest('不能关注自己');
    }
    // 检查要关注的用户是否存在
    const followingUser = await User.findByPk(followingId);
    
    if (!followingUser) {
      throw new NotFound('要关注的用户不存在');
    }
    // 检查是否已经关注过
    const follow = await Follow.findOne({
      where: {
        followerId,
        followingId
      }
    });
    if (!follow) {
      await Follow.create({
        followerId,
        followingId,
        status: 1
      });
      const [updatedFollower, updatedFollowing] = await Promise.all([
        User.findByPk(followerId),
        User.findByPk(followingId)
      ]);
      console.log('关注后用户信息:', {
        follower: {
          id: updatedFollower.id,
          followCount: updatedFollower.followCount
        },
        following: {
          id: updatedFollowing.id,
          fansCount: updatedFollowing.fansCount
        }
      });
      success(res, '关注成功');
    } else {
      if (follow.status === 1) {
        follow.status = 0;
        await follow.save();
        const [updatedFollower, updatedFollowing] = await Promise.all([
          User.findByPk(followerId),
          User.findByPk(followingId)
        ]);
        console.log('取消关注后用户信息:', {
          follower: {
            id: updatedFollower.id,
            followCount: updatedFollower.followCount
          },
          following: {
            id: updatedFollowing.id,
            fansCount: updatedFollowing.fansCount
          }
        });
        success(res, '取消关注成功');
      } else {
        follow.status = 1;
        await follow.save();
        const [updatedFollower, updatedFollowing] = await Promise.all([
          User.findByPk(followerId),
          User.findByPk(followingId)
        ]);
        console.log('重新关注后用户信息:', {
          follower: {
            id: updatedFollower.id,
            followCount: updatedFollower.followCount
          },
          following: {
            id: updatedFollowing.id,
            fansCount: updatedFollowing.fansCount
          }
        });
        success(res, '关注成功');
      }
    }
  } catch (error) {
    failure(res, error);
  }
});
/**
 * 分页查询当前登录用户关注的用户发布的笔记
 * GET /follow/noteList?page=1&pageSize=10
 */
router.get('/noteList',  async function (req, res, next) {
  try {
    const userId = req.userId;
    if (!userId) throw new Unauthorized('请先登录');
    const currentPage = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 50);
    const offset = (currentPage - 1) * pageSize;
    // 查询当前用户关注的人
    const follows = await Follow.findAll({
      where: { followerId: userId, status: 1 },
      attributes: ['followingId']
    });
    const followingIds = follows.map(f => f.followingId);
    if (followingIds.length === 0) {
      return success(res, '查询成功', {
        total: 0,
        currentPage,
        pageSize,
        totalPages: 0,
        data: []
      });
    }
    const notes = await Note.findAndCountAll({
      attributes: ['id','title','content','coverImageUrl','images','videoUrl','likeCount','commentCount','collectCount','viewCount','createdAt'],
      include: [{ model: User, as: 'user', attributes: ['id','username','nickname','avatar'] }],
      where: { userId: { [Op.in]: followingIds }, status: 1, visibility: 1 },
      order: [['createdAt','DESC']],
      offset,
      limit: pageSize
    });
    success(res, '查询成功', {
      total: notes.count,
      currentPage,
      pageSize,
      totalPages: Math.ceil(notes.count / pageSize),
      data: notes.rows
    });
  } catch (error) {
    failure(res, error);
  }
});
module.exports = router;
