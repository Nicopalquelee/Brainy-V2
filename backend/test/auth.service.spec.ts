import { AuthService } from '../src/auth/auth.service';
import * as bcrypt from 'bcrypt';

describe('AuthService (unit)', () => {
  let service: AuthService;
  const mockUsersService: { findByEmail: jest.Mock } = {
    findByEmail: jest.fn()
  };

  beforeEach(() => {
    service = new AuthService(mockUsersService as unknown);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('returns null when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const res = await service.validateUser('no@user', 'pass');
      expect(res).toBeNull();
    });

    it('returns null when password does not match', async () => {
      const pwd = 'secret';
      const wrongPwd = 'wrong';
      const hash = await bcrypt.hash(pwd, 10);
      const user = { id: 1, email: 'a@b.com', passwordHash: hash, role: 'student' };
      mockUsersService.findByEmail.mockResolvedValue(user);
      const res = await service.validateUser(user.email, wrongPwd);
      expect(res).toBeNull();
    });

    it('returns user data when password matches', async () => {
      const pwd = 'secret';
      const hash = await bcrypt.hash(pwd, 10);
      const user = { id: 1, email: 'a@b.com', passwordHash: hash, role: 'student' };
      mockUsersService.findByEmail.mockResolvedValue(user);
      const res = await service.validateUser(user.email, pwd);
      expect(res).not.toBeNull();
      expect(res.email).toBe(user.email);
      expect((res as unknown).passwordHash).toBeUndefined();
    });

    it('handles bcrypt comparison errors', async () => {
      const user = { id: 1, email: 'a@b.com', passwordHash: 'invalid-hash', role: 'student' };
      mockUsersService.findByEmail.mockResolvedValue(user);
      const res = await service.validateUser(user.email, 'password');
      expect(res).toBeNull();
    });
  });

  describe('login', () => {
    it('returns an accessToken', async () => {
      const token = await service.login({ id: 5, email: 'x@x.com', role: 'student' } as unknown);
      expect(token).toHaveProperty('accessToken');
      expect(typeof token.accessToken).toBe('string');
    });

    it('generates different tokens for different users', async () => {
      const user1 = { id: 1, email: 'user1@test.com', role: 'student' };
      const user2 = { id: 2, email: 'user2@test.com', role: 'admin' };
      
      const token1 = await service.login(user1 as unknown);
      const token2 = await service.login(user2 as unknown);
      
      expect(token1.accessToken).not.toBe(token2.accessToken);
    });

    it('includes user information in token', async () => {
      const user = { id: 123, email: 'test@example.com', role: 'student' };
      const token = await service.login(user as unknown);
      
      // Decode JWT to verify payload
      const payload = JSON.parse(Buffer.from(token.accessToken.split('.')[1], 'base64').toString());
      expect(payload.sub).toBe(user.id);
      expect(payload.email).toBe(user.email);
      expect(payload.role).toBe(user.role);
    });
  });

  describe('additional login scenarios', () => {
    it('handles login with different user roles', async () => {
      const adminUser = { id: 2, email: 'admin@test.com', role: 'admin' };
      const token = await service.login(adminUser as unknown);
      
      expect(token).toHaveProperty('accessToken');
      expect(typeof token.accessToken).toBe('string');
    });

    it('handles login with missing user data gracefully', async () => {
      const incompleteUser = { id: 3, email: 'incomplete@test.com' };
      const token = await service.login(incompleteUser as unknown);
      
      expect(token).toHaveProperty('accessToken');
      expect(typeof token.accessToken).toBe('string');
    });
  });
});
