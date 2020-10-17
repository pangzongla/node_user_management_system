var mysql = require('mysql');
//创建一个连接的到一个对象
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database: 'ajaxtest'
});
//连接数据库
connection.connect(function(err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('connected as id ' + connection.threadId);
});
//执行查询操作  把查询命令发送出去
//错误信息会返回给第一个参数 第二个参数是返回的结果(只写一个就只有null了）
//这个result是你查询数据库的时候返回的内容，有返回证明数据库那边ok
connection.query("SELECT * FROM admin", function (error,result) {
    console.log(result);
})