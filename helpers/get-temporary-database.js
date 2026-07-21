/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const path = require('node:path');

const { boolean } = require('boolean');
const Database = require('better-sqlite3-multiple-ciphers');

const getPathToDatabase = require('./get-path-to-database');
const logger = require('./logger');
const migrateSchema = require('./migrate-schema');
const setupPragma = require('./setup-pragma');
const { encrypt } = require('./encrypt-decrypt');
const config = require('#config');
const env = require('#config/env');

const ServerShutdownError = require('#helpers/server-shutdown-error');
const TemporaryMessages = require('#models/temporary-messages');

async function getTemporaryDatabase(session) {
  // if server is shutting down then don't bother getting database
  if (this.isClosing) throw new ServerShutdownError();

  const cacheKey = session.user.alias_id;

  //
  // Check the LRU cache first — avoids re-opening the same temp DB file
  // on every inbound message when the main DB is unavailable.
  //
  if (this.temporaryDatabaseMap && this.temporaryDatabaseMap.has(cacheKey)) {
    const cached = this.temporaryDatabaseMap.get(cacheKey);
    if (cached && cached.open) return cached;
    // If the cached DB was closed externally, remove stale entry
    this.temporaryDatabaseMap.delete(cacheKey);
  }

  const storagePath = getPathToDatabase({
    id: session.user.alias_id,
    storage_location: session.user.storage_location
  });
  const filePath = path.join(
    path.dirname(storagePath),
    `${session.user.alias_id}-tmp.sqlite`
  );

  const tmpDb = new Database(filePath, {
    // if the db wasn't found it means there wasn't any mail
    // fileMustExist: true,
    timeout: config.busyTimeout,
    // <https://github.com/WiseLibs/better-sqlite3/issues/217#issuecomment-456535384>
    verbose: boolean(env.SQLITE_VERBOSE) ? console.log : null
  });

  const tmpSession = {
    ...session,
    user: {
      ...session.user,
      password: encrypt(
        Array.isArray(env.API_SECRETS) ? env.API_SECRETS[0] : env.API_SECRETS
      )
    }
  };

  try {
    await setupPragma(tmpDb, tmpSession);
  } catch (pragmaErr) {
    // Close the handle to prevent file descriptor leak
    try {
      tmpDb.close();
    } catch {}

    throw pragmaErr;
  }

  //
  // Override cache_size for temporary databases (2MB instead of 64MB).
  // Temp DBs are small and short-lived; 2MB is more than sufficient.
  //
  tmpDb.pragma('cache_size = -2048');

  // migrate schema
  const commands = migrateSchema(this, tmpDb, tmpSession, {
    TemporaryMessages
  });

  if (commands.length > 0) {
    tmpDb.transaction(() => {
      for (const command of commands) {
        try {
          tmpDb.prepare(command).run();
        } catch (err) {
          // duplicate column errors are expected when migration was already applied
          if (err.message.startsWith('duplicate column name:')) {
            logger.debug(err, { command });
          } else {
            err.isCodeBug = true;
            logger.fatal(err, { command });
          }

          // migration support in case existing rows
          if (
            err.message.includes(
              'Cannot add a NOT NULL column with default value NULL'
            ) &&
            command.endsWith(' NOT NULL')
          ) {
            try {
              tmpDb.prepare(command.replace(' NOT NULL', '')).run();
            } catch (err) {
              err.isCodeBug = true;
              logger.fatal(err, { command });
            }
          }
        }
      }
    })();
  }

  // Store in the LRU cache so subsequent calls reuse this connection
  if (this.temporaryDatabaseMap) {
    this.temporaryDatabaseMap.set(cacheKey, tmpDb);
  }

  return tmpDb;
}

module.exports = getTemporaryDatabase;
