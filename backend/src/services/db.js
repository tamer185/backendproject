import { createConfig } from '../config.js';
import { dbService as fileDb } from './db-file.js';
// future: import { mongoDb } from './db-mongo.js'; etc.

export function dbService() {
  const cfg = createConfig(process.env);

  switch ((cfg.DB_PROVIDER || 'file').toLowerCase()) {
    case 'file':
      return fileDb({ filePath: cfg.DB_FILE_PATH });
    // case 'dynamo':
    //   return dynamoDb(cfg);
    default:
      throw new Error(`Unknown DB_PROVIDER: ${cfg.DB_PROVIDER}`);
  }
}
