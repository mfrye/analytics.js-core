var path = require('path');
var webpack = require('webpack');
var ComponentPlugin = require("component-webpack-plugin");

var plugins = [];

const DEBUG = process.env.NODE_ENV != 'production';
const VERBOSE = true;


if (process.env.NODE_ENV == 'production') {
  plugins = [
    // new webpack.ResolverPlugin(
    //   new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin("bower.json", ["main"])
    // ),
    //new ComponentPlugin({},["components"]),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({compress: {warnings: true}}),
    new webpack.optimize.AggressiveMergingPlugin()
  ]
}

module.exports = {

  cache: DEBUG,
  debug: DEBUG,

  stats: {
    colors: true,
    reasons: DEBUG,
    hash: VERBOSE,
    version: VERBOSE,
    timings: true,
    chunks: VERBOSE,
    chunkModules: VERBOSE,
    cached: VERBOSE,
    cachedAssets: VERBOSE
  },


    entry: [ './src/index.js'],
    output: {
      publicPath: '/',
      sourcePrefix: '  ',
      path: __dirname,
      filename: DEBUG ? 'analytics.js' : 'analytics.min.js'
    },
    // module: {
    //     loaders: [
    //         {
    //           test: path.join(__dirname, 'src'),
    //           loader: 'babel-loader'
    //         }
    //     ]
    // },
    // resolve: {
    //   modulesDirectories: ["web_modules", 'node_modules', 'components'],
    //   extensions: [ '', '.js', '.css' ]
    // },
    resolve: {
      extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx'],
      // alias: {
      //     "react": __dirname + '/../node_modules/react',
      //     "react/addons": __dirname + '/../node_modules/react/addons',
      // }
    },
    plugins: plugins
};
