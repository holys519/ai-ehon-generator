export type StoryPage = {
  id: string;
  image: string | null;
  imageScale: number; // 画像の拡大率 (0.5 ~ 2.0)
  text: string;
};

export type CoverData = {
  image: string | null;
  imageScale: number;
};

export type Book = {
  id: string;
  title: string;
  coverData: CoverData;
  pages: StoryPage[];
  createdAt: number;
  updatedAt: number;
};

export type AppMode = 'home' | 'edit' | 'preview' | 'view' | 'ai-generate';
