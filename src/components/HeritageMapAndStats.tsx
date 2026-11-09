import React, { useState } from 'react';
import {
  Landmark,
  TrendingUp,
  Ship,
  Train,
  Store,
  Compass,
  MapPin,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Award
} from 'lucide-react';
import { CULTURAL_SPOTS, REGIONAL_STATS } from '../data/nichinanHeritage';
import { CulturalSpot, Language } from '../types';

interface Props {
  language: Language;
  onSelectSpot: (spotId: string) => void;
}

export const HeritageMapAndStats: React.FC<Props> = ({
  language,
  onSelectSpot,
}) => {
  const [selectedArea, setSelectedArea] = useState<string>('all');

  const filteredSpots =
    selectedArea === 'all'
      ? CULTURAL_SPOTS
      : CULTURAL_SPOTS.filter((s) => s.area === selectedArea);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Mini Stats Infographic Dashboard */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-200/80">
        <div className="max-w-2xl mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 tracking-wider uppercase mb-1">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>Nichinan Regional Statistics & Strategic Insight</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-heritage text-stone-900">
            日南の文化財118件と、寄り道周遊DXの意義
          </h2>
          <p className="text-xs md:text-sm text-stone-600 mt-1">
            中心部の港や駅前で完結してしまう観光から、奥深い中山間地（酒谷・鵜戸・北郷）へ。
            ミニ統計データから見えてくる日南のポテンシャルと地域共創の姿です。
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: 118 Cultural Properties */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-900">国指定・登録文化財</span>
              <Landmark className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-3xl font-bold font-heritage text-amber-950">
              118 <span className="text-sm font-sans font-normal text-amber-800">件</span>
            </div>
            <p className="text-[11px] text-amber-800/90 mt-1 leading-snug">
              115件から増加。明治の無筋コンクリート造灯台の最高峰「鞍埼灯台」の重要文化財指定など誇り高き歴史。
            </p>
          </div>

          {/* Stat 2: Cruise Ships */}
          <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sky-900">油津港クルーズ寄港</span>
              <Ship className="w-4 h-4 text-sky-700" />
            </div>
            <div className="text-xl font-bold font-heritage text-sky-950 mt-1">
              世界最高峰の船
            </div>
            <p className="text-[11px] text-sky-800/90 mt-1 leading-snug">
              クイーンエリザベス、MSCベリッシマが相次いで寄港。国際的なインバウンド客へ深い日本文化を発信。
            </p>
          </div>

          {/* Stat 3: Taiwan Sister Station */}
          <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-rose-900">国際友好協定</span>
              <Train className="w-4 h-4 text-rose-700" />
            </div>
            <div className="text-xl font-bold font-heritage text-rose-950 mt-1">
              台湾「日南駅」姉妹駅
            </div>
            <p className="text-[11px] text-rose-800/90 mt-1 leading-snug">
              同名の奇跡。1922年木造駅舎の台湾日南駅とJR日南線が結ぶ、心温まる日台文化交流。
            </p>
          </div>

          {/* Stat 4: Deep Area Economics */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-900">中山間地の消費分散</span>
              <Store className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-xl font-bold font-heritage text-emerald-950 mt-1">
              酒谷29件 / 鵜戸31件
            </div>
            <p className="text-[11px] text-emerald-800/90 mt-1 leading-snug">
              中心部に偏りがちな消費を、AI語り部と寄り道提案で里山や岬の店舗へ広げる地域循環モデル。
            </p>
          </div>
        </div>
      </div>

      {/* Cultural Spots Explorer with Filter */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-200/80 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold font-heritage text-stone-900">
              日南の文化財・名所アーカイブ
            </h3>
            <p className="text-xs text-stone-500">
              気になる名所を選ぶと、「景色にかざすAI語り部」でその土地の人物が直接物語を語ります。
            </p>
          </div>

          {/* Area Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-xl text-xs font-medium">
            {[
              { id: 'all', label: 'すべて' },
              { id: 'obi', label: '飫肥（重伝建）' },
              { id: 'sakatani', label: '酒谷（棚田）' },
              { id: 'nango', label: '南郷・大島（灯台）' },
              { id: 'udo', label: '鵜戸（洞窟神宮）' },
              { id: 'kitago', label: '北郷（飫肥杉・渓谷）' },
              { id: 'aburatsu', label: '油津・日南線' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSelectedArea(btn.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedArea === btn.id
                    ? 'bg-amber-800 text-white shadow-sm font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Spot Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpots.map((spot) => (
            <div
              key={spot.id}
              className="group bg-stone-50/50 hover:bg-white rounded-2xl border border-stone-200/80 hover:border-amber-300 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video overflow-hidden bg-stone-200">
                  <img
                    src={spot.imageUrl}
                    alt={spot.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-semibold">
                    {spot.areaNameJa}
                  </div>
                  {spot.isDeepSlowSpot && (
                    <div className="absolute top-2.5 right-2.5 bg-emerald-700/90 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                      中山間地・寄り道
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-2">
                  <div className="text-[11px] font-bold text-amber-800">
                    {spot.culturalDesignation}
                  </div>
                  <h4 className="text-base font-bold text-stone-900 font-heritage group-hover:text-amber-900 transition-colors">
                    {spot.name}
                  </h4>
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {spot.descriptionJa}
                  </p>
                  <div className="pt-2 text-[11px] text-stone-500 bg-amber-50/60 p-2.5 rounded-lg border border-amber-100/60">
                    <strong className="text-amber-900">歴史の深み: </strong>
                    {spot.deepHistoryJa.slice(0, 95)}...
                  </div>
                </div>
              </div>

              {/* Action: Open in Storyteller */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => onSelectSpot(spot.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>この場所のAI語り部を聞く</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
