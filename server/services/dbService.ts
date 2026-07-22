import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import pg from 'pg';

export class DbService {
  private pgUrl: string | undefined;
  private pgClient: any = null;
  private usePostgres = false;
  private dbPath: string;
  private sqlDb: any = null;
  private writeQueue: Array<{ sql: string; params: any[]; resolve: () => void; reject: (err: any) => void }> = [];
  private flushTimeout: any = null;
  private flushingPromise: Promise<void> | null = null;

  constructor(databaseUrl?: string) {
    this.pgUrl = databaseUrl || process.env.DATABASE_URL;
    this.usePostgres = !!this.pgUrl;
    this.dbPath = path.join(process.cwd(), 'database.sqlite');
    
    if (this.usePostgres) {
      console.log('[DbService] PostgreSQL connection specified, preparing live connection context.');
    } else {
      console.log('[DbService] No DATABASE_URL found. Using fallback SQLite storage.');
    }
  }

  private async getPgClient() {
    if (!this.pgClient) {
      const { Client } = pg;
      this.pgClient = new Client({
        connectionString: this.pgUrl,
        ssl: this.pgUrl?.includes('localhost') || this.pgUrl?.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
      });
      await this.pgClient.connect();
      console.log('[DbService] Successfully connected to PostgreSQL database cluster.');
    }
    return this.pgClient;
  }

  private async getSqlDb() {
    if (!this.sqlDb) {
      const SQL = await initSqlJs();
      if (fs.existsSync(this.dbPath)) {
        try {
          const filebuffer = fs.readFileSync(this.dbPath);
          const dbInstance = new SQL.Database(filebuffer);
          // Force SQLite to parse the header and schema to verify integrity
          dbInstance.exec("PRAGMA schema_version;");
          this.sqlDb = dbInstance;
        } catch (err) {
          console.error(`[DbService] Failed to load existing SQLite database from ${this.dbPath} (possible corruption or unsupported format):`, err);
          console.log('[DbService] Initializing clean SQLite database file...');
          this.sqlDb = null;
          try {
            if (fs.existsSync(this.dbPath)) {
              fs.unlinkSync(this.dbPath);
            }
          } catch (unlinkErr) {
            console.error('[DbService] Failed to delete corrupted SQLite file:', unlinkErr);
          }
          this.sqlDb = new SQL.Database();
        }
      } else {
        this.sqlDb = new SQL.Database();
      }
    }
    return this.sqlDb;
  }

