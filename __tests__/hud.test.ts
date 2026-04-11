import { describe, it, expect } from 'vitest';
import { renderHUD } from '../src/hud.js';
import type { HUDData, HuddyConfig } from '../src/types.js';

const baseConfig: HuddyConfig = { hudEnabled: true, lang: 'en' };

const baseData: HUDData = {
  contextPercent: null,
  rateLimit5h: null,
  rateLimit7d: null,
  sessionDurationMs: 0,
};

describe('renderHUD', () => {
  it('returns empty string when hudEnabled is false', () => {
    const result = renderHUD(baseData, { ...baseConfig, hudEnabled: false });
    expect(result).toBe('');
  });

  it('includes version string', () => {
    const result = renderHUD(baseData, baseConfig);
    expect(result).toContain('huddy#');
  });

  it('shows context percentage when provided', () => {
    const result = renderHUD({ ...baseData, contextPercent: 45 }, baseConfig);
    expect(result).toContain('45%');
  });

  it('shows rate limit 5h when provided', () => {
    const result = renderHUD(
      { ...baseData, rateLimit5h: { percent: 30, resetsAt: null } },
      baseConfig,
    );
    expect(result).toContain('30%');
  });

  it('shows session duration when > 0', () => {
    const result = renderHUD(
      { ...baseData, sessionDurationMs: 90 * 60_000 },
      baseConfig,
    );
    expect(result).toContain('1h30m');
  });

  it('shows minutes only for sub-hour sessions', () => {
    const result = renderHUD(
      { ...baseData, sessionDurationMs: 42 * 60_000 },
      baseConfig,
    );
    expect(result).toContain('42m');
  });

  it('does not show session when sessionDurationMs is 0', () => {
    const result = renderHUD({ ...baseData, sessionDurationMs: 0 }, baseConfig);
    expect(result).not.toContain('session:');
  });
});
