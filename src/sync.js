import { loadRecords, saveRecords, KEY, GOALS_KEY } from './data.js';

const SYNC_KEY = 'dairy_sync_url';
const POLL_INTERVAL = 15000;

let _pollTimer = null;
let _onStatusChange = null;

export function getSyncUrl() {
  return localStorage.getItem(SYNC_KEY) || '';
}

export function setSyncUrl(url) {
  url = url.replace(/\/+$/, '');
  localStorage.setItem(SYNC_KEY, url);
  return url;
}

export function clearSyncUrl() {
  localStorage.removeItem(SYNC_KEY);
}

async function api(path, method = 'GET', body = null) {
  const base = getSyncUrl();
  if (!base) return { error: 'No server configured' };
  try {
    const opts = { method, headers: {} };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(base + path, opts);
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    return data;
  } catch (e) {
    return { error: e.message || 'Connection failed' };
  }
}

export async function checkConnection() {
  const result = await api('/api/health');
  return !result.error;
}

export async function fetchRemoteData() {
  const result = await api('/api/data');
  if (result.error) return null;
  return Array.isArray(result) ? result : null;
}

export async function fetchRemoteGoals() {
  const result = await api('/api/goals');
  if (result.error || !result || typeof result !== 'object') return null;
  return result;
}

export async function pushData(records) {
  const result = await api('/api/data', 'POST', records);
  return !result.error;
}

export async function pushGoals(goals) {
  const result = await api('/api/goals', 'POST', goals);
  return !result.error;
}

export async function syncAll() {
  // Push local → remote (local is source of truth after edits)
  const local = loadRecords();
  await pushData(local);

  // Also fetch remote to see if anything changed (last-write-wins is fine)
  const remote = await fetchRemoteData();
  if (remote && remote.length !== local.length) {
    const merged = mergeByDate(local, remote);
    saveRecords(merged);
    window.__records = merged;
    return merged;
  }
  return null;
}

function mergeByDate(local, remote) {
  const map = {};
  local.forEach(r => map[r.date] = r);
  remote.forEach(r => { if (!map[r.date]) map[r.date] = r; });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

export function onServerStatusChange(cb) {
  _onStatusChange = cb;
}

export function startAutoSync() {
  stopAutoSync();
  if (!getSyncUrl()) return;
  _pollTimer = setInterval(async () => {
    const connected = await checkConnection();
    if (connected) {
      const remote = await fetchRemoteData();
      const local = loadRecords();
      if (remote && remote.length !== local.length) {
        const merged = mergeByDate(local, remote);
        saveRecords(merged);
        window.__records = merged;
        if (_onStatusChange) _onStatusChange('synced', merged.length);
      }
    }
    if (_onStatusChange) _onStatusChange(connected ? 'connected' : 'disconnected');
  }, POLL_INTERVAL);
}

export function stopAutoSync() {
  if (_pollTimer) clearInterval(_pollTimer);
  _pollTimer = null;
}

export async function saveWithSync(records) {
  saveRecords(records);
  if (getSyncUrl()) {
    await pushData(records);
  }
}
