import * as SQLite from 'expo-sqlite';

const DB_NAME = 'inboxunseen.db';
const DB_VERSION = 1;

class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.runMigrations();
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Get current schema version
    const result = await this.db.getFirstAsync(
      'SELECT name FROM sqlite_master WHERE type="table" AND name="schema_migrations"'
    );
    
    if (!result) {
      // First time setup
      await this.db.execAsync(`
        CREATE TABLE schema_migrations (
          version INTEGER PRIMARY KEY
        );
      `);
    }

    const versionResult = await this.db.getFirstAsync(
      'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1'
    );
    
    const currentVersion = versionResult ? (versionResult as any).version : 0;

    if (currentVersion < DB_VERSION) {
      await this.applyMigrations(currentVersion);
    }
  }

  private async applyMigrations(fromVersion: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    if (fromVersion < 1) {
      // Initial schema from PRD
      await this.db.execAsync(`
        -- Contacts are anonymized via a stable hash
        CREATE TABLE contacts (
          id TEXT PRIMARY KEY,          -- contact_hash
          display_hint TEXT,            -- optional user-given label
          n_msgs INTEGER DEFAULT 0,
          confidence REAL DEFAULT 0.0,  -- 0..1
          created_at INTEGER
        );

        CREATE TABLE contact_stats (
          contact_id TEXT REFERENCES contacts(id),
          reply_latency_hist BLOB,      -- serialized buckets
          best_hours TEXT,              -- JSON array e.g., [19,20,21,22]
          tone_len_coeffs TEXT,         -- JSON {len: x, playful: y, direct: z}
          taboo_tokens TEXT,            -- JSON array ["??","..."]
          updated_at INTEGER,
          PRIMARY KEY (contact_id)
        );

        CREATE TABLE threads (
          id TEXT PRIMARY KEY,
          contact_id TEXT REFERENCES contacts(id),
          created_at INTEGER
        );

        CREATE TABLE analyses (
          id TEXT PRIMARY KEY,
          thread_id TEXT REFERENCES threads(id),
          features_hash TEXT,
          prob REAL,                    -- 0..1
          bucket TEXT,                  -- Likely/Uncertain/Unlikely
          recommendation TEXT,          -- send|wait; wait_minutes
          reasons TEXT,                 -- JSON array of strings
          suggestions TEXT,             -- JSON array of rewrite strings
          created_at INTEGER
        );

        CREATE TABLE outcomes (
          analysis_id TEXT PRIMARY KEY REFERENCES analyses(id),
          got_reply INTEGER,            -- 0/1
          latency_minutes INTEGER,
          logged_at INTEGER
        );
      `);

      await this.db.runAsync(
        'INSERT INTO schema_migrations (version) VALUES (?)', 
        [1]
      );
    }
  }

  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  // Analysis operations
  async createAnalysis(analysis: {
    id: string;
    threadId: string;
    featuresHash: string;
    prob: number;
    bucket: string;
    recommendation: string;
    reasons: string[];
    suggestions: string[];
  }): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(`
      INSERT INTO analyses (id, thread_id, features_hash, prob, bucket, recommendation, reasons, suggestions, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      analysis.id,
      analysis.threadId,
      analysis.featuresHash,
      analysis.prob,
      analysis.bucket,
      analysis.recommendation,
      JSON.stringify(analysis.reasons),
      JSON.stringify(analysis.suggestions),
      Date.now()
    ]);
  }

  async getRecentAnalyses(limit: number = 20): Promise<any[]> {
    const db = await this.getDatabase();
    const result = await db.getAllAsync(
      'SELECT * FROM analyses ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    
    return result.map(row => {
      const analysis = row as any;
      return {
        ...analysis,
        reasons: JSON.parse(analysis.reasons || '[]'),
        suggestions: JSON.parse(analysis.suggestions || '[]'),
      };
    });
  }

  async getAnalysisById(analysisId: string): Promise<any | null> {
    const db = await this.getDatabase();
    const result = await db.getFirstAsync(
      'SELECT * FROM analyses WHERE id = ?',
      [analysisId]
    );
    
    if (!result) {
      return null;
    }
    
    const analysis = result as any;
    return {
      ...analysis,
      reasons: JSON.parse(analysis.reasons || '[]'),
      suggestions: JSON.parse(analysis.suggestions || '[]'),
    };
  }

  async logOutcome(analysisId: string, gotReply: boolean, latencyMinutes?: number): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(`
      INSERT OR REPLACE INTO outcomes (analysis_id, got_reply, latency_minutes, logged_at)
      VALUES (?, ?, ?, ?)
    `, [
      analysisId,
      gotReply ? 1 : 0,
      latencyMinutes || null,
      Date.now()
    ]);
  }

  // Contact operations
  async getOrCreateContact(contactHash: string, displayHint?: string): Promise<string> {
    const db = await this.getDatabase();
    
    const existing = await db.getFirstAsync(
      'SELECT id FROM contacts WHERE id = ?',
      [contactHash]
    );
    
    if (existing) {
      return contactHash;
    }

    await db.runAsync(`
      INSERT INTO contacts (id, display_hint, created_at)
      VALUES (?, ?, ?)
    `, [contactHash, displayHint || null, Date.now()]);
    
    return contactHash;
  }

  // Thread operations  
  async createThread(id: string, contactId: string): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(`
      INSERT INTO threads (id, contact_id, created_at)
      VALUES (?, ?, ?)
    `, [id, contactId, Date.now()]);
  }

  // Data deletion for privacy
  async deleteAllData(): Promise<void> {
    const db = await this.getDatabase();
    await db.execAsync(`
      DELETE FROM outcomes;
      DELETE FROM analyses;  
      DELETE FROM contact_stats;
      DELETE FROM threads;
      DELETE FROM contacts;
    `);
  }

  async deleteContact(contactId: string): Promise<void> {
    const db = await this.getDatabase();
    await db.execAsync(`
      DELETE FROM outcomes WHERE analysis_id IN (
        SELECT id FROM analyses WHERE thread_id IN (
          SELECT id FROM threads WHERE contact_id = '${contactId}'
        )
      );
      DELETE FROM analyses WHERE thread_id IN (
        SELECT id FROM threads WHERE contact_id = '${contactId}'
      );
      DELETE FROM contact_stats WHERE contact_id = '${contactId}';
      DELETE FROM threads WHERE contact_id = '${contactId}';
      DELETE FROM contacts WHERE id = '${contactId}';
    `);
  }
}

export const database = new Database();
