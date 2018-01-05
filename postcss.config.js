module.exports = {
    plugins: [
        require('autoprefixer')({
            browsers: ['last 5 version',"> 1%"] //前五种浏览器版本
        })
    ]
};