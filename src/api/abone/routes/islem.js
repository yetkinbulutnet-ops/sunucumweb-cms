'use strict';

module.exports = {
  routes: [
    { method: 'POST', path: '/abone/kayit', handler: 'islem.kayit', config: { auth: false, policies: [] } },
    { method: 'POST', path: '/abone/islem', handler: 'islem.islem', config: { auth: false, policies: [] } },
  ],
};
