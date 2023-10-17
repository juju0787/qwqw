const express = require('express');
const app = express();
const mysql = require('mysql');
const cors = require('cors');
const PORT = 4000;
const bodyParser = require('body-parser');
const { readSync } = require('fs');
const db = mysql.createPool({
    host: "realajaez.c5e0jhimhqta.ap-southeast-2.rds.amazonaws.com",
    user: "user",
    password: "mymyajaez",
    database: "ajaez"
})
db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection error: " + err.message);
        // 여기에서 오류 처리 로직을 추가합니다.
    } else {
        // 연결이 성공한 경우, connection을 사용하여 쿼리를 실행하거나 다른 작업을 수행합니다.
        console.log('연결성공')
    }
});
app.use(cors());
app.use(bodyParser.json()); // JSON 바디 파싱을 위한 설정
app.get('/GetPopularPost', (req, res) => {
    console.log('옴')
    const sqlquery = 'SELECT * FROM post ORDER BY heart DESC';
    db.query(sqlquery, (err, result) => {
        if (err) {
            console.error(err)
            res.send(false);
        }
        else {
            console.log('get success');
            res.send(result);
        }
    })
})
app.get('/GetRecentPost', (req, res) => {
    console.log('옴')
    const sqlquery = 'SELECT * FROM post';
    db.query(sqlquery, (err, result) => {
        if (err) {
            console.error(err)
            res.send(false);
        }
        else {
            console.log('get success');
            res.send(result);
        }
    })
})
app.get('/GetNick',(req,res)=>{
    const {nickname} = req.query;
    const sqlquery = `SELECT * FROM user WHERE nickname = '${nickname}';`
    db.query(sqlquery,(err,result)=>{
        if(err){
            console.error(err);
            res.send(false)
        }
        else{
            console.log(result)
            if(result.length <= 0){
            db.query('INSERT INTO post (nickname) VALUES (?)',[nickname],(err,result)=>{
                if(err){
                    console.error(err)
                }
                else{
                    res.send(true)
                }
            })
        }
        else{
            res.send(false)
        }
        }
    })
})
app.post('/Upload', (req, res) => {
    const date = new Date()
    const mon = date.getMonth() + 1;
    const day = date.getDate();
    console.log(mon + '/' + day)
    const now = mon + '/' + day
    console.log(now)
    const { nickname, title, detail, random } = req.body
    const sqlquery = `INSERT INTO post (nickname,title,detail,time,heart,random,comments) VALUES (?,?,?,?,0,?,'[]')`
    db.query(sqlquery, [nickname, title, detail, now, random], (err, result) => {
        if (err) {
            console.error(err);
            res.send(false);
        }
        else {
            console.log('succed save!');
            res.send(true)
        }
    })
})
app.post('/ChangLike', (req, res) => {
    const { bool, title, random } = req.body
    console.log(title, random, bool)
    let sqlquery;
    if (bool) {
        sqlquery = "UPDATE post SET heart = heart + 1 WHERE title = ? AND random = ?";
    }
    else {
        sqlquery = "UPDATE post SET heart = heart - 1 WHERE title = ? AND random = ?";
    }
    db.query(sqlquery, [title, random], (err, result) => {
        if (err) {
            res.send(false);
            console.log(err)
        }
        else {
            res.send(true);
            console.log(result)
            console.log('성공')
        }
    })
})
app.get('/GetAnswer', (req, res) => {
    const { title, random } = req.query;
    const sqlquery = "SELECT * from post WHERE title = ? AND random = ?"
    db.query(sqlquery, [title, random], (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(result);
            res.send(result);
        }
    })
})
app.get('/getMyPosts', (req, res) => {
    const { nickname } = req.query;
    const sqlquery = "SELECT * FROM post WHERE nickname = ?"
    db.query(sqlquery, [nickname], (err, result) => {
        if (err) {
            console.error(err)
        }
        else {
            if (result == undefined) {
                res.send(false)
                console.log('dd', result)
            }
            else {
                res.send(result.reverse());
                console.log(result);
            }


        }
    })
})
app.get('/GetLikePosts', async (req, res) => {
    const { likeList } = req.query;
    console.log('l;ike',likeList);
    if(likeList !== undefined){
    let dataArr = [];
        try {
            for (let i = 0; i < likeList.length; i++) {
                const sqlquery = `SELECT * FROM post WHERE title = "${likeList[i].title}" AND random = "${likeList[i].random}"`;
                const result = await new Promise((resolve, reject) => {
                    db.query(sqlquery, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
                dataArr.push(result);
                console.log(result.flat());
            }
            console.log('dddddddddddd', dataArr);
            res.send(dataArr);
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    }
    else{
        console.log('undefind')
        res.send(false)
    }
    
});
app.post('/Comment', (req, res) => {
    const { comment, title, random } = req.body;
    console.log(req.body);
    const date = new Date()
    const mon = date.getMonth() + 1;
    const day = date.getDate();
    console.log(mon + '/' + day)
    const now = mon + '/' + day
    const ob = { detail: comment, time: now }
    // 변경된 부분: SQL 쿼리 수정
    const sqlquery = `UPDATE post SET comments = JSON_ARRAY_INSERT(comments, '$[0]', ?) WHERE title = ? AND random = ?`;
    db.query(sqlquery, [JSON.stringify(ob), title, random], (err, result) => {
        if (err) {
            console.error(err);
            res.send(false);
        } else {
            console.log(result);
            res.send(true);
        }
    });
});

app.listen(PORT, () => {
    console.log(`running on port ${PORT}`);
});
