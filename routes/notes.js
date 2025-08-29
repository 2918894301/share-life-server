const express = require('express');
const router = express.Router();
const { success, failure } = require('../utils/responses');
const { singleVideoUpload,singleImageUpload,generateVideoCoverFromUrl } = require('../utils/aliyun');
const { BadRequest, NotFound } = require('http-errors');
const { Note, User } = require('../models');

router.get('/noteDetail/:id', async function (req, res) {
  try {
    const { id } = req.params;
    // 查询笔记详情，包含作者信息，并只选择需要的字段
    const note = await Note.findByPk(id, {
      attributes: [
        'id', 'title', 'content', 'coverImageUrl', 'images', 'videoUrl', 
        'tags', 'categoryId', 'locationName', 'likeCount', 'commentCount', 
        'collectCount', 'createdAt'
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'username', 'signature']
        }
      ],
      raw: false
    });
    if (!note) throw new NotFound(`ID为${id}的笔记不存在`);
    const noteDetail = {
      id: note.id,
      title: note.title,
      content: note.content,
      coverImageUrl: note.coverImageUrl,
      images: note.images,
      videoUrl: note.videoUrl,
      tags: note.tags,
      category: note.category,
      createdAt: note.createdAt,
      locationName: note.locationName,
      likeCount: note.likeCount,
      collectCount: note.collectCount,
      commentCount: note.commentCount,
      author: note.user ? {
        id: note.user.id,
        nickname: note.user.nickname || note.user.username,
        avatar: note.user.avatar,
        signature: note.user.signature,
      } : null
    };
    success(res, '获取笔记详情成功', { noteDetail });
  } catch (error) {
    failure(res, error);
  }
});
/**
 * 视频上传接口，用于上传视频文件并创建视频笔记
 * 只能上传一个视频，视频大小不能超过50MB
 * 使用字段名 "video" 上传视频文件
 * 需要用户认证
 */
router.post('/upload-video',  async function (req, res) {
  try {
    singleVideoUpload(req, res, async (err) => {
      try {
        if (err) {
          console.error('视频上传错误:', err);
          return failure(res, err);
        }
        if (!req.file) {
          return failure(res, new BadRequest('请使用字段名 video 上传视频'));
        }
        const { title, content = '', categoryId, locationName, visibility = 1 } = req.body;
        if (!title || title.trim() === '') {
          return failure(res, new BadRequest('标题不能为空'));
        }
        const videoUrl = req.file.url;
        // 生成并上传首帧封面
        const coverImageUrl = await generateVideoCoverFromUrl(videoUrl);
        // 持久化到数据库
        const note = await Note.create({
          userId: req.userId,
          title: title.trim(),
          content: content.trim(),
          videoUrl,
          coverImageUrl,
          categoryId: categoryId ? Number(categoryId) : null,
          locationName: locationName || null,
          visibility: Number(visibility) || 1,
          status: 1 // 默认状态为正常
        });
        success(res, '视频笔记创建成功', { 
          note: {
            id: note.id,
            title: note.title,
            content: note.content,
            videoUrl: note.videoUrl,
            coverImageUrl: note.coverImageUrl,
            categoryId: note.categoryId,
            locationName: note.locationName,
            visibility: note.visibility,
            createdAt: note.createdAt
          }
        });
      } catch (e) {
        console.error('视频笔记创建失败:', e);
        failure(res, e);
      }
    });
  } catch (error) {
    console.error('视频上传处理失败:', error);
    failure(res, error);
  }
});
/**
 * 单张图片上传接口（适用于微信小程序多次上传）
 * 只上传图片，不创建笔记，返回图片URL
 * 使用字段名 "image"
 */
