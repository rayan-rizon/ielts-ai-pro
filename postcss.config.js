export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    cssnano: {
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
        reduceIdents: false, // Don't mangle animation names
      }],
    },
  },
};
