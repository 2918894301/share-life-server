const express = require('express');
const router = express.Router();
const { Note, Like, User, Follow, Collection, sequelize } = require('../models');
const { success, failure } = require('../utils/responses');
const { NotFound, BadRequest } = require('http-errors');

/**
 * 点赞或取消点赞笔记
 * @route POST /likesAndCollect/like
 * @param {number} noteId - 笔记ID
 * @returns {Object} 点赞/取消点赞结果
 */
router.post('/like', async function (req, res) {
  try {
    const userId = req.userId;
    const { noteId } = req.body;
    if (!noteId) {
      throw new BadRequest('笔记ID不能为空');
    }
    const note = await Note.findByPk(noteId);
    if (!note) {
      throw new NotFound('笔记不存在');
    }
    // 检查是否已经点赞过
    const like = await Like.findOne({
      where: {
        noteId,
        userId
      }
    });
    if (!like) {
      await Like.create({ 
        noteId, 
        userId,
        targetType: 1 // 1 表示点赞笔记
      });
      const updatedNote = await Note.findByPk(noteId);
      console.log('点赞后笔记信息:', {
        id: updatedNote.id,
        title: updatedNote.title,
        likeCount: updatedNote.likeCount
      });
      success(res, '点赞成功');
    } else {
      // 如果已经点赞过，则删除点赞记录
      // Like 模型的 hooks 会自动减少笔记的 likeCount
      await like.destroy();
      // 重新获取笔记信息，查看更新后的likeCount
      const updatedNote = await Note.findByPk(noteId);
      console.log('取消点赞后笔记信息:', {
        id: updatedNote.id,
        title: updatedNote.title,
        likeCount: updatedNote.likeCount
      });
      success(res, '取消点赞成功');
    }
  } catch (error) {
    console.error('点赞/取消点赞失败:', error);
    failure(res, error);
  }
});

/**
 * 收藏或取消收藏笔记
 * @route POST /likesAndCollectAndFollow/collect
 * @param {number} noteId - 笔记ID
 * @returns {Object} 收藏/取消收藏结果
 */
router.post('/collect', async function (req, res) {
  try {
    const userId = req.userId;
    const { noteId } = req.body;
    if (!noteId) {
      throw new BadRequest('笔记ID不能为空');
    }
    const note = await Note.findByPk(noteId);
    if (!note) {
      throw new NotFound('笔记不存在');
    }
    const collection = await Collection.findOne({
      where: {
        noteId,
        userId
      }
    });
    // 如果没有收藏过，则创建收藏记录
    // Collection 模型的 hooks 会自动增加笔记的 collectCount
    if (!collection) {
      await Collection.create({ 
        noteId, 
        userId,
        status: 1
      });
      // 重新获取笔记信息，查看更新后的collectCount
      const updatedNote = await Note.findByPk(noteId);
      console.log('收藏后笔记信息:', {
        id: updatedNote.id,
        title: updatedNote.title,
        collectCount: updatedNote.collectCount
      });
      success(res, '收藏成功');
    } else {
      // 如果已经收藏过，则删除收藏记录
      // Collection 模型的 hooks 会自动减少笔记的 collectCount
      await collection.destroy();
      // 重新获取笔记信息，查看更新后的collectCount
      const updatedNote = await Note.findByPk(noteId);
      console.log('取消收藏后笔记信息:', {
        id: updatedNote.id,
        title: updatedNote.title,
        collectCount: updatedNote.collectCount
      });
      success(res, '取消收藏成功');
    }
  } catch (error) {
    console.error('收藏/取消收藏失败:', error);
    failure(res, error);
  }
});

/**
 * 检查用户是否点赞和收藏了笔记
 * @route GET /likesAndCollect/check
 * @param {number} noteId - 笔记ID
 * @returns {Object} 点赞和收藏状态
 */
router.get('/check', async function (req, res) {
  try {
    const userId = req.userId;
    const { noteId } = req.query;
    console.log(noteId);
    if (!noteId) {
      throw new BadRequest('笔记ID不能为空');
    }
    // 查找笔记
    const note = await Note.findByPk(noteId);
    if (!note) {
      throw new NotFound('笔记不存在');
    }
    // 检查是否已经点赞和收藏
    const [like, collection] = await Promise.all([
      Like.findOne({
        where: {
          noteId,
          userId,
          targetType: 1
        }
      }),
      Collection.findOne({
        where: {
          noteId,
          userId,
          status: 1
        }
      })
    ]);
    success(res, '查询成功', {
      isLiked: !!like,
      isCollected: !!collection
    });
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;
