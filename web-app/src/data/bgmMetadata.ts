export interface BgmInfo {
  id: string;
  title: string;
  titleEn: string;
  originalPiece: string;
  composer: string;
  variation?: string;
}

export const BGM_METADATA_MAP: Record<string, BgmInfo> = {
  // === Theme & Bach Masterpieces ===
  bgm_01: {
    id: "bgm_01",
    title: "G弦上的咏叹调 (主题曲)",
    titleEn: "Air on the G String (Main Theme)",
    originalPiece: "巴赫 《G弦上的咏叹调》 (Air on the G String)",
    composer: "J.S. Bach",
    variation: "主题原版 / Main Theme"
  },
  bgm_02: {
    id: "bgm_02",
    title: "魔鬼的颤音",
    titleEn: "The Devil's Trill",
    originalPiece: "塔蒂尼 《魔鬼的颤音奏鸣曲》 (The Devil's Trill Sonata)",
    composer: "G. Tartini",
    variation: "魔王的主题 / Maou's Theme"
  },
  bgm_03: {
    id: "bgm_03",
    title: "D大调交响曲",
    titleEn: "Sinfonia in D major",
    originalPiece: "巴赫 《D大调前奏曲与交响曲》",
    composer: "J.S. Bach",
    variation: "日常学园 / School Days"
  },
  bgm_04: {
    id: "bgm_04",
    title: "哥德堡变奏曲",
    titleEn: "Goldberg Variations",
    originalPiece: "巴赫 《哥德堡变奏曲》 BWV 988",
    composer: "J.S. Bach",
    variation: "智谋博弈 / Mind Games"
  },
  bgm_05: {
    id: "bgm_05",
    title: "g小调第一无伴奏小提琴奏鸣曲",
    titleEn: "Violin Sonata No. 1 in G minor",
    originalPiece: "巴赫 《g小调第一无伴奏小提琴奏鸣曲》 BWV 1001",
    composer: "J.S. Bach",
    variation: "静谧黄昏 / Quiet Dusk"
  },
  bgm_06: {
    id: "bgm_06",
    title: "圣母颂",
    titleEn: "Ave Maria",
    originalPiece: "巴赫/古诺 《圣母颂》 (Ave Maria)",
    composer: "Bach / Gounod",
    variation: "纯真誓言 / Innocent Vow"
  },
  bgm_07: {
    id: "bgm_07",
    title: "玄秘曲与叙事",
    titleEn: "Mystic Ballad",
    originalPiece: "巴赫/萨蒂 古典叙事曲",
    composer: "Classical / Arranged",
    variation: "幽邃回想 / Deep Nostalgia"
  },
  bgm_07a: {
    id: "bgm_07a",
    title: "玄秘曲 (轻快版)",
    titleEn: "Mystic Ballad (Light ver.)",
    originalPiece: "巴赫/萨蒂 古典叙事曲",
    composer: "Classical / Arranged",
    variation: "轻松日常 / Light Days"
  },
  bgm_08: {
    id: "bgm_08",
    title: "勃兰登堡第三协奏曲",
    titleEn: "Brandenburg Concerto No. 3",
    originalPiece: "巴赫 《勃兰登堡第三协奏曲》 BWV 1048",
    composer: "J.S. Bach",
    variation: "欢快跃动 / Lively Rhythm"
  },
  bgm_10: {
    id: "bgm_10",
    title: "g小调小赋格",
    titleEn: "Little Fugue in G minor",
    originalPiece: "巴赫 《g小调小赋格》 BWV 578",
    composer: "J.S. Bach",
    variation: "诙谐日常 / Playful Fugue"
  },
  bgm_10a: {
    id: "bgm_10a",
    title: "小赋格 (变奏 A)",
    titleEn: "Little Fugue (Variation A)",
    originalPiece: "巴赫 《g小调小赋格》 BWV 578",
    composer: "J.S. Bach",
    variation: "明快交谈 / Bright Talk"
  },
  bgm_10b: {
    id: "bgm_10b",
    title: "小赋格 (变奏 B)",
    titleEn: "Little Fugue (Variation B)",
    originalPiece: "巴赫 《g小调小赋格》 BWV 578",
    composer: "J.S. Bach",
    variation: "逗趣节奏 / Comic Stroll"
  },
  bgm_11: {
    id: "bgm_11",
    title: "大提琴第一无伴奏组曲",
    titleEn: "Cello Suite No. 1 in G major",
    originalPiece: "巴赫 《G大调第一无伴奏大提琴组曲 前奏曲》 BWV 1007",
    composer: "J.S. Bach",
    variation: "大提琴独白 / Cello Soliloquy"
  },
  bgm_11a: {
    id: "bgm_11a",
    title: "大提琴无伴奏 (变奏 A)",
    titleEn: "Cello Suite No. 1 (Var. A)",
    originalPiece: "巴赫 《G大调第一无伴奏大提琴组曲》 BWV 1007",
    composer: "J.S. Bach",
    variation: "幽邃沉思 / Deep Thought"
  },
  bgm_12: {
    id: "bgm_12",
    title: "d小调恰空舞曲",
    titleEn: "Chaconne in D minor",
    originalPiece: "巴赫 《d小调第二无伴奏小提琴帕蒂塔 恰空》 BWV 1004",
    composer: "J.S. Bach",
    variation: "宿命与誓言 / Fate & Vow"
  },
  bgm_13: {
    id: "bgm_13",
    title: "d小调托卡塔与赋格",
    titleEn: "Toccata & Fugue in D minor",
    originalPiece: "巴赫 《d小调托卡塔与赋格》 BWV 565",
    composer: "J.S. Bach",
    variation: "暴风威严 / Majestic Storm"
  },
  bgm_13a: {
    id: "bgm_13a",
    title: "托卡塔与赋格 (紧迫版)",
    titleEn: "Toccata & Fugue (Urgent ver.)",
    originalPiece: "巴赫 《d小调托卡塔与赋格》 BWV 565",
    composer: "J.S. Bach",
    variation: "紧迫危局 / High Tension"
  },
  bgm_14: {
    id: "bgm_14",
    title: "E大调第三无伴奏小提琴组曲",
    titleEn: "Partita No. 3 in E major",
    originalPiece: "巴赫 《E大调第三无伴奏小提琴组曲 前奏曲》 BWV 1006",
    composer: "J.S. Bach",
    variation: "华丽舞步 / Elegant Finale"
  },
  bgm_15: {
    id: "bgm_15",
    title: "a小调第一小提琴协奏曲",
    titleEn: "Violin Concerto in A minor",
    originalPiece: "巴赫 《a小调第一小提琴协奏曲》 BWV 1041",
    composer: "J.S. Bach",
    variation: "弦乐疾走 / Swift Strings"
  },
  bgm_16c: {
    id: "bgm_16c",
    title: "羽管键琴协奏曲 (慢板)",
    titleEn: "Harpsichord Concerto (Adagio)",
    originalPiece: "巴赫 《f小调羽管键琴协奏曲 慢板》 BWV 1056",
    composer: "J.S. Bach",
    variation: "幽咽夜曲 / Somber Night"
  },
  bgm_16d: {
    id: "bgm_16d",
    title: "羽管键琴协奏曲 (哀伤版)",
    titleEn: "Harpsichord Concerto (Grief ver.)",
    originalPiece: "巴赫 《f小调羽管键琴协奏曲》 BWV 1056",
    composer: "J.S. Bach",
    variation: "诀别时刻 / Farewell"
  },
  bgm_16e: {
    id: "bgm_16e",
    title: "羽管键琴协奏曲 (尾声版)",
    titleEn: "Harpsichord Concerto (Ending ver.)",
    originalPiece: "巴赫 《f小调羽管键琴协奏曲》 BWV 1056",
    composer: "J.S. Bach",
    variation: "残阳余晖 / Twilight"
  },
  bgm_17: {
    id: "bgm_17",
    title: "c小调帕萨卡里亚与赋格",
    titleEn: "Passacaglia & Fugue in C minor",
    originalPiece: "巴赫 《c小调帕萨卡里亚与赋格》 BWV 582",
    composer: "J.S. Bach",
    variation: "深渊凝视 / Abyssal Stare"
  },
  bgm_17a: {
    id: "bgm_17a",
    title: "帕萨卡里亚 (变奏 A)",
    titleEn: "Passacaglia (Var. A)",
    originalPiece: "巴赫 《c小调帕萨卡里亚与赋格》 BWV 582",
    composer: "J.S. Bach",
    variation: "暗潮涌动 / Dark Tides"
  },

  // === Beethoven Masterpieces ===
  bgm_18: {
    id: "bgm_18",
    title: "第五交响曲“命运”",
    titleEn: "Symphony No. 5 'Fate'",
    originalPiece: "贝多芬 《c小调第五交响曲“命运”》 Op. 67",
    composer: "L. van Beethoven",
    variation: "命运之门 / Gate of Fate"
  },
  bgm_20: {
    id: "bgm_20",
    title: "第十四钢琴奏鸣曲“月光”",
    titleEn: "Moonlight Sonata",
    originalPiece: "贝多芬 《升c小调第十四钢琴奏鸣曲“月光”》 Op. 27 No. 2",
    composer: "L. van Beethoven",
    variation: "深夜倾诉 / Midnight Murmurs"
  },
  bgm_21: {
    id: "bgm_21",
    title: "第九交响曲“欢乐颂”",
    titleEn: "Symphony No. 9 'Ode to Joy'",
    originalPiece: "贝多芬 《d小调第九交响曲“合唱” 欢乐颂》 Op. 125",
    composer: "L. van Beethoven",
    variation: "管弦激昂版 / Triumphant"
  },
  bgm_21b: {
    id: "bgm_21b",
    title: "欢乐颂 (独奏小提琴变奏)",
    titleEn: "Ode to Joy (Violin Solo ver.)",
    originalPiece: "贝多芬 《第九交响曲“欢乐颂”》 Op. 125",
    composer: "L. van Beethoven",
    variation: "小提琴变奏 / Violin Solo"
  },
  bgm_21c: {
    id: "bgm_21c",
    title: "欢乐颂 (八音盒与轻音版)",
    titleEn: "Ode to Joy (Music Box ver.)",
    originalPiece: "贝多芬 《第九交响曲“欢乐颂”》 Op. 125",
    composer: "L. van Beethoven",
    variation: "轻柔八音盒 / Music Box"
  },
  bgm_21d: {
    id: "bgm_21d",
    title: "欢乐颂 (抒情钢琴慢板 / 提前到来的春天)",
    titleEn: "Ode to Joy (Piano Ballad / The Early Spring)",
    originalPiece: "贝多芬 《第九交响曲“欢乐颂”》 Op. 125",
    composer: "L. van Beethoven",
    variation: "终章融雪抒情慢板 / True End Climax"
  },
  bgm_22: {
    id: "bgm_22",
    title: "第八钢琴奏鸣曲“悲怆”",
    titleEn: "Pathétique Sonata",
    originalPiece: "贝多芬 《c小调第八钢琴奏鸣曲“悲怆”》 Op. 13",
    composer: "L. van Beethoven",
    variation: "心碎悲怆 / Heartbreak"
  },
  bgm_22a: {
    id: "bgm_22a",
    title: "悲怆奏鸣曲 (变奏 A)",
    titleEn: "Pathétique Sonata (Var. A)",
    originalPiece: "贝多芬 《第八钢琴奏鸣曲“悲怆”》 Op. 13",
    composer: "L. van Beethoven",
    variation: "低沉回响 / Somber Echo"
  },
  bgm_23: {
    id: "bgm_23",
    title: "第二十三钢琴奏鸣曲“热情”",
    titleEn: "Appassionata Sonata",
    originalPiece: "贝多芬 《f小调第二十三钢琴奏鸣曲“热情”》 Op. 57",
    composer: "L. van Beethoven",
    variation: "激荡热情 / Ardent Passion"
  },
  bgm_24: {
    id: "bgm_24",
    title: "埃格蒙特序曲",
    titleEn: "Egmont Overture",
    originalPiece: "贝多芬 《埃格蒙特序曲》 Op. 84",
    composer: "L. van Beethoven",
    variation: "英雄进军 / Hero's March"
  },
  bgm_24a: {
    id: "bgm_24a",
    title: "埃格蒙特序曲 (变奏 A)",
    titleEn: "Egmont Overture (Var. A)",
    originalPiece: "贝多芬 《埃格蒙特序曲》 Op. 84",
    composer: "L. van Beethoven",
    variation: "雪中小屋 / Snow Cabin"
  },
  bgm_24b: {
    id: "bgm_24b",
    title: "埃格蒙特序曲 (变奏 B)",
    titleEn: "Egmont Overture (Var. B)",
    originalPiece: "贝多芬 《埃格蒙特序曲》 Op. 84",
    composer: "L. van Beethoven",
    variation: "春风拂面 / Gentle Spring"
  },
  bgm_25: {
    id: "bgm_25",
    title: "华尔斯坦奏鸣曲",
    titleEn: "Waldstein Sonata",
    originalPiece: "贝多芬 《C大调第二十一钢琴奏鸣曲“华尔斯坦”》 Op. 53",
    composer: "L. van Beethoven",
    variation: "黎明破晓 / Dawn Breakthrough"
  },
  bgm_25b: {
    id: "bgm_25b",
    title: "华尔斯坦 (变奏 B)",
    titleEn: "Waldstein Sonata (Var. B)",
    originalPiece: "贝多芬 《第二十一钢琴奏鸣曲“华尔斯坦”》 Op. 53",
    composer: "L. van Beethoven",
    variation: "激昂交锋 / Heated Clash"
  },
  bgm_25c: {
    id: "bgm_25c",
    title: "华尔斯坦 (紧迫版)",
    titleEn: "Waldstein Sonata (Urgent ver.)",
    originalPiece: "贝多芬 《第二十一钢琴奏鸣曲“华尔斯坦”》 Op. 53",
    composer: "L. van Beethoven",
    variation: "千钧一发 / Critical Edge"
  },
  bgm_26: {
    id: "bgm_26",
    title: "第九小提琴奏鸣曲“克鲁采”",
    titleEn: "Kreutzer Sonata",
    originalPiece: "贝多芬 《A大调第九小提琴奏鸣曲“克鲁采”》 Op. 47",
    composer: "L. van Beethoven",
    variation: "激烈对决 / Ferocious Duel"
  },
  bgm_26b: {
    id: "bgm_26b",
    title: "克鲁采奏鸣曲 (变奏 B)",
    titleEn: "Kreutzer Sonata (Var. B)",
    originalPiece: "贝多芬 《第九小提琴奏鸣曲“克鲁采”》 Op. 47",
    composer: "L. van Beethoven",
    variation: "暗夜追踪 / Midnight Pursuit"
  },
  bgm_27: {
    id: "bgm_27",
    title: "第五小提琴奏鸣曲“春天”",
    titleEn: "Spring Sonata",
    originalPiece: "贝多芬 《F大调第五小提琴奏鸣曲“春天”》 Op. 24",
    composer: "L. van Beethoven",
    variation: "春意盎然 / Joyful Spring"
  },

  // === Schubert, Mussorgsky, Borodin Masterpieces ===
  bgm_28: {
    id: "bgm_28",
    title: "艺术歌曲《魔王》",
    titleEn: "Erlkönig",
    originalPiece: "舒伯特 《魔王》 (Erlkönig) D. 328",
    composer: "F. Schubert",
    variation: "魔王袭来 / Maou's Assault"
  },
  bgm_29: {
    id: "bgm_29",
    title: "第八交响曲“未完成”",
    titleEn: "Unfinished Symphony",
    originalPiece: "舒伯特 《b小调第八交响曲“未完成”》 D. 759",
    composer: "F. Schubert",
    variation: "未完宿愿 / Unfinished Desire"
  },
  bgm_30: {
    id: "bgm_30",
    title: "第十四弦乐四重奏“死神与少女”",
    titleEn: "Death & the Maiden",
    originalPiece: "舒伯特 《d小调第十四弦乐四重奏“死神与少女”》 D. 810",
    composer: "F. Schubert",
    variation: "死神阴影 / Shadow of Death"
  },
  bgm_31: {
    id: "bgm_31",
    title: "冬之旅 · 菩提树",
    titleEn: "Winterreise: Der Lindenbaum",
    originalPiece: "舒伯特 《冬之旅 菩提树》 D. 911",
    composer: "F. Schubert",
    variation: "冬日荒野 / Winter Wasteland"
  },
  bgm_34: {
    id: "bgm_34",
    title: "图画展览会 · 漫步",
    titleEn: "Pictures at an Exhibition: Promenade",
    originalPiece: "穆索尔斯基 《图画展览会 漫步》",
    composer: "M. Mussorgsky",
    variation: "回忆长廊 / Gallery of Memories"
  },
  bgm_35: {
    id: "bgm_35",
    title: "荒山之夜",
    titleEn: "Night on Bald Mountain",
    originalPiece: "穆索尔斯基 《荒山之夜》",
    composer: "M. Mussorgsky",
    variation: "狂气风暴 / Wild Fury"
  },
  bgm_36: {
    id: "bgm_36",
    title: "波罗维茨舞曲 (鞑靼人舞曲)",
    titleEn: "Polovtsian Dances",
    originalPiece: "鲍罗丁 《伊戈尔王 波罗维茨舞曲》",
    composer: "A. Borodin",
    variation: "狂热异域 / Savage Mob"
  },
  bgm_36d: {
    id: "bgm_36d",
    title: "鞑靼人舞曲 (冲锋版)",
    titleEn: "Polovtsian Dances (Rush ver.)",
    originalPiece: "鲍罗丁 《波罗维茨舞曲》",
    composer: "A. Borodin",
    variation: "暴徒冲锋 / Mob Charge"
  },
  bgm_36g: {
    id: "bgm_36g",
    title: "鞑靼人舞曲 (末路版)",
    titleEn: "Polovtsian Dances (Fall ver.)",
    originalPiece: "鲍罗丁 《波罗维茨舞曲》",
    composer: "A. Borodin",
    variation: "末路狂澜 / Final Collapse"
  },
  bgm_end: {
    id: "bgm_end",
    title: "G弦上的咏叹调 (管弦乐完整版 / 片尾曲)",
    titleEn: "Air on the G String (Full Orchestral / Ending)",
    originalPiece: "巴赫 《G弦上的咏叹调》 (Air on the G String)",
    composer: "J.S. Bach",
    variation: "大结局片尾 / Grand Finale Ending"
  }
};

