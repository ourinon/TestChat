'use strict';
var express = require('express');
var router = express.Router();

//샘플페이지 : 테스트용
router.get('/sample', function (req, res) {
    res.render('sample/sample.ejs');
});


//심플채팅 예시 페이지
router.get('/simple', function (req, res) {
    res.render('sample/simplechat.ejs');
});



module.exports = router;