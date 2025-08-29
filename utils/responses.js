const createError = require('http-errors');
const multer = require('multer');
function success(res, message, data = {}, code = 200) {
  res.status(code).json({
    status: true,
    message,
    data,
  });
}
function failure(res, error) {
  // 默认响应为 500，服务器错误
  let statusCode;
  let errors;

  if (error.name === 'SequelizeValidationError') {
    // Sequelize 验证数据错误
    statusCode = 400;
    errors = error.errors.map((e) => e.message);
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    // Token 验证错误
    statusCode = 401;
    errors = '您提交的 token 错误或已过期。';
  } else if (error instanceof createError.HttpError) {
    // http-errors 库创建的错误
    statusCode = error.status;
    errors = error.message;
  } else if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      errors = '文件大小超出限制。';
    } else {
      statusCode = 400;
      errors = error.message;
    }
  } else {
    statusCode = 500;
    errors = '服务器错误。';
  }
  const errorMessages = Array.isArray(errors) ? errors : [errors];
  res.status(statusCode).json({
    status: false,
    message: errorMessages[0] || `请求失败: ${error.name}`, // 使用第一个错误信息作为主要提示
    data: {
      errors: errorMessages,
    }
  });
}

module.exports = {
  success,
  failure,
};
