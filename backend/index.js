// ============================================================================
// ZENFOCUS BACKEND SERVICE & SUPABASE API GATEWAY (Node.js)
// Implements server-side endpoints, database health probe, and policy dispatch
// ============================================================================

import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env or root .env
function loadEnv() {
  const envFiles = [
    resolve(__dirname, '.env'),
    resolve(__dirname, '..', '.env')
  ];

  for (const file of envFiles) {
    if (existsSync(file)) {
      const content = readFileSync(file, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
    }
  }
}

loadEnv();

const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

// CORS and response helpers
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Root / Status
  if (req.method === 'GET' && (pathname === '/' || pathname === '/health')) {
    sendJson(res, 200, {
      service: 'zenfocus-backend',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      supabaseConfigured: Boolean(SUPABASE_URL && SUPABASE_KEY)
    });
    return;
  }

  // Database Connection Health Check via Supabase RPC
  if (req.method === 'GET' && pathname === '/api/health') {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_connection`, {
        method: 'POST',
        headers: supabaseHeaders
      });

      if (response.ok) {
        const dbStatus = await response.json();
        sendJson(res, 200, {
          databaseStatus: 'CONNECTED',
          supabaseUrl: SUPABASE_URL,
          serverMetadata: dbStatus[0] || dbStatus
        });
      } else {
        const errText = await response.text();
        sendJson(res, 502, {
          databaseStatus: 'ERROR',
          statusCode: response.status,
          error: errText
        });
      }
    } catch (err) {
      sendJson(res, 500, {
        databaseStatus: 'UNREACHABLE',
        error: err.message
      });
    }
    return;
  }

  // Query Restriction Policies
  if (req.method === 'GET' && pathname === '/api/policies') {
    try {
      const deviceId = url.searchParams.get('deviceId');
      let targetUrl = `${SUPABASE_URL}/rest/v1/restriction_policies?select=*`;
      if (deviceId) {
        targetUrl += `&target_device_id=eq.${encodeURIComponent(deviceId)}`;
      }

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: supabaseHeaders
      });

      const data = await response.json();
      sendJson(res, response.status, data);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // Fallback 404
  sendJson(res, 404, { error: 'Route not found' });
});

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(__filename);
if (isMain) {
  server.listen(PORT, () => {
    console.log(`[ZenFocus Backend] Server listening on port ${PORT}`);
    console.log(`[ZenFocus Backend] Target Supabase URL: ${SUPABASE_URL}`);
  });
}

export default server;

