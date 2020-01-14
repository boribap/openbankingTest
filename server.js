var express = require('express');
var request = require('request');
var mysql = require('mysql');
var jwt = require('jsonwebtoken');
var auth = require('./lib/auth.js');
var tokenKey = 'fintechAcademy0$1#0@6!';
app = express();

var port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'fintechuser',
  password: 'rlaqhdnjs96',
  database: 'fintech',
  port: '3306'
});
connection.connect();

app.get('/testauth', auth, (req, res) => {
  res.json('로그인한 사용자입니다.');
});
app.get('/', (req, res, next) => {
  res.render('index');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/dbtofront', (req, res) => {
  connection.query('SELECT * FROM fintechtable', function(
    error,
    results,
    fields
  ) {
    if (error) throw error;
    console.log('The result is: ', results);
  });
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/main', (req, res) => {
  res.render('main');
});

app.get('/balance', (req, res) => {
  res.render('balance');
});

app.get('/qrcode', (req, res) => {
  res.render('qrcode');
});

app.get('/qrReader', (req, res) => {
  res.render('qrReader');
});

app.get('/authResult', (req, res) => {
  var authCode = req.query.code;
  console.log(authCode);

  var option = {
    method: 'POST',
    url: 'https://testapi.openbanking.or.kr/oauth/2.0/token',
    headers: '',
    form: {
      code: authCode,
      client_id: '3STFaIpxfR5BPG6RhOfP1cyLh28K3GuY7rOl6R6M',
      client_secret: 'Yd8SuuVksgkL7XtrAf38W0hf1ER80BgR8LWOjfjl',
      redirect_uri: 'http://localhost:3000/authResult',
      grant_type: 'authorization_code'
    }
  };

  request(option, (err, resopnse, body) => {
    console.log(body);
    var accessRequestResult = JSON.parse(body);
    res.render('resultChild', { data: accessRequestResult });
  });
});

//--------------------------------------POST-------------------------------------------//
app.post('/user', (req, res) => {
  console.log(req.body);
  var name = req.body.name;
  var password = req.body.password;
  var email = req.body.email;
  var accessToken = req.body.accessToken;
  var refreshToken = req.body.refreshToken;
  var userSeqNo = req.body.userSeqNo;

  console.log(accessToken, '에세스 토큰 확인');
  console.log(refreshToken);
  // 3개 변수 추가

  var sql =
    'INSERT INTO fintech.user (name, email, password, accesstoken, refreshtoken, userseqno) VALUES (?, ?, ?, ?, ?, ?)';
  // SQL 구문 변경 DB 구조 확인 바람

  connection.query(
    sql,
    [name, email, password, accessToken, refreshToken, userSeqNo],
    function(error, results, fields) {
      // [] 배열 정보 변경 -> 변수추가
      if (error) throw error;
      console.log('The result is: ', results);
      console.log('sql is ', this.sql);
      res.json(1);
    }
  );
});

app.post('/login', function(req, res) {
  var email = req.body.email;
  var userPassword = req.body.password;
  var sql = 'SELECT * FROM user WHERE email = ?';
  console.log('들어옴');
  connection.query(sql, [email], function(error, results, fields) {
    if (error) throw error;
    console.log(results[0].password, userPassword);
    if (results[0].password == userPassword) {
      jwt.sign(
        {
          userName: results[0].name,
          userId: results[0].id,
          userEmail: results[0].email
        },
        tokenKey,
        {
          expiresIn: '10d',
          issuer: 'fintech.admin',
          subject: 'user.login.info'
        },
        function(err, token) {
          console.log('로그인 성공', token);
          res.json(token);
        }
      );
    } else {
      console.log('비밀번호 틀렸습니다.');
      res.json(0);
    }
  });
});

app.post('/accountList', auth, function(req, res) {
  var userData = req.decoded;
  console.log(userData);
  var sql = 'SELECT * FROM user WHERE id = ?';
  connection.query(sql, [userData.userId], function(err, result) {
    console.log(result[0].accesstoken);
    console.log(result[0].userseqno);
    if (err) {
      console.error(err);
      throw err;
    } else {
      var option = {
        method: 'get',
        url: 'https://testapi.openbanking.or.kr/v2.0/account/list',
        headers: {
          Authorization: 'Bearer ' + result[0].accesstoken
        },
        qs: {
          user_seq_no: result[0].userseqno,
          include_cancel_yn: 'Y',
          sort_order: 'D'
        }
      };
      request(option, function(error, response, body) {
        console.log(body);
        var parseData = JSON.parse(body);
        res.json(parseData);
      });
    }
  });
});

