const Table = require('./table');
const getConnection = Symbol('mysql:thread:getConnection');
module.exports = class Thread {
  constructor(mysql, getConnection) {
    this.conn = null;
    this.lifes = {};
    this.mysql = mysql;
    this[getConnection] = getConnection;
    this.init();
  }

  on(name, callback) {
    if (!this.lifes[name]) this.lifes[name] = [];
    this.lifes[name].push(callback);
    return this;
  }
  
  async emit(name, ...args) {
    if (this.lifes[name]) {
      const life = this.lifes[name];
      for (let i = 0; i < life.length; i++) {
        await life[i](...args);
      }
    }
  }

  init() {
    for (const table in this.mysql.tables) {
      this[table] = new Table(this, table, this.mysql.tables[table]);
    }
  }

  async exec(sql, ...args) {
    await this.getConn();
    await this.emit('beforeExec', sql, ...args);
    const res = await new Promise((resolve, reject) => {
      this.conn.query(sql, args, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
    await this.emit('exec', res);
    return res;
  }

  async getConn() {
    if (this.conn) return this.conn;
    return this.conn = await this[getConnection]();
  }

  release() {
    if (this.mysql.mode = 'pool' && this.conn) {
      this.conn.release();
    }
    this.conn = null;
  }

  async begin() {
    await this.getConn();
    await this.emit('beforeBegin');
    await new Promise((resolve, reject) => {
      this.conn.beginTransaction(err => {
        if (err) return reject(err);
        resolve();
      })
    });
    await this.emit('begin');
  }

  async commit() {
    if (!this.conn) return;
    await this.emit('beforeCommit');
    await new Promise((resolve, reject) => {
      this.conn.commit(err => {
        if (err) return reject(err);
        resolve();
      })
    });
    this.release();
    await this.emit('commit');
  }

  async rollback() {
    if (!this.conn) return;
    await this.emit('beforeRollback');
    await new Promise((resolve, reject) => {
      this.conn.rollback(err => {
        if (err) return reject(err);
        resolve();
      })
    });
    this.release();
    await this.emit('rollback');
  }
}