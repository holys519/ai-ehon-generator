import React, { useState, useRef } from 'react';
import { Plus, Image as ImageIcon, BookOpen, Check, Trash2, ZoomIn, ZoomOut, Book, X, Sparkles, GripVertical, Loader2 } from 'lucide-react';
import type { StoryPage, CoverData } from '../types';
import { generateImagePrompt, generateImage } from '../services/geminiService';
import { getApiKey } from '../utils/crypto';

interface EditorProps {
  title: string;
  setTitle: (title: string) => void;
  coverData: CoverData;
  setCoverData: (data: CoverData) => void;
  onAddPage: (image: string | null, imageScale: number, text: string) => void;
  onPreview: () => void;
  onFinish: () => void;
  pages: StoryPage[];
  onDeletePage?: (id: string) => void;
  onUpdatePage?: (id: string, updates: Partial<StoryPage>) => void;
  onReorderPages?: (pages: StoryPage[]) => void;
}

export const Editor: React.FC<EditorProps> = ({
  title,
  setTitle,
  coverData,
  setCoverData,
  onAddPage,
  onPreview,
  onFinish,
  pages,
  onDeletePage,
  onUpdatePage,
  onReorderPages
}) => {
  const [currentText, setCurrentText] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentImageScale, setCurrentImageScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  
  // ページ編集モーダル用の状態
  const [editingPage, setEditingPage] = useState<StoryPage | null>(null);
  const [editText, setEditText] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editImageScale, setEditImageScale] = useState(1);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  // ドラッグ&ドロップ用の状態
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // AI画像生成用の状態
  const [generatingImageFor, setGeneratingImageFor] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentImage(reader.result as string);
        setCurrentImageScale(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverData({
          ...coverData,
          image: reader.result as string,
          imageScale: 1
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPage = () => {
    if (!currentText && !currentImage) return;
    onAddPage(currentImage, currentImageScale, currentText);
    setCurrentText('');
    setCurrentImage(null);
    setCurrentImageScale(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ページ編集モーダルを開く
  const openEditModal = (page: StoryPage) => {
    setEditingPage(page);
    setEditText(page.text);
    setEditImage(page.image);
    setEditImageScale(page.imageScale);
  };

  // ページ編集モーダルを閉じる
  const closeEditModal = () => {
    setEditingPage(null);
    setEditText('');
    setEditImage(null);
    setEditImageScale(1);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  // 編集を保存
  const savePageEdit = () => {
    if (editingPage && onUpdatePage) {
      onUpdatePage(editingPage.id, {
        text: editText,
        image: editImage,
        imageScale: editImageScale
      });
      closeEditModal();
    }
  };

  // 編集モーダル用の画像アップロード
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImage(reader.result as string);
        setEditImageScale(1);
      };
      reader.readAsDataURL(file);
    }
  };

  // ドラッグ開始
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  // ドラッグオーバー
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  // ドラッグ終了
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // ドロップ
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex || !onReorderPages) return;

    const newPages = [...pages];
    const [draggedPage] = newPages.splice(draggedIndex, 1);
    newPages.splice(dropIndex, 0, draggedPage);
    onReorderPages(newPages);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // AI画像生成
  const handleGenerateImage = async (pageId: string, pageText: string, isEditModal: boolean = false) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      alert('APIキーが設定されていません。ホーム画面で設定してください。');
      return;
    }

    try {
      setGeneratingImageFor(pageId);

      // 画像プロンプトを生成
      const imagePrompt = await generateImagePrompt(
        apiKey,
        title || 'Children\'s storybook',
        pageText,
        []
      );

      // 画像を生成
      const generatedImage = await generateImage(apiKey, imagePrompt);

      if (isEditModal) {
        setEditImage(generatedImage);
        setEditImageScale(1);
      } else if (onUpdatePage) {
        onUpdatePage(pageId, { image: generatedImage, imageScale: 1 });
      }
    } catch (error) {
      console.error('画像生成エラー:', error);
      alert('画像生成に失敗しました。APIキーを確認してください。');
    } finally {
      setGeneratingImageFor(null);
    }
  };

  // 新規ページ用のAI画像生成
  const handleGenerateNewPageImage = async () => {
    if (!currentText) {
      alert('テキストを入力してから画像を生成してください。');
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      alert('APIキーが設定されていません。ホーム画面で設定してください。');
      return;
    }

    try {
      setGeneratingImageFor('new');

      const imagePrompt = await generateImagePrompt(
        apiKey,
        title || 'Children\'s storybook',
        currentText,
        []
      );

      const generatedImage = await generateImage(apiKey, imagePrompt);
      setCurrentImage(generatedImage);
      setCurrentImageScale(1);
    } catch (error) {
      console.error('画像生成エラー:', error);
      alert('画像生成に失敗しました。APIキーを確認してください。');
    } finally {
      setGeneratingImageFor(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 表紙設定セクション */}
      <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-xl border border-amber-200">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-5 h-5 text-amber-700" />
          <h2 className="text-lg font-bold text-amber-800">表紙の設定</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* タイトル入力 */}
          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">本のタイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトルを入力..."
              className="w-full text-2xl font-bold border-2 border-amber-300 focus:border-amber-500 rounded-lg outline-none px-4 py-3 transition-colors bg-white"
            />
          </div>

          {/* 表紙画像 */}
          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">表紙画像（任意）</label>
            <div 
              className={`border-2 border-dashed rounded-lg h-40 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                coverData.image ? 'border-amber-500 bg-amber-50' : 'border-amber-300 hover:border-amber-400 bg-white'
              }`}
              onClick={() => coverFileInputRef.current?.click()}
            >
              {coverData.image ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img 
                    src={coverData.image} 
                    alt="Cover Preview" 
                    className="max-h-full max-w-full object-contain"
                    style={{ transform: `scale(${coverData.imageScale})` }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCoverData({ ...coverData, image: null, imageScale: 1 });
                      if (coverFileInputRef.current) coverFileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-10 h-10 text-amber-400 mb-2" />
                  <span className="text-amber-600 text-sm">表紙画像を選択</span>
                </>
              )}
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverImageUpload}
              />
            </div>
            {/* 表紙画像リサイズ */}
            {coverData.image && (
              <div className="mt-3 flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-amber-600" />
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={coverData.imageScale}
                  onChange={(e) => setCoverData({ ...coverData, imageScale: parseFloat(e.target.value) })}
                  className="flex-1 accent-amber-500"
                />
                <ZoomIn className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-amber-600 w-12">{Math.round(coverData.imageScale * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ページ作成セクション */}
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          新しいページを作成
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* 画像入力エリア */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">ページ画像</label>
            <div 
              className={`border-2 border-dashed rounded-lg h-64 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                currentImage ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {generatingImageFor === 'new' ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                  <span className="text-indigo-600 text-sm">AI画像生成中...</span>
                </div>
              ) : currentImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-2">
                  <img 
                    src={currentImage} 
                    alt="Preview" 
                    className="max-h-full max-w-full object-contain transition-transform"
                    style={{ transform: `scale(${currentImageScale})` }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImage(null);
                      setCurrentImageScale(1);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-gray-500">画像を選択 (クリック)</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            {/* AI画像生成ボタン */}
            <button
              onClick={handleGenerateNewPageImage}
              disabled={!currentText || generatingImageFor === 'new'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {generatingImageFor === 'new' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              AIで画像を生成
            </button>
            {/* 画像リサイズスライダー */}
            {currentImage && (
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <ZoomOut className="w-4 h-4 text-gray-500" />
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={currentImageScale}
                  onChange={(e) => setCurrentImageScale(parseFloat(e.target.value))}
                  className="flex-1 accent-indigo-500"
                />
                <ZoomIn className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 w-14 text-right">{Math.round(currentImageScale * 100)}%</span>
              </div>
            )}
          </div>

          {/* テキスト入力エリア */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">ストーリーテキスト</label>
            <textarea
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder="ここにストーリーやセリフを入力してください..."
              className="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center justify-between border-t pt-6">
          <div className="flex space-x-4">
            {pages.length > 0 && (
              <button
                onClick={onPreview}
                className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                プレビュー
              </button>
            )}
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleAddPage}
              disabled={!currentText && !currentImage}
              className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5 mr-2" />
              次へ (保存)
            </button>
          </div>
        </div>
      </div>

      {/* 現在のページ一覧 */}
      {pages.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow-xl">
          <h3 className="text-sm font-medium text-gray-500 mb-2">作成済みページ ({pages.length}ページ)</h3>
          <p className="text-xs text-gray-400 mb-4">
            💡 ページをクリックして編集 | ドラッグで順序変更
          </p>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {pages.map((page, index) => (
              <div 
                key={page.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => openEditModal(page)}
                className={`flex-shrink-0 w-36 h-48 border-2 rounded-lg bg-gray-50 relative group cursor-pointer transition-all hover:shadow-lg hover:border-indigo-400 ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverIndex === index && draggedIndex !== index ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                }`}
              >
                {/* ドラッグハンドル */}
                <div className="absolute top-1 left-1 p-1 bg-gray-200/80 rounded cursor-grab active:cursor-grabbing z-10">
                  <GripVertical className="w-3 h-3 text-gray-500" />
                </div>
                {/* ページ番号 */}
                <div className="absolute top-1 left-7 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">{index + 1}</div>
                
                {/* 画像プレビュー */}
                {page.image ? (
                  <div className="w-full h-24 overflow-hidden rounded-t-lg flex items-center justify-center bg-gray-100">
                    <img 
                      src={page.image} 
                      alt={`Page ${index + 1}`} 
                      className="max-w-full max-h-full object-contain"
                      style={{ transform: `scale(${page.imageScale * 0.8})` }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-24 bg-gray-200 flex items-center justify-center rounded-t-lg">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                
                {/* テキストプレビュー */}
                <div className="p-2">
                  <p className="text-xs text-gray-600 line-clamp-3">{page.text || '(テキストなし)'}</p>
                </div>
                
                {/* AI生成ボタン */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateImage(page.id, page.text);
                  }}
                  disabled={generatingImageFor === page.id || !page.text}
                  className="absolute bottom-1 right-1 p-1.5 bg-purple-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title="AIで画像を生成"
                >
                  {generatingImageFor === page.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                </button>
                
                {/* 削除ボタン */}
                {onDeletePage && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePage(page.id);
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <button
              onClick={onFinish}
              className="flex items-center px-8 py-3 bg-green-600 text-white text-lg font-bold rounded-full hover:bg-green-700 transition-transform hover:scale-105 shadow-lg"
            >
              <Check className="w-6 h-6 mr-2" />
              完成して本を読む
            </button>
          </div>
        </div>
      )}

      {/* ページ編集モーダル */}
      {editingPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-800">ページを編集</h2>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 画像編集エリア */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">ページ画像</label>
                  <div 
                    className={`border-2 border-dashed rounded-lg h-64 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                      editImage ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
                    }`}
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    {generatingImageFor === editingPage.id ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                        <span className="text-indigo-600 text-sm">AI画像生成中...</span>
                      </div>
                    ) : editImage ? (
                      <div className="relative w-full h-full flex items-center justify-center p-2">
                        <img 
                          src={editImage} 
                          alt="Preview" 
                          className="max-h-full max-w-full object-contain transition-transform"
                          style={{ transform: `scale(${editImageScale})` }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditImage(null);
                            setEditImageScale(1);
                            if (editFileInputRef.current) editFileInputRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-gray-500">画像を選択 (クリック)</span>
                      </>
                    )}
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditImageUpload}
                    />
                  </div>
                  
                  {/* AI画像生成ボタン */}
                  <button
                    onClick={() => handleGenerateImage(editingPage.id, editText, true)}
                    disabled={!editText || generatingImageFor === editingPage.id}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {generatingImageFor === editingPage.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    AIで画像を生成
                  </button>
                  
                  {/* 画像リサイズスライダー */}
                  {editImage && (
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                      <ZoomOut className="w-4 h-4 text-gray-500" />
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={editImageScale}
                        onChange={(e) => setEditImageScale(parseFloat(e.target.value))}
                        className="flex-1 accent-indigo-500"
                      />
                      <ZoomIn className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 w-14 text-right">{Math.round(editImageScale * 100)}%</span>
                    </div>
                  )}
                </div>

                {/* テキスト編集エリア */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">ストーリーテキスト</label>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="ここにストーリーやセリフを入力してください..."
                    className="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>
            
            {/* フッターボタン */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={savePageEdit}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
