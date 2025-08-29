const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Unauthorized } = require('http-errors');
const { success, failure } = require('../utils/responses');

module.exports = async (req, res, next) => {
  try {
    let token = req.headers.token || req.query.token;
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); 
      }
    }

    if (!token) {
      throw new Unauthorized('当前接口需要认证才能访问。');
    }
    // 验证token是否正确
    const decoded = jwt.verify(token, process.env.SECRET);
    // 从 jwt 中，解析出之前存入的 userId
    const { userId } = decoded;
    
    req.userId = userId;
    next();
  } catch (error) {
    failure(res, error);
  }
};
