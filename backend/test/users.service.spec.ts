import { DataSource } from 'typeorm';
import { UsersService } from '../src/users/users.service';
import { User } from '../src/users/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('UsersService (basic)', () => {
  let ds: DataSource;
  let repo: Repository<User>;
  let service: UsersService;

  beforeAll(async () => {
    ds = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [User],
      synchronize: true
    });
    await ds.initialize();
    repo = ds.getRepository(User);
    // @ts-expect-error - Mock repository for testing
    service = new UsersService(repo);
  });

  afterAll(async () => {
    await ds.destroy();
  });

  beforeEach(async () => {
    // Clear database before each test
    await repo.clear();
  });

  describe('create', () => {
    it('creates a user with hashed password', async () => {
      const dto: { email: string; password: string; name: string } = { email: 'test@uss.cl', password: 'pass123', name: 'Test' };
      const created = await service.create(dto);
      expect(created.id).toBeGreaterThan(0);
      expect(created.email).toBe(dto.email);
      expect(created.name).toBe(dto.name);
      expect(created.role).toBe('student');
      
      const found = await repo.findOneBy({ id: created.id });
      expect(found.email).toBe(dto.email);
      const match = await bcrypt.compare(dto.password, found.passwordHash as string);
      expect(match).toBe(true);
    });

    it('creates admin user when role is specified', async () => {
      const dto: { email: string; password: string; name: string; role: string } = { email: 'admin@uss.cl', password: 'admin123', name: 'Admin', role: 'admin' };
      const created = await service.create(dto);
      expect(created.role).toBe('admin');
    });

    it('handles duplicate email', async () => {
      const dto: { email: string; password: string; name: string } = { email: 'duplicate@uss.cl', password: 'pass123', name: 'Test' };
      await service.create(dto);
      
      await expect(service.create(dto)).rejects.toThrow();
    });

    it('handles invalid email format gracefully', async () => {
      const dto: { email: string; password: string; name: string } = { email: 'invalid-email', password: 'pass123', name: 'Test' };
      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.email).toBe('invalid-email');
    });

    it('validates required fields', async () => {
      const dto: { email: string } = { email: 'test@uss.cl' }; // Missing password and name
      await expect(service.create(dto)).rejects.toThrow();
    });
  });

  describe('findByEmail', () => {
    it('finds user by email', async () => {
      const dto: { email: string; password: string; name: string } = { email: 'find@uss.cl', password: 'pass123', name: 'Find User' };
      await service.create(dto);
      
      const found = await service.findByEmail(dto.email);
      expect(found).not.toBeNull();
      expect(found.email).toBe(dto.email);
    });

    it('returns null for non-existent email', async () => {
      const found = await service.findByEmail('nonexistent@uss.cl');
      expect(found).toBeNull();
    });

    it('handles case-sensitive email search', async () => {
      const dto: { email: string; password: string; name: string } = { email: 'CaseTest@uss.cl', password: 'pass123', name: 'Case Test' };
      await service.create(dto);
      
      const found = await service.findByEmail('CaseTest@uss.cl');
      expect(found).not.toBeNull();
      expect(found.email).toBe('CaseTest@uss.cl');
    });
  });

  describe('findByEmail edge cases', () => {
    it('handles empty email', async () => {
      const found = await service.findByEmail('');
      expect(found).toBeNull();
    });

    it('handles null email', async () => {
      const found = await service.findByEmail(null as unknown);
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('updates user information', async () => {
      const dto: { email: string; password: string; name: string } = { email: 'update@uss.cl', password: 'pass123', name: 'Update Test' };
      await service.create(dto);
      
      const updateData = { name: 'Updated Name', role: 'admin' };
      const updated = await service.update(created.id, updateData);
      
      expect(updated.name).toBe('Updated Name');
      expect(updated.role).toBe('admin');
    });

    it('handles update with non-existent ID', async () => {
      const updateData = { name: 'Updated Name' };
      const result = await service.update(999, updateData);
      expect(result).toBeNull();
    });
  });

  describe('additional create scenarios', () => {
    it('creates user with different roles', async () => {
      const dto: { email: string; password: string; name: string; role: string } = { email: 'admin@uss.cl', password: 'admin123', name: 'Admin User', role: 'admin' };
      await service.create(dto);
      expect(created.role).toBe('admin');
    });

    it('handles user creation with special characters in name', async () => {
      const dto: { email: string; password: string; name: string } = { email: 'special@uss.cl', password: 'pass123', name: 'José María' };
      await service.create(dto);
      expect(created.name).toBe('José María');
    });
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      const users = [
        { email: 'user1@uss.cl', password: 'pass123', name: 'User 1' },
        { email: 'user2@uss.cl', password: 'pass123', name: 'User 2' },
        { email: 'user3@uss.cl', password: 'pass123', name: 'User 3' }
      ];
      
      for (const user of users) {
        await service.create(user);
      }
      
      const allUsers = await service.findAll();
      expect(allUsers).toHaveLength(3);
    });

    it('returns empty array when no users exist', async () => {
      const allUsers = await service.findAll();
      expect(allUsers).toHaveLength(0);
    });
  });
});
