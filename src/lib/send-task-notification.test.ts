import { sendTaskNotification, NotificationProvider } from './send-task-notification';

describe('sendTaskNotification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('calls provider.send with the given message', async () => {
    process.env.NOTIFICATION_API_KEY = 'test-key';
    const mockProvider: NotificationProvider = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    await sendTaskNotification(mockProvider, 'user@example.com', 'Nova tarefa atribuída');

    expect(mockProvider.send).toHaveBeenCalledWith(
      'user@example.com',
      'Nova tarefa atribuída'
    );
  });

  it('throws when NOTIFICATION_API_KEY is missing', async () => {
    delete process.env.NOTIFICATION_API_KEY;
    const mockProvider: NotificationProvider = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    await expect(
      sendTaskNotification(mockProvider, 'user@example.com', 'Mensagem')
    ).rejects.toThrow('NOTIFICATION_API_KEY is not defined');
  });
});
