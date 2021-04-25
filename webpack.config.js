const path = require('path');
const paths = require("./paths");

const HTMLWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const isDev = process.env.NODE_ENV === 'development';
const CopyWebpackPlugin = require('copy-webpack-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const ImageminPlugin = require("imagemin-webpack");

const filename = (ext) => isDev ? `[name].${ext}` : `[name].[contenthash].${ext}`;
let temp = process.env.NODE_PATH
const optimization = () => {
    const configObj = {
        splitChunks: {
            chunks: 'all'
        }
    }//это разбивает файлы на чанки

    if (!isDev) {
        configObj.minimizer = [
            new OptimizeCssAssetsWebpackPlugin(),
            new TerserWebpackPlugin()
        ];
    }//это оптимизация в готовой сборке под продакшн

    return configObj;//мы можем передавать опции или плагины в webpack из функций
};

const plugins = () => {
    const basePlugins = [
        new HTMLWebpackPlugin({
            template: path.resolve(__dirname, 'src/index.html'),
            filename: 'index.html',
            minify: {
                collapseWhitespace: !isDev//убирает пробелы
            }
        }),
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: `./css/${filename('css')}`
        }),
        new CopyWebpackPlugin({
            patterns: [
                {from: path.resolve(__dirname, 'src/assets'), to: path.resolve(__dirname, 'app')}//тут мы можем перемещать файлы важно что бы папка откуда берем файлы не была пуста
            ]
        })
    ];
    if (!isDev) {
        basePlugins.push(
            new ImageminPlugin({
                bail: false, // Ignore errors on corrupted images
                cache: true,
                imageminOptions: {
                    // Before using imagemin plugins make sure you have added them in `package.json` (`devDependencies`) and installed them

                    // Lossless optimization with custom option
                    // Feel free to experiment with options for better result for you
                    plugins: [
                        ["gifsicle", {interlaced: true}],
                        ["jpegtran", {progressive: true}],
                        ["optipng", {optimizationLevel: 5}],
                        [
                            "svgo",
                            {
                                plugins: [
                                    {
                                        removeViewBox: false
                                    }
                                ]
                            }
                        ]
                    ]
                }
            })
        )
    }
    return basePlugins

}

module.exports = {
    context: path.resolve(__dirname, 'src'),//задаем стандартный путь src
    mode: 'development',
    entry: './js/main.js',
    output: {
        filename: `./js/${filename('js')}`,
        path: path.resolve(__dirname, 'app'),
        publicPath: ''
    },
    devServer: {
        historyApiFallback: true,
        contentBase: path.resolve(__dirname, 'app'),
        open: true,
        compress: true,
        overlay: true,
        hot: true,
        port: 3000
    },
    optimization: optimization(),
    plugins: plugins(),
    devtool: isDev ? 'source-map' : false,
    resolve: {//настройка для того что бы не писать относительные пути
        modules: ['node_modules', paths.appNodeModules, path.resolve('./src')]
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                loader: 'html-loader'//настройка что бы в hot-reload попадали html файлы
            },
            {
                test: /\.css$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: isDev
                        }
                    },
                    'css-loader'
                ]
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: (resourcePath, context) => {//эта опция нужна что бы указывать background-image в scss если не указать путь будет не верный
                                return path.relative(path.dirname(resourcePath), context) + '/';
                            }
                        }
                    },
                    'css-loader',//потом обычный css-loader перегонят в стили
                    'sass-loader'//тут сначала вызывается sass-loader и загружает наши стили
                ]
            },
            {
                test: /\.(?:|gif|png|jpg|jpeg|svg)$/i,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: `./img/${filename('[ext]')}`//это файл лоадер тут в настройках я указал какую папку создавать и как файлы называть
                    }
                }]
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,//то что не включать в итоговую сборку то есть он не будет искать js файлы в node_modules
                use: ['babel-loader']//этот модуль комппилирует наш es6 код в es5 это проиходит даже в dev моде
            },
            {
                test: /\.(?:|wof2)$/i,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: `./fonts/${filename('[ext]')}`//это файл лоадер тут в настройках я указал какую папку создавать и как файлы называть
                    }
                }]
            },
        ]
    }
}