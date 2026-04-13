import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { VERSION } from './version.js';

const CACHE_PATH = join(homedir(), '.huddy', 'update-check.json');
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24시간
const FETCH_TIMEOUT_MS = 3000; // registry 응답 3초 제한
const REGISTRY_URL = 'https://registry.npmjs.org/@7apislaz/huddy/latest';

interface UpdateCache {
  lastCheck: number;
  latestVersion: string | null;
}

function loadCache(): UpdateCache {
  try {
    if (!existsSync(CACHE_PATH)) return { lastCheck: 0, latestVersion: null };
    return JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
  } catch {
    return { lastCheck: 0, latestVersion: null };
  }
}

function saveCache(cache: UpdateCache): void {
  try {
    mkdirSync(join(homedir(), '.huddy'), { recursive: true });
    writeFileSync(CACHE_PATH, JSON.stringify(cache) + '\n', 'utf8');
  } catch {
    // 캐시 저장 실패는 무시
  }
}

/** 버전 비교: a > b이면 true */
function isNewer(latest: string, current: string): boolean {
  const l = latest.split('.').map(Number);
  const c = current.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] ?? 0) > (c[i] ?? 0)) return true;
    if ((l[i] ?? 0) < (c[i] ?? 0)) return false;
  }
  return false;
}

/**
 * npm registry에서 최신 버전 확인.
 * 24시간에 1회만 실제 네트워크 호출, 나머지는 캐시 사용.
 * 에러 시 null 반환 (CLI 동작에 영향 없음).
 */
export async function checkForUpdate(): Promise<string | null> {
  try {
    const cache = loadCache();

    // 캐시가 유효하면 네트워크 호출 생략
    if (Date.now() - cache.lastCheck < CHECK_INTERVAL_MS) {
      if (cache.latestVersion && isNewer(cache.latestVersion, VERSION)) {
        return cache.latestVersion;
      }
      return null;
    }

    // npm registry에서 최신 버전 가져오기
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(REGISTRY_URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      // 체크 실패해도 캐시 시간 갱신 (재시도 폭주 방지)
      saveCache({ lastCheck: Date.now(), latestVersion: null });
      return null;
    }

    const data = await res.json() as { version?: string };
    const latest = data.version ?? null;

    saveCache({ lastCheck: Date.now(), latestVersion: latest });

    if (latest && isNewer(latest, VERSION)) {
      return latest;
    }
    return null;
  } catch {
    return null;
  }
}
