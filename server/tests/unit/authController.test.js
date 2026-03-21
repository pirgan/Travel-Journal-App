import { describe, it, expect, vi, beforeEach } from 'vitest';

// bcryptjs is mocked; the factory below simulates the User model's pre-save hook
// so we can assert on genSalt/hash call args without hitting real crypto.
vi.mock('bcryptjs');

vi.mock('../../src/models/User.js', async () => {
  const { default: bcrypt } = await import('bcryptjs');
  return {
    default: {
      findOne: vi.fn(),
      create: vi.fn().mockImplementation(async (data) => {
        // Mirrors the User model's pre-save hook: genSalt(10) then hash
        const salt = await bcrypt.genSalt(10);
        await bcrypt.hash(data.password, salt);
        return { _id: 'uid1', name: data.name, email: data.email, profilePic: '' };
      }),
    },
  };
});

vi.mock('jsonwebtoken');

import User from '../../src/models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { register, login } from '../../src/controllers/authController.js';

const makeRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('authController', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    it('returns 201 and token on success', async () => {
      User.findOne.mockResolvedValue(null);
      jwt.sign.mockReturnValue('test-token');
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashed');

      const req = { body: { name: 'Alice', email: 'alice@test.com', password: 'pass123' } };
      const res = makeRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'test-token' }),
      );
    });

    it('returns 409 when email already registered', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing' });

      const req = { body: { name: 'Alice', email: 'alice@test.com', password: 'pass123' } };
      const res = makeRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
      );
    });

    it('returns 400 when name is missing', async () => {
      const req = { body: { email: 'alice@test.com', password: 'pass123' } };
      const res = makeRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when email is missing', async () => {
      const req = { body: { name: 'Alice', password: 'pass123' } };
      const res = makeRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when password is missing', async () => {
      const req = { body: { name: 'Alice', email: 'alice@test.com' } };
      const res = makeRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('calls bcrypt.genSalt with 10 rounds', async () => {
      User.findOne.mockResolvedValue(null);
      jwt.sign.mockReturnValue('tok');
      bcrypt.genSalt.mockResolvedValue('fakeSalt');
      bcrypt.hash.mockResolvedValue('$2b$10$fakeHash');

      const req = { body: { name: 'Alice', email: 'alice@test.com', password: 'pass123' } };
      await register(req, makeRes());

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    });

    it('calls bcrypt.hash with the plain password and derived salt', async () => {
      User.findOne.mockResolvedValue(null);
      jwt.sign.mockReturnValue('tok');
      bcrypt.genSalt.mockResolvedValue('fakeSalt');
      bcrypt.hash.mockResolvedValue('$2b$10$fakeHash');

      const req = { body: { name: 'Alice', email: 'alice@test.com', password: 'pass123' } };
      await register(req, makeRes());

      expect(bcrypt.hash).toHaveBeenCalledWith('pass123', 'fakeSalt');
    });

    it('signs JWT with { id } payload, JWT_SECRET and 30d expiry', async () => {
      process.env.JWT_SECRET = 'test-secret';
      User.findOne.mockResolvedValue(null);
      jwt.sign.mockReturnValue('signed-token');
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashed');

      const req = { body: { name: 'Alice', email: 'alice@test.com', password: 'pass123' } };
      await register(req, makeRes());

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'uid1' },
        'test-secret',
        { expiresIn: '30d' },
      );
    });

    it('response includes _id, name, email and profilePic fields', async () => {
      User.findOne.mockResolvedValue(null);
      jwt.sign.mockReturnValue('tok');
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashed');

      const req = { body: { name: 'Alice', email: 'alice@test.com', password: 'pass123' } };
      const res = makeRes();
      await register(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'uid1',
          name: 'Alice',
          email: 'alice@test.com',
          profilePic: '',
        }),
      );
    });
  });

  // ─── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    const mockUser = {
      _id: 'uid1',
      name: 'Alice',
      email: 'alice@test.com',
      profilePic: '',
      matchPassword: vi.fn(),
    };

    it('returns 200 with token on valid credentials', async () => {
      User.findOne.mockResolvedValue(mockUser);
      mockUser.matchPassword.mockResolvedValue(true);
      jwt.sign.mockReturnValue('login-token');

      const req = { body: { email: 'alice@test.com', password: 'pass123' } };
      const res = makeRes();

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'login-token' }),
      );
    });

    it('returns 400 when fields are missing', async () => {
      const req = { body: { email: 'alice@test.com' } };
      const res = makeRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 on wrong password', async () => {
      User.findOne.mockResolvedValue(mockUser);
      mockUser.matchPassword.mockResolvedValue(false);

      const req = { body: { email: 'alice@test.com', password: 'wrong' } };
      const res = makeRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 when user not found', async () => {
      User.findOne.mockResolvedValue(null);

      const req = { body: { email: 'nobody@test.com', password: 'pass' } };
      const res = makeRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
