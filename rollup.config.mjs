import terser from '@rollup/plugin-terser';

export default [
  // Unminified builds (ESM + UMD)
  {
    input: 'src/slider.js',
    output: [
      {
        file: 'dist/product-card-slider.esm.js',
        format: 'esm',
      },
      {
        file: 'dist/product-card-slider.umd.js',
        format: 'umd',
        name: 'ProductCardSlider',
        exports: 'default',
      },
    ],
  },
  // Minified builds (ESM + UMD)
  {
    input: 'src/slider.js',
    output: [
      {
        file: 'dist/product-card-slider.esm.min.js',
        format: 'esm',
      },
      {
        file: 'dist/product-card-slider.umd.min.js',
        format: 'umd',
        name: 'ProductCardSlider',
        exports: 'default',
      },
    ],
    plugins: [terser({
      maxWorkers: 1,
      format: { comments: false },
      compress: { passes: 2 },
    })],
  },
];
