# @clusic / mysql-orm

mysql数据库操作类

## Install

```shell
# common use
npm i @clusic/mysql-orm

# or use in clusic/rex
clusic add @clusic/mysql-orm --plugin
```

## Usage

```javascript
const MySQL = require('@clusic/mysql-orm');
const mysql = new MySQL(options);
const ctx = mysql.thread();
await ctx.begin();
await ctx.exec(sql, ...conditions);
await ctx.commit();
await ctx.rollback();
await ctx[table_name].grep(data);
await ctx[table_name].insert(data);
await ctx[table_name].update(data, where, ...wheres);
await ctx[table_name].delete(where, ...wheres);
await ctx[table_name].exec(columns, where, wheres);
ctx.release();
```

## Events

- beforeBegin 事务开启前
- begin 事务开启后
- beforeCommit 提交前
- commit 提交后
- beforeRollback 回滚前
- rollback 回滚后
- beforeExec 执行SQL语句前
- exec 执行SQL语句后

```javascript
mysql.on('begin', (sql, ...args) => console.log('事务开始了'));
mysql.on('exec', (res) => console.log(res));
```

## Use in Clusic

在worker中，ctx上会存在一个你在配置[database]属性名的对象，指向当前mysql操作对象。

```javascript
await ctx[database].begin();
await ctx[database].commit();
```

在agent中，全局app[database]指向对应的操作对象。

```javascript
app.feed(name, async () => {
  await app.mysql.begin();
  await app.mysql.commit();
})
```