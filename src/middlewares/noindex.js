module.exports = () => async (ctx, next) => {
  await next();
  ctx.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
};