/**
 * Resolves BGM information from a sequence ID (e.g. 'bgm_21d', 'bgm_02.ogg', 'bgm_101')
 */
export function getBgmInfo(seqId?: string | null): BgmInfo {
  if (!seqId) {
    return {
      id: '',
      title: '无背景音乐',
      titleEn: 'No Background Music',
      originalPiece: '',
      composer: ''
    };
  }

  const cleanId = seqId.replace('.ogg', '').replace('.mp3', '').trim();
  
  if (BGM_METADATA_MAP[cleanId]) {
    return BGM_METADATA_MAP[cleanId];
  }

  // Fallback: If it's a known numbered prefix like bgm_21* or bgm_10*
  const basePrefix = cleanId.replace(/[a-z]+$/i, '');
  if (BGM_METADATA_MAP[basePrefix]) {
    const parent = BGM_METADATA_MAP[basePrefix];
    return {
      id: cleanId,
      title: `${parent.title} (变奏 ${cleanId})`,
      titleEn: `${parent.titleEn} (Var. ${cleanId})`,
      originalPiece: parent.originalPiece,
      composer: parent.composer,
      variation: cleanId
    };
  }

  // Generic fallback for ambient / extra tracks
  return {
    id: cleanId,
    title: `古典曲目 (${cleanId})`,
    titleEn: `Classical Piece (${cleanId})`,
    originalPiece: '古典名曲编曲',
    composer: 'Classical'
  };
}
