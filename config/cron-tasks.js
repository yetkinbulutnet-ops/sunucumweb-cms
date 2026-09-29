'use strict';

module.exports = {
  otomatikBlog: {
    task: () => require('../src/yardimci/otoblog').zamanlayici(),
    options: { rule: '7 * * * *', tz: 'Europe/Istanbul' },
  },
};
