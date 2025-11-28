import React, { useState } from 'react';
import type { StoryPage, CoverData } from '../types';
import { X, RotateCcw, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';

interface BookViewerProps {
  pages: StoryPage[];
  title: string;
  coverData: CoverData;
  onClose: () => void;
  onBackToEdit?: () => void;
  isPreview?: boolean;
}

export const BookViewer: React.FC<BookViewerProps> = ({ pages, title, coverData, onClose, onBackToEdit, isPreview = false }) => {
  // 0: 表紙, 1〜N: 各ストーリーページ, N+1: 裏表紙
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSpreads = pages.length + 2; // 表紙 + ページ数 + 裏表紙

  const goToNext = () => {
    if (currentIndex < totalSpreads - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-900">
      {/* 背景パターン */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-50 pointer-events-none"></div>
      
      {/* コントロールバー */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        {!isPreview && onBackToEdit && (
          <button 
            onClick={onBackToEdit}
            className="bg-indigo-500/80 hover:bg-indigo-600 text-white px-3 py-2 rounded-full backdrop-blur-sm transition-colors flex items-center gap-2"
            title="データを保持して編集に戻る"
          >
            <Edit3 className="w-5 h-5" />
            <span className="text-sm">編集に戻る</span>
          </button>
        )}
        <button 
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
          title={isPreview ? "プレビューを閉じる" : "新しい本を作成"}
        >
          {isPreview ? <X className="w-6 h-6" /> : <RotateCcw className="w-6 h-6" />}
        </button>
      </div>

      <div className="mb-4 text-white/80 font-serif text-sm tracking-wider z-10">
        {isPreview ? 'PREVIEW MODE' : 'READING MODE'}
      </div>

      {/* 本の本体エリア */}
      <div className="relative w-full max-w-5xl h-[600px] flex items-center justify-center perspective-1000">
        
        {/* 左矢印 */}
        <button 
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className={`absolute left-4 z-20 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-0 transition-all ${currentIndex === 0 ? 'pointer-events-none' : ''}`}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {/* 本のコンテンツ */}
        <div className="relative w-[900px] h-[550px] bg-transparent transition-transform duration-500 transform-style-3d shadow-2xl flex">
          
          {/* コンテンツ表示エリア */}
          {currentIndex === 0 ? (
            // 表紙（中央表示）
            <div className="w-full h-full flex items-center justify-center">
              <div 
                className="w-[400px] h-[550px] bg-[#8B4513] text-[#f3e5ab] shadow-2xl rounded-r-lg border-l-4 border-[#5D2906] cursor-pointer hover:translate-x-[-5px] transition-transform overflow-hidden"
                onClick={goToNext}
              >
                <div className="h-full w-full border-[12px] border-[#5D2906] p-6 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-30 pointer-events-none"></div>
                  
                  {/* 表紙画像 */}
                  {coverData.image && (
                    <div className="w-full h-48 mb-4 flex items-center justify-center overflow-hidden rounded-lg bg-black/10 z-10">
                      <img 
                        src={coverData.image} 
                        alt="Cover" 
                        className="max-w-full max-h-full object-contain transition-transform"
                        style={{ transform: `scale(${coverData.imageScale})` }}
                      />
                    </div>
                  )}
                  
                  <h1 className="text-3xl md:text-4xl font-serif font-bold text-center mb-8 drop-shadow-md z-10 leading-tight">
                    {title || "My Story Book"}
                  </h1>
                  <div className="mt-auto mb-4 z-10">
                    <p className="text-xs tracking-widest font-serif opacity-80">ORIGINAL STORY BOOK</p>
                  </div>
                </div>
              </div>
            </div>
          ) : currentIndex === totalSpreads - 1 ? (
            // 裏表紙
            <div className="w-full h-full flex items-center justify-center">
              <div 
                className="w-[400px] h-[550px] bg-[#8B4513] text-[#f3e5ab] shadow-2xl rounded-l-lg border-r-4 border-[#5D2906] cursor-pointer hover:translate-x-[5px] transition-transform"
                onClick={goToPrev}
              >
                 <div className="h-full w-full border-[12px] border-[#5D2906] flex items-center justify-center relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-30 pointer-events-none"></div>
                    <h2 className="text-3xl font-serif font-bold z-10">THE END</h2>
                  </div>
              </div>
            </div>
          ) : (
            // 見開きページ (currentIndex 1 means pages[0])
            <div className="w-full h-full flex shadow-2xl rounded overflow-hidden bg-[#fffaf0]">
              {/* 左ページ：画像 */}
              <div className="w-1/2 h-full border-r border-gray-200 p-6 flex flex-col items-center justify-center relative">
                <div className="w-full h-[80%] flex items-center justify-center bg-gray-50 rounded shadow-inner p-2 overflow-hidden">
                  {pages[currentIndex - 1]?.image ? (
                    <img 
                      src={pages[currentIndex - 1].image!} 
                      alt={`Page ${currentIndex}`} 
                      className="max-w-full max-h-full object-contain transition-transform"
                      style={{ transform: `scale(${pages[currentIndex - 1].imageScale})` }}
                    />
                  ) : (
                    <div className="text-gray-300">No Image</div>
                  )}
                </div>
                <span className="absolute bottom-4 text-gray-400 text-xs font-serif">- {currentIndex * 2 - 1} -</span>
                
                {/* めくりクリックエリア（戻る） */}
                <div className="absolute inset-y-0 left-0 w-16 cursor-pointer hover:bg-black/5 transition-colors" onClick={goToPrev} title="前のページへ"></div>
              </div>

              {/* 右ページ：テキスト */}
              <div className="w-1/2 h-full p-8 flex flex-col relative">
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-lg leading-loose font-serif text-gray-800 whitespace-pre-wrap text-justify w-full">
                    {pages[currentIndex - 1]?.text}
                  </p>
                </div>
                <span className="absolute bottom-4 self-center text-gray-400 text-xs font-serif">- {currentIndex * 2} -</span>

                 {/* めくりクリックエリア（進む） */}
                 <div className="absolute inset-y-0 right-0 w-16 cursor-pointer hover:bg-black/5 transition-colors" onClick={goToNext} title="次のページへ"></div>
              </div>
            </div>
          )}
        </div>

        {/* 右矢印 */}
        <button 
          onClick={goToNext}
          disabled={currentIndex === totalSpreads - 1}
          className={`absolute right-4 z-20 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-0 transition-all ${currentIndex === totalSpreads - 1 ? 'pointer-events-none' : ''}`}
        >
          <ChevronRight className="w-8 h-8" />
        </button>

      </div>
      
      <div className="mt-8 text-white/50 text-xs font-serif z-10">
        {currentIndex === 0 ? '表紙をクリックして本を開く' : '画面端をクリックまたは矢印でページをめくる'}
      </div>
    </div>
  );
};
