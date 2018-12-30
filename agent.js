const MySQL = require('./index');
module.exports = async (app, plugin) => {
  let config = plugin.config;
  if (!config) throw new Error('@clusic/mysql need configs');
  if (!Array.isArray(config)) config = [config];
  
  for (let i = 0; i < config.length; i++) {
    const item = config[i];
    item.connectionLimit = 1;
    const Mysql = new MySQL(item);
    await Mysql.connect();
    await Mysql.createTables();
    app.bind('stop', async () => await Mysql.disconnect());
    app[item.database] = Mysql.thread();
  }
};