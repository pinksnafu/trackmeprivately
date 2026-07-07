import { describe, test, expect, vi, beforeEach, afterEach, Mock } from 'vitest';

const mockDeleteMany = vi.fn();
const mockExecuteRaw = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      event = {
        deleteMany: mockDeleteMany,
      };
      $executeRawUnsafe = mockExecuteRaw;
      $disconnect = mockDisconnect;
    },
  };
});

describe('Prune Script', () => {
  const originalEnv = process.env;
  let exitSpy: Mock;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    exitSpy = vi.fn().mockImplementation(() => {
      throw new Error('process.exit called');
    });
    vi.stubGlobal('process', {
      ...process,
      exit: exitSpy,
    });
    vi.resetModules();

    // Default mock behaviors
    mockDeleteMany.mockResolvedValue({ count: 10 });
    mockExecuteRaw.mockResolvedValue(null);
    mockDisconnect.mockResolvedValue(null);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  test('should do nothing and disconnect if ANALYTICS_RETENTION_DAYS is not set', async () => {
    delete process.env.ANALYTICS_RETENTION_DAYS;
    
    const { main } = await import('../prune');
    await main();

    expect(mockDeleteMany).not.toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('should log error and exit if ANALYTICS_RETENTION_DAYS is invalid', async () => {
    process.env.ANALYTICS_RETENTION_DAYS = 'invalid-value';
    
    const { main } = await import('../prune');
    await expect(main()).rejects.toThrow('process.exit called');

    expect(mockDeleteMany).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('should run deleteMany and VACUUM when valid days configured', async () => {
    process.env.ANALYTICS_RETENTION_DAYS = '30';
    
    const { main } = await import('../prune');
    await main();

    expect(mockDeleteMany).toHaveBeenCalled();
    const deleteArgs = mockDeleteMany.mock.calls[0][0];
    expect(deleteArgs.where.createdAt.lt).toBeInstanceOf(Date);
    expect(mockExecuteRaw).toHaveBeenCalledWith('VACUUM;');
    expect(mockDisconnect).toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
