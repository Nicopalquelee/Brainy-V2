import { HealthController } from '../src/health/health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  describe('health', () => {
    it('should return health status', () => {
      const result = controller.health();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String)
      });
    });

    it('should return valid timestamp format', () => {
      const result = controller.health();
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should return consistent status', () => {
      const result1 = controller.health();
      const result2 = controller.health();

      expect(result1.status).toBe('ok');
      expect(result2.status).toBe('ok');
    });
  });

  describe('cors', () => {
    it('should return cors configuration', () => {
      const result = controller.cors();

      expect(result).toHaveProperty('cors');
      expect(typeof result.cors).toBe('string');
    });

    it('should return default cors when no env var', () => {
      const result = controller.cors();

      expect(result.cors).toBeDefined();
    });
  });
});
