'use strict'

var webpack = require('webpack');

module.exports = {
    context: __dirname,
    entry: [
        __dirname + '/main.js',
    ],
    stats: {
        colors: true,
        reasons: true
    },
    module: {
        loaders: [
            {
                test: /\.coffee$/,
                loaders: [
                    'coffee-loader',
                    'source-map-loader',
                ]
            },
        ]
    },
    output: {
        path: __dirname + '/build/',
        filename: "litegl.js",
        library: "litegl"
    },
    devtool: 'inline-source-map',
    plugins: [
    ],
    resolve: {
        extensions: ["", ".webpack.js", ".web.js", ".js"]
    },
}
