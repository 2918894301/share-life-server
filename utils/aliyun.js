const multer = require('multer');
const MAO = require('multer-aliyun-oss');
const OSS = require('ali-oss');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { BadRequest } = require('http-errors');
// 阿里云配置信息
const config = {
  region: process.env.ALIYUN_REGION,
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
  bucket: process.env.ALIYUN_BUCKET,
  secure: true,
};
const client = new OSS(config);

/**
 * 使用 http 请求头中的 content-length 限制文件大小
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
const imageSizeLimits = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length']);
  if (contentLength > 10*1024*1024) {
    return next(new BadRequest('图片大小不能超过10MB'));
  }
  next();
};
// 创建一个自定义的multer实例，专门用于头像上传
const avatarUpload = multer({
  storage: MAO({ config: config,destination: 'uploads/avatar' }),
  fileFilter: function (req, file, cb) {
    const isImage = file.mimetype.split('/')[0] === 'image';
    if (!isImage) return cb(new BadRequest('只能上传图片文件'));
    cb(null, true);
  },
}); 
//单图片上传
const imageUpload = multer({
  storage: MAO({ config: config, destination: 'uploads/images' }),
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.split('/')[0] === 'image';
    if (!isImage) return cb(new BadRequest('只能上传图片文件'));
    cb(null, true);
  },
});
const singleImageUpload=(req,res,next)=>{
  imageSizeLimits(req, res, (err) => {
    if (err) return next(err);
    imageUpload.single('image')(req, res, next);
  });
}
const singleAvatarUpload=(req,res,next)=>{
  imageSizeLimits(req, res, (err) => {
    if (err) return next(err);
    avatarUpload.single('avatar')(req, res, next);
  });
}

const videoSizeLimits = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length']);
  if (contentLength > 50*1024*1024) {
    return next(new BadRequest('视频大小不能超过10MB'));
  }
  next();
};
// 限制为单视频上传
const videoUpload = multer({
  storage: MAO({ config: config, destination: 'uploads/videos' }),
  fileFilter: (req, file, cb) => {
    const isVideo = file.mimetype.split('/')[0] === 'video';
    if (!isVideo) return cb(new BadRequest('只能上传视频文件'));
    cb(null, true);
  },
});

const singleVideoUpload=(req,res,next)=>{
  videoSizeLimits(req, res, (err) => {
    if (err) return next(err);
    videoUpload.single('video')(req, res, next);
  });
}

/**
 * 生成视频首帧并上传至 OSS，返回封面图 URL
 * @param {string} videoUrl 公开可访问的视频 URL（已上传到 OSS）
 * @returns {Promise<string>} 上传后的封面图 URL
 */
const generateVideoCoverFromUrl = async (videoUrl) => {
  const tmpDir = path.join(__dirname, '..', 'temp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const localCover = path.join(tmpDir, `${uuidv4()}.jpg`);
  // 使用 ffmpeg 从远程视频截取首帧
  await new Promise((resolve, reject) => {
    ffmpeg(videoUrl)
      .on('end', resolve)
      .on('error', reject)
      .screenshots({
        count: 1,
        timemarks: ['00:00:01.000'],
        filename: path.basename(localCover),
        folder: tmpDir,
        size: '720x?'
      });
  });
  const ossKey = `uploads/covers/${uuidv4()}.jpg`;
  const result = await client.put(ossKey, localCover);
  // 清理本地文件
  try { fs.unlinkSync(localCover); } catch (e) {}
  return result && result.url ? result.url : `${config.secure ? 'https' : 'http'}://${config.bucket}.${config.region}.aliyuncs.com/${ossKey}`;
};
module.exports = {
  config,
  client,
  singleVideoUpload,
  singleImageUpload,
  singleAvatarUpload,
  generateVideoCoverFromUrl
};