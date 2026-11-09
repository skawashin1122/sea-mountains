export type Language = 'ja' | 'nichinan_dialect' | 'en' | 'zh_tw';

export type PersonaId = 'samurai' | 'fisherman' | 'grandmother' | 'forester' | 'shrine_maiden' | 'conductor';

export interface PersonaInfo {
  id: PersonaId;
  nameJa: string;
  roleJa: string;
  nameEn: string;
  nameZh: string;
  area: string;
  descriptionJa: string;
  descriptionEn: string;
  descriptionZh: string;
  defaultGreeting: string;
  avatarBg: string;
  iconName: string;
}

export interface CulturalSpot {
  id: string;
  name: string;
  area: 'obi' | 'aburatsu' | 'sakatani' | 'udo' | 'kitago' | 'nango';
  areaNameJa: string;
  culturalDesignation: string; // e.g. "国指定重要文化財", "国選定重要伝統的建造物群保存地区", "国選定重要文化的景観"
  category: 'architecture' | 'landscape' | 'coastal' | 'forest' | 'railway';
  descriptionJa: string;
  descriptionEn: string;
  descriptionZh: string;
  deepHistoryJa: string;
  recommendedPersona: PersonaId;
  imageUrl: string;
  lat: number;
  lng: number;
  isDeepSlowSpot: boolean; // Highlights Sakatani, Udo, Kitago
  specialtyTip: string;
}

export interface StorytellerResponse {
  characterName: string;
  title: string;
  story: string;
  culturalTrivia: string;
  slowTravelTip: string;
  greetingAudioText?: string;
}

export interface ConciergePlan {
  courseTitle: string;
  themeDescription: string;
  totalDuration: string;
  highlights: string[];
  stops: {
    step: number;
    name: string;
    area: string;
    stayMinutes: number;
    culturalAsset: string;
    slowExperience: string;
    localEconomyNote: string;
  }[];
  localFoodTip: string;
  messageFromNichinan: string;
}

export interface StampRecord {
  id: string;
  spotName: string;
  area: string;
  date: string;
  characterName: string;
  summary: string;
  ringYear: number;
}
