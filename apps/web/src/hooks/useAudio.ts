export interface Options {
  volume?: number; // 音量，范围为0到1，默认为1
  rate?: number; // 语速，范围为0.1到10，默认为1
  pitch?: number; // 音调，范围为0到2，默认为1
  lang?: string; // 语言代码，例如'en-US'，默认为浏览器的语言设置
}

let instance: SpeechSynthesisUtterance | null = null;
const getInstance = (options: Options) => {
  if (!instance) {
    instance = new SpeechSynthesisUtterance();
    const { volume = 0.7, rate = 1, pitch = 1, lang = "en-US" } = options;
    instance.volume = volume;
    instance.rate = rate;
    instance.pitch = pitch;
    instance.lang = lang;
  }
  return instance;
};

export const useAudio = (options: Options) => {
  const pronounce = getInstance(options); // 发音

  const playAudio = (word: string) => {
    pronounce.text = word;
    speechSynthesis.speak(pronounce);
  };

  return { playAudio };
};
