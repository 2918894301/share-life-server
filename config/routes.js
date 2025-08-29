const express = require('express');
const router = express.Router();
//认证中间件
const userAuth = require('../middlewares/user-auth');

//路由
const indexRouter = require('../routes/index');
const authRouter = require('../routes/auth');
const uploadsRouter = require('../routes/uploads');
const noteRouter = require('../routes/notes');
const userRouter = require('../routes/users');
const likesAndCollectRouter = require('../routes/likesAndCollect');
const categoryRouter = require('../routes/category');
const commentRouter = require('../routes/comment');
const followRouter = require('../routes/follow');
const searchRouter = require('../routes/search');


router.use('/', indexRouter);
router.use('/auth', authRouter);
router.use('/uploads', userAuth, uploadsRouter);
router.use('/note', userAuth, noteRouter);
router.use('/users', userAuth, userRouter);
router.use('/likesAndCollect', userAuth, likesAndCollectRouter);
router.use('/categories', categoryRouter);
router.use('/comments', userAuth, commentRouter);
router.use('/follow', userAuth, followRouter);
router.use('/search', searchRouter);


module.exports = router;