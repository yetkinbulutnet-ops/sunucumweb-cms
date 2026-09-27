module.exports = ({ env }) => ({
  host: env('HOST', '127.0.0.1'),
  port: env.int('PORT', 3654),
  url: env('PUBLIC_URL', 'https://cms.sunucumweb.com'),
  proxy: { koa: true },
  logger: { updates: { enabled: false } },
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