router.post('/upload-single-image', async function (req, res) {
  try {
    singleImageUpload(req, res, async (err) => {
      try {
        if (err) {
          console.error('图片上传错误:', err);
          return failure(res, err);
        }
        if (!req.file) {
          return failure(res, new BadRequest('请使用字段名 image 上传图片'));
        }
        console.log('图片上传成功:', {
          filename: req.file.filename,
          url: req.file.url,
          size: req.file.size
        });
        success(res, '图片上传成功', { 
          imageUrl: req.file.url,
          filename: req.file.filename,
          size: req.file.size
        });
      } catch (e) {
        console.error('图片处理失败:', e);
        failure(res, e);
      }
    });
  } catch (error) {
    console.error('图片上传处理失败:', error);
    failure(res, error);
  }
});
/**
 * 创建图片笔记接口（在所有图片上传完成后调用）
 * 接收图片URL数组和笔记信息
 */
router.post('/create-image-note', async function (req, res) {
  try {
    const { title, content = '', categoryId, locationName, visibility = 1, imageUrls } = req.body;
    // 验证必填字段
    if (!title || title.trim() === '') {
      return failure(res, new BadRequest('标题不能为空'));
    }
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return failure(res, new BadRequest('请提供图片URL数组'));
    }
    // 限制最多5张图片
    if (imageUrls.length > 5) {
      return failure(res, new BadRequest('最多只能上传5张图片'));
    }
    // 第一张图片作为封面图
    const coverImageUrl = imageUrls[0];
    // 创建笔记数据
    const noteData = {
      userId: req.userId,
      title: title.trim(),
      content: content.trim(),
      images: imageUrls,
      coverImageUrl: coverImageUrl,
      categoryId: categoryId ? Number(categoryId) : null,
      locationName: locationName || null,
      visibility: Number(visibility) || 1,
      status: 1
    };
    // 保存到数据库
    const note = await Note.create(noteData);
    success(res, '图片笔记创建成功', { 
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
        images: note.images,
        coverImageUrl: note.coverImageUrl,
        categoryId: note.categoryId,
        locationName: note.locationName,
        visibility: note.visibility,
        createdAt: note.createdAt
      }
    });
  } catch (error) {
    console.error('图片笔记创建失败:', error);
    failure(res, error);
  }
});
/**
 * 创建视频笔记接口  客户端直传
 * POST /note/create-video-note
 * 接收参数：title, content, categoryId, locationName, visibility, coverImageUrl, videoUrl
 */
router.post('/create-video-note', async function (req, res) {
  try {
    const { title, content = '', categoryId, locationName, visibility = 1, coverImageUrl, videoUrl } = req.body;
    // 参数验证
    if (!title || title.trim() === '') {
      return failure(res, new BadRequest('标题不能为空'));
    }
    if (!videoUrl || videoUrl.trim() === '') {
      return failure(res, new BadRequest('视频URL不能为空'));
    }
    if (!coverImageUrl || coverImageUrl.trim() === '') {
      return failure(res, new BadRequest('封面图片URL不能为空'));
    }
    // 验证URL格式（基本验证）
    try {
      new URL(videoUrl);
      new URL(coverImageUrl);
    } catch (urlError) {
      return failure(res, new BadRequest('视频URL或封面图片URL格式不正确'));
    }
    // 创建视频笔记数据
    const noteData = {
      userId: req.userId,
      title: title.trim(),
      content: content.trim(),
      videoUrl: videoUrl.trim(),
      coverImageUrl: coverImageUrl.trim(),
      categoryId: categoryId ? Number(categoryId) : null,
      locationName: locationName || null,
      visibility: Number(visibility) || 1,
      status: 1 // 默认状态为正常
    };
    // 保存到数据库
    const note = await Note.create(noteData);
    // 返回创建成功的笔记信息
    success(res, '视频笔记创建成功', { 
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
        videoUrl: note.videoUrl,
        coverImageUrl: note.coverImageUrl,
        categoryId: note.categoryId,
        locationName: note.locationName,
        visibility: note.visibility,
        status: note.status,
        createdAt: note.createdAt,
        likeCount: note.likeCount || 0,
      }
    });
  } catch (error) {
    console.error('视频笔记创建失败:', error);
    failure(res, error);
  }
});

module.exports = router;
