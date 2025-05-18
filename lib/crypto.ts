// Using Web Crypto API for encryption/decryption
// This handles client-side encryption of messages

/**
 * Generates a random encryption key
 */
export const generateKey = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

/**
 * Encrypts text using a provided key
 */
export const encryptMessage = async (text: string, key: string): Promise<string> => {
  try {
    const encodedText = new TextEncoder().encode(text);
    const encodedKey = new TextEncoder().encode(key);
    
    // Derive key from password
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encodedKey,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    
    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Derive an AES-GCM key using PBKDF2
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    
    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      derivedKey,
      encodedText
    );
    
    // Combine the salt, IV, and encrypted data into a single array
    const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encryptedData), salt.length + iv.length);
    
    // Convert to Base64 for URL-safe storage
    return btoa(String.fromCharCode(...Array.from(result)));
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt message");
  }
};

/**
 * Decrypts a message using a provided key
 */
export const decryptMessage = async (encrypted: string, key: string): Promise<string> => {
  try {
    // Convert from Base64
    const data = new Uint8Array(
      atob(encrypted)
        .split("")
        .map((char) => char.charCodeAt(0))
    );
    
    const encodedKey = new TextEncoder().encode(key);
    
    // Extract salt, IV, and encrypted data
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encryptedData = data.slice(28);
    
    // Derive key from password
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encodedKey,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    
    // Derive the same key using PBKDF2
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    
    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      derivedKey,
      encryptedData
    );
    
    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt message. It may have been tampered with or the password is incorrect.");
  }
};