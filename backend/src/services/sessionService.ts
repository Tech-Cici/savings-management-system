import { JwtPayload } from '../utils/jwt';

export interface Session {
  userId: string;
  email: string;
  role: 'admin' | 'client';
  deviceId?: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

export class SessionService {
  private sessions: Map<string, Session> = new Map();
  private readonly SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  private readonly MAX_SESSIONS_PER_USER = 3; // Maximum concurrent sessions per user

  constructor() {
    // Clean up expired sessions every 5 minutes
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  createSession(jwtPayload: JwtPayload, deviceId?: string): string {
    const sessionId = this.generateSessionId();
    const now = new Date();

    // Check if user has too many active sessions
    const userSessions = Array.from(this.sessions.values())
      .filter(session => session.userId === jwtPayload.userId && session.isActive);

    if (userSessions.length >= this.MAX_SESSIONS_PER_USER) {
      // Remove oldest session
      const oldestSession = userSessions.reduce((oldest, current) => 
        current.lastActivity < oldest.lastActivity ? current : oldest
      );
      this.sessions.delete(this.getSessionIdBySession(oldestSession));
    }

    const session: Session = {
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      role: jwtPayload.role,
      deviceId,
      createdAt: now,
      lastActivity: now,
      isActive: true
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return null;
    }

    // Check if session has expired due to inactivity
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
    
    if (timeSinceLastActivity > this.SESSION_TIMEOUT) {
      this.invalidateSession(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivity = now;
    this.sessions.set(sessionId, session);

    return session;
  }

  updateSessionActivity(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return false;
    }

    session.lastActivity = new Date();
    this.sessions.set(sessionId, session);
    return true;
  }

  invalidateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.set(sessionId, session);
      return true;
    }
    return false;
  }

  invalidateUserSessions(userId: string): number {
    let invalidatedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId && session.isActive) {
        session.isActive = false;
        this.sessions.set(sessionId, session);
        invalidatedCount++;
      }
    }
    
    return invalidatedCount;
  }

  invalidateDeviceSessions(deviceId: string): number {
    let invalidatedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.deviceId === deviceId && session.isActive) {
        session.isActive = false;
        this.sessions.set(sessionId, session);
        invalidatedCount++;
      }
    }
    
    return invalidatedCount;
  }

  getActiveSessionsCount(userId: string): number {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && session.isActive)
      .length;
  }

  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private getSessionIdBySession(targetSession: Session): string | null {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session === targetSession) {
        return sessionId;
      }
    }
    return null;
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (!session.isActive) {
        continue;
      }

      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
      
      if (timeSinceLastActivity > this.SESSION_TIMEOUT) {
        session.isActive = false;
        this.sessions.set(sessionId, session);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  // Get session statistics for monitoring
  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
  } {
    const totalSessions = this.sessions.size;
    const activeSessions = Array.from(this.sessions.values())
      .filter(session => session.isActive).length;
    const expiredSessions = totalSessions - activeSessions;

    return {
      totalSessions,
      activeSessions,
      expiredSessions
    };
  }
}

// Import crypto at the top
import crypto from 'crypto';
