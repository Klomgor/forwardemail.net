/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const _ = require('#helpers/lodash');

const combineErrors = require('#helpers/combine-errors');
const env = require('#config/env');
const logger = require('#helpers/logger');

// https://www.sqlite.org/pragma.html#pragma_table_list
function hasFTS5Already(db, table) {
  // [
  //   {
  //     schema: 'main',
  //     name: 'Messages',
  //     type: 'table',
  //     ncol: 33,
  //     wr: 0,
  //     strict: 0
  //   },
  //   {
  //     schema: 'main',
  //     name: 'Messages_fts',
  //     type: 'virtual',
  //     ncol: 4,
  //     wr: 0,
  //     strict: 0
  //   },
  //   ...
  // ]
  const tables = db.pragma(`table_list(${table}_fts)`);
  return tables.length > 0;
}

//
// Check if a table exists using sqlite_master (synchronous).
//
function hasTableDirect(db, table) {
  const row = db
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
    .get(table);
  return Boolean(row);
}

//
// Get column info for a table using PRAGMA queries (synchronous).
// Returns column metadata in the same shape used by the schema migration loop.
//
function getColumnInfoDirect(db, table) {
  const columns = db.pragma(`table_xinfo(${table})`);
  const foreignKeys = db.pragma(`foreign_key_list(${table})`);
  const indexes = db.pragma(`index_list(${table})`);

  // Check for AUTOINCREMENT in CREATE TABLE statement
  const createSql = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?")
    .get(table);
  const hasAutoIncrement =
    createSql &&
    createSql.sql &&
    createSql.sql.toUpperCase().includes('AUTOINCREMENT');

  // Build index->column mapping for is_unique
  const uniqueColumns = new Set();
  for (const idx of indexes) {
    if (idx.unique) {
      const idxInfo = db.pragma(`index_info(${idx.name})`);
      for (const col of idxInfo) {
        uniqueColumns.add(col.name);
      }
    }
  }

  // Build foreign key mapping
  const fkMap = {};
  for (const fk of foreignKeys) {
    fkMap[fk.from] = { table: fk.table, column: fk.to };
  }

  return columns.map((col) => ({
    name: col.name,
    table,
    data_type: col.type,
    default_value: col.dflt_value,
    max_length: null,
    numeric_precision: null,
    numeric_scale: null,
    is_generated: col.hidden === 2 || col.hidden === 3,
    generation_expression: null,
    is_nullable: !col.notnull,
    is_unique: uniqueColumns.has(col.name),
    is_primary_key: col.pk > 0,
    has_auto_increment: col.pk > 0 && hasAutoIncrement,
    foreign_key_column: fkMap[col.name] ? fkMap[col.name].column : null,
    foreign_key_table: fkMap[col.name] ? fkMap[col.name].table : null
  }));
}

//
// ALTER TABLE notes:
// - [x] cannot be UNIQUE or PRIMARY KEY
// - [x] NOT NULL without default value
// - [x] cannot have default of time/date related
// - [x] foreign key with foreign key constraint must allow NULL
//

const COLUMN_PROPERTIES = [
  'data_type',
  'default_value',
  'max_length',
  'numeric_precision',
  'numeric_scale',
  'is_generated',
  'generation_expression',
  'is_nullable',
  'is_unique',
  'is_primary_key',
  'has_auto_increment',
  'foreign_key_column',
  'foreign_key_table'
];

