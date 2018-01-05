const path = require('path');
module.exports = {
    //设置唯一的入口文件
    mainJs: "./app/main.js",
    //服务开启的根目录
    server: "./public",
    //打包后输出的文件夹
    path: path.resolve(__dirname, "../public"),
    //输出的js文件的文件路径
    jsPath:"js/index.js",
    //输出的css文件的文件路径
    cssPath:"css/index.css",
    //输出的图片等文件的路径配置
    filePath:"./images/[name].[hash:7].[ext]",
    //设置文件转换成base64格式的大小
    limit:10000
};