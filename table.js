module.exports = class Table {
  constructor(thread, name, properties) {
    this.name = name;
    this.thread = thread;
    this.properties = properties;
    for (const i in properties) {
      if (properties[i].column_key === 'PRI') {
        this.primaryKey = properties[i].column_name;
        break;
      }
    }
  }

  async grep(data) {
    if (!Array.isArray(data)) data = [data];
    const inserts = [], updates = [];
    data.forEach(item => {
      if (item[this.primaryKey]) {
        const pk = item[this.primaryKey];
        delete item[this.primaryKey];
        updates.push([
          item,
          `??=?`,
          this.primaryKey,
          pk
        ]);
      } else {
        inserts.push(item);
      }
    });
    if (inserts.length) {
      await this.insert(inserts);
    }
    if (updates.length) {
      for (let i = 0; i < updates.length; i++) {
        await this.update(...updates[i]);
      }
    }
  }

  async insert(data) {
    return await this.thread.exec('INSERT INTO ?? SET ?', this.name, data);
  }

  async update(value, where, ...wheres) {
    let fields = [], values = [this.name];
    for (const key in value){
      fields.push('`' + key + '`=?');
      values.push(value[key]);
    }
    let sql = `UPDATE ?? SET ${fields.join(',')}`;
    if ( where ){
      sql += ' WHERE ' + where;
      values = values.concat(wheres);
    }
    return (await this.thread.exec(sql, ...values)).changedRows;
  }

  async delete(where, ...wheres){
    let sql = `DELETE FROM ??`, values = [this.name];
    if ( where ){
      sql += ' WHERE ' + where;
      values = values.concat(wheres);
    }
    return (await this.thread.exec(sql, ...values)).affectedRows;
  }

  async exec(columns, where, ...wheres) {
    let sql = `SELECT ?? FROM ??`, values = [columns, this.name];
    if ( where ){
      sql += ' WHERE ' + where;
      values = values.concat(wheres);
    }
    return await this.thread.exec(sql, ...values);
  }
}