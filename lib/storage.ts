import {v4 as uuidv4} from 'uuid';

export interface SecretMessage {
  id: string;
  encryptedContent: string;
  createdAt: number;
  expiresAt: number;
  passwordProtected: boolean;
}

const STORAGE_KEY = 'secret_messages';

export const storeSecret = (
  encryptedContent: string,
  expiresIn: number,
  passwordProtected: boolean = false
): string => {
  try {
    const id = uuidv4();
    const now = Date.now();

    const message: SecretMessage = {
      id,
      encryptedContent,
      createdAt: now,
      expiresAt: now + expiresIn,
      passwordProtected,
    };

    const existingData = localStorage.getItem(STORAGE_KEY);
    const messages: Record<string, SecretMessage> = existingData
      ? JSON.parse(existingData)
      : {};

    messages[id] = message;

    const cleanedMessages = Object.entries(messages).reduce(
      (acc, [key, msg]) => {
        if (msg.expiresAt > now) {
          acc[key] = msg;
        }
        return acc;
      },
      {} as Record<string, SecretMessage>
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedMessages));

    return id;
  } catch (error) {
    console.error("Error storing secret:", error);
    throw new Error("Failed to store secret message");
  }
};

export const retrieveAndDestroySecret = (id: string): SecretMessage | null => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    if (!existingData) return null;
    const messages: Record<string, SecretMessage> = JSON.parse(existingData);
    const message = messages[id];

    if (!message || message.expiresAt < Date.now()) {
      return null;
    }

    delete messages[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    return message;

  } catch (error) {
    console.error("Error retrieving secret:", error);
    return null;
  }
};

export const checkMessageExists = (id: string): boolean => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    if (!existingData) return false;
    const messages: Record<string, SecretMessage> = JSON.parse(existingData);
    const message = messages[id];
    if (!message || message.expiresAt < Date.now()) {
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error checking message:", error);
    return false;
  }
};

export const cleanupExpiredMessages = (): void => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    if (!existingData) return;

    const messages: Record<string, SecretMessage> = JSON.parse(existingData);
    const now = Date.now();

    const cleanedMessages = Object.entries(messages).reduce(
      (acc, [key, msg]) => {
        if (msg.expiresAt > now) {
          acc[key] = msg;
        }
        return acc;
      },
      {} as Record<string, SecretMessage>
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedMessages));
  } catch (error) {
    console.error("Error cleaning up expired messages:", error);
  }
};