var http = require('http');
var url = require('url');
var fs = require('fs');
var querystring = require('querystring');


//数据库引入
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'ajaxtest'
});
connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected as id ' + connection.threadId);
});
connection.query("SELECT * FROM admin", function (error, result) {
    console.log(result);
})

//引入cookie
var cookie = require("cookie");

//主要代码内容
var app = http.createServer(function (req, res) {
    // res.write('服务器开通成功');
    // res.end();
    var url_obj = url.parse(req.url);
    // if(url_obj.pathname === '/'){
    //     render("./template/index-bak.html",res);
    // }
    // if(url_obj.pathname === '/login'){
    //     render("./template/login-bak.html",res);
    // }

   //前端浏览器主页请求
    if (url_obj.pathname === '/') {
        render("./template/index.html", res);
        return;  //若满足了，阻止下面代码执行进行渲染
    }


    //用户注册功能逻辑
    //通过register.html里的ajax接收到数据；处理判断后返回给register.html里的ajax的xhr.responseText
    if (url_obj.pathname === "/register" && req.method === "POST") {
        var user_info = "";
        req.on("data", function (chunk) {
            user_info += chunk;
        });
        req.on("end", function (err) {
            if (!err) {
                var user_obj = querystring.parse(user_info);
                res.setHeader("content-type", "text/html;charset=utf-8");  //发送过去用utf-8编译
                //漏填写判断
                if (user_obj.username === '' || user_obj.password === '') {
                    res.write('{"status":1, "message":"用户名或者密码不能为空"}', 'utf-8');
                    res.end();
                    return;
                }
                //前后密码不一致
                if (user_obj.password !== user_obj.repassword) {
                    res.write('{"status":1, "message":"请再确认两次密码是否输入一致"}', 'utf-8');
                    res.end();
                    return;
                }
                //注册成功后把信息记录在数据库中
                var sql = 'INSERT INTO admin(username,password) VALUE("' + user_obj.username + '","' + user_obj.password + '")'
                connection.query(sql, function (error, result) {
                    // console.log(result);
                    //如果error里没有错误，result被定义且不为空，则向前端发送注册成功
                    if (!error && result && result.length !== 0) {
                        res.write('{"status":0, "message":"注册成功"}', 'utf-8');
                        res.end();
                        return;
                    }
                })
            }
        })
    }


    //用户登录功能逻辑
    if (url_obj.pathname === "/login" && req.method === "POST") {
        var user_info = "";
        req.on("data", function (chunk) {
            // console.log(chunk);
            user_info += chunk;
        })
        res.setHeader("content-type", "text/html;charset=utf-8");  //发送过去用utf-8编译
        req.on("end", function (err) {
            var user_obj = querystring.parse(user_info);
            if (!err) {
                // console.log(user_info);
                var user_obj = querystring.parse(user_info);
                var sql = "SELECT * FROM admin WHERE username='" + user_obj.username + "'AND password='" + user_obj.password + "'"
                connection.query(sql, function (error, result) {
                    // console.log(error,result);  测试
                    if (!error && result && result.length !== 0) {
                        //发送一个cookie
                        res.setHeader('Set-Cookie', cookie.serialize('isLogin', "true"));
                        res.write('{"status":0, "message":"登录成功"}', 'utf-8');
                        res.end();
                    } else {
                        res.write('{"status":1, "message":"用户名或者密码错误"}', 'utf-8');
                        res.end();
                    }
                })
            }
        })
        return;
    }

    //管理系统页面获取表格数据
    if (url_obj.pathname === "/list" && req.method === "GET") {
        // console.log("收到发送");
        var sql = "SELECT * FROM user";
        connection.query(sql, function (error, result) {
            // console.log(error,result);  测试
            if (!error && result) {
                // console.log(result);
                //result返回的表格为数组对象，需转成字符串
                var arrstr = JSON.stringify(result);
                res.setHeader("content-type", "text/html;charset=utf-8");  //发送过去用utf-8编译
                res.write('{"status":0, "data":' + arrstr + '}', 'utf-8');
                res.end();
            }
        });
        return;
    }

    //添加用户逻辑
    if (url_obj.pathname === "/adduser" && req.method === "POST") {
        var user_info = "";
        req.on("data", function (chunk) {
            user_info += chunk;
        });
        res.setHeader("content-type", "text/html;charset=utf-8");  //发送过去用utf-8编译
        req.on("end", function (err) {
            var user_obj = querystring.parse(user_info);
            if (!err) {
                var sql = 'INSERT INTO user VALUE(' + null + ',"' + user_obj.username + '","' + user_obj.total + '","' + user_obj.fixed + '","' + user_obj.current + '")';
                connection.query(sql, function (error, result) {
                    if (!error && result && result.length !== 0) {
                        res.write('{"status":0, "message":"添加成功"}', 'utf-8');
                        res.end();
                    } else {
                        res.write('{"status":1, "message":"添加失败"}', 'utf-8');
                        res.end();
                    }
                })
            }
        })
        return;
    }

    //添加用户里的用户信息保存
    if (url_obj.pathname === "/update" && req.method === "POST") {
        // res.write('{"status":0, "message":"后台测试接收成功"}', 'utf-8');
        // res.end();
        var user_info = "";
        req.on("data", function (chunk) {
            user_info += chunk;
        });
        req.on("end", function (error) {
            if (!error) {
                var user_obj = querystring.parse(user_info);
                // console.log(user_obj);  //发现id为字符串类型
                var sql = 'UPDATE user SET username="' + user_obj.username + '",total_assets="' + user_obj.total + '",fixed_assets="' + user_obj.fixed + '",current_assets="' + user_obj.current + '" WHERE id=' + Number(user_obj.id);
                connection.query(sql, function (error, result) {
                    res.setHeader('content-type', 'text/html;charset=utf-8');
                    if (!error && result && result.length !== 0) {
                        res.write('{"status":0, "message":"编辑成功"}', 'utf-8');
                        res.end();
                    } else {
                        res.write('{"status":1, "message":"编辑失败"}', 'utf-8');
                        res.end();
                    }
                })
            }
        })
        return;
    }

    //点击删除用户业务
    if (url_obj.pathname === "/delete" && req.method === "POST") {
        var user_info = "";
        req.on("data", function (chunk) {
            user_info += chunk
        })
        req.on("end", function (error) {
            if (!error) {
                var user_obj = querystring.parse(user_info);
                var sql = "DELETE FROM user WHERE id=" + Number(user_obj.id);
                connection.query(sql, function (error, result) {
                    res.setHeader('content-type', 'text/html;charset=utf-8');
                    if (!error && result && result.length !== 0) {
                        res.write('{"status":0, "message":"删除成功"}', 'utf-8');
                        res.end();
                    } else {
                        res.write('{"status":1, "message":"删除失败"}', 'utf-8');
                        res.end();
                    }
                })
            }
        })
    }


    // 获取和设置cookie
    // if(url_obj.pathname === "/getcookie"){
    //         console.log(req.headers.cookie)
    //         var cookie_obj = cookie.parse(req.headers.cookie)
    //         console.log(cookie_obj);
    //     }
    //     if(url_obj.pathname === "/setcookie"){
    //         res.setHeader('Set-Cookie', cookie.serialize('sfsd', "true"));
    //         res.end();
    //     }
    // 返回admin.html的时候做验证
    if (url_obj.pathname === "/admin.html") {
        //    获取到cookie 如果有对应到登录标识 就返回admin.html页面 如果没有就返回错误页面
        if (cookie.parse(req.headers.cookie || '').isLogin === "true") {
            render("./template/admin.html", res);
            // console.log("接收到coolie")
        } else {
            render("./template/error.html", res);
            // console.log("接收失败")
        }
        return;
    }
    // if(url_obj.pathname	===	"/admin.html"	&&	req.method	===	"GET"){
    //     var	cookie_obj	=	cookie.parse(req.headers.cookie	||	'')
    //     if(cookie_obj.isLogin	===	"true"){
    //         render("./template/admin.html",	res);
    //     }else	{
    //         render('./template/error.html',	res);
    //     }
    // return;
    // }

    //前端其他页面请求
    render("./template" + url_obj.pathname, res);


    //退出系统
    if (url_obj.pathname === "/logout") {
        res.setHeader('Set-Cookie', cookie.serialize('isLogin', ""));
        render("./template/index.html", res)
        return;
    }

})

//render 前端网页请求的封装（必须有res)
function render(path, res) {
    fs.readFile(path, 'binary', function (err, data) {
        if (!err) {
            res.write(data, 'binary');
            res.end();
        }
    })
}

//端口代码
app.listen(5000, function (err) {
    if (!err) {
        console.log("5000端口正常开通");
    }
})