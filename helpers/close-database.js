/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const { execFile } = require('node:child_process');
const process = require('node:process');

const ms = require('ms');
const pWaitFor = require('p-wait-for');

const logger = require('#helpers/logger');

//
// Drop Linux page cache for a file using posix_fadvise(DONTNEED).
// This prevents closed databases from consuming page cache indefinitely.
// Uses Python's os.posix_fadvise for zero-copy eviction without a native addon.
// Fire-and-forget: errors are logged at debug level and never propagate.
//
function dropPageCache(filePath) {
  if (process.platform !== 'linux') return;
  if (!filePath || typeof filePath !== 'string') return;

  execFile(
    'python3',
    [
      '-c',
      `import os\ntry:\n fd = os.open("${filePath}", os.O_RDONLY)\n os.posix_fadvise(fd, 0, 0, os.POSIX_FADV_DONTNEED)\n os.close(fd)\nexcept OSError:\n pass`
    ],
    { timeout: 5000 },
    (err) => {
      if (err) logger.debug(`dropPageCache failed for ${filePath}`, { err });
    }
  );
}

async function closeDatabase(db) {
  if (!db.open) return;

  // Capture file path before closing (db.name is the file path in better-sqlite3)
  const dbPath = db.name;

  if (db.inTransaction) {
    try {
      await pWaitFor(() => !db.inTransaction, {
        timeout: ms('30s')
      });
    } catch (err) {
      err.message = `Shutdown could not cancel transaction: ${err.message}`;
      // TODO: remove later
      console.error(err);
      err.isCodeBug = true;
      logger.error(err, { db });
    }
  }

  try {
    db.pragma('analysis_limit=400');
    db.pragma('optimize');
    db.close();
  } catch (err) {
    // TODO: remove later
    console.error(err);
    logger.error(err, { db });
  }

  //
  // After closing, advise the kernel to drop page cache for this database
  // and its WAL/SHM files. This reclaims memory that would otherwise remain
  // cached indefinitely (the root cause of 100+ GB page cache usage).
  //
  if (dbPath) {
    dropPageCache(dbPath);
    dropPageCache(`${dbPath}-wal`);
    dropPageCache(`${dbPath}-shm`);
  }
}

module.exports = closeDatabase;
