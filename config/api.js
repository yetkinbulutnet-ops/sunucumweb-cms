module.exports = {
  rest: {
    prefix: '/api/v1',
    defaultLimit: 25,
    maxLimit: 100,
    withCount: true,
    strictParams: true,
  },
  documents: {
    strictParams: true,
    strictRelations: true,
  },
};
