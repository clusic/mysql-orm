const NPMMySQL =  require('mysql');
const Thread = require('./thread');
module.exports = class MySQLORM {
  constructor(options) {
    this.options = options;
    this.mode = 'pool';
    this.tables = {};
  }

  async connect() {
    if (this.options.connectionLimit && this.options.connectionLimit > 1) return this.dbo = NPMMySQL.createPool(this.options);
    delete this.options.connectionLimit;
    this.dbo = NPMMySQL.createConnection(this.options);
    await new Promise((resolve, reject) => {
      this.dbo.connect(err => {
        if (err) return reject(err);
        resolve();
      });
    });
    this.mode = 'single';
  }

  async getConnection() {
    return await new Promise((resolve, reject) => {
      this.dbo.getConnection((err, connection) => {
        if (err) return reject(err);
        resolve(connection);
      });
    });
  }

  async createTables() {
    let conn = null;
    if (this.mode === 'pool') {
      conn = await this.getConnection();
    } else {
      conn = this.dbo;
    }
    const tables = await new Promise((resolve, reject) => {
      conn.query("select table_name from information_schema.tables where table_schema=? and table_type='base table'", [this.options.database], (err, result) => {
        if (err) return reject(err);
        resolve(result.map(res => res.table_name));
      });
    });

    for (let i = 0; i < tables.length; i++) {
      this.tables[tables[i]] = await new Promise((resolve, reject) => {
        conn.query(
          `select 
            column_name, 
            column_default,
            is_nullable,
            data_type,
            character_maximum_length,
            column_type,
            column_key,
            extra,
            column_comment
          from information_schema.columns where table_schema=? and table_name=?`, [this.options.database, tables[i]], (err, result) => {
            if (err) return reject(err);
            const target = {};
            result.forEach(res => target[res.column_name] = res);
            resolve(target);
        });
      });
    }

    if (this.mode === 'pool') {
      conn.release();
    }
  }

  async disconnect() {
    return await new Promise(resolve => {
      this.dbo.end(err => {
        if (err) {
          try{ this.dbo.destroy(); } catch(e) {}
        }
        resolve();
      });
    });
  }

  thread() {
    return new Thread(this);
  }
}