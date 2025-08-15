import * as SQLite from 'expo-sqlite';

const DB_NAME = 'inboxunseen.db';
const DB_VERSION = 2;

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

      await this.db.runAsync('INSERT INTO schema_migrations (version) VALUES (?)', [1]);
    }
    if (fromVersion < 2) {
      // Phase 5: Notifications nudge scheduling table
      await this.db.execAsync(`
        CREATE TABLE nudges (
          analysis_id TEXT PRIMARY KEY REFERENCES analyses(id),
          notification_id TEXT,
          fire_time INTEGER
        );
      `);
      await this.db.runAsync('INSERT INTO schema_migrations (version) VALUES (?)', [2]);
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
    createdAt?: number;
  }): Promise<void> {
    const db = await this.getDatabase();
    const createdAt = analysis.createdAt || Date.now();
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
      createdAt
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

  // Nudge scheduling persistence
  async createNudge(analysisId: string, notificationId: string, fireTime: number): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(`
      INSERT OR REPLACE INTO nudges (analysis_id, notification_id, fire_time)
      VALUES (?, ?, ?)
    `, [analysisId, notificationId, fireTime]);
  }

  async deleteNudge(analysisId: string): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync('DELETE FROM nudges WHERE analysis_id = ?', [analysisId]);
  }

  async getActiveNudges(): Promise<Array<{ analysis_id: string; notification_id: string; fire_time: number }>> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync('SELECT * FROM nudges');
    return rows as any;
  }

  async getAnalysesNeedingNudges(now: number, twelveHoursMs: number): Promise<Array<{ id: string; created_at: number }>> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync(`
      SELECT a.id, a.created_at FROM analyses a
        LEFT JOIN outcomes o ON o.analysis_id = a.id
        LEFT JOIN nudges n ON n.analysis_id = a.id
      WHERE o.analysis_id IS NULL
        AND n.analysis_id IS NULL
        AND (a.created_at + ?) > ?
    `, [twelveHoursMs, now]);
    return rows as any;
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
  DELETE FROM nudges;
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

  // Data export for privacy compliance
  async exportAllData(): Promise<{
    contacts: any[];
    contact_stats: any[];
    threads: any[];
    analyses: any[];
    outcomes: any[];
    exported_at: string;
  }> {
    const db = await this.getDatabase();
    
    try {
      // Export contacts
      const contacts = await db.getAllAsync('SELECT * FROM contacts ORDER BY created_at DESC');
      
      // Export contact stats with parsed JSON
      const rawContactStats = await db.getAllAsync('SELECT * FROM contact_stats ORDER BY updated_at DESC');
      const contact_stats = rawContactStats.map((row: any) => ({
        ...row,
        reply_latency_hist: row.reply_latency_hist ? JSON.parse(row.reply_latency_hist) : null,
        best_hours: row.best_hours ? JSON.parse(row.best_hours) : null,
        tone_len_coeffs: row.tone_len_coeffs ? JSON.parse(row.tone_len_coeffs) : null,
        taboo_tokens: row.taboo_tokens ? JSON.parse(row.taboo_tokens) : null,
      }));
      
      // Export threads
      const threads = await db.getAllAsync('SELECT * FROM threads ORDER BY created_at DESC');
      
      // Export analyses with parsed JSON
      const rawAnalyses = await db.getAllAsync('SELECT * FROM analyses ORDER BY created_at DESC');
      const analyses = rawAnalyses.map((row: any) => ({
        ...row,
        reasons: row.reasons ? JSON.parse(row.reasons) : [],
        suggestions: row.suggestions ? JSON.parse(row.suggestions) : [],
      }));
      
      // Export outcomes
      const outcomes = await db.getAllAsync('SELECT * FROM outcomes ORDER BY logged_at DESC');
      
      return {
        contacts: contacts || [],
        contact_stats: contact_stats || [],
        threads: threads || [],
        analyses: analyses || [],
        outcomes: outcomes || [],
        exported_at: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error('Export failed for table:', error);
      // Return partial data rather than failing completely
      return {
        contacts: [],
        contact_stats: [],
        threads: [],
        analyses: [],
        outcomes: [],
        exported_at: new Date().toISOString(),
      };
    }
  }
}

export const database = new Database();