  private sqliteToPostgres(sql: string): string {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  private parseStatements(sql: string): string[] {
    const cleanLines = sql.split('\n').map(line => {
      const commentIndex = line.indexOf('--');
      if (commentIndex !== -1) {
        const beforeComment = line.substring(0, commentIndex);
        const singleQuotes = (beforeComment.match(/'/g) || []).length;
        const doubleQuotes = (beforeComment.match(/"/g) || []).length;
        if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
          return beforeComment;
        }
      }
      return line;
    });
    
    const fullSql = cleanLines.join('\n');
    const statements: string[] = [];
    let currentStatement = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inDollarQuote = false;
    
    for (let i = 0; i < fullSql.length; i++) {
      const char = fullSql[i];
      
      // Check for dollar quote start/end ($$)
      if (char === '$' && i + 1 < fullSql.length && fullSql[i + 1] === '$') {
        inDollarQuote = !inDollarQuote;
        currentStatement += '$$';
        i++; // skip next '$'
        continue;
      }
      
      if (!inDollarQuote) {
        if (char === "'" && (i === 0 || fullSql[i - 1] !== '\\')) {
          inSingleQuote = !inSingleQuote;
        } else if (char === '"' && (i === 0 || fullSql[i - 1] !== '\\')) {
          inDoubleQuote = !inDoubleQuote;
        }
      }
      
      if (char === ';' && !inSingleQuote && !inDoubleQuote && !inDollarQuote) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
      } else {
        currentStatement += char;
      }
    }
    
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    return statements;
  }

  public async exec(sql: string): Promise<void> {
    await this.flushWrites();
    const statements = this.parseStatements(sql);
    if (this.usePostgres) {
      try {
        const client = await this.getPgClient();
        for (const stmt of statements) {
          let pgStmt = stmt.replace(/INTEGER PRIMARY KEY/gi, 'SERIAL PRIMARY KEY');
          await client.query(pgStmt);
        }
      } catch (err) {
        console.error('[DbService] PostgreSQL execution failure:', err);
        throw err;
      }
    } else {
      try {
        const sDb = await this.getSqlDb();
        for (const stmt of statements) {
          const trimmed = stmt.trim().toUpperCase();
          if (trimmed.startsWith('CREATE OR REPLACE FUNCTION') || 
              trimmed.startsWith('CREATE FUNCTION') || 
              trimmed.startsWith('DO $$') ||
              trimmed.startsWith('DROP FUNCTION') ||
              trimmed.startsWith('DROP TRIGGER') ||
              (trimmed.startsWith('CREATE TRIGGER') && trimmed.includes('EXECUTE FUNCTION')) ||
              (trimmed.startsWith('CREATE TRIGGER') && trimmed.includes('EXECUTE PROCEDURE'))) {
            console.log(`[DbService] Skipping PostgreSQL-specific PL/pgSQL statement in SQLite fallback: ${stmt.substring(0, 50).replace(/\n/g, ' ')}...`);
            continue;
          }
          sDb.run(stmt);
        }
        const data = sDb.export();
        fs.writeFileSync(this.dbPath, Buffer.from(data));
      } catch (err: any) {
        console.error('[DbService] SQLite execution failure:', err);
        throw err;
      }
    }
  }

  /**
   * Run automated, numbered migrations from the /database/migrations folder
   */
  public async runMigrations(): Promise<void> {
    console.log('[DbService] Initiating multi-tenant database migration cycle...');
    try {
      if (!this.usePostgres && fs.existsSync(this.dbPath)) {
        try {
          const sDb = await this.getSqlDb();
          const checkTable = sDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='organizations'");
          const tableExists = checkTable.step();
          checkTable.free();
          if (!tableExists) {
            console.log('[DbService] organizations table is missing. Re-initializing SQLite database file to clean broken migration state.');
            this.sqlDb = null;
            if (fs.existsSync(this.dbPath)) {
              fs.unlinkSync(this.dbPath);
            }
          }
        } catch (e) {
          console.warn('[DbService] Error checking organization table existence, proceeding anyway:', e);
        }
      }

      // Ensure migrations record table exists
      await this.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
          name VARCHAR(255) PRIMARY KEY,
          applied_at BIGINT NOT NULL
        );
      `);

      const migrationsFolder = path.join(process.cwd(), 'database', 'migrations');
      if (!fs.existsSync(migrationsFolder)) {
        console.warn(`[DbService] Migrations folder not found at "${migrationsFolder}". Skipping migration cycle.`);
        return;
      }

      const files = fs.readdirSync(migrationsFolder)
        .filter(f => f.endsWith('.sql'))
        .sort((a, b) => a.localeCompare(b));

      console.log(`[DbService] Found ${files.length} migration files in folder.`);

      const applied = await this.all(`SELECT name FROM _migrations`);
      const appliedSet = new Set(applied.map((m: any) => m.name));

      for (const file of files) {
        if (appliedSet.has(file)) {
          console.debug(`[DbService] Migration ${file} already applied, skipping.`);
          continue;
        }

        console.log(`[DbService] Applying migration file: "${file}"...`);
        const filePath = path.join(migrationsFolder, file);
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Execute the full migration content block
        await this.exec(sqlContent);

        // Track that migration completed successfully
        await this.run(
          `INSERT INTO _migrations (name, applied_at) VALUES (?, ?);`,
          [file, Date.now()]
        );
        console.log(`[DbService] Migration ${file} compiled and registered successfully.`);
      }

      console.log('[DbService] Migration cycle completed. Enterprise database state is synchronized.');
    } catch (err) {
      console.error('[DbService] Migration cycle failed:', err);
      throw err;
    }
  }

  public static totalQueries = 0;
  public static totalQueryLatencyMs = 0;
  public static recentQueriesInfo: Array<{ sql: string; latency: number; timestamp: number }> = [];

  public async flushWrites(): Promise<void> {
    if (this.flushingPromise) {
      return this.flushingPromise;
    }
    this.flushingPromise = this.doFlushWrites().finally(() => {
      this.flushingPromise = null;
    });
    return this.flushingPromise;
  }

  private async doFlushWrites(): Promise<void> {
    if (this.writeQueue.length === 0) {
      return;
    }
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    const batch = [...this.writeQueue];
    this.writeQueue = [];

    const startTime = Date.now();
    console.log(`[DbService] Flushing write queue of size ${batch.length}...`);

    if (this.usePostgres) {
      let client;
      try {
        client = await this.getPgClient();
        await client.query('BEGIN');
        for (const item of batch) {
          const pgSql = this.sqliteToPostgres(item.sql);
          await client.query(pgSql, item.params);
        }
        await client.query('COMMIT');

        // Resolve all promises
        batch.forEach(item => item.resolve());

        const duration = Date.now() - startTime;
        DbService.totalQueryLatencyMs += duration;
        DbService.totalQueries += batch.length;
        console.log(`[DbService] Successfully flushed ${batch.length} writes to PostgreSQL in ${duration}ms.`);
      } catch (err) {
        console.error('[DbService] PostgreSQL batch write transaction failed, falling back to sequential writes:', err);
        if (client) {
          try {
            await client.query('ROLLBACK');
          } catch (rbErr) {
            console.error('[DbService] Rollback failed:', rbErr);
          }
        }

        // Fallback sequentially so that valid writes succeed and only bad ones fail
        for (const item of batch) {
          try {
            const pgSql = this.sqliteToPostgres(item.sql);
            await client.query(pgSql, item.params);
            item.resolve();
          } catch (seqErr) {
            item.reject(seqErr);
          }
        }
      }
    } else {
      // SQLite
      try {
        const sDb = await this.getSqlDb();
        sDb.run('BEGIN TRANSACTION');
        for (const item of batch) {
          const stmt = sDb.prepare(item.sql);
          stmt.run(item.params);
          stmt.free();
        }
        sDb.run('COMMIT');

        const data = sDb.export();
        fs.writeFileSync(this.dbPath, Buffer.from(data));

        batch.forEach(item => item.resolve());

        const duration = Date.now() - startTime;
        DbService.totalQueryLatencyMs += duration;
        DbService.totalQueries += batch.length;
        console.log(`[DbService] Successfully flushed ${batch.length} writes to SQLite in ${duration}ms.`);
      } catch (err) {
        console.error('[DbService] SQLite batch write transaction failed, falling back to sequential writes:', err);
        try {
          const sDb = await this.getSqlDb();
          sDb.run('ROLLBACK');
        } catch (rbErr) {
          console.debug('[DbService] SQLite Rollback failed or not in transaction:', rbErr);
        }

        // Fallback sequentially
        for (const item of batch) {
          try {
            const sDb = await this.getSqlDb();
            const stmt = sDb.prepare(item.sql);
            stmt.run(item.params);
            stmt.free();
            const data = sDb.export();
            fs.writeFileSync(this.dbPath, Buffer.from(data));
            item.resolve();
          } catch (seqErr) {
            item.reject(seqErr);
          }
        }
      }
    }
  }

  public async all(sql: string, params: any[] = []): Promise<any[]> {
    await this.flushWrites();
    const startTime = Date.now();
    DbService.totalQueries++;
    if (this.usePostgres) {
      try {
        const client = await this.getPgClient();
        const pgSql = this.sqliteToPostgres(sql);
        const res = await client.query(pgSql, params);
        const duration = Date.now() - startTime;
        DbService.totalQueryLatencyMs += duration;
        DbService.recentQueriesInfo.unshift({ sql, latency: duration, timestamp: Date.now() });
        if (DbService.recentQueriesInfo.length > 50) DbService.recentQueriesInfo.pop();
        return res.rows;
      } catch (err) {
        console.error('[DbService] PostgreSQL query failure for SQL:', sql, err);
        throw err;
      }
    } else {
      try {
        const sDb = await this.getSqlDb();
        const stmt = sDb.prepare(sql);
        stmt.bind(params);
        const results: any[] = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        const duration = Date.now() - startTime;
        DbService.totalQueryLatencyMs += duration;
        DbService.recentQueriesInfo.unshift({ sql, latency: duration, timestamp: Date.now() });
        if (DbService.recentQueriesInfo.length > 50) DbService.recentQueriesInfo.pop();
        return results;
      } catch (err) {
        console.error('[DbService] SQLite query failure for SQL:', sql, err);
        throw err;
      }
    }
  }

  public async run(sql: string, params: any[] = [], bypassQueue = false): Promise<void> {
    const isWrite = /^\s*(INSERT|UPDATE|DELETE|REPLACE)/i.test(sql);

    if (isWrite && !bypassQueue) {
      return new Promise<void>((resolve, reject) => {
        this.writeQueue.push({ sql, params, resolve, reject });
        if (this.writeQueue.length >= 20) {
          this.flushWrites().catch(console.error);
        } else if (!this.flushTimeout) {
          this.flushTimeout = setTimeout(() => {
            this.flushWrites().catch(console.error);
          }, 500);
        }
      });
    }

    const startTime = Date.now();
    DbService.totalQueries++;
    if (this.usePostgres) {
      try {
        const client = await this.getPgClient();
        const pgSql = this.sqliteToPostgres(sql);
        await client.query(pgSql, params);
        const duration = Date.now() - startTime;
        DbService.totalQueryLatencyMs += duration;
        DbService.recentQueriesInfo.unshift({ sql, latency: duration, timestamp: Date.now() });
        if (DbService.recentQueriesInfo.length > 50) DbService.recentQueriesInfo.pop();
      } catch (err) {
        console.error('[DbService] PostgreSQL execution failure for SQL:', sql, err);
        throw err;
      }
    } else {
      try {
        const sDb = await this.getSqlDb();
        const stmt = sDb.prepare(sql);
        stmt.run(params);
        stmt.free();
        const data = sDb.export();
        fs.writeFileSync(this.dbPath, Buffer.from(data));
        const duration = Date.now() - startTime;
        DbService.totalQueryLatencyMs += duration;
        DbService.recentQueriesInfo.unshift({ sql, latency: duration, timestamp: Date.now() });
        if (DbService.recentQueriesInfo.length > 50) DbService.recentQueriesInfo.pop();
      } catch (err) {
        console.error('[DbService] SQLite execution failure for SQL:', sql, err);
        throw err;
      }
    }
  }
}

export const dbService = new DbService();
