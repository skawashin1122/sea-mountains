import React, { useState, useEffect } from 'react';
import {
  Compass,
  Camera,
  TreePine,
  Landmark,
  Languages,
  Info,
  Ship,
  Sparkles,
  MapPin,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { StorytellerView } from './components/StorytellerView';
import { SlowTravelConcierge } from './components/SlowTravelConcierge';
import { ObiCedarGrowthRings } from './components/ObiCedarGrowthRings';
import { HeritageMapAndStats } from './components/HeritageMapAndStats';
import { Language, StampRecord } from './types';
import { UI_TRANSLATIONS } from './data/nichinanHeritage';

const INITIAL_STAMPS: StampRecord[] = [
  {
    id: 'initial_obi',
    spotName: '飫肥城下町・武家屋敷通り',
    area: '飫肥',
    date: '2026/04/12',
    characterName: '飫肥藩士 伊東甚兵衛',
    summary: '飫肥石の石垣に触れ、四百年の武士の気概と飫肥杉造林の歴史を聞く。',
    ringYear: 1,
  },
  {
    id: 'initial_sakatani',
    spotName: '酒谷・坂元棚田',
    area: '酒谷',
    date: '2026/04/15',
    characterName: '酒谷のトメばあちゃん',
    summary: '重要文化的景観の石積み棚田で、湧水と手作り草だんごの温もりに触れる。',
    ringYear: 2,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'story' | 'concierge' | 'rings' | 'stats'>('story');
  const [language, setLanguage] = useState<Language>('ja');
  const [targetSpotId, setTargetSpotId] = useState<string | null>(null);
  const [showConceptModal, setShowConceptModal] = useState<boolean>(false);

  // Load stamps from localStorage
  const [stamps, setStamps] = useState<StampRecord[]>(() => {
    try {
      const saved = localStorage.getItem('nichinan_cedar_stamps');
      return saved ? JSON.parse(saved) : INITIAL_STAMPS;
    } catch {
      return INITIAL_STAMPS;
    }
  });

  const saveStampsToStorage = (newStamps: StampRecord[]) => {
    setStamps(newStamps);
    try {
      localStorage.setItem('nichinan_cedar_stamps', JSON.stringify(newStamps));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  };

  const handleAddStamp = (data: Omit<StampRecord, 'id' | 'date' | 'ringYear'>) => {
    const newRecord: StampRecord = {
      ...data,
      id: `stamp_${Date.now()}`,
      date: new Date().toLocaleDateString('ja-JP'),
      ringYear: stamps.length + 1,
    };
    const updated = [...stamps, newRecord];
    saveStampsToStorage(updated);
  };

  const handleRemoveStamp = (id: string) => {
    const updated = stamps.filter((s) => s.id !== id);
    saveStampsToStorage(updated);
  };

  const handleSelectSpotFromMap = (spotId: string) => {
    setTargetSpotId(spotId);
    setActiveTab('story');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.ja;
  const currentTreeAge = 25 + stamps.length * 15;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-[#2b2520]">
      {/* Top Notification / Concept Highlight Bar */}
      <div className="bg-amber-950 text-amber-100 text-xs py-2 px-4 border-b border-amber-900/60">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-700 text-white font-bold px-2 py-0.5 rounded text-[10px]">
              企画案D
            </span>
            <span className="font-medium text-amber-200">
              文化財・観光×国際・地域周遊DX 『にちなん海幸山幸ものがたり』
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConceptModal(true)}
              className="text-amber-300 hover:text-white underline text-[11px] flex items-center gap-1 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              <span>企画コンセプト＆ミニ統計データを見る</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-800 to-amber-950 text-white flex items-center justify-center shadow-sm shrink-0">
              <TreePine className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold font-heritage tracking-tight text-stone-900">
                  {t.appTitle}
                </h1>
                <span className="hidden sm:inline-block text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-bold">
                  日南市
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden md:block">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Right Controls: Cedar Age Indicator & Language Selector */}
          <div className="flex items-center gap-3">
            {/* Tree Age Chip */}
            <button
              onClick={() => setActiveTab('rings')}
              className="hidden sm:flex items-center gap-2 bg-stone-100 hover:bg-amber-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs transition-colors"
              title="年輪スタンプ手帳を開く"
            >
              <TreePine className="w-4 h-4 text-emerald-700" />
              <span className="text-stone-600 font-medium">飫肥杉樹齢:</span>
              <strong className="text-stone-900">{currentTreeAge}年生</strong>
            </button>

            {/* Language dropdown */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs">
              <Languages className="w-3.5 h-3.5 text-stone-500 ml-1 mr-0.5" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-stone-800 font-medium py-1 px-1.5 focus:outline-none cursor-pointer"
              >
                <option value="ja">日本語</option>
                <option value="nichinan_dialect">日南弁</option>
                <option value="en">English</option>
                <option value="zh_tw">繁體中文</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2 scrollbar-none text-xs sm:text-sm font-medium">
            {[
              {
                id: 'story',
                label: t.navStory,
                icon: <Camera className="w-4 h-4" />,
              },
              {
                id: 'concierge',
                label: t.navConcierge,
                icon: <Compass className="w-4 h-4" />,
              },
              {
                id: 'rings',
                label: t.navRings,
                icon: <TreePine className="w-4 h-4" />,
                badge: `${stamps.length}`,
              },
              {
                id: 'stats',
                label: t.navHeritageMap,
                icon: <Landmark className="w-4 h-4" />,
                badge: '118件',
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-amber-800 text-white shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-amber-950 text-amber-200'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {activeTab === 'story' && (
          <StorytellerView
            language={language}
            onLanguageChange={setLanguage}
            onAddStamp={handleAddStamp}
            savedStamps={stamps}
            initialSpotId={targetSpotId}
          />
        )}

        {activeTab === 'concierge' && (
          <SlowTravelConcierge
            language={language}
            onSelectSpotForStory={(spotName) => {
              setActiveTab('story');
            }}
          />
        )}

        {activeTab === 'rings' && (
          <ObiCedarGrowthRings
            stamps={stamps}
            onRemoveStamp={handleRemoveStamp}
            language={language}
          />
        )}

        {activeTab === 'stats' && (
          <HeritageMapAndStats
            language={language}
            onSelectSpot={handleSelectSpotFromMap}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-300 py-10 px-6 border-t border-stone-800 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white font-heritage font-bold text-base">
              <TreePine className="w-5 h-5 text-amber-400" />
              <span>にちなん海幸山幸ものがたり</span>
            </div>
            <p className="text-xs text-stone-400 max-w-xl">
              宮崎県日南市 文化財118件（国指定重要文化財・鞍埼灯台、重伝建・飫肥城下町、重要文化的景観・坂元棚田など）の継承と、中山間地（酒谷・鵜戸・北郷）のローカル経済を育むディープ・スローツーリズム推進DX。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs text-stone-400">
            <div>
              姉妹駅: JR九州 日南駅 🤝 台湾鉄路 日南駅
            </div>
            <span className="hidden sm:inline text-stone-600">·</span>
            <div>
              寄港地: 油津港（クイーンエリザベス / MSCベリッシマ）
            </div>
          </div>
        </div>
      </footer>

      {/* Concept & Mini-Stats Modal */}
      {showConceptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md">
                  企画案D 企画概要・着眼データ
                </span>
                <h3 className="text-xl md:text-2xl font-bold font-heritage text-stone-900 mt-2">
                  『にちなん海幸山幸ものがたり』
                </h3>
                <p className="text-xs text-stone-500">
                  〜AI語り部と巡る、飫肥杉と海原のディープ・スローツーリズム〜
                </p>
              </div>
              <button
                onClick={() => setShowConceptModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Statistical Foundation */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-amber-700" />
                <span>着眼したミニ統計データ</span>
              </h4>
              <ul className="text-xs text-stone-700 space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-700 mt-1.5 shrink-0" />
                  <span>
                    <strong>国指定・登録文化財が「115件 → 118件」に増加</strong>（国宝級の鞍埼灯台の重要文化財指定、飫肥の重伝建、酒谷の坂元棚田、鵜戸など）。
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-700 mt-1.5 shrink-0" />
                  <span>
                    <strong>油津港に世界最高峰のクルーズ船（クイーンエリザベス、MSCベリッシマ）が相次いで寄港。</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-700 mt-1.5 shrink-0" />
                  <span>
                    <strong>台湾「日南（リーナン）駅」との姉妹駅協定締結</strong>（同名駅の奇跡と日台友好）。
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-700 mt-1.5 shrink-0" />
                  <span>
                    <strong>課題:</strong> 事業所や観光客の消費は中心部（吾田・油津）に偏り、<strong>酒谷（事業所29件）や鵜戸（31件）</strong>などの奥深い地域に届いていない。
                  </span>
                </li>
              </ul>
            </div>

            {/* 3 Core Gemini Features */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>アプリの3大機能（Gemini API 活用）</span>
              </h4>
              <div className="space-y-2 text-xs text-stone-700">
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60">
                  <strong className="text-stone-900 block mb-0.5">
                    1. 景色にかざすだけ！「マルチリンガルAI語り部」
                  </strong>
                  スマホカメラで武家屋敷の石垣や坂元棚田を画像認識。飫肥藩士、カツオ船頭、棚田のおばあちゃん等になりきり、日南弁・標準語・英語・台湾華語の情感あふれる音声で歴史を語りかけます。
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                  <strong className="text-stone-900 block mb-0.5">
                    2. 「のんびり寄り道」AIコンシェルジュ
                  </strong>
                  クルーズ船寄港客やドライブ客に、混雑スポットだけでなく「酒谷の棚田を眺める隠れ家カフェ」「北郷の飫肥杉森林浴温泉」など奥深い日常への寄り道コースを提案。
                </div>
                <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/60">
                  <strong className="text-stone-900 block mb-0.5">
                    3. 旅の記念「デジタル飫肥杉年輪スタンプ」
                  </strong>
                  各地を訪れるごとに年輪が増えるデジタル手帳。貯まった年輪は道の駅等で本物の飫肥杉工芸品やカツオ炙り重特典と引き換え可能。
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowConceptModal(false)}
                className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm transition-all"
              >
                アプリを体験する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
