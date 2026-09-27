const { sifreSifirlamaSablonu } = require('../src/guvenlik/sablon');

module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    sessions: {
      idleSessionLifespan: 2 * 60 * 60,
      maxSessionLifespan: 12 * 60 * 60,
      idleRefreshTokenLifespan: 7 * 24 * 60 * 60,
      maxRefreshTokenLifespan: 30 * 24 * 60 * 60,
    },
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    remote: {
      enabled: false,
    },
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  ai: {
    enabled: false,
  },
  forgotPassword: {
    from: env('MAIL_FROM', 'SunucumWEB Admin <sunucumweb@yetkinbulut.net>'),
    replyTo: env('MAIL_REPLY_TO', 'sunucumweb@yetkinbulut.net'),
    emailTemplate: sifreSifirlamaSablonu(),
    expiresIn: '30m',
  },
  flags: {
    nps: false,
    promoteEE: false,
    docLinks: false,
  },
});
