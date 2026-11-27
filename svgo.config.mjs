// SVGO config for public/illustrations (docs/ILLUSTRATION-SYSTEM.md).
// Keeps everything CSS needs to animate: ids, classes, basic shapes (cx/cy/r stay animatable)
// and separate paths (mergePaths would fuse two `.stamp-slot` paths into one).
export default {
  multipass: true,
  floatPrecision: 2,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,
          mergePaths: false,
          convertShapeToPath: false,
          collapseGroups: false,
          moveElemsAttrsToGroup: false,
          moveGroupAttrsToElems: false,
          inlineStyles: false,
          // Never emit colour names: the palette test compares hex values.
          convertColors: { shortname: false },
        },
      },
    },
    'removeDimensions',
    'removeXlink',
    'removeRasterImages',
    'removeScripts',
  ],
};
