const express = require('express');
const router = express.Router();
const { success, failure } = require('../utils/responses');
const { config, client } = require('../utils/aliyun');
const { BadRequest } = require('http-errors');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

/**
 * 获取图片+视频双文件上传的阿里云 OSS 授权信息
 * GET /uploads//aliyun_direct?fileType=cover|video
 */
router.get('/aliyun_direct', async function (req, res, next) {
  try {
    // 获取文件类型参数
    const fileType = req.query.fileType; // 'cover' 或 'video'
    if (!fileType || !['cover', 'video'].includes(fileType)) {
      return failure(res, new BadRequest('fileType参数必须为 cover 或 video'));
    }
    // 有效期
    const date = moment().add(1, 'days');
    // 根据文件类型设置不同的配置
    let maxFileSize, allowedTypes, directory;
    if (fileType === 'video') {
      maxFileSize = 100 * 1024 * 1024; // 视频限制100MB
      allowedTypes = [
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
        'video/webm', 'video/3gpp', 'video/x-flv'
      ];
      directory = 'uploads/videos'; // 视频保存目录
    } else { // cover
      maxFileSize = 10 * 1024 * 1024; // 图片限制10MB
      allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'
      ];
      directory = 'uploads/covers'; // 封面图保存目录
    }
    // 生成唯一文件名（不包含扩展名，由前端根据实际文件类型添加）
    const baseFileName = uuidv4();
    const key = `${directory}/${baseFileName}`;
    // 上传安全策略
    const policy = {
      expiration: date.toISOString(), 
      conditions: [
        ['content-length-range', 0, maxFileSize], 
        { bucket: client.options.bucket }, 
        ['starts-with', '$key', `${directory}/`], 
        ['in', '$content-type', allowedTypes], 
      ],
    };
    // 签名
    const formData = await client.calculatePostSignature(policy);
    // bucket 域名（阿里云上传地址）
    const host =
      `https://${config.bucket}.${(await client.getBucketLocation()).location}.aliyuncs.com`.toString();
    // 返回参数
    const params = {
      expire: date.format('YYYY-MM-DD HH:mm:ss'),
      policy: formData.policy,
      signature: formData.Signature,
      OSSAccessKeyId: formData.OSSAccessKeyId,
      host,
      key: key, 
      directory: directory,
      url: host + '/' + key,
      baseFileName: baseFileName, // UUID文件名（不含扩展名）
      fileType: fileType,
      maxFileSize: maxFileSize,
      maxFileSizeMB: Math.round(maxFileSize / (1024 * 1024)),
      allowedTypes: allowedTypes,
    };
    success(res, `获取${fileType === 'video' ? '视频' : '封面图'}上传授权成功`, params);
  } catch (error) {
    console.error('获取阿里云授权信息失败:', error);
    failure(res, error);
  }
});
module.exports = router;
