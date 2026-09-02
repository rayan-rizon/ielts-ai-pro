export default {
  plugins: {
    '@tailwindcss/postcss': {},
    cssnano: {
      preset: [
        'default',
        {
          discardComments: {
            removeAll: true,
          },
          reduceIdents: false, // Don't mangle animation names
        },
      ],
    },
  },
};
