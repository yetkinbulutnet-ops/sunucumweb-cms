'use strict';

module.exports = {
  routes: [{ method: 'POST', path: '/iletisim-mesaji/yeni', handler: 'yeni.yeni', config: { auth: false, policies: [] } }],
};
