declare module "arabic-persian-reshaper" {
  export const ArabicShaper: {
    convertArabic: (input: string) => string;
    convertArabicBack: (input: string) => string;
  };
  export const PersianShaper: {
    convertArabic: (input: string) => string;
  };
}

declare module "bidi-js" {
  type BidiApi = {
    getEmbeddingLevels: (text: string) => unknown;
    getReorderedString: (text: string, levels: unknown) => string;
  };
  export default function bidiFactory(): BidiApi;
}
