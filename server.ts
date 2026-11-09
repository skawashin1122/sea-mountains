import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// Server-side Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Timeout helper
function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), ms);
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise,
  ]);
}

// Retry helper for Gemini API with backoff
async function callWithRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 500): Promise<T> {
  try {
    return await withTimeout(fn(), 8000);
  } catch (err: any) {
    const isTransient =
      err?.message?.includes('503') ||
      err?.message?.includes('UNAVAILABLE') ||
      err?.message?.includes('high demand') ||
      err?.status === 503;
    if (retries > 0 && isTransient) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return callWithRetry(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

// Fallback authentic stories when Gemini is under temporary high demand (503)
function getCuratedStoryFallback(spotName: string, persona: string, language: string, question?: string) {
  const isEn = language === 'en';
  const isZh = language === 'zh_tw';
  const isDialect = language === 'nichinan_dialect';

  if (persona === 'grandmother' || spotName.includes('酒谷') || spotName.includes('棚田')) {
    if (isEn) {
      return {
        characterName: 'Grandmother Tome of Sakatani',
        title: 'Stone Terraces Carved by Generations of Mountain Water',
        story: `Welcome all the way deep into Sakatani. Look closely at these stone walls—stacked by our ancestors piece by piece without mortar, enduring over a century of heavy rains. The clear springs from the Obi cedar forests flow down these channels, nurturing our rice and green mugwort. We are a quiet village with only 29 local shops, but every spring we gather in the spirit of "Yui" (mutual village aid). Take a deep breath of the mountain breeze, eat some of our handmade kusa-dango, and feel the gentle pulse of the countryside.`,
        culturalTrivia: 'Sakamoto Terraced Fields is a National Important Cultural Landscape. The stone walls use local mountain stones interlocked to drain water naturally and resist typhoons.',
        slowTravelTip: 'Be sure to stop by Michi-no-Eki Sakatani down the road for warm kusa-dango and handmade bamboo craft items.',
        greetingAudioText: 'Welcome to Sakatani! Come sit down, have a bite of mugwort dumpling and take a slow breath.',
      };
    }
    if (isZh) {
      return {
        characterName: '酒谷梯田守護者 留美奶奶',
        title: '世代石工與飫肥杉甘泉凝結的綠色奇蹟',
        story: `真高興看到遠道而來的貴客願意走進深山的酒谷呀！看看眼前這些層層疊疊的石砌梯田，都是我們先人一塊塊親手堆疊起來的。這座山村雖然只有29家在地小店，但大家互助合作的「結（Yui）」之心幾百年來從未改變。從飫肥杉山林流下的天然湧水滋養了甘甜的梯田米，也長出了香氣撲鼻的艾草。請坐下來嚐一口熱騰騰的手作艾草糰子，感受日南山里最溫暖的呼吸吧。`,
        culturalTrivia: '酒谷坂元梯田獲選為日本國家級「重要文化景觀」，精巧的亂石乾砌工法具備極佳的排水與抗震透水能力。',
        slowTravelTip: '順道探訪山腳下的「道の駅酒谷」，品嚐在地農家媽媽們手捏的草糰子與梯田米飯糰。',
        greetingAudioText: '歡迎來到深山酒谷，坐下來吃個草糰子，慢慢吹著山風吧。',
      };
    }
    return {
      characterName: '酒谷のトメばあちゃん',
      title: isDialect ? '先祖代々の石積みと湧水が守る、酒谷のぬくもり' : '先祖代々の石積みが語る、坂元棚田と山の恵み',
      story: isDialect
        ? `よう奥の酒谷までおいでくれたとなぁ！この坂元棚田の石垣ば見てみらんね。江戸から昭和にかけて、先祖たちが一つひとつ手で積んだ頑丈な石積みじゃが。上流の飫肥杉の山から湧き出る清らかな水が田んぼを満たして、旨い米と青々したよもぎを育ててくれるとよ。酒谷は事業所が29件ばかりの静かな山里じゃどん、集落みんなで助け合う「結（ゆい）」の心が息づいちょる。道の駅の草だんごでも頬張って、ゆったりしていっきゃいね。`
        : `ようこそ奥深い酒谷へお越しくださいました。この坂元棚田の石積みは、先祖たちが頑丈に積み上げた国の重要文化的景観です。飫肥杉の山が育む清らかな湧水が田んぼを満たし、おいしい棚田米と香り高いよもぎを育んでいます。事業所わずか29件の静かな山里ですが、互いに助け合う「結（ゆい）」の心が今も脈々と息づいています。どうぞ深呼吸して、のんびりとした日南の暮らしに触れていってください。`,
      culturalTrivia: '坂元棚田は国選定重要文化的景観。急斜面を支える石積み工法は通水性に優れ、日南特有の大雨にも崩れない先人の土木技術の結晶です。',
      slowTravelTip: '道の駅酒谷で蒸したての「草だんご」を味わい、日南ダムの静寂な湖畔へ足を延ばすのがおすすめです。',
      greetingAudioText: 'よう奥の酒谷まで来てくれたねぇ。草だんごでも食べてゆっくりしていっきゃい。',
    };
  }

  if (persona === 'fisherman' || spotName.includes('大島') || spotName.includes('鞍埼') || spotName.includes('油津')) {
    if (isEn) {
      return {
        characterName: 'Skipper Kenzo of Aburatsu',
        title: 'Guiding Kuroshio Waters: The Historic Kurasaki Lighthouse',
        story: `Ahoy! You have arrived at the maritime gateway of southern Kyushu! Standing proud on Oshima Island is Kurasaki Lighthouse—built back in 1884, Japan's oldest unreinforced concrete lighthouse, recently designated a National Important Cultural Property. For generations, our skipjack tuna fleet has navigated the fierce Kuroshio current following that bright white beacon. We are proud of Nichinan’s ranking as Japan’s #1 near-shore skipjack pole-and-line port. When you get back to the docks, you must try our seared Katsuo-aburi-ju!`,
        culturalTrivia: 'Kurasaki Lighthouse was designed under British engineering influences in 1884 and is recognized as a milestone of Meiji-era concrete civil engineering.',
        slowTravelTip: 'Take a small ferry across to Oshima, then visit Port Station Meitsu for freshly seared skipjack tuna lunch sets.',
        greetingAudioText: 'Welcome aboard! Hear the roar of the Pacific waves and the proud tales of our Kuroshio fishermen!',
      };
    }
    if (isZh) {
      return {
        characterName: '近海鰹魚船長 健三',
        title: '照亮黑潮百年的白色守護者：鞍埼燈塔',
        story: `嘿！歡迎來到日本近海鰹魚一支釣第一名的港町！矗立在大島險崖上的「鞍埼燈塔」，建於明治17年（1884年），是日本現存最古老的無筋混凝土燈塔，最近更升格為日本國家重要文化財！我們漁夫世世代代在黑潮狂浪中搏鬥，只要看見這座白色燈塔的光芒，心裡就知道平安回到家了。走過油津紅磚倉庫和堀川運河，一定要去目井津港大口品嚐香氣四溢的炙燒鰹魚重！`,
        culturalTrivia: '鞍埼燈塔為日本明治初期近代化登錄文化財，2023年正式指定為國家重要文化財，見證日本近代航路安全與混凝土建築史。',
        slowTravelTip: '搭乘渡船登上大島近距離觀覽燈塔，回程在「港の駅めいつ」品嚐極上鰹魚炙烤雙味丼。',
        greetingAudioText: '吹著黑潮海風，來聽聽我們討海人與百年鞍埼燈塔的故事吧！',
      };
    }
    return {
      characterName: '油津・目井津の船頭 健三',
      title: isDialect ? '黒潮を照らす白き道標・鞍埼灯台と一本釣りの心意気' : '黒潮の難所を照らし続ける鞍埼灯台と海の男たち',
      story: isDialect
        ? `おっ、いい風吹いちょるな！大島沖にそびえる鞍埼灯台（くらさきとうだい）ば見らんね。明治17年に建てられた日本最古の無筋コンクリート造灯台で、最近国の重要文化財に指定された宝物じゃが！わしら日南の漁師は、日本一の近海カツオ一本釣りの誇りば胸に、この灯台の光を目指して港へ帰って来るとよ。油津の堀川運河や赤レンガ館の歴史も、みんな飫肥杉やカツオを運んだ海のロマンから始まっとる。港の駅めいつのカツオ炙り重は絶品やから、絶対に食べていかんね！`
        : `おいでいただき感謝します！大島の断崖に立つ鞍埼灯台は、明治17年初点灯の日本最古の無筋コンクリート造灯台で、国の重要文化財に指定された日南の誇りです。近海カツオ一本釣り日本一の港町として、船乗りたちは黒潮の荒波を越え、この灯台の光を頼りに港へ戻ってきました。油津赤レンガ館や堀川運河が語る海の歴史と、新鮮なカツオ炙り重の味をぜひ堪能してください。`,
      culturalTrivia: '鞍埼灯台は明治17年築の日本現存最古の無筋コンクリート造灯台。2023年に国の重要文化財に新規指定され、近代土木遺産の最高峰と讃えられています。',
      slowTravelTip: '目井津港の「港の駅めいつ」で日南名物・カツオ炙り重を食べ、渡船で大島の奇岩遊歩道へ寄り道するのが通の楽しみ方です。',
      greetingAudioText: '黒潮の荒波と、わしら一本釣り漁師の誇りを聞いていかんね！',
    };
  }

  // Default Samurai / Obi Castle Town
  if (isEn) {
    return {
      characterName: 'Samurai Ito Jinbei',
      title: 'Four Centuries of Heritage Etched in Obi Stone and Cedar Forests',
      story: `Greetings, esteemed traveler. You stand in the castle town of Obi, held by the Ito clan for fourteen generations. Notice the majestic gray stone walls flanking our samurai residences—carved from local Obi volcanic tuff, cool to the touch and covered in velvety emerald moss. In the Edo era, when the domain faced grave financial hardship, our lords and scholars initiated widespread planting of Obi cedar, yielding lightweight, resin-rich timber prized nationwide for wooden ship hulls. Walk gently along our stone alleys and taste our traditional egg pudding-cake.`,
      culturalTrivia: 'Obi Castle Town is selected as a National Important Preservation District for Groups of Historic Buildings. The volcanic tuff walls are soft enough to shape yet resilient against weather and fire.',
      slowTravelTip: 'Venture beyond the castle to the quiet backstreets of Matsuo-no-maru, and sample Obi-ten fish patties freshly fried at family-run shops.',
      greetingAudioText: 'Welcome to Obi Castle Town. Touch this mossy stone wall and listen to four hundred years of history.',
    };
  }
  if (isZh) {
    return {
      characterName: '飫肥藩士 伊東甚兵衛',
      title: '四百年飫肥石垣與護藩飫肥杉的榮光物語',
      story: `遠道而來的旅人，歡迎步入九州小京都——飫肥城下町。請駐足撫摸身旁由火山凝灰岩「飫肥石」砌造的厚重石垣，在綠苔覆蓋下已佇立了四百年。當年飫肥藩財政艱困之時，藩主與賢儒安井息軒提倡廣植飫肥杉，因油脂豐厚、水不腐朽，成為全日本造船最搶手的「弁甲材」，拯救了整個領國。願您漫步在藥醫門與武家屋敷之間，品嚐口感宛如布丁的飫肥厚燒玉子，感受時光沉澱的優雅。`,
      culturalTrivia: '飫肥城下町獲選為日本重要傳統建造物群保存地區（重傳建），特有的「飫肥石」由火山灰凝結而成，蓄水透氣且防火。',
      slowTravelTip: '除了主要城郭，推薦漫步至路地裏的傳統店鋪，品嚐剛起鍋的香脆飫肥天與甜美日向夏柑橘。',
      greetingAudioText: '歡迎光臨飫肥藩城下町。請觸摸這片石垣，傾聽四百年的歲月私語。',
    };
  }
  return {
    characterName: '飫肥藩士 伊東甚兵衛',
    title: isDialect ? '四百年の石垣と飫肥杉が語る、城下町の武士の気概' : '飫肥石の石垣と名木・飫肥杉が紡ぐ四百年の物語',
    story: isDialect
      ? `ようこそ飫肥の城下町へ！この苔むした石垣に触れてみらんね。これは加工しやすくて火に強い「飫肥石（おびいし）」という凝灰岩じゃが。江戸時代、五万一千石の伊東家が治めたこの町は、財政難に苦しんだ時期もあったとよ。それを救ったのが山々に植えられた「飫肥杉」じゃ。油分が多く水に浮く木質は、木造船の弁甲材として日本中から重宝されたとよ。武家屋敷の並びをのんびり歩いて、まるでプリンのように甘い厚焼き玉子を食べていっきゃいね。`
      : `よくぞ飫肥城下町へお越しくださいました。周囲を囲む石垣は、地元で採掘された凝灰岩「飫肥石」で積まれており、国の重要伝統的建造物群保存地区に選定されています。江戸時代、財政危機に見舞われた飫肥藩は、山々に飫肥杉を植林する政策を断行しました。樹脂を多く含み水に強い飫肥杉は、木造船の弁甲材として上方や日本海側まで運ばれ藩を潤しました。ぜひ武家屋敷の薬医門を眺めながら、名物の厚焼き玉子をご賞味ください。`,
    culturalTrivia: '飫肥城下町は九州で最初に選定された重要伝統的建造物群保存地区。飫肥石の石垣や武家屋敷の薬医門が、当時の身分制度と城郭都市の美学を今に伝えます。',
    slowTravelTip: '豫章館の枯山水庭園で風の音に耳を傾けた後は、北郷の飫肥杉美林温泉や酒谷の坂元棚田へ寄り道するのが極上のスローツーリズムです。',
    greetingAudioText: 'ようこそ飫肥へ。この飫肥石の石垣に触れてみられよ。四百年の息吹が宿っておる。',
  };
}

// Fallback authentic concierge itinerary
function getCuratedItineraryFallback(travelerType: string, stayHours: string, language: string) {
  return {
    courseTitle: '海幸山幸を心で味わう「酒谷棚田と飫肥杉美林」ゆったり寄り道コース',
    themeDescription:
      '油津港のクルーズ寄港地や駅から一歩足を伸ばし、事業所29件の穏やかな山里・酒谷の石積み棚田と、森林セラピー基地・北郷の飫肥杉美林へ。混雑を離れて深呼吸する極上のスローツーリズムです。',
    totalDuration: stayHours || '約5〜6時間',
    highlights: ['国選定重要文化的景観・坂元棚田', '酒谷名物つきたて草だんご', '北郷飫肥杉美林と猪八重渓谷', '港の駅めいつ近海カツオ炙り重'],
    stops: [
      {
        step: 1,
        name: '油津赤レンガ館＆堀川運河（出発地周辺）',
        area: '油津',
        stayMinutes: 40,
        culturalAsset: '国登録有形文化財・大正10年建造の洋風赤レンガ倉庫と飫肥杉運搬の運河',
        slowExperience: '石積みの護岸とアーチ橋（夢見橋）の風景を眺めながら、海風を感じて散策。',
        localEconomyNote: '運河沿いのローカルカフェで日向夏ドリンクをテイクアウト。',
      },
      {
        step: 2,
        name: '酒谷・坂元棚田＆道の駅酒谷（中山間地寄り道）',
        area: '酒谷',
        stayMinutes: 70,
        culturalAsset: '国選定重要文化的景観・先人が築いた精緻な石積みの棚田群',
        slowExperience: '山の湧水が流れる水路の音に耳を澄まし、棚田を見渡すベンチで深呼吸。',
        localEconomyNote: '事業所29件の酒谷を応援！おばあちゃん手作りの名物草だんごとお茶を堪能。',
      },
      {
        step: 3,
        name: '飫肥城下町・豫章館＆武家屋敷通り',
        area: '飫肥',
        stayMinutes: 60,
        culturalAsset: '国選定重要伝統的建造物群保存地区（重伝建）と飫肥石の苔むす石垣',
        slowExperience: '藩主ゆかりの枯山水庭園を眺め、武家屋敷の薬医門の木肌に触れる。',
        localEconomyNote: '老舗店でプリンのような伝統の厚焼き玉子と揚げたて飫肥天を食べ歩き。',
      },
      {
        step: 4,
        name: '北郷・猪八重渓谷＆飫肥杉美林（森林浴）',
        area: '北郷',
        stayMinutes: 50,
        culturalAsset: '世界的コケの宝庫（300種自生）と造船材として育てられた飫肥杉林',
        slowExperience: '飫肥杉の爽やかな木の香りに包まれ、美肌の湯・北郷温泉郷で足湯に浸かる。',
        localEconomyNote: '道の駅きたごうで本物の飫肥杉工芸品（コースターや箸）を購入。',
      },
      {
        step: 5,
        name: '目井津港・港の駅めいつ（港町グルメ）',
        area: '南郷',
        stayMinutes: 50,
        culturalAsset: '日本一の近海カツオ一本釣りの水揚げ港と国宝級鞍埼灯台の眺望',
        slowExperience: '水揚げされたばかりの新鮮なカツオ炙り重を、港の船を眺めながら味わう。',
        localEconomyNote: '漁協直営店で地元の漁師を応援し、海の恵みに感謝するひととき。',
      },
    ],
    localFoodTip: '日南名物「カツオ炙り重」（最初は刺身、二杯目は香ばしく炙って特製タレと茶漬けで）と酒谷の草だんご。',
    messageFromNichinan: '大急ぎで通り過ぎず、山と海の静かな営みに耳を澄ませてくれてありがとう。またいつでも帰ってきてね。',
  };
}

// Health Check API
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/test', (req, res) => {
  res.json({ received: req.body, time: Date.now() });
});

// API: Multilingual Storyteller Generation
app.post('/api/storyteller/narrate', async (req, res) => {
  const { spotName, persona, language, imageBase64, customQuestion } = req.body;

  try {
    const ai = getGeminiClient();

    let systemInstruction = `あなたは宮崎県日南市の観光文化財案内を行う「AI語り部」です。
訪れた旅人に、ただの解説ではなく、その土地に息づく生活や歴史、魂のこもった物語を語りかけます。
日南市は国指定・登録文化財が118件に達し、飫肥杉の美林や飫肥城下町の武家屋敷（重伝建）、酒谷の坂元棚田（重要文化的景観）、大島・鞍埼灯台（重要文化財）、鵜戸神宮など豊かな宝があります。
また、油津港には世界屈指のクルーズ船（クイーンエリザベス、MSCベリッシマ等）が寄港し、台湾の「日南（リーナン）駅」とは姉妹駅協定を結んでいます。

【選択されたキャラクター設定】
`;

    if (persona === 'samurai') {
      systemInstruction += `【飫肥藩士（伊東家の家臣）】
江戸時代の飫肥城下町に仕えた武士。飫肥杉の山林育成と財政再建（清武地頭・安井息軒や伊東祐兵公の歴史）、武家屋敷の石垣「飫肥石（凝灰岩）」、飫肥杉の弁甲材としての誇りを凛々しく、かつ旅人に親身に語る。一人称は「拙者」「当家」。`;
    } else if (persona === 'fisherman') {
      systemInstruction += `【油津・目井津の近海カツオ一本釣り船頭】
日本一の近海カツオ一本釣り漁業の町・日南の誇り高き船頭。荒波の大島沖や鞍埼灯台の歴史、油津赤レンガ館の繁栄、新鮮なカツオ炙り重の旨さ、男たちの海原への情熱を、豪快で温かく語る。一人称は「わし」「おいどん」。`;
    } else if (persona === 'grandmother') {
      systemInstruction += `【酒谷・坂元棚田の守り手おばあちゃん】
山あいの酒谷で、先祖代々伝わる石積みの棚田を守ってきた温かいおばあちゃん。美味しい草だんご、澄んだ水、棚田の四季の美しさと、中山間地での助け合いの暮らしを、しみじみと優しく語る。一人称は「ばあちゃん」「わたし」。`;
    } else if (persona === 'forester') {
      systemInstruction += `【北郷の飫肥杉山守（やまもり）】
北郷の山中で飫肥杉の森を何代にもわたって育ててきた山守。飫肥杉特有のしなり、樹脂の多さ（水に浮き腐りにくい弁甲材）、猪八重渓谷のコケや森林浴の清々しさ、山と海を繋ぐ森の恵みを誇りを持って語る。一人称は「わし」「僕」。`;
    } else if (persona === 'shrine_maiden') {
      systemInstruction += `【鵜戸の巫女・海神の語り手】
日向灘の奇岩洞窟に鎮座する鵜戸神宮の巫女。山幸彦と豊玉姫の神話、運玉投げの祈り、青い海と朱塗りの本殿の神秘を、清らかで情景が目に浮かぶように語る。`;
    } else if (persona === 'conductor') {
      systemInstruction += `【日南線＆台湾日南駅友好コンダクター】
JR九州日南線と、台湾鉄路「日南（リーナン）駅」の姉妹駅の絆を愛する鉄道案内人。車窓から見える七ツ八重や鬼の洗濯板、海幸山幸観光列車、国境を越えた人の温もりを爽やかに語る。`;
    } else {
      systemInstruction += `【日南の案内人】親しみやすく温かい案内人。`;
    }

    systemInstruction += `\n【指定言語】\n`;
    if (language === 'nichinan_dialect') {
      systemInstruction += `日南弁（宮崎弁南那珂方言）。「〜じゃが」「〜やっちゃが」「〜け？」「おいでくれたとなぁ」「てげ（とても）」「〜やじ」「ゆったりしていっきゃい（ゆっくりしていってね）」など、温かみあふれる日南の方言を自然に散りばめてください。`;
    } else if (language === 'ja') {
      systemInstruction += `標準日本語。上品で情感豊かな語り口。`;
    } else if (language === 'en') {
      systemInstruction += `Natural and poetic English suitable for international travelers and cruise ship passengers. Retain the soul and warmth of the chosen Japanese character persona. Include cultural explanations naturally.`;
    } else if (language === 'zh_tw') {
      systemInstruction += `台灣繁體中文。親切、溫暖且富有文化深度，專為台灣旅客設計。提及宮崎日南與台灣台中日南車站的友好姊妹緣分，傳達如同親友造訪般的真摯情感。`;
    }

    systemInstruction += `
【出力要件】
必ず以下のJSON形式で返してください:
{
  "characterName": "語り部の名前",
  "title": "物語のタイトル",
  "story": "語り部としての語り（350〜550文字程度。情景描写、歴史・文化財のディープな背景、旅人への温かいメッセージ）。",
  "culturalTrivia": "この場所の文化財・歴史のディープな豆知識（1〜2文）",
  "slowTravelTip": "奥深い中山間地（酒谷、鵜戸、北郷など）や近隣の隠れ名所への寄り道アドバイス（1〜2文）",
  "greetingAudioText": "冒頭の呼びかけ短文"
}
`;

    const userPrompt = customQuestion
      ? `【スポット/風景】${spotName || '日南の景色'}\n【旅人からの質問・関心】${customQuestion}`
      : `【スポット/風景】${spotName || '日南の景色'}\nこの場所の歴史、文化財としての価値、日南の山幸海幸の物語を、あなたのキャラクターになりきって語ってください。`;

    const contents: any[] = [];
    if (imageBase64) {
      const match = imageBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (match) {
        const mimeType = `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}`;
        const data = match[2];
        contents.push({
          inlineData: {
            mimeType,
            data,
          },
        });
      }
    }
    contents.push({ text: userPrompt });

    const response = await callWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: contents },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      })
    );

    const text = response.text || '{}';
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.warn('Gemini Storyteller API returned error, providing authentic fallback story:', error.message);
    const fallback = getCuratedStoryFallback(spotName || '', persona || 'samurai', language || 'ja', customQuestion);
    res.json(fallback);
  }
});

