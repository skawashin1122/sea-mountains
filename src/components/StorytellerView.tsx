import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sparkles,
  TreePine,
  RotateCw,
  Compass,
  CheckCircle2,
  HelpCircle,
  MapPin,
  Flame,
  Shield,
  Anchor,
  HeartHandshake,
  Trees,
  Train,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PERSONAS, CULTURAL_SPOTS, UI_TRANSLATIONS } from '../data/nichinanHeritage';
import { PersonaId, Language, CulturalSpot, StorytellerResponse, StampRecord } from '../types';

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onAddStamp: (stamp: Omit<StampRecord, 'id' | 'date' | 'ringYear'>) => void;
  savedStamps: StampRecord[];
  initialSpotId?: string | null;
}

const personaIcons: Record<string, React.ReactNode> = {
  Shield: <Shield className="w-5 h-5" />,
  Anchor: <Anchor className="w-5 h-5" />,
  HeartHandshake: <HeartHandshake className="w-5 h-5" />,
  Trees: <Trees className="w-5 h-5" />,
  Flame: <Flame className="w-5 h-5" />,
  Train: <Train className="w-5 h-5" />,
};

export const StorytellerView: React.FC<Props> = ({
  language,
  onLanguageChange,
  onAddStamp,
  savedStamps,
  initialSpotId,
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.ja;

  const [selectedPersona, setSelectedPersona] = useState<PersonaId>('samurai');
  const [selectedSpot, setSelectedSpot] = useState<CulturalSpot>(
    initialSpotId
      ? CULTURAL_SPOTS.find((s) => s.id === initialSpotId) || CULTURAL_SPOTS[0]
      : CULTURAL_SPOTS[0]
  );
  const [activeImage, setActiveImage] = useState<string>(selectedSpot.imageUrl);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [storyResult, setStoryResult] = useState<StorytellerResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [ttsLoading, setTtsLoading] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [stampedForCurrent, setStampedForCurrent] = useState<boolean>(false);

  // Sync spot change if persona recommends one or vice versa
  const handleSpotSelect = (spot: CulturalSpot) => {
    setSelectedSpot(spot);
    setActiveImage(spot.imageUrl);
    setSelectedPersona(spot.recommendedPersona);
    setStoryResult(null);
    setStampedForCurrent(false);
    stopAudio();
    if (cameraActive) {
      stopCamera();
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } else {
        setCameraError('お使いのブラウザではカメラ機能がサポートされていません');
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('カメラの起動に失敗しました。写真のアップロードや名所プリセットをご利用ください。');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setActiveImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setActiveImage(reader.result);
          stopCamera();
          setStoryResult(null);
          setStampedForCurrent(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateStory = async (questionOverride?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    stopAudio();

    try {
      const q = questionOverride !== undefined ? questionOverride : customQuestion;
      const response = await fetch('/api/storyteller/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotName: selectedSpot.name,
          persona: selectedPersona,
          language,
          imageBase64: activeImage.startsWith('data:') ? activeImage : undefined,
          customQuestion: q.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '物語の生成に失敗しました');
      }

      const data: StorytellerResponse = await response.json();
      setStoryResult(data);
      setStampedForCurrent(false);

      // Auto play speech if supported
      playStoryAudio(data.story, data.characterName);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '語り部からの応答が届きませんでした。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const playStoryAudio = async (textToSpeak: string, speakerName?: string) => {
    stopAudio();
    setTtsLoading(true);

    try {
      // First try Server-side Gemini TTS
      const res = await fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak.slice(0, 300),
          language,
          persona: selectedPersona,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => setIsPlayingAudio(false);
          audio.onerror = () => {
            fallbackWebSpeech(textToSpeak);
          };
          await audio.play();
          setIsPlayingAudio(true);
          setTtsLoading(false);
          return;
        }
      }
      throw new Error('Fallback to WebSpeech');
    } catch {
      // Fallback to client Web Speech API
      fallbackWebSpeech(textToSpeak);
    } finally {
      setTtsLoading(false);
    }
  };

  const fallbackWebSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      if (language === 'en') {
        utterance.lang = 'en-US';
      } else if (language === 'zh_tw') {
        utterance.lang = 'zh-TW';
      } else {
        utterance.lang = 'ja-JP';
      }
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleRecordStamp = () => {
    if (!storyResult) return;

    onAddStamp({
      spotName: selectedSpot.name,
      area: selectedSpot.areaNameJa,
      characterName: storyResult.characterName || PERSONAS[selectedPersona].nameJa,
      summary: storyResult.title || selectedSpot.culturalDesignation,
    });

    setStampedForCurrent(true);
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#047857', '#d97706', '#0284c7', '#b45309'],
    });
  };

  useEffect(() => {
    return () => {
      stopCamera();
      stopAudio();
    };
  }, []);

  const currentPersona = PERSONAS[selectedPersona];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner / Scenery & Camera Stage */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex flex-wrap items-center justify-between gap-4 bg-stone-50/50">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 tracking-wider uppercase">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Multimodal Vision & Voice AI</span>
              <span className="text-stone-300">/</span>
              <span>118 Cultural Properties</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-heritage text-stone-900 mt-1">
              {t.cameraTitle}
            </h2>
            <p className="text-sm text-stone-600 mt-0.5">
              石垣、棚田、灯台、美林の風景から、AI語り部が歴史の物語を情感込めて紡ぎます。
            </p>
          </div>

          {/* Quick Language switch buttons */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => onLanguageChange('nichinan_dialect')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                language === 'nichinan_dialect'
                  ? 'bg-amber-800 text-white shadow-sm font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              日南弁
            </button>
            <button
              onClick={() => onLanguageChange('ja')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                language === 'ja'
                  ? 'bg-amber-800 text-white shadow-sm font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              日本語
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                language === 'en'
                  ? 'bg-amber-800 text-white shadow-sm font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('zh_tw')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                language === 'zh_tw'
                  ? 'bg-amber-800 text-white shadow-sm font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              繁體中文
            </button>
          </div>
        </div>

        {/* Viewport: Live Camera or Photo Showcase */}
        <div className="relative aspect-video md:aspect-[21/9] bg-stone-900 overflow-hidden flex items-center justify-center">
          {cameraActive ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-dashed border-amber-400/60 pointer-events-none m-6 rounded-xl flex items-center justify-center">
                <span className="bg-black/60 text-amber-200 px-3 py-1 rounded-full text-xs backdrop-blur-sm">
                  日南の文化財や風景を枠内に収めてください
                </span>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                  onClick={capturePhoto}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-6 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Camera className="w-5 h-5" />
                  風景を撮影して認識
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-stone-800/80 hover:bg-stone-700 text-white px-4 py-2.5 rounded-full text-xs backdrop-blur-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full group">
              <img
                src={activeImage}
                alt={selectedSpot.name}
                className="w-full h-full object-cover brightness-95 group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />

              {/* Spot Tag on viewport */}
              <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-end justify-between gap-4 text-white">
                <div>
                  <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectedSpot.areaNameJa}</span>
                    <span>·</span>
                    <span>{selectedSpot.culturalDesignation}</span>
                    {selectedSpot.isDeepSlowSpot && (
                      <span className="bg-emerald-600/90 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                        奥深い寄り道エリア
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl md:text-3xl font-bold font-heritage mt-1 drop-shadow-md">
                    {selectedSpot.name}
                  </h3>
                  <p className="text-xs md:text-sm text-stone-300 max-w-2xl line-clamp-2 mt-1">
                    {language === 'en'
                      ? selectedSpot.descriptionEn
                      : language === 'zh_tw'
                      ? selectedSpot.descriptionZh
                      : selectedSpot.descriptionJa}
                  </p>
                </div>

                {/* Camera / Upload buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={startCamera}
                    className="bg-white/90 hover:bg-white text-stone-900 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-md backdrop-blur-sm transition-colors"
                  >
                    <Camera className="w-4 h-4 text-amber-700" />
                    カメラでかざす
                  </button>
                  <label className="bg-stone-900/80 hover:bg-stone-800 text-stone-200 text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-md backdrop-blur-sm cursor-pointer transition-colors border border-stone-700">
                    <Upload className="w-4 h-4 text-stone-300" />
                    写真アップロード
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="p-3 bg-rose-50 border-b border-rose-100 text-xs text-rose-700">
            {cameraError}
          </div>
        )}

        {/* Preset Scenery Gallery */}
        <div className="p-4 bg-stone-50 border-t border-stone-200/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-700" />
              日南の文化財・名所プリセット（画像認識対象）:
            </span>
            <span className="text-[11px] text-stone-500">
              タップして風景を切り替え
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {CULTURAL_SPOTS.map((spot) => {
              const isSelected = selectedSpot.id === spot.id;
              return (
                <button
                  key={spot.id}
                  onClick={() => handleSpotSelect(spot)}
                  className={`text-left p-2 rounded-xl transition-all border ${
                    isSelected
                      ? 'border-amber-700 bg-amber-50/80 shadow-sm ring-1 ring-amber-700/20'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="aspect-square rounded-lg overflow-hidden mb-1.5 bg-stone-100">
                    <img
                      src={spot.imageUrl}
                      alt={spot.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[11px] font-bold text-stone-800 truncate">
                    {spot.name.split('・')[0]}
                  </div>
                  <div className="text-[10px] text-stone-500 truncate">
                    {spot.areaNameJa}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Persona Selection Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold font-heritage text-stone-900 flex items-center gap-2">
              <span>語り手（AIペルソナ）を選ぶ</span>
            </h3>
            <p className="text-xs text-stone-500">
              場所に合わせた登場人物になりきり、歴史の裏話や人々の営みを語ります。
            </p>
          </div>
          <div className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md">
            推奨: {PERSONAS[selectedSpot.recommendedPersona].nameJa.split(' ')[0]}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(PERSONAS) as PersonaId[]).map((pKey) => {
            const persona = PERSONAS[pKey];
            const isSelected = selectedPersona === pKey;
            const isRecommended = selectedSpot.recommendedPersona === pKey;

            return (
              <button
                key={pKey}
                onClick={() => {
                  setSelectedPersona(pKey);
                  stopAudio();
                }}
                className={`p-3.5 rounded-xl text-left border transition-all relative ${
                  isSelected
                    ? 'border-amber-800 bg-amber-950/5 ring-2 ring-amber-800/20 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                {isRecommended && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                    おすすめ
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${persona.avatarBg} text-white flex items-center justify-center shadow-sm shrink-0`}
                  >
                    {personaIcons[persona.iconName] || <Shield className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-xs text-stone-500">{persona.roleJa}</div>
                    <div className="text-sm font-bold text-stone-900">
                      {language === 'en'
                        ? persona.nameEn
                        : language === 'zh_tw'
                        ? persona.nameZh
                        : persona.nameJa}
                    </div>
                    <div className="text-xs text-stone-600 line-clamp-1 mt-0.5">
                      {persona.area}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Persona Quote */}
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-3 text-xs text-stone-700">
          <div className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center shrink-0 font-serif font-bold text-[11px]">
            語
          </div>
          <div className="italic">
            「{currentPersona.defaultGreeting}」
          </div>
        </div>
      </div>

      {/* Action: Ask Storyteller / Generate */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/80 space-y-4">
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            語り部に深掘りしてみたい質問（自由入力）:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder={t.askQuestionPlaceholder}
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-700/40 text-sm bg-stone-50/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleGenerateStory();
                }
              }}
            />
            <button
              onClick={() => handleGenerateStory()}
              disabled={isLoading}
              className="bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm flex items-center gap-2 text-sm transition-all shrink-0"
            >
              {isLoading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>思案中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.startNarration}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick prompt suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
          <span className="font-medium text-stone-600">よくある質問:</span>
          {[
            'なぜ飫肥杉は船造りに向いているの？',
            '飫肥石の石垣にはどんな特徴がある？',
            '坂元棚田はどうやって維持されているの？',
            '油津港にクルーズ船が来る理由は？',
            '台湾の日南駅とはどんなご縁があるの？',
          ].map((promptText) => (
            <button
              key={promptText}
              onClick={() => {
                setCustomQuestion(promptText);
                handleGenerateStory(promptText);
              }}
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-center gap-2">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Story Narration Card Result */}
      {storyResult && (
        <div className="bg-white rounded-2xl shadow-md border border-stone-200/90 overflow-hidden divide-y divide-stone-100 transition-all animate-fadeIn">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-amber-50/80 via-stone-50 to-orange-50/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-800 font-semibold">
                  <span>{storyResult.characterName}</span>
                  <span>·</span>
                  <span>{selectedSpot.name}</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold font-heritage text-stone-900 mt-1">
                  {storyResult.title}
                </h3>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isPlayingAudio) {
                      stopAudio();
                    } else {
                      playStoryAudio(storyResult.story, storyResult.characterName);
                    }
                  }}
                  disabled={ttsLoading}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
                    isPlayingAudio
                      ? 'bg-amber-700 text-white animate-pulse'
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}
                >
                  {ttsLoading ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>音声準備中...</span>
                    </>
                  ) : isPlayingAudio ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>一時停止</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{t.generateSpeech}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isPlayingAudio && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-800">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                <span>AI語り部が情感を込めて語りかけています（Gemini TTS）</span>
              </div>
            )}
          </div>

          {/* Story Body */}
          <div className="p-6 md:p-8 space-y-4">
            <div className="text-base md:text-lg leading-relaxed text-stone-800 font-heritage whitespace-pre-line bg-amber-50/30 p-5 rounded-xl border border-amber-100/60">
              {storyResult.story}
            </div>

            {/* Cultural Trivia & Deep Slow Detour */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>{t.triviaLabel}</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  {storyResult.culturalTrivia}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/70">
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{t.slowTipLabel}</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {storyResult.slowTravelTip}
                </p>
              </div>
            </div>

            {/* Stamp to Cedar Growth Rings */}
            <div className="pt-4 flex items-center justify-between border-t border-stone-100">
              <div className="text-xs text-stone-500">
                旅の記念としてデジタル手帳に刻み、飫肥杉の年輪を育てましょう。
              </div>

              <button
                onClick={handleRecordStamp}
                disabled={stampedForCurrent}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  stampedForCurrent
                    ? 'bg-emerald-100 text-emerald-800 cursor-default'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm hover:shadow active:scale-95'
                }`}
              >
                {stampedForCurrent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t.addedToRings}</span>
                  </>
                ) : (
                  <>
                    <TreePine className="w-4 h-4" />
                    <span>{t.addToRings}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
