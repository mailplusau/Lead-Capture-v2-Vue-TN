const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')

module.exports = {
  lintOnSave: false,
  css: {
    extract: false,
  },
  configureWebpack: {
    optimization: {
      splitChunks: false // makes there only be 1 js file - leftover from earlier attempts but doesn't hurt
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'mp_cl_lead_capture_tn_v2.html',
        template: 'public/index.html',  //template file to embed the source
        inlineSource: '.(js|css)$' // embed all javascript and css inline
      }),
      new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin)
    ]
  }
}