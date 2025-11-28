import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check, AlertCircle, Trash2 } from 'lucide-react';
import { saveApiKey, getApiKey, clearApiKey } from '../utils/crypto';

interface ApiKeySettingsProps {
  onApiKeySet: (hasKey: boolean) => void;
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const storedKey = getApiKey();
    if (storedKey) {
      setHasStoredKey(true);
      setApiKey('');
      onApiKeySet(true);
    }
  }, [onApiKeySet]);

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'APIキーを入力してください' });
      return;
    }

    if (!apiKey.startsWith('AIza')) {
      setMessage({ type: 'error', text: '有効なGoogle APIキーを入力してください' });
      return;
    }

    saveApiKey(apiKey.trim());
    setHasStoredKey(true);
    setApiKey('');
    setMessage({ type: 'success', text: 'APIキーを保存しました（セッション中のみ有効）' });
    onApiKeySet(true);

    setTimeout(() => setMessage(null), 3000);
  };

  const handleClearKey = () => {
    if (window.confirm('APIキーを削除しますか？')) {
      clearApiKey();
      setHasStoredKey(false);
      setMessage({ type: 'success', text: 'APIキーを削除しました' });
      onApiKeySet(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Key className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-gray-800">Google Gemini APIキー設定</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        AI生成機能を使用するには、Google AI StudioでAPIキーを取得してください。
        <a 
          href="https://aistudio.google.com/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-indigo-600 hover:underline ml-1"
        >
          APIキーを取得 →
        </a>
      </p>

      {hasStoredKey ? (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700">
            <Check className="w-5 h-5" />
            <span>APIキーが設定されています</span>
          </div>
          <button
            onClick={handleClearKey}
            className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            削除
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button
            onClick={handleSaveKey}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            APIキーを保存
          </button>
        </div>
      )}

      {message && (
        <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-700">
          ⚠️ セキュリティについて: APIキーはセッションストレージに暗号化して保存されます。
          ブラウザを閉じると削除されます。本番環境ではサーバーサイドでの管理を推奨します。
        </p>
      </div>
    </div>
  );
};

