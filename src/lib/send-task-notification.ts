export interface NotificationProvider {
  send: (recipient: string, message: string) => Promise<void>;
}

/**
 * Sends a notification about a task to the recipient using the provided provider.
 * Requires the environment variable `NOTIFICATION_API_KEY` to be set.
 */
export async function sendTaskNotification(
  provider: NotificationProvider,
  recipient: string,
  message: string
): Promise<void> {
  const apiKey = process.env.NOTIFICATION_API_KEY;
  if (!apiKey) {
    throw new Error('NOTIFICATION_API_KEY is not defined');
  }

  await provider.send(recipient, message);
}
