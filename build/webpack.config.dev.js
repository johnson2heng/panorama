const config = require("./config");

module.exports = {
    entry: config.mainJs, //已多次提及的唯一入口文件
    output: {
        path: config.path, //打包后的文件存放的地方
        filename: config.jsPath //打包后输出文件的文件名
    },

    //以下是服务环境配置
    devServer: {
        contentBase: config.server,//本地服务器所加载的页面所在的目录
        inline: true, //实时刷新
        host: "192.168.1.105"
    },

    module: {
        rules:[
            {
                test: /(\.jsx|\.js)$/,
                use: {
                    loader: "babel-loader"
                },
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use:[
                    {
                        loader: "style-loader"
                    },
                    {
                        loader: "css-loader"
                    },
                    {
                        loader: 'postcss-loader'
                    }
                ]
            },
            {
                test: /\.less$/,
                use:[
                    {
                        loader: "style-loader"
                    },
                    {
                        loader: "css-loader"
                    },
                    {
                        loader: 'postcss-loader'
                    },
                    {
                        loader: "less-loader"
                    }
                ]
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: config.limit,
                        name: config.filePath
                    }
                }
            },
            {
                test: /\.(eot|woff|ttf|woff2)(\?|$)/,
                use: {
                    loader: 'file-loader',
                    options: {
                        limit: config.limit,
                        name: config.filePath
                    }
                }
            }
        ]
    }
};