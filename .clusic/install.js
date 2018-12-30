module.exports = () => {
  return {
    contextName: 'mysql',
    options: {
      host: '127.0.0.1',
      user: 'user',
      password: 'password',
      database: 'database',
      connectionLimit: 10,
      port: 389
    }
  }
};