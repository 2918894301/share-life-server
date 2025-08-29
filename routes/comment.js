const express = require('express');
const router = express.Router();
const { success, failure } = require('../utils/responses');
const { BadRequest, NotFound, Unauthorized } = require('http-errors');
const { Comment, User, Note, Sequelize } = require('../models');
const { Op } = Sequelize;

/**
 * 分页查询指定笔记的评论列表
 * GET /comments?noteId=1&page=1&pageSize=10
 * - 只返回已发布状态（status=1）的评论
 * - 包含评论作者信息
 * - 如果是二级评论，包含被回复的评论及其作者的基本信息
 */
router.get('/', async function (req, res) {
  try {
    const noteId = parseInt(req.query.noteId);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 50);
    const offset = (page - 1) * pageSize;
    if (!noteId) return failure(res, new BadRequest('noteId 必填'));

    const { rows, count } = await Comment.findAndCountAll({
      attributes: ['id', 'content', 'createdAt', 'likeCount', 'replyToId', 'level'],
      where: { noteId, status: 1 },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'nickname', 'avatar', 'username']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: pageSize
    });
    // 收集需要补充的被回复评论的信息（仅针对有 replyToId 的二级评论）
    const replyToIds = rows
      .map(c => c.replyToId)
      .filter(id => !!id);

    let replyToMap = {};
    if (replyToIds.length) {
      const replyToComments = await Comment.findAll({
        attributes: ['id', 'content', 'authorId'],
        where: { id: { [Op.in]: replyToIds } },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'nickname', 'username']
          }
        ]
      });
      replyToMap = replyToComments.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});
    }
    const list = rows.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      likeCount: comment.likeCount,
      author: comment.author ? {
        id: comment.author.id,
        nickname: comment.author.nickname || comment.author.username,
        avatar: comment.author.avatar
      } : null,
      replyTo: comment.replyToId && replyToMap[comment.replyToId] ? {
        id: replyToMap[comment.replyToId].id,
        content: replyToMap[comment.replyToId].content,
        author: replyToMap[comment.replyToId].author ? {
          id: replyToMap[comment.replyToId].author.id,
          nickname: replyToMap[comment.replyToId].author.nickname || replyToMap[comment.replyToId].author.username
        } : null
      } : null
    }));

    const pagination = {
      total: count,
      pageSize,
      current: page,
      totalPages: Math.ceil(count / pageSize)
    };

    success(res, '查询评论成功', { comments: list, pagination });
  } catch (error) {
    failure(res, error);
  }
});
/**
 * 发送评论
 * POST /comments/create
 * body: { noteId: number, content: string, replyToId?: number }
 */
router.post('/create', async function (req, res) {
  try {
    const authorId = req.userId;
    const { noteId, content, replyToId } = req.body || {};
    // 基础校验
    const parsedNoteId = parseInt(noteId);
    if (!parsedNoteId || Number.isNaN(parsedNoteId)) {
      return failure(res, new BadRequest('noteId 必填且必须为数字'));
    }

    const trimmed = typeof content === 'string' ? content.trim() : '';
    if (!trimmed) {
      return failure(res, new BadRequest('评论内容不能为空'));
    }

    // 校验笔记是否存在
    const note = await Note.findByPk(parsedNoteId);
    if (!note) return failure(res, new NotFound(`ID为${parsedNoteId}的笔记不存在`));

    let parsedReplyToId = null;
    if (replyToId !== undefined && replyToId !== null && replyToId !== '') {
      parsedReplyToId = parseInt(replyToId);
      if (!parsedReplyToId || Number.isNaN(parsedReplyToId)) {
        return failure(res, new BadRequest('replyToId 必须为数字'));
      }
      const targetComment = await Comment.findByPk(parsedReplyToId);
      if (!targetComment) return failure(res, new NotFound('被回复的评论不存在'));
      if (targetComment.noteId !== parsedNoteId) {
        return failure(res, new BadRequest('不能回复其他笔记下的评论'));
      }
    }
    // 创建评论（模型 hooks 会负责维护评论数和层级/rootCommentId）
    const created = await Comment.create({
      noteId: parsedNoteId,
      authorId,
      content: trimmed,
      replyToId: parsedReplyToId || null,
      status: 1
    });
    // 查询带关联信息的结果用于返回
    const createdWithRelations = await Comment.findByPk(created.id, {
      attributes: ['id', 'content', 'createdAt', 'likeCount', 'replyToId', 'level'],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'nickname', 'avatar', 'username']
        },
        {
          model: Comment,
          as: 'replyTo',
          attributes: ['id', 'content'],
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'nickname', 'username']
            }
          ]
        }
      ]
    });
    const data = {
      id: createdWithRelations.id,
      content: createdWithRelations.content,
      createdAt: createdWithRelations.createdAt,
      likeCount: createdWithRelations.likeCount,
      author: createdWithRelations.author ? {
        id: createdWithRelations.author.id,
        nickname: createdWithRelations.author.nickname || createdWithRelations.author.username,
        avatar: createdWithRelations.author.avatar
      } : null,
      replyTo: createdWithRelations.replyTo ? {
        id: createdWithRelations.replyTo.id,
        content: createdWithRelations.replyTo.content,
        author: createdWithRelations.replyTo.author ? {
          id: createdWithRelations.replyTo.author.id,
          nickname: createdWithRelations.replyTo.author.nickname || createdWithRelations.replyTo.author.username
        } : null
      } : null
    };
    success(res, '发送评论成功', data);
  } catch (error) {
    failure(res, error);
  }
});

module.exports = router;

