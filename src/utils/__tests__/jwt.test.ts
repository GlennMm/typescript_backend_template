import { describe, test, expect } from 'bun:test';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../jwt';

describe('JWT Utils', () => {
  test('should generate and verify access token', () => {
    const payload = {
      userId: 'user123',
      role: 'TenantUser' as const,
      tenantId: 'tenant123',
    };

    const token = generateAccessToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.tenantId).toBe(payload.tenantId);
  });

  test('should generate and verify refresh token', () => {
    const payload = {
      userId: 'user123',
      tokenId: 'token123',
      role: 'TenantAdmin' as const,
      tenantId: 'tenant123',
    };

    const token = generateRefreshToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.tokenId).toBe(payload.tokenId);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.tenantId).toBe(payload.tenantId);
  });

  test('should throw error for invalid token', () => {
    const invalidToken = 'invalid.token.here';

    expect(() => verifyAccessToken(invalidToken)).toThrow();
  });

  test('should handle SuperAdmin payload without tenantId', () => {
    const payload = {
      userId: 'user123',
      role: 'SuperAdmin' as const,
    };

    const token = generateAccessToken(payload);
    expect(token).toBeDefined();

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.tenantId).toBeUndefined();
  });
});
