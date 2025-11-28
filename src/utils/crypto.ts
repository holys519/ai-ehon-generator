// 簡易的な暗号化・復号化ユーティリティ
// 注意: これは完全なセキュリティを提供するものではありません
// 本番環境ではサーバーサイドでAPIキーを管理することを推奨します

const ENCRYPTION_KEY = 'storybook-creator-2024';

export const encryptApiKey = (apiKey: string): string => {
  try {
    // Base64エンコード + 簡易XOR暗号化
    const encoded = btoa(apiKey);
    let result = '';
    for (let i = 0; i < encoded.length; i++) {
      result += String.fromCharCode(
        encoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    return btoa(result);
  } catch {
    return '';
  }
};

export const decryptApiKey = (encrypted: string): string => {
  try {
    const decoded = atob(encrypted);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    return atob(result);
  } catch {
    return '';
  }
};

const API_KEY_STORAGE_KEY = 'gemini-api-key-encrypted';

export const saveApiKey = (apiKey: string): void => {
  const encrypted = encryptApiKey(apiKey);
  sessionStorage.setItem(API_KEY_STORAGE_KEY, encrypted);
};

export const getApiKey = (): string | null => {
  const encrypted = sessionStorage.getItem(API_KEY_STORAGE_KEY);
  if (!encrypted) return null;
  return decryptApiKey(encrypted);
};

export const clearApiKey = (): void => {
  sessionStorage.removeItem(API_KEY_STORAGE_KEY);
};

