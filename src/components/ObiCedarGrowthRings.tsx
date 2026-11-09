import React, { useState } from 'react';
import {
  TreePine,
  Award,
  Sparkles,
  Ticket,
  Calendar,
  MapPin,
  CheckCircle,
  Share2,
  Trash2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StampRecord, Language } from '../types';

interface Props {
  stamps: StampRecord[];
  onRemoveStamp: (id: string) => void;
  language: Language;
}

interface RewardItem {
  id: string;
  requiredYears: number;
  placeName: string;
  title: string;
  description: string;
  badge: string;
  isRedeemed: boolean;
}

export const ObiCedarGrowthRings: React.FC<Props> = ({
  stamps,
  onRemoveStamp,
  language,
}) => {
  const [selectedStamp, setSelectedStamp] = useState<StampRecord | null>(
    stamps.length > 0 ? stamps[stamps.length - 1] : null
  );

  const [redeemedRewards, setRedeemedRewards] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('nichinan_redeemed_rewards');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [showCertificate, setShowCertificate] = useState<boolean>(false);

  // Growth ring calculation
  const baseAge = 25;
  const calculatedAge = baseAge + stamps.length * 15;

  let cedarRank = '飫肥杉の若木（しなやかな若木）';
  let cedarRankEn = 'Young Obi Cedar';
  if (calculatedAge >= 100) {
    cedarRank = '飫肥杉美林の巨樹・御神木（百年生）';
    cedarRankEn = 'Centennial Sacred Obi Cedar';
  } else if (calculatedAge >= 75) {
    cedarRank = '名木・飫肥藩の弁甲材（造船銘木）';
    cedarRankEn = 'Historic Shipbuilding Benkozai Timber';
  } else if (calculatedAge >= 50) {
    cedarRank = '飫肥城下町の棟木・立派な杉';
    cedarRankEn = 'Obi Castle Town Timber';
  }

  const rewards: RewardItem[] = [
    {
      id: 'reward_kitago_coaster',
      requiredYears: 40,
      placeName: '道の駅きたごう',
      title: '本物の飫肥杉製オリジナルコースター',
      description: '北郷の飫肥杉から削り出した、爽やかな木の香りと油分をたたえた伝統工芸コースターを進呈。',
      badge: '飫肥杉工芸',
      isRedeemed: !!redeemedRewards['reward_kitago_coaster'],
    },
    {
      id: 'reward_sakatani_dango',
      requiredYears: 55,
      placeName: '道の駅酒谷（棚田の里）',
      title: '酒谷名物・つきたて草だんご（1個引換）',
      description: '清流と坂元棚田の麓で作られる、よもぎの香り豊かな名物草だんご。中山間地の温かいおもてなし。',
      badge: '酒谷の味',
      isRedeemed: !!redeemedRewards['reward_sakatani_dango'],
    },
    {
      id: 'reward_meitsu_katsuo',
      requiredYears: 70,
      placeName: '港の駅めいつ（目井津港）',
      title: '日南名物「カツオ炙り重」200円引換優待券',
      description: '近海カツオ一本釣り日本一の港町で、新鮮な生カツオと特製タレの炙りを堪能できる特別優待。',
      badge: '一本釣りカツオ',
      isRedeemed: !!redeemedRewards['reward_meitsu_katsuo'],
    },
    {
      id: 'reward_obi_treat',
      requiredYears: 85,
      placeName: '飫肥城観光案内所',
      title: '飫肥城下町「厚焼き玉子・飫肥天」味めぐり引換券',
      description: 'まるでプリンのような飫肥伝統の厚焼き玉子と、揚げたて飫肥天を味わえる町歩き引換券。',
      badge: '城下町名物',
      isRedeemed: !!redeemedRewards['reward_obi_treat'],
    },
  ];

  const handleRedeem = (rewardId: string) => {
    const updated = { ...redeemedRewards, [rewardId]: true };
    setRedeemedRewards(updated);
    try {
      localStorage.setItem('nichinan_redeemed_rewards', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#b45309', '#047857', '#e11d48'],
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-200/80 flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wider uppercase mb-1">
            <TreePine className="w-4 h-4 text-emerald-600" />
            <span>Digital Obi Cedar Growth Rings</span>
            <span>·</span>
            <span>旅の記憶手帳</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-heritage text-stone-900">
            デジタル飫肥杉年輪スタンプ手帳
          </h2>
          <p className="text-xs md:text-sm text-stone-600 mt-1 max-w-xl">
            日南を巡り、歴史や物語を聞くごとに樹齢が重なります。
            貯まった年輪は「道の駅きたごう」等で本物の飫肥杉工芸品や名物グルメの特典と引き換えできます。
          </p>
        </div>

        {/* Tree Age Counter Card */}
        <div className="bg-gradient-to-br from-amber-900 via-stone-800 to-emerald-950 text-white p-5 rounded-2xl shadow-md flex items-center gap-5 min-w-[240px]">
          <div className="w-14 h-14 rounded-full border-2 border-amber-400/40 flex items-center justify-center bg-black/30 shrink-0">
            <TreePine className="w-8 h-8 text-amber-300" />
          </div>
          <div>
            <div className="text-[11px] text-amber-200/90 font-medium">現在の飫肥杉樹齢</div>
            <div className="text-3xl font-bold font-heritage text-amber-100">
              {calculatedAge} <span className="text-sm font-sans">年生</span>
            </div>
            <div className="text-[11px] text-stone-300 truncate max-w-[170px]">
              {cedarRank}
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Ring Visualizer & Stamp List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Wood Cross Section (Left 6/12) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 shadow-sm border border-stone-200/80 flex flex-col items-center justify-center">
          <div className="text-xs font-bold text-stone-600 mb-2 flex items-center gap-1.5 self-start">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>飫肥杉の年輪断面（タップで記録を確認）</span>
          </div>

          <div className="relative w-full max-w-[340px] aspect-square my-4">
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full drop-shadow-xl select-none"
            >
              <defs>
                <radialGradient id="barkGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="85%" stopColor="#4a2c11" />
                  <stop offset="92%" stopColor="#3d210b" />
                  <stop offset="100%" stopColor="#241306" />
                </radialGradient>
                <radialGradient id="woodGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="35%" stopColor="#b45309" />
                  <stop offset="70%" stopColor="#d4a373" />
                  <stop offset="90%" stopColor="#faedcd" />
                  <stop offset="100%" stopColor="#5c3a21" />
                </radialGradient>
              </defs>

              {/* Bark Outer */}
              <circle cx="200" cy="200" r="195" fill="url(#barkGradient)" />
              {/* Sapwood & Heartwood */}
              <circle cx="200" cy="200" r="180" fill="url(#woodGradient)" />

              {/* Background faint natural rings */}
              {[40, 65, 90, 115, 140, 160].map((r, i) => (
                <circle
                  key={i}
                  cx="200"
                  cy="200"
                  r={r}
                  fill="none"
                  stroke="#8c531b"
                  strokeWidth="1.2"
                  strokeDasharray="4 2"
                  opacity="0.3"
                />
              ))}

              {/* Stamped rings from user visits */}
              {stamps.map((st, idx) => {
                const ringRadius = 50 + ((idx + 1) / (stamps.length + 1)) * 120;
                const isCurrent = selectedStamp?.id === st.id;
                return (
                  <g
                    key={st.id}
                    className="cursor-pointer transition-all"
                    onClick={() => setSelectedStamp(st)}
                  >
                    <circle
                      cx="200"
                      cy="200"
                      r={ringRadius}
                      fill="none"
                      stroke={isCurrent ? '#047857' : '#92400e'}
                      strokeWidth={isCurrent ? 4 : 2.5}
                      opacity={isCurrent ? 1 : 0.75}
                    />
                    {/* Ring marker point */}
                    <circle
                      cx={200 + ringRadius * Math.cos((idx * 1.2) + 0.5)}
                      cy={200 + ringRadius * Math.sin((idx * 1.2) + 0.5)}
                      r={isCurrent ? 7 : 5}
                      fill={isCurrent ? '#10b981' : '#b45309'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}

              {/* Pith (Center Heart of Obi Cedar) */}
              <circle cx="200" cy="200" r="24" fill="#78350f" stroke="#451a03" strokeWidth="2" />
              <text
                x="200"
                y="204"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#fef3c7"
                className="pointer-events-none"
              >
                飫肥杉
              </text>
            </svg>
          </div>

          <div className="text-center text-xs text-stone-500">
            {stamps.length === 0 ? (
              <span>まだスタンプがありません。「景色にかざすAI語り部」で物語を聞いて年輪を刻みましょう！</span>
            ) : (
              <span>
                全 <strong className="text-stone-800">{stamps.length} 箇所</strong> の物語が年輪として刻まれています。
              </span>
            )}
          </div>
        </div>

        {/* Selected Stamp Detail or Stamp List (Right 6/12) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Detail Card */}
          {selectedStamp ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200/80">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md">
                  第 {selectedStamp.ringYear} 年輪の記憶
                </span>
                <span className="text-xs text-stone-400">{selectedStamp.date}</span>
              </div>

              <h4 className="text-xl font-bold font-heritage text-stone-900">
                {selectedStamp.spotName}
              </h4>
              <div className="text-xs text-stone-500 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{selectedStamp.area}</span>
                <span>·</span>
                <span>語り部: {selectedStamp.characterName}</span>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200/50 text-xs text-stone-700 leading-relaxed font-heritage">
                {selectedStamp.summary}
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-100 text-xs">
                <span className="text-emerald-700 font-medium">✓ デジタル年輪に永久保存済み</span>
                <button
                  onClick={() => onRemoveStamp(selectedStamp.id)}
                  className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                  title="このスタンプを削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-stone-50/70 border border-dashed border-stone-200 rounded-3xl p-8 text-center text-xs text-stone-500">
              年輪を選択すると、その時聞いた物語の詳細が表示されます。
            </div>
          )}

          {/* Stamp List */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200/80">
            <h5 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-3">
              刻まれた旅のスタンプ一覧
            </h5>

            {stamps.length === 0 ? (
              <p className="text-xs text-stone-500">
                「景色にかざすAI語り部」で文化財の物語を聞くと、ここに自動で追加されます。
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {stamps.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStamp(st)}
                    className={`w-full p-2.5 rounded-xl text-left border text-xs flex items-center justify-between transition-all ${
                      selectedStamp?.id === st.id
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <TreePine className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="truncate">{st.spotName}</span>
                    </div>
                    <span className="text-[10px] text-stone-400 shrink-0">{st.date}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real Local Rewards / Coupons Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-200/80 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
              <Ticket className="w-4 h-4 text-amber-700" />
              <span>日南市内店舗・道の駅リアル引き換え特典</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold font-heritage text-stone-900 mt-0.5">
              年輪に応じた地域応援特典
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              現地のお店で画面を提示すると、本物の飫肥杉工芸品や名物グルメの割引・プレゼントを受け取れます。
            </p>
          </div>

          <button
            onClick={() => setShowCertificate(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-100/80 hover:bg-amber-200 text-amber-900 flex items-center gap-2 transition-colors"
          >
            <Award className="w-4 h-4 text-amber-700" />
            <span>飫肥杉年輪 認定証を発行</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.map((rw) => {
            const isUnlocked = calculatedAge >= rw.requiredYears;
            return (
              <div
                key={rw.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isUnlocked
                    ? rw.isRedeemed
                      ? 'border-stone-200 bg-stone-50 opacity-75'
                      : 'border-amber-300 bg-gradient-to-br from-amber-50/50 to-white shadow-sm'
                    : 'border-stone-200 bg-stone-50/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold bg-amber-800 text-white px-2 py-0.5 rounded">
                    {rw.badge}
                  </span>
                  <span className="text-xs font-medium text-stone-500">
                    必要樹齢: {rw.requiredYears}年生以上
                  </span>
                </div>

                <div className="text-xs text-amber-900 font-bold mb-1">
                  {rw.placeName}
                </div>
                <h4 className="text-sm font-bold text-stone-900 mb-1">
                  {rw.title}
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  {rw.description}
                </p>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  {rw.isRedeemed ? (
                    <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-stone-400" />
                      引換済み
                    </span>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => handleRedeem(rw.id)}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white shadow-sm transition-all active:scale-95"
                    >
                      店舗で提示して引き換える
                    </button>
                  ) : (
                    <span className="text-xs text-stone-400">
                      あと {rw.requiredYears - calculatedAge} 年輪で解放
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Digital Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border-4 border-amber-800/40 relative animate-fadeIn text-center space-y-4">
            <div className="text-xs font-bold tracking-widest text-amber-800 uppercase">
              宮崎県日南市 スローツーリズム推進委員会
            </div>
            <h3 className="text-2xl font-bold font-heritage text-stone-900">
              飫肥杉年輪 認定証
            </h3>
            <div className="w-16 h-1 bg-amber-800 mx-auto rounded-full" />

            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2 text-stone-800 text-xs leading-relaxed">
              <p>
                あなたは日南の山・海・町並みに息づく物語に耳を傾け、
                飫肥杉の樹齢を <strong className="text-amber-900 text-sm font-bold">{calculatedAge}年生</strong> まで重ねた、日南の誇り高き関係人口・応援旅人であることをここに認定します。
              </p>
              <div className="pt-2 text-stone-500">
                称号: <strong className="text-stone-900">{cedarRank}</strong>
              </div>
            </div>

            <div className="text-[11px] text-stone-400">
              認定日: {new Date().toLocaleDateString('ja-JP')} · 日南市文化財118件
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setShowCertificate(false)}
                className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm transition-all"
              >
                手帳に戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
