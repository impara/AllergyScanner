// emoji-dictionary.d.ts
declare module 'emoji-dictionary' {
    const emojiDictionary: {
      getName: (emoji: string) => string | null;
      getUnicode: (name: string) => string | null;
      hasEmoji: (str: string) => boolean;
      names: string[];
    };
  
    export default emojiDictionary;
  }