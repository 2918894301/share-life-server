const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { success, failure } = require('../utils/responses');
const { NotFound, BadRequest, Unauthorized } = require('http-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const userAuth = require('../middlewares/user-auth');

const { v4: uuidv4 } = require('uuid');
/**
 * 用户注册
 * POST /auth/register
 * @param {string} username - 用户名
 * @param {string} phone - 手机号
 * @param {string} password - 密码
 * @param {string} nickname - 昵称（可选）
 * @param {number} gender - 性别（0:未知, 1:男, 2:女）（可选）
 */
router.post('/register', async function (req, res) {
  try {
    const { username, phone, password, nickname, gender } = req.body;
    
    // 验证必填字段
    if (!username) {
      throw new BadRequest('用户名必须填写');
    }
    if (!phone) {
      throw new BadRequest('手机号必须填写');
    }
    if (!password) {
      throw new BadRequest('密码必须填写');
    }
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequest('请输入有效的手机号');
    }
    
    // 验证密码长度
    if (password.length < 6 || password.length > 45) {
      throw new BadRequest('密码长度必须是6~45之间');
    }
    
    // 验证用户名是否已存在
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      throw new BadRequest('用户名已被注册');
    }
    
    // 验证手机号是否已存在
    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
      throw new BadRequest('手机号已被注册，请直接登录');
    }
    const userData = {
      username,
      phone,
      password, // 密码会在模型中自动加密
      nickname: nickname || '小番茄'+uuidv4().replace(/-/g, '').substring(0, 8),
      gender: gender !== undefined ? gender : 0,
      status: 1,
      location: '成都',
      signature: '这个人很懒，什么都没留下'
    };

    const user = await User.create(userData);
    
    // 移除敏感信息
    const safeUser = user.toJSON();
    delete safeUser.password;

    success(res, '注册成功', { 
      user: safeUser,
    }, 201);
  } catch (error) {
    failure(res, error);
  }
});
/**
 * 用户登录
 * POST /auth/login
 * @param {string} login - 用户名或手机号
 * @param {string} password - 密码
 */
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    // 验证必填字段
    if (!login) {
      throw new BadRequest('手机号/用户名必须填写');
    }
    if (!password) {
      throw new BadRequest('密码必须填写');
    }
    // 查询用户是否存在（通过手机号或用户名）
    const user = await User.findOne({
      where: {
        [Op.or]: [{ phone: login }, { username: login }],
      },
    });
    if (!user) {
      throw new NotFound('用户不存在，请先注册');
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
     
      throw new Unauthorized('密码错误');
    }
    
    // 检查用户状态
    if (user.status !== 1) {
      throw new Unauthorized('账号已被禁用，请联系管理员');
    }
    // 生成身份验证令牌
    const token = jwt.sign(
      {
        userId: user.id,
        userPhone: user.phone,
      },
      process.env.SECRET,
      { expiresIn: '30d' }
    );
    const userInfo = user.toJSON();
    // 删除敏感信息
    delete userInfo.password; 
    
    // 更新用户最后登录时间（异步操作，不影响响应）
    User.update(
      { lastLoginAt: new Date() },
      { where: { id: user.id } }
    ).catch(err => console.error('更新登录时间失败:', err));
    
    const responseData = {
      user: userInfo,
      token: token,
      redBookId: userInfo.redBookId || '6150741554',
    };
    success(res, '登录成功', responseData);
  } catch (error) {

    failure(res, error);
  }
});
/**
 * 获取用户信息
 * GET /auth/profile
 * 需要用户登录
 */
router.get('/profile', userAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] } 
    });
    if (!user) {
      throw new NotFound('用户不存在');
    }
    success(res, '获取用户信息成功', { user });
  } catch (error) {
    failure(res, error);
  }
});


module.exports = router;