// API: Slow Travel Concierge (寄り道コンシェルジュ)
app.post('/api/concierge/recommend', async (req, res) => {
  const { travelerType, stayHours, interests, startPoint, language } = req.body;

  try {
    const ai = getGeminiClient();

    const systemInstruction = `あなたは宮崎県日南市の「のんびり寄り道」AIコンシェルジュです。
日南市では、世界最高峰のクルーズ船（クイーンエリザベス、MSCベリッシマ等）の油津寄港や観光客の消費が、中心市街地（吾田・油津）に偏り、奥深い魅力を持つ酒谷（事業所わずか29件、美しい坂元棚田）や鵜戸（事業所31件、海神の神話）、北郷（飫肥杉の美林と温泉）に届きにくい課題があります。
また、日南市は国指定・登録文化財が118件（国宝級の鞍埼灯台の重要文化財指定、飫肥城下町の重伝建、酒谷の坂元棚田など）を誇ります。

あなたの役割は、通り一遍の観光地めぐりではなく、日南の「海幸・山幸」の深呼吸できるスローツーリズム体験を企画することです。
中心部から少し足を伸ばした酒谷、北郷、細田、南郷、鵜戸などのディープな名所を必ず含め、地域経済と文化財継承に貢献するあたたかい周遊プランを提案してください。

出力形式（必ず以下のJSON形式）:
{
  "courseTitle": "寄り道コースの魅力的なタイトル",
  "themeDescription": "この寄り道コースのコンセプトと日南の魅力（2〜3文）",
  "totalDuration": "所要時間の目安（例: 約5時間）",
  "highlights": ["見どころキーワード1", "見どころキーワード2", "見どころキーワード3"],
  "stops": [
    {
      "step": 1,
      "name": "スポット名称",
      "area": "エリア（飫肥 / 油津 / 酒谷 / 北郷 / 南郷 / 鵜戸）",
      "stayMinutes": 50,
      "culturalAsset": "関連文化財や歴史的背景",
      "slowExperience": "ここでののんびり体験",
      "localEconomyNote": "地域応援ポイント"
    }
  ],
  "localFoodTip": "日南のご当地グルメおすすめ",
  "messageFromNichinan": "日南の人々からの歓迎メッセージ"
}
`;

    const userPrompt = `
【旅行者タイプ】${travelerType || 'クルーズ船またはのんびり観光客'}
【滞在可能時間】${stayHours || '約5〜6時間'}
【出発地点】${startPoint || '油津港（または日南駅）'}
【興味テーマ】${interests ? interests.join(', ') : '歴史文化、飫肥杉の自然、地元食文化'}
【言語】${language || 'ja'}

日南の文化財118件の誇りと、酒谷・鵜戸・北郷などの奥深い地域への寄り道を含んだ、心温まるスローツーリズムプランを提案してください。
`;

    const response = await callWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      })
    );

    const text = response.text || '{}';
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.warn('Gemini Concierge API error, providing authentic slow-travel fallback plan:', error.message);
    const fallback = getCuratedItineraryFallback(travelerType, stayHours, language);
    res.json(fallback);
  }
});

// API: Audio Speech Generation (Gemini TTS)
app.post('/api/tts/speak', async (req, res) => {
  try {
    const { text, language, persona } = req.body;
    const ai = getGeminiClient();

    let voiceName = 'Kore';
    if (persona === 'samurai' || persona === 'fisherman') {
      voiceName = 'Fenrir';
    } else if (persona === 'conductor' || persona === 'forester') {
      voiceName = 'Puck';
    } else if (persona === 'shrine_maiden') {
      voiceName = 'Zephyr';
    } else if (persona === 'grandmother') {
      voiceName = 'Charon';
    }

    const response = await callWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Say warmly as a Japanese local storyteller: ${text.slice(0, 280)}`,
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      })
    );

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('No audio returned from Gemini TTS');
    }

    res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.warn('TTS error (client will fallback to SpeechSynthesis):', error.message);
    res.status(500).json({ error: error.message || 'TTS generation failed' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
