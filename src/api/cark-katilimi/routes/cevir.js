'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/cark/cevir',
      handler: 'cevir.cevir',
      config: { auth: false, policies: [] },
    },
  ],
};
