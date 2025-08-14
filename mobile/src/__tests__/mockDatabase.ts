// Mock database for Jest tests
interface MockAnalysis {
  id: string;
  threadId: string;
  featuresHash: string;
  prob: number;
  bucket: string;
  recommendation: string;
  reasons: string[];
  suggestions: string[];
  createdAt: number;
}

interface MockOutcome {
  analysisId: string;
  gotReply: boolean;
  latencyMinutes?: number;
  loggedAt: number;
}

class MockDatabase {
  private analyses: MockAnalysis[] = [];
  private outcomes: Map<string, MockOutcome> = new Map();
  private contacts: Map<string, { id: string; displayHint?: string; createdAt: number }> = new Map();

  async init(): Promise<void> {
    // Mock initialization - always succeeds
  }

  async close(): Promise<void> {
    // Mock close
  }

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
    this.analyses.push({
      ...analysis,
      createdAt: Date.now(),
    });
  }

  async getRecentAnalyses(limit: number = 20): Promise<any[]> {
    return this.analyses
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .map(analysis => {
        const outcome = this.outcomes.get(analysis.id);
        return {
          ...analysis,
          created_at: analysis.createdAt,
          outcome: outcome ? {
            gotReply: outcome.gotReply,
            latencyMinutes: outcome.latencyMinutes,
            loggedAt: outcome.loggedAt
          } : undefined,
        };
      });
  }

  async getAnalysisById(id: string): Promise<any | null> {
    const found = this.analyses.find(a => a.id === id);
    if (!found) return null;
    const outcome = this.outcomes.get(id);
    return {
      ...found,
      created_at: found.createdAt,
      outcome: outcome ? {
        gotReply: outcome.gotReply,
        latencyMinutes: outcome.latencyMinutes,
        loggedAt: outcome.loggedAt
      } : undefined,
    };
  }

  async logOutcome(analysisId: string, gotReply: boolean, latencyMinutes?: number): Promise<void> {
    this.outcomes.set(analysisId, {
      analysisId,
      gotReply,
      latencyMinutes,
      loggedAt: Date.now(),
    });
  }

  async getOrCreateContact(contactHash: string, displayHint?: string): Promise<string> {
    if (!this.contacts.has(contactHash)) {
      this.contacts.set(contactHash, {
        id: contactHash,
        displayHint,
        createdAt: Date.now(),
      });
    }
    return contactHash;
  }

  async createThread(id: string, contactId: string): Promise<void> {
    // Mock thread creation
  }

  async deleteAllData(): Promise<void> {
    this.analyses = [];
    this.outcomes.clear();
    this.contacts.clear();
  }

  async deleteContact(contactId: string): Promise<void> {
    this.contacts.delete(contactId);
    // Remove related analyses (simplified)
    this.analyses = this.analyses.filter(a => a.threadId !== contactId);
  }
}

export const mockDatabase = new MockDatabase();
