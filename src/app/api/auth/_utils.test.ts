import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeToken, verifyToken, COOKIE_NAME, COOKIE_MAX_AGE } from './_utils';

// _utils.ts 内部通过 process.env.AUTH_SECRET 签名
const SECRET = 'test-secret-0123456789abcdef';

describe('auth token', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = SECRET;
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.AUTH_SECRET;
  });

  it('makeToken 生成格式为 payload.signature 两段', () => {
    const token = makeToken();
    expect(token.split('.')).toHaveLength(2);
  });

  it('makeToken 生成的 token 可通过 verifyToken', () => {
    const token = makeToken();
    expect(verifyToken(token)).toBe(true);
  });

  it('verifyToken 对 null/undefined/非字符串返回 false', () => {
    expect(verifyToken(undefined)).toBe(false);
    expect(verifyToken(null)).toBe(false);
    // @ts-expect-error 测试非法输入
    expect(verifyToken(123)).toBe(false);
  });

  it('verifyToken 对损坏 token 返回 false', () => {
    expect(verifyToken('')).toBe(false);
    expect(verifyToken('abc')).toBe(false);
    expect(verifyToken('a.b.c')).toBe(false);
    expect(verifyToken('payload-only')).toBe(false);
    expect(verifyToken('!!!.!!!')).toBe(false);
  });

  it('verifyToken 对篡改签名的 token 返回 false', () => {
    const token = makeToken();
    const [payload, sig] = token.split('.');
    // 篡改签名（最后一位翻转）
    const tampered = sig.endsWith('A') ? sig.slice(0, -1) + 'B' : sig.slice(0, -1) + 'A';
    expect(verifyToken(`${payload}.${tampered}`)).toBe(false);
  });

  it('verifyToken 对篡改 payload 的 token 返回 false', () => {
    const token = makeToken();
    const [payload] = token.split('.');
    const tampered = payload.endsWith('A') ? payload.slice(0, -1) + 'B' : payload.slice(0, -1) + 'A';
    // 原签名只对原 payload 有效
    const [, sig] = makeToken().split('.');
    expect(verifyToken(`${tampered}.${sig}`)).toBe(false);
  });

  it('COOKIE_MAX_AGE 为 7 天', () => {
    expect(COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 7);
  });

  it('COOKIE_NAME 为 auth_token', () => {
    expect(COOKIE_NAME).toBe('auth_token');
  });
});
