const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  publicPath:
    process.env.NODE_ENV === "production" ? "/typing-converter/" : "/",

  outputDir: "../docs",
  transpileDependencies: true,
  lintOnSave: false,

  pluginOptions: {
    vuetify: {
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
    },
  },
});
