let instance: SpeechRecognitionAlternative | null = null;

const getInstance = () => {
  const SpeechRecognition = window.SpeechRecognitionAlternative;
  if(!SpeechRecognition) {
    throw new Error('浏览器不支持语音识别');
  }
  if(!instance) {
    instance = new SpeechRecognition();
  }
  return instance;
};
