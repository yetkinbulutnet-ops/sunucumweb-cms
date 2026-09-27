module.exports = ({ env }) => {
  const medya = env('STORAGE_URL', 'https://storage.sunucumweb.com');
  return [
    'global::noindex',
    'strapi::logger',
    'strapi::errors',
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'connect-src': ["'self'", 'https:'],
            'script-src': ["'self'", 'https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/'],
            'frame-src': ["'self'", 'https://www.google.com/recaptcha/', 'https://recaptcha.google.com/recaptcha/'],
            'img-src': ["'self'", 'data:', 'blob:', medya, 'https://www.gstatic.com/recaptcha/'],
            'media-src': ["'self'", 'data:', 'blob:', medya],
            upgradeInsecureRequests: null,
          },
        },
      },
    },
    {
      name: 'strapi::cors',
      config: {
        origin: env.array('CORS_ORIGINS', ['https://sunucumweb.com', 'http://localhost:3000']),
      },
    },
    'strapi::query',
    'strapi::body',
    'global::guvenlik',
    'global::panel',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};
