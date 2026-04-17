import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

// Mock env
process.env['JWT_ACCESS_SECRET'] = 'test-access-secret';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret';
process.env['JWT_ACCESS_EXPIRES_IN'] = '15m';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
process.env['DATABASE_URL'] = 'postgresql://test';
process.env['NODE_ENV'] = 'test';

const mockPayload = { userId: 'user-123', email: 'test@test.com', role: 'USER' as const };

describe('JWT utilities', () => {
  test('signAccessToken returns a string', () => {
    const token = signAccessToken(mockPayload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  });

  test('signRefreshToken returns a string', () => {
    const token = signRefreshToken(mockPayload);
    expect(typeof token).toBe('string');
  });

  test('verifyRefreshToken decodes payload correctly', () => {
    const token = signRefreshToken(mockPayload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(mockPayload.userId);
    expect(decoded.email).toBe(mockPayload.email);
    expect(decoded.role).toBe(mockPayload.role);
  });

  test('verifyRefreshToken throws on invalid token', () => {
    expect(() => verifyRefreshToken('invalid.token.here')).toThrow();
  });

  test('access token and refresh token are different', () => {
    const access = signAccessToken(mockPayload);
    const refresh = signRefreshToken(mockPayload);
    expect(access).not.toBe(refresh);
  });
});

describe('bcrypt password hashing', () => {
  const password = 'Password1';

  test('hash is different from original password', async () => {
    const hash = await bcrypt.hash(password, 10);
    expect(hash).not.toBe(password);
  });

  test('compare returns true for correct password', async () => {
    const hash = await bcrypt.hash(password, 10);
    const valid = await bcrypt.compare(password, hash);
    expect(valid).toBe(true);
  });

  test('compare returns false for wrong password', async () => {
    const hash = await bcrypt.hash(password, 10);
    const valid = await bcrypt.compare('WrongPassword', hash);
    expect(valid).toBe(false);
  });
});