function migrateSchema(instance, db, session, tables) {
  //
  // Populate index list directly on the existing db handle.
  // Previously this was done inside an afterCreate hook on a second connection;
  // now we use the same connection to avoid race conditions.
  //
  const indexList = {};
  for (const table of Object.keys(tables)) {
    try {
      indexList[table] = db.pragma(`index_list(${table})`);
    } catch (err) {
      logger.error(err, { session, resolver: instance.resolver });
      indexList[table] = [];
    }
  }

  // ensure that all tables exist
  const errors = [];
  const commands = [];

  for (const table of Object.keys(tables)) {
    if (!hasTableDirect(db, table)) {
      // create table
      commands.push(tables[table].createStatement);

      // add columns
      for (const key of Object.keys(tables[table].mapping)) {
        const mapped = tables[table].mapping[key];
        // TODO: some columns get created in the createStatement
        //       so we don't want to add them if they already exist
        //       (basically all the cases where `otherKeys.push` is invoked)
        //       (in the `helpers/mongoose-to-sqlite.js` mapping setup)
        if (mapped.alterStatement && !mapped.other_keys.includes(key))
          commands.push(tables[table].mapping[key].alterStatement);

        // TODO: conditionally add indexes using `indexList[table]`
        if (mapped.indexStatement) commands.push(mapped.indexStatement);
        // conditionally add FTS5
        if (mapped.fts5) {
          const exists = hasFTS5Already(db, table);
          if (!exists) commands.push(...mapped.fts5);
        }
      }

      continue;
    }

    // ensure that all columns exist using mapping for the table
    const columnInfo = getColumnInfoDirect(db, table);

    // create mapping of columns by their key for easy lookup
    const columnInfoByKey = _.zipObject(
      columnInfo.map((c) => c.name),
      columnInfo
    );

    //
    // NOTE: this is a migration for columns removed (e.g. CalendarEvents.uid)
    //       which previously caused NOT NULL constraint errors
    //       (and we could have done a workaround to set a default value, e.g. '')
    //       (however newer version of SQLite - which we use - support dropping columns)
    //       https://stackoverflow.com/a/66399224
    //
    for (const key of Object.keys(columnInfoByKey)) {
      const column = columnInfoByKey[key];
      if (!column) continue; // safeguard
      // ensure mapping exists, otherwise remove it
      if (tables[table].mapping[key]) continue;

      try {
        // Drop any indexes on this column first
        db.exec(`DROP INDEX IF EXISTS ${table}_${key}`);
        db.exec(`ALTER TABLE ${table} DROP COLUMN ${key}`);
      } catch (err) {
        // Log but don't throw
        err.isCodeBug = true;
        logger.error(err, {
          table,
          column: key,
          session,
          resolver: instance.resolver
        });
      }
    }

    //
    // get a list of existing and expected columns
    //
    const existingColumns = columnInfo.map((c) => c.name);
    const expectedColumns = Object.keys(tables[table].mapping);

    //
    // if we are missing columns, then we need to add them
    //
    const missingColumns = _.difference(expectedColumns, existingColumns);

    if (missingColumns.length > 0) {
      for (const key of missingColumns) {
        if (tables[table].mapping[key].alterStatement) {
          commands.push(tables[table].mapping[key].alterStatement);
        }
      }
    }

    for (const key of Object.keys(tables[table].mapping)) {
      const column = columnInfoByKey[key];
      if (!column) {
        // we don't run ALTER TABLE commands unless we need to
        if (tables[table].mapping[key].alterStatement) {
          commands.push(tables[table].mapping[key].alterStatement);
        }

        // TODO: conditionally add indexes using `indexList[table]`
        if (tables[table].mapping[key].indexStatement)
          commands.push(tables[table].mapping[key].indexStatement);
        // conditionally add FTS5
        if (tables[table].mapping[key].fts5) {
          const exists = hasFTS5Already(db, table);
          if (!exists) commands.push(...tables[table].mapping[key].fts5);
        }

        continue;
      }

      // conditionally add indexes using `indexList[table]`
      if (tables[table].mapping[key].indexStatement) {
        //
        // if the index doesn't match up
        // (e.g. `unique` is 1 when should be 0)
        // (or if `partial` is 1 - the default should be 0)
        // then we can drop the existing index and add the proper one
        // but note that if it's "id" then it needs both autoindex and normal index
        //
        const existingIndex = indexList[table].find((obj) => {
          return obj.name === `${table}_${key}`;
        });

        if (existingIndex) {
          if (
            existingIndex.partial !== 0 ||
            Boolean(existingIndex.unique) !==
              tables[table].mapping[key].is_unique ||
            existingIndex.origin !== 'c'
          ) {
            // drop it and add it back
            commands.push(
              `DROP INDEX IF EXISTS "${table}_${key}"`,
              tables[table].mapping[key].indexStatement
            );
          }
          // TODO: ensure primary key index (e.g. name = sqlite_autoindex_mailboxes_1) see above
          //       (origin = 'pk')
        } else {
          commands.push(tables[table].mapping[key].indexStatement);
        }
      }

      // conditionally add FTS5
      if (tables[table].mapping[key].fts5) {
        const exists = hasFTS5Already(db, table);
        if (!exists) commands.push(...tables[table].mapping[key].fts5);
      }

      //
      // NOTE: sqlite does not support altering data types
      //       (so manual migration would be required)
      //       (e.g. which we would write to rename the col, add the proper one, then migrate the data)
      //       https://stackoverflow.com/a/2083562
      //       https://sqlite.org/omitted.html
      //
      // TODO: therefore if any of these changed from the mapping value
      // then we need to log a code bug error and throw it
      // (store all errors in an array and then use combine errors)
      for (const prop of COLUMN_PROPERTIES) {
        if (column[prop] !== tables[table].mapping[key][prop]) {
          //
          // TODO: note that we would need to lock/unlock database for this
          // TODO: this is where we'd write the migration necessary
          // TODO: rename the table to __table, then add the proper table with columns
          // TODO: and then we would need to copy back over the data and afterwards delete __table
          // TODO: this should be run inside a `transaction()` with rollback
          //
          // NOTE: for now in the interim we're going to simply log it as a code bug
          //
          const message = `Column "${key}" in table "${table}" has property "${prop}" with definition "${column[prop]}" when it needs to be "${tables[table].mapping[key][prop]}" to match the current schema`;
          if (
            message !==
            'Column "scale" in table "Calendars" has property "default_value" with definition "null" when it needs to be "Gregorian" to match the current schema'
          )
            errors.push(message);
        }
      }
    }
  }

  // NOTE: schema mismatch errors are expected for older databases
  // (SQLite does not support ALTER COLUMN to change data types)
  if (errors.length > 0) {
    const err = combineErrors(errors);
    err.isCodeBug = false;
    logger.debug(err, { session, resolver: instance.resolver });
  }

  //
  // When FTS5 is disabled, drop the virtual table and orphaned triggers.
  // Triggers can survive even after the FTS5 table is dropped, causing
  // "no such table: Messages_fts" errors on INSERT/UPDATE/DELETE.
  //
  if (!env.SQLITE_FTS5_ENABLED) {
    commands.push(
      'DROP TRIGGER IF EXISTS Messages_ai',
      'DROP TRIGGER IF EXISTS Messages_ad',
      'DROP TRIGGER IF EXISTS Messages_au',
      'DROP TABLE IF EXISTS Messages_fts'
    );
  }

  return commands;
}

module.exports = migrateSchema;
