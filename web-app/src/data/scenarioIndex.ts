export type RouteType = 'Main' | 'Tsubaki' | 'Kanon' | 'Mizuha' | 'Haru';

export interface ScenarioTopic {
  id: string;
  title: string;
  startPtr: number;
  bg?: string;
  route: RouteType;
  presets?: Record<string, any>;
}

export interface ChapterIndex {
  chapterId: string;
  titleJp: string;
  titleEn: string;
  description: string;
  scenarios: ScenarioTopic[];
}

export const SCENARIO_INDEX: ChapterIndex[] = [
  {
    chapterId: 'ch1',
    titleJp: '第一章：魔王降临',
    titleEn: 'Chapter 1: The Devil Appears',
    description: '京介与宇佐美哈尔相遇，并收到了来自“魔王”的第一封神秘邮件。',
    scenarios: [
      { id: 'g01', title: '序幕与转校生', startPtr: 0, bg: 'bg_01a', route: 'Main' },
      { id: 'g02', title: '黑道事务与第一宗委托', startPtr: 0, bg: 'bg_18a', route: 'Main' },
      { id: 'g05', title: '美轮椿姬的登场', startPtr: 0, bg: 'bg_03a', route: 'Main' }
    ]
  },
  {
    chapterId: 'ch2',
    titleJp: '第二章：陷阱与羁绊 (椿姬篇)',
    titleEn: 'Chapter 2: Traps & Bonds (Tsubaki Arc)',
    description: '围绕椿姬家土地与权三高利贷债务的斗争。',
    scenarios: [
      { id: 'g06', title: '企划与表决', startPtr: 0, bg: 'bg_04a', route: 'Main' },
      { id: 'g14', title: '抉择：分歧点', startPtr: 1600, bg: 'bg_18c', route: 'Main' },
      { id: 'gt01', title: '椿姬线：新的生活 (Ch 1)', startPtr: 0, bg: 'bg_19a', route: 'Tsubaki', presets: { flag_tubaki: 4 } },
      { id: 'gt06', title: '椿姬线：债务危机与决心 (Ch 6)', startPtr: 0, bg: 'bg_19d', route: 'Tsubaki', presets: { flag_tubaki: 4 } },
      { id: 'gt08', title: '椿姬线：公寓反击策划 (Ch 8)', startPtr: 486, bg: 'bg_19b', route: 'Tsubaki', presets: { flag_tubaki: 4 } },
      { id: 'gt09', title: '椿姬线：决胜与结局 (Ch 9)', startPtr: 0, bg: 'bg_08a', route: 'Tsubaki', presets: { flag_tubaki: 4 } }
    ]
  },
  {
    chapterId: 'ch3',
    titleJp: '第三章：冰面上的绝技 (花音篇)',
    titleEn: 'Chapter 3: Ice & Ambition (Kanon Arc)',
    description: '花音的花样滑冰全国大赛与母女恩怨。',
    scenarios: [
      { id: 'gk01', title: '花音线：特训开始 (Ch 1)', startPtr: 0, bg: 'bg_14a', route: 'Kanon', presets: { flag_kanon: 3 } },
      { id: 'gk03', title: '花音线：冰场与密语 (Ch 3)', startPtr: 0, bg: 'bg_17a', route: 'Kanon', presets: { flag_kanon: 3 } },
      { id: 'gk08', title: '花音线：全国大赛前夕 (Ch 8)', startPtr: 0, bg: 'bg_15a', route: 'Kanon', presets: { flag_kanon: 3 } },
      { id: 'gked', title: '花音线：胜者与尾声 (Epilogue)', startPtr: 0, bg: 'bg_25a', route: 'Kanon', presets: { flag_kanon: 3 } }
    ]
  },
  {
    chapterId: 'ch4',
    titleJp: '第四章：白鸟的羽翼 (水羽篇)',
    titleEn: 'Chapter 4: Swan\'s Wings (Mizuha Arc)',
    description: '水羽的家庭秘密与学园理事长纷争。',
    scenarios: [
      { id: 'gm01', title: '水羽线：学园纠葛 (Ch 1)', startPtr: 0, bg: 'bg_02a', route: 'Mizuha', presets: { flag_mizuha: 2 } },
      { id: 'gm05', title: '水羽线：真相大白 (Ch 5)', startPtr: 0, bg: 'bg_01a', route: 'Mizuha', presets: { flag_mizuha: 2 } },
      { id: 'gmed', title: '水羽线：尾声 (Epilogue)', startPtr: 0, bg: 'bg_01a', route: 'Mizuha', presets: { flag_mizuha: 2 } }
    ]
  },
  {
    chapterId: 'ch5',
    titleJp: '第五章：魔王与勇者的宿命 (哈尔篇 / True)',
    titleEn: 'Chapter 5: Fate of Hero & Devil (Haru Arc / True)',
    description: '与魔王展开的最终宿命决战与拯救故事。',
    scenarios: [
      { id: 'g43', title: '终章：对决开始', startPtr: 0, bg: 'bg_08c', route: 'Haru', presets: { flag_haru: 3 } },
      { id: 'g50', title: '终章：枪声与密室', startPtr: 0, bg: 'bg_10c', route: 'Haru', presets: { flag_haru: 3 } },
      { id: 'g55', title: '真实尾声：G弦上的魔王', startPtr: 0, bg: 'bg_25a', route: 'Haru', presets: { flag_haru: 3 } }
    ]
  }
];
