const izinliTurler = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const yasakliTurler = [
  'image/svg+xml',
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

module.exports = ({ env }) => ({
  i18n: { enabled: false },
  'content-releases': { enabled: false },
  'review-workflows': { enabled: false },
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST'),
        port: env.int('SMTP_PORT', 587),
        secure: false,
        requireTLS: true,
        auth: {
          user: env('SMTP_USER'),
          pass: env('SMTP_PASS'),
        },
      },
      settings: {
        defaultFrom: env('MAIL_FROM', 'SunucumWEB Admin <sunucumweb@yetkinbulut.net>'),
        defaultReplyTo: env('MAIL_REPLY_TO', 'sunucumweb@yetkinbulut.net'),
      },
    },
  },
  upload: {
    config: {
      provider: 'strapi-provider-upload-swb',
      providerOptions: {
        kok: env('STORAGE_ROOT', '/home/sunucumweb-storage/htdocs/storage.sunucumweb.com'),
        taban: env('STORAGE_URL', 'https://storage.sunucumweb.com'),
        kalite: env.int('WEBP_QUALITY', 82),
        sizeLimit: env.int('UPLOAD_SIZE_LIMIT', 50 * 1024 * 1024),
      },
      sizeLimit: env.int('UPLOAD_SIZE_LIMIT', 50 * 1024 * 1024),
      security: {
        allowedTypes: izinliTurler,
        deniedTypes: yasakliTurler,
      },
    },
  },
});
