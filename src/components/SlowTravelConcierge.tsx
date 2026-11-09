import React, { useState } from 'react';
import {
  Compass,
  Clock,
  Sparkles,
  MapPin,
  Utensils,
  Ship,
  Car,
  Train,
  Heart,
  RotateCw,
  ArrowRight,
  BookmarkCheck,
  Check,
  ExternalLink,
  Shield,
  Trees,
  TreePine
} from 'lucide-react';
import { ConciergePlan, Language } from '../types';
import { REGIONAL_STATS } from '../data/nichinanHeritage';

interface Props {
  language: Language;
  onSelectSpotForStory?: (spotName: string) => void;
}

export const SlowTravelConcierge: React.FC<Props> = ({
  language,
  onSelectSpotForStory,
}) => {
  const [travelerType, setTravelerType] = useState<string>('cruise');
  const [stayHours, setStayHours] = useState<string>('6時間');
  const [startPoint, setStartPoint] = useState<string>('油津港（クルーズ船ターミナル）');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    '坂元棚田と里山の草だんご（酒谷）',
    '重要文化財・鞍埼灯台とカツオ炙り重',
    '飫肥杉の美林と森林浴（北郷）',
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [planResult, setPlanResult] = useState<ConciergePlan | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/concierge/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          travelerType,
          stayHours,
          startPoint,
          interests: selectedInterests,
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プラン生成に失敗しました');
      }

      const data: ConciergePlan = await response.json();
      setPlanResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '寄り道プランの生成に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Intro & Economic Context Highlight */}
      <div className="bg-gradient-to-br from-amber-900 via-stone-900 to-emerald-950 text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 tracking-wider uppercase mb-2">
            <Compass className="w-4 h-4" />
            <span>Deep Slow-Tourism Concierge</span>
            <span>·</span>
            <span>日南市周遊DX</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-heritage leading-snug">
            「港や駅前で終わらせない」<br className="hidden sm:inline" />
            日南の奥深い暮らしへ、心ほどける寄り道旅を。
          </h2>
          <p className="text-sm text-stone-300 mt-2 leading-relaxed">
            クイーンエリザベスやMSCベリッシマが寄港する油津港。中心部のにぎわいだけでなく、
            事業所わずか29件の<strong className="text-amber-200">酒谷（坂元棚田・草だんご）</strong>や
            31件の<strong className="text-amber-200">鵜戸（海神の洞窟）</strong>、
            美肌温泉と飫肥杉美林の<strong className="text-amber-200">北郷</strong>へ。
            AIコンシェルジュがあなたの滞在時間に合わせた優しい寄り道ルートを提案します。
          </p>
        </div>

        {/* Ambient subtle wood/wave decorative background */}
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 pointer-events-none">
          <TreePine className="w-96 h-96 text-amber-200" />
        </div>
      </div>

      {/* Preferences Form */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200/80 space-y-6">
        <div>
          <h3 className="text-lg font-bold font-heritage text-stone-900">
            旅の条件を設定する
          </h3>
          <p className="text-xs text-stone-500">
            あなたの移動手段や滞在時間、興味に合わせて寄り道ルートを組み立てます。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Traveler Type */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              旅行スタイル
            </label>
            <div className="space-y-2">
              {[
                { id: 'cruise', label: '大型クルーズ船の寄港客', icon: <Ship className="w-4 h-4 text-sky-700" /> },
                { id: 'drive', label: 'のんびりレンタカードライブ', icon: <Car className="w-4 h-4 text-emerald-700" /> },
                { id: 'train', label: 'JR日南線×バス・サイクリング', icon: <Train className="w-4 h-4 text-amber-700" /> },
                { id: 'taiwan', label: '台湾からの友好観光客', icon: <Heart className="w-4 h-4 text-rose-700" /> },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setTravelerType(type.id)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium flex items-center gap-2.5 transition-all ${
                    travelerType === type.id
                      ? 'border-amber-800 bg-amber-50/70 text-stone-900 ring-1 ring-amber-800/30 font-bold'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {type.icon}
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stay Duration */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              日南での滞在時間
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['3〜4時間（ショート寄港）', '5〜6時間（標準コース）', '7〜8時間（丸一日ゆっくり）', '1泊2日（宿泊ディープ）'].map(
                (time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setStayHours(time)}
                    className={`p-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                      stayHours === time
                        ? 'border-amber-800 bg-amber-50/70 text-stone-900 ring-1 ring-amber-800/30 font-bold'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {time}
                  </button>
                )
              )}
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                出発・発着地点
              </label>
              <select
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50/50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-700/30"
              >
                <option value="油津港（クルーズ船ターミナル）">油津港（クルーズ船ターミナル）</option>
                <option value="JR日南駅（宮崎空港・宮崎駅方面から）">JR日南駅（宮崎空港・宮崎駅方面から）</option>
                <option value="飫肥駅・飫肥城下町駐車場">飫肥駅・飫肥城下町駐車場</option>
                <option value="道の駅きたごう（北郷IC付近）">道の駅きたごう（北郷IC付近）</option>
                <option value="目井津港・南郷駅">目井津港・南郷駅</option>
              </select>
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              惹かれる日南のテーマ（複数選択可）
            </label>
            <div className="space-y-1.5">
              {[
                '坂元棚田と里山の草だんご（酒谷）',
                '重要文化財・鞍埼灯台とカツオ炙り重',
                '飫肥杉の美林と森林浴（北郷）',
                '飫肥城下町・武家屋敷とプリン風厚焼き玉子',
                '鵜戸神宮・海食洞窟と運玉投げ祈願',
                '台湾日南駅との絆・鉄道の旅',
              ].map((interest) => {
                const checked = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`w-full p-2 rounded-lg border text-left text-xs flex items-center justify-between transition-colors ${
                      checked
                        ? 'border-emerald-700 bg-emerald-50/60 text-emerald-950 font-semibold'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <span className="truncate pr-2">{interest}</span>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px] ${
                        checked ? 'bg-emerald-700 text-white' : 'border border-stone-300'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleGeneratePlan}
            disabled={isLoading}
            className="w-full sm:w-auto bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 text-white font-bold px-8 py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all active:scale-95"
          >
            {isLoading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>日南の寄り道ルートを思案中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>のんびり寄り道コースを提案してもらう</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* Generated Itinerary Plan */}
      {planResult && (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200/90 overflow-hidden divide-y divide-stone-100 animate-fadeIn">
          {/* Header */}
          <div className="p-6 md:p-8 bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/40">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-amber-800 font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>所要目安: {planResult.totalDuration}</span>
              </span>
              <span className="text-stone-400">/</span>
              <span>出発: {startPoint}</span>
            </div>

            <h3 className="text-2xl md:text-3xl font-bold font-heritage text-stone-900 leading-tight">
              {planResult.courseTitle}
            </h3>

            <p className="text-sm text-stone-700 mt-2 max-w-3xl leading-relaxed">
              {planResult.themeDescription}
            </p>

            {/* Highlights */}
            {planResult.highlights && planResult.highlights.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {planResult.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="text-xs bg-amber-100/70 text-amber-900 px-3 py-1 rounded-full font-medium"
                  >
                    #{h}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stops Timeline */}
          <div className="p-6 md:p-8 space-y-6">
            <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-800" />
              <span>寄り道スケジュール</span>
            </h4>

            <div className="relative pl-6 md:pl-8 space-y-8 before:absolute before:left-2.5 md:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
              {planResult.stops.map((stop, idx) => (
                <div key={idx} className="relative group">
                  {/* Step circle */}
                  <div className="absolute -left-6 md:-left-8 top-1 w-5 h-5 md:w-7 md:h-7 rounded-full bg-amber-800 text-white font-bold text-[10px] md:text-xs flex items-center justify-center shadow-sm">
                    {stop.step || idx + 1}
                  </div>

                  <div className="bg-stone-50/70 rounded-2xl p-5 border border-stone-200/80 hover:border-amber-300 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded">
                          {stop.area}
                        </span>
                        <h5 className="text-base font-bold text-stone-900 font-heritage">
                          {stop.name}
                        </h5>
                      </div>
                      <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        滞在目安: 約{stop.stayMinutes}分
                      </span>
                    </div>

                    <div className="text-xs text-stone-600 mb-2">
                      <strong className="text-stone-700">文化財・歴史背景: </strong>
                      {stop.culturalAsset}
                    </div>

                    <p className="text-xs text-stone-800 leading-relaxed bg-white p-3 rounded-xl border border-stone-100 mb-2">
                      <strong className="text-emerald-800">心ほどける寄り道体験: </strong>
                      {stop.slowExperience}
                    </p>

                    {stop.localEconomyNote && (
                      <div className="text-[11px] text-amber-900 bg-amber-50/90 px-3 py-1.5 rounded-lg border border-amber-200/60 flex items-center gap-1.5">
                        <span className="font-bold">地域応援:</span>
                        <span>{stop.localEconomyNote}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Food tip & local message */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/60">
                <div className="text-xs font-bold text-orange-900 flex items-center gap-1.5 mb-1.5">
                  <Utensils className="w-3.5 h-3.5 text-orange-700" />
                  <span>道中のご当地グルメ</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  {planResult.localFoodTip}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5">
                  <Heart className="w-3.5 h-3.5 text-emerald-700" />
                  <span>日南からの温もりメッセージ</span>
                </div>
                <p className="text-xs text-emerald-900 italic leading-relaxed">
                  「{planResult.messageFromNichinan}」
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
