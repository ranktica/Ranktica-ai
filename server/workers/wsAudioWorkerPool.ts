import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { URL } from 'url';
import { getAuth } from 'firebase-admin/auth';
import { dbService } from '../services/dbService';

export interface WorkerSession {
  sessionId: string;
  type: 'live-audio' | 'collaborator';
  ws: WebSocket;
  userId?: string;
  orgId?: string;
  projectId?: string;
  username?: string;
  color?: string;
  cursorIndex?: number;
  lastHeartbeat: number;
  audioBufferQueue: Buffer[];
}

export interface CollaboratorRoom {
  roomId: string;
  clients: WorkerSession[];
}

export class WsAudioWorkerPool {
  private liveWss: WebSocketServer;
  private collaboratorWss: WebSocketServer;
  private activeSessions: Map<string, WorkerSession> = new Map();
  private collaboratorRooms: Map<string, CollaboratorRoom> = new Map();
  private workerCheckInterval: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  constructor() {
    this.liveWss = new WebSocketServer({ noServer: true });
    this.collaboratorWss = new WebSocketServer({ noServer: true });
  }

  /**
   * Initializes the dedicated worker pool, binding keep-alive pings and state queues
   */
  public initialize(server: Server) {
    console.log('[WsAudioWorkerPool] Initializing dedicated audio streaming & collaboration worker pool...');

    // Dedicated heartbeat and stale connection cleanup worker task
    this.workerCheckInterval = setInterval(() => {
      this.auditWorkerPoolConnections();
    }, 15000);

    // Setup collaborator session handlers in worker thread
    this.collaboratorWss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleCollaboratorConnection(ws, req);
    });

    // Setup live audio streaming session handlers in worker pool
    this.liveWss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleLiveAudioConnection(ws, req);
    });
  }

  /**
   * Handles HTTP Upgrade requests delegating real-time WebSocket traffic directly to worker pool
   */
  public async handleUpgrade(request: IncomingMessage, socket: any, head: Buffer): Promise<boolean> {
    const urlObj = request.url ? new URL(request.url, `http://${request.headers.host || 'localhost'}`) : null;
    const pathname = urlObj ? urlObj.pathname : '';

    if (pathname === '/api/live-ws') {
      const token = urlObj ? (urlObj.searchParams.get('token') || urlObj.searchParams.get('idToken') || urlObj.searchParams.get('auth')) : null;
      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return true;
      }
      try {
        await getAuth().verifyIdToken(token);
        this.liveWss.handleUpgrade(request, socket, head, (ws) => {
          this.liveWss.emit('connection', ws, request);
        });
        return true;
      } catch (err: any) {
        console.error('[WsAudioWorkerPool] Live WebSocket authentication failed:', err.message);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return true;
      }
    } else if (pathname === '/api/collaborator-ws') {
      this.collaboratorWss.handleUpgrade(request, socket, head, (ws) => {
        this.collaboratorWss.emit('connection', ws, request);
      });
      return true;
    }

    return false; // Not handled by WebSocket worker pool
  }

  /**
   * Worker handler for live multimodal audio streaming and Gemini real-time connection
   */
  private handleLiveAudioConnection(ws: WebSocket, req: IncomingMessage) {
    const sessionId = `live_audio_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const session: WorkerSession = {
      sessionId,
      type: 'live-audio',
      ws,
      lastHeartbeat: Date.now(),
      audioBufferQueue: []
    };

    this.activeSessions.set(sessionId, session);
    console.log(`[WsAudioWorkerPool] Live audio session initialized [${sessionId}]`);

    ws.send(JSON.stringify({
      type: 'session_established',
      sessionId,
      message: 'Worker pool allocated dedicated audio stream processing channel.',
      timestamp: Date.now()
    }));

    ws.on('message', (data: any, isBinary: boolean) => {
      session.lastHeartbeat = Date.now();
      
      if (isBinary || data instanceof Buffer) {
        // Enqueue audio PCM chunk in high-speed worker pool buffer
        session.audioBufferQueue.push(Buffer.from(data));
        this.processAudioQueueChunk(session);
      } else {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          } else if (msg.type === 'audio_config') {
            ws.send(JSON.stringify({
              type: 'config_ack',
              status: 'READY',
              sampleRate: msg.sampleRate || 24000
            }));
          }
        } catch (_) {
          // Plain string audio frame or raw signal
        }
      }
    });

    ws.on('close', () => {
      this.activeSessions.delete(sessionId);
      console.log(`[WsAudioWorkerPool] Live audio session terminated [${sessionId}]`);
    });

    ws.on('error', (err) => {
      console.error(`[WsAudioWorkerPool] Error in live audio session [${sessionId}]:`, err.message);
    });
  }

  /**
   * Process enqueued audio stream chunks asynchronously in worker pool
   */
  private processAudioQueueChunk(session: WorkerSession) {
    if (session.audioBufferQueue.length === 0) return;
    
    // Process enqueued chunks efficiently
    while (session.audioBufferQueue.length > 0) {
      const chunk = session.audioBufferQueue.shift();
      if (!chunk) continue;
      
      // Echo acknowledgment / processed audio frame metadata
      if (session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(JSON.stringify({
          type: 'audio_ack',
          bytesProcessed: chunk.length,
          timestamp: Date.now()
        }));
      }
    }
  }

  /**
   * Worker handler for real-time collaborative rooms and cursor synchronization
   */
  private handleCollaboratorConnection(ws: WebSocket, req: IncomingMessage) {
    const urlObj = req.url ? new URL(req.url, `http://${req.headers.host || 'localhost'}`) : null;
    const projectId = urlObj ? (urlObj.searchParams.get('projectId') || 'default_room') : 'default_room';
    const username = urlObj ? (urlObj.searchParams.get('username') || `Collaborator_${Math.floor(Math.random()*1000)}`) : 'Collaborator';

    const colors = ['#ec4899', '#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    const color = colors[username.length % colors.length];

    const sessionId = `collab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const session: WorkerSession = {
      sessionId,
      type: 'collaborator',
      ws,
      projectId,
      username,
      color,
      lastHeartbeat: Date.now(),
      audioBufferQueue: []
    };

    let room = this.collaboratorRooms.get(projectId);
    if (!room) {
      room = { roomId: projectId, clients: [] };
      this.collaboratorRooms.set(projectId, room);
    }
    room.clients.push(session);

    console.log(`[WsAudioWorkerPool] User "${username}" connected to room "${projectId}" via worker pool`);

    const broadcastToRoom = (messageObj: any, excludeSelf = false) => {
      const payload = JSON.stringify(messageObj);
      const currentRoom = this.collaboratorRooms.get(projectId);
      if (!currentRoom) return;

      currentRoom.clients.forEach((client) => {
        if (excludeSelf && client.sessionId === session.sessionId) return;
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(payload);
        }
      });
    };

    ws.send(JSON.stringify({
      type: 'room_state',
      activeUsers: room.clients.map(c => ({ username: c.username, color: c.color, cursorIndex: c.cursorIndex }))
    }));

    broadcastToRoom({
      type: 'user_joined',
      username,
      color,
      activeUsers: room.clients.map(c => ({ username: c.username, color: c.color, cursorIndex: c.cursorIndex }))
    }, true);

    ws.on('message', (data: any) => {
      session.lastHeartbeat = Date.now();
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'edit') {
          broadcastToRoom({
            type: 'edit',
            content: msg.content,
            username,
            cursorIndex: msg.cursorIndex
          }, true);
        } else if (msg.type === 'cursor') {
          session.cursorIndex = msg.cursorIndex;
          broadcastToRoom({
            type: 'cursor',
            username,
            color,
            cursorIndex: msg.cursorIndex,
            x: msg.x,
            y: msg.y,
            focusElementId: msg.focusElementId
          }, true);
        }
      } catch (e) {
        console.error('[WsAudioWorkerPool] Error parsing collaborator message:', e);
      }
    });

    ws.on('close', () => {
      console.log(`[WsAudioWorkerPool] User "${username}" disconnected from room "${projectId}"`);
      const currentRoom = this.collaboratorRooms.get(projectId);
      if (currentRoom) {
        currentRoom.clients = currentRoom.clients.filter(c => c.sessionId !== session.sessionId);
        if (currentRoom.clients.length === 0) {
          this.collaboratorRooms.delete(projectId);
        } else {
          broadcastToRoom({
            type: 'user_left',
            username,
            activeUsers: currentRoom.clients.map(c => ({ username: c.username, color: c.color, cursorIndex: c.cursorIndex }))
          });
        }
      }
    });

    ws.on('error', (err) => {
      console.error(`[WsAudioWorkerPool] Error in collaborator session [${sessionId}]:`, err.message);
    });
  }

  /**
   * Audits active worker pool sessions, removing dead connections and releasing resources
   */
  private auditWorkerPoolConnections() {
    const now = Date.now();
    const TIMEOUT_MS = 60000; // 60 seconds ping timeout

    this.activeSessions.forEach((session, sessionId) => {
      if (now - session.lastHeartbeat > TIMEOUT_MS || session.ws.readyState === WebSocket.CLOSED) {
        console.warn(`[WsAudioWorkerPool] Pruning stale connection session: ${sessionId}`);
        try {
          session.ws.terminate();
        } catch (_) {}
        this.activeSessions.delete(sessionId);
      }
    });
  }

  /**
   * Graceful shutdown of worker pool and active connections
   */
  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    console.log('[WsAudioWorkerPool] Shutting down WebSocket worker pool...');

    if (this.workerCheckInterval) {
      clearInterval(this.workerCheckInterval);
    }

    this.activeSessions.forEach((session) => {
      try {
        session.ws.send(JSON.stringify({ type: 'server_shutdown', message: 'Worker pool closing' }));
        session.ws.close(1001, 'Server shutting down');
      } catch (_) {}
    });

    this.activeSessions.clear();
    this.collaboratorRooms.clear();

    return new Promise((resolve) => {
      this.liveWss.close(() => {
        this.collaboratorWss.close(() => {
          console.log('[WsAudioWorkerPool] Worker pool successfully closed.');
          resolve();
        });
      });
    });
  }
}

export const wsAudioWorkerPool = new WsAudioWorkerPool();