app.post('/balance', auth, function(req, res) {
  var userData = req.decoded;
  var finusenum = req.body.fin_use_num;
  console.log(finusenum);
  var sql = 'SELECT * FROM user WHERE id = ?';
  connection.query(sql, [userData.userId], function(err, result) {
    if (err) {
      console.error(err);
      throw err;
    } else {
      console.log(result);

      var countnum = Math.floor(Math.random() * 1000000000) + 1;
      var transId = 'T991605540U' + countnum;

      var option = {
        method: 'get',
        url: 'https://testapi.openbanking.or.kr/v2.0/account/balance/fin_num',
        headers: {
          Authorization: 'Bearer ' + result[0].accesstoken
        },
        qs: {
          bank_tran_id: transId,
          fintech_use_num: finusenum,
          tran_dtime: '20200108145630'
        }
      };
      request(option, function(error, response, body) {
        console.log(body);
        var parseData = JSON.parse(body);
        res.json(parseData);
      });
    }
  });
});

app.post('/tran', auth, (req, res) => {
  var userData = req.decoded;
  var finusenum = req.body.fin_use_num;
  console.log(finusenum);

  var sql = 'SELECT * FROM user WHERE id = ?';
  connection.query(sql, [userData.userId], function(err, result) {
    if (err) {
      console.error(err);
      throw err;
    } else {
      console.log(result);

      var countnum = Math.floor(Math.random() * 1000000000) + 1;
      var transId = 'T991605540U' + countnum;

      var option = {
        method: 'get',
        url:
          'https://testapi.openbanking.or.kr/v2.0/account/transaction_list/fin_num',
        headers: {
          Authorization: 'Bearer ' + result[0].accesstoken
        },
        qs: {
          bank_tran_id: transId,
          fintech_use_num: finusenum,
          inquiry_type: 'A',
          inquiry_base: 'D',
          from_date: '20190101',
          to_date: '20190301',
          sort_order: 'D',
          tran_dtime: '20200108145630'
        }
      };
      request(option, function(error, response, body) {
        console.log(body);
        var parseData = JSON.parse(body);
        res.json(parseData);
      });
    }
  });
});

app.post('/withdrawQr', auth, (req, res) => {
  var userData = req.decoded.userId;
  var finusenum = req.body.fin_use_num;
  console.log('핀유저 넘버 : ' + finusenum);

  var sql = 'SELECT * FROM user WHERE id = ?';
  connection.query(sql, [userData], function(err, result) {
    if (err) {
      console.error(err);
      throw err;
    } else {
      console.log(result);

      var countnum = Math.floor(Math.random() * 1000000000) + 1;
      var transId = 'T991605540U' + countnum;

      var option = {
        method: 'post',
        url: 'https://testapi.openbanking.or.kr/v2.0/transfer/withdraw/fin_num',
        headers: {
          Authorization:
            'Bearer ' +
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiIxMTAwNzUyNTc0Iiwic2NvcGUiOlsiaW5xdWlyeSIsImxvZ2luIiwidHJhbnNmZXIiXSwiaXNzIjoiaHR0cHM6Ly93d3cub3BlbmJhbmtpbmcub3Iua3IiLCJleHAiOjE1ODYxNDUzNTcsImp0aSI6ImI5NDM1M2FjLTY1MTctNDU1OS1iYTQ3LTg0M2UxNGFlODUzNCJ9.sA0m8qOgDQPkv89W57EzL2O-RmwokglRuj1684bGBrc'
        },
        json: {
          bank_tran_id: transId,
          cntr_account_type: 'N',
          cntr_account_num: '1001672206',
          dps_print_content: '쇼핑몰환불',
          fintech_use_num: finusenum,
          wd_print_content: '오픈뱅킹출금',
          tran_amt: '1000',
          tran_dtime: '20200101101921',
          req_client_name: '홍길동',
          req_client_bank_code: '097',
          req_client_account_num: '1234567890',
          req_client_num: '1100752574',
          transfer_purpose: 'TR',
          sub_frnc_name: '하위가맹점',
          sub_frnc_num: '123456789012',
          sub_frnc_business_num: '1234567890',
          recv_client_name: '김보원',
          recv_client_bank_code: '097',
          recv_client_account_num: '123456789'
        }
      };
      request(option, function(error, response, body) {
        console.log(body);
        var resultObject = body;
        if (resultObject.rsp_code == 'A0000') {
          res.json(1);
        } else {
          res.json(resultObject.rsp_code);
        }
      });
    }
  });
});

app.listen(port);
console.log('Listening on port', port);
