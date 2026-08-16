export type RouteType = 'Main' | 'Tsubaki' | 'Kanon' | 'Mizuha' | 'Haru';

export interface ScenarioTopic {
  id: string;
  title: string;
  titleEn?: string;
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
    titleJp: '第一章：魔王降临 (序幕)',
    titleEn: 'Chapter 1: The Devil Appears (Prologue)',
    description: '京介与宇佐美哈尔相遇，并收到了来自“魔王”的第一封神秘邮件。',
    scenarios: [
      { id: 'g01', title: '序幕：转校生宇佐美哈尔', titleEn: 'Prologue: Transfer Student Haru', startPtr: 0, bg: 'bg_01a', route: 'Main' },
      { id: 'g02', title: '黑道事务与第一宗委托', titleEn: 'Underworld Business & First Case', startPtr: 0, bg: 'bg_18a', route: 'Main' },
      { id: 'g03', title: '追寻魔王的足迹', titleEn: 'Tracing the Devil', startPtr: 0, bg: 'bg_02a', route: 'Main' },
      { id: 'g04', title: '咖啡厅与神秘指令', titleEn: 'Cafe & Secret Orders', startPtr: 0, bg: 'bg_11a', route: 'Main' },
      { id: 'g05', title: '第一章尾声：美轮椿姬的登场', titleEn: 'Ch 1 Epilogue: Tsubaki\'s Entrance', startPtr: 0, bg: 'bg_03a', route: 'Main' }
    ]
  },
  {
    chapterId: 'ch2_common',
    titleJp: '第二章：土地风波与绑架事件 (椿姬篇·共通)',
    titleEn: 'Chapter 2: Land Crisis & Kidnapping (Tsubaki Arc)',
    description: '围绕椿姬家土地与高利贷债务的斗争，魔王展开了第一场绑架犯罪博弈。',
    scenarios: [
      { id: 'g06', title: '土地买卖企划与风波', titleEn: 'Land Project & Upheaval', startPtr: 0, bg: 'bg_04a', route: 'Main' },
      { id: 'g07', title: '权三高利贷与家庭危机', titleEn: 'Gonzou\'s Loan & Family Crisis', startPtr: 0, bg: 'bg_19a', route: 'Main' },
      { id: 'g08', title: '椿姬的坚强与心愿', titleEn: 'Tsubaki\'s Resolve', startPtr: 0, bg: 'bg_03a', route: 'Main' },
      { id: 'g09', title: '绑架预告与魔王暗算', titleEn: 'Kidnap Warning & Devil\'s Scheme', startPtr: 0, bg: 'bg_18b', route: 'Main' },
      { id: 'g10', title: '废弃工厂搜寻战', titleEn: 'Abandoned Factory Search', startPtr: 0, bg: 'bg_10b', route: 'Main' },
      { id: 'g11', title: '破局与营救时刻', titleEn: 'Breakthrough & Rescue', startPtr: 0, bg: 'bg_10c', route: 'Main' },
      { id: 'g12', title: '归途与真情吐露', titleEn: 'Journey Home & Confession', startPtr: 0, bg: 'bg_19c', route: 'Main' },
      { id: 'g13', title: '圣夜祭典与阴云', titleEn: 'Christmas Eve & Dark Clouds', startPtr: 0, bg: 'bg_08a', route: 'Main' },
      { id: 'g14', title: '椿姬的日记与魔王低语', titleEn: 'Tsubaki\'s Diary & Devil\'s Whisper', startPtr: 0, bg: 'bg_01a', route: 'Main' },
      { id: 'g15', title: '天使与恶魔之隙', titleEn: 'Between Angel and Demon', startPtr: 0, bg: 'bg_01a', route: 'Main' },
      { id: 'g16', title: '黑道社会的金钱法则', titleEn: 'Money Rules in the Underworld', startPtr: 0, bg: 'bg_18a', route: 'Main' },
      { id: 'g17', title: '感冒蔓延与缺席异变', titleEn: 'Flu Spread & Strange Absences', startPtr: 0, bg: 'bg_02a', route: 'Main' },
      { id: 'g18', title: '假日探访与心意烦扰', titleEn: 'Holiday Visit & Disturbed Feelings', startPtr: 0, bg: 'bg_19a', route: 'Main' },
      { id: 'g19', title: '少女的欲望与矛盾', titleEn: 'Desire and Conflict', startPtr: 0, bg: 'bg_19b', route: 'Main' },
      { id: 'g20', title: '日常的裂痕', titleEn: 'Cracks in the Daily Life', startPtr: 0, bg: 'bg_01a', route: 'Main' },
      { id: 'g21', title: '聚会与暗夜街头', titleEn: 'Party & Dark Streets', startPtr: 0, bg: 'bg_18a', route: 'Main' },
      { id: 'g22', title: '储物柜钥匙的秘密', titleEn: 'Secret of the Locker Key', startPtr: 0, bg: 'bg_08a', route: 'Main' },
      { id: 'g23', title: '第二章尾声：雪夜决断与分歧', titleEn: 'Ch 2 Epilogue: Decision in the Snow', startPtr: 0, bg: 'bg_25a', route: 'Main' }
    ]
  },
  {
    chapterId: 'tsubaki_route',
    titleJp: '美轮椿姬篇：守护的誓言 (个人线)',
    titleEn: 'Tsubaki Route: Vow to Protect (Branch)',
    description: '京介选择守护椿姬与她的家人，共同面对公寓拆迁与最终结局。',
    scenarios: [
      { id: 'gt01', title: '椿姬线：新的生活 (Ch 1)', titleEn: 'Tsubaki Route: New Life (Ch 1)', startPtr: 0, bg: 'bg_19a', route: 'Tsubaki', presets: { flag_tubaki: 4 } },
      { id: 'gt02', title: '椿姬线：日常相伴 (Ch 2)', titleEn: 'Tsubaki Route: Daily Companionship (Ch 2)', startPtr: 0, bg: 'bg_19b', route: 'Tsubaki', presets: { flag_tubaki: 4 } },
      { id: 'gt03', title: '椿姬线：家庭的温馨 (Ch 3)', titleEn: 'Tsubaki Route: Family Warmth (Ch 3)', startPtr: 0, bg: 'bg_19a', route: 'Tsubaki', presets: { flag_tubaki: 4 } },
      { id: 'gt04', title: '椿姬线：暗流涌动 (Ch 4)', titleEn: 'Tsubaki Route: Undercurrents (Ch 4)', startPtr: 0, bg: 'bg_18a', route: 'Tsubaki', presets: { flag_tubaki: 4 } },
      { id: 'gt05', title: '椿姬线：守护的誓言 (Ch 5)', titleEn: 'Tsubaki Route: Vow to Protect (Ch 5)', startPtr: 0, bg: 'bg_03a', route: 'Tsubaki', presets: { flag_tubaki: 4 } },
      { id: 'gt06', title: '椿姬线：债务危机与决心 (Ch 6)', titleEn: 'Tsubaki Route: Debt Crisis (Ch 6)', startPtr: 0, bg: 'bg_19d', route: 'Tsubaki', presets: { flag_tubaki: 4 } },
      { id: 'gt07', title: '椿姬线：绝境中的希望 (Ch 7)', titleEn: 'Tsubaki Route: Hope in Crisis (Ch 7)', startPtr: 0, bg: 'bg_04a', route: 'Tsubaki', presets: { flag_tubaki: 4 } },
      { id: 'gt08', title: '椿姬线：公寓反击策划 (Ch 8)', titleEn: 'Tsubaki Route: Counterattack (Ch 8)', startPtr: 0, bg: 'bg_19b', route: 'Tsubaki', presets: { flag_tubaki: 4 } },
      { id: 'gt09', title: '椿姬线：决胜与救赎 (Ch 9)', titleEn: 'Tsubaki Route: Final Victory (Ch 9)', startPtr: 0, bg: 'bg_08a', route: 'Tsubaki', presets: { flag_tubaki: 4 } },
      { id: 'gted', title: '椿姬线：大结局 (Ending)', titleEn: 'Tsubaki Route: Ending', startPtr: 0, bg: 'bg_25a', route: 'Tsubaki', presets: { flag_tubaki: 4, tubaki_clear: 1 } },
      { id: 'gth1', title: '椿姬特殊场景 1 (初夜·誓言之夜)', titleEn: 'Tsubaki Special Scene 1 (The Vow)', startPtr: 0, bg: 'bg_19a', route: 'Tsubaki', presets: { flag_tubaki: 4, tubaki_clear: 1 } },
      { id: 'gth2', title: '椿姬特殊场景 2 (温泉蜜语)', titleEn: 'Tsubaki Special Scene 2 (Hot Springs)', startPtr: 0, bg: 'bg_19b', route: 'Tsubaki', presets: { flag_tubaki: 4, tubaki_clear: 1 } }
    ]
  },
  {
    chapterId: 'ch3_common',
    titleJp: '第三章：冰面上的绝技 (花音篇·共通)',
    titleEn: 'Chapter 3: Ice & Ambition (Kanon Arc)',
    description: '围绕花音的花样滑冰全国大赛选拔、母女矛盾与魔王的冰场陷阱。',
    scenarios: [
      { id: 'g24', title: '花音的登场与花滑梦想', titleEn: 'Kanon\'s Entrance & Skating Dream', startPtr: 0, bg: 'bg_14a', route: 'Main' },
      { id: 'g25', title: '母亲的严苛与沉重压力', titleEn: 'Mother\'s Harshness & Heavy Pressure', startPtr: 0, bg: 'bg_15a', route: 'Main' },
      { id: 'g26', title: '晨练与不寻常的日常', titleEn: 'Morning Practice & Strange Days', startPtr: 0, bg: 'bg_14b', route: 'Main' },
      { id: 'g27', title: '比赛前夕的邀请', titleEn: 'Pre-Match Invitation', startPtr: 0, bg: 'bg_15a', route: 'Main' },
      { id: 'g28', title: '恶魔的阴笑与观赛预告', titleEn: 'Devil\'s Grin & Watch Notice', startPtr: 0, bg: 'bg_08c', route: 'Main' },
      { id: 'g29', title: '冰场决战与魔王的破坏', titleEn: 'Rink Battle & Devil\'s Sabotage', startPtr: 0, bg: 'bg_16a', route: 'Main' },
      { id: 'g30', title: '惊险救援与哈尔的洞察', titleEn: 'Dangerous Rescue & Haru\'s Insight', startPtr: 0, bg: 'bg_02a', route: 'Main' },
      { id: 'g31', title: '追踪西条与垃圾堆里的秘密', titleEn: 'Tracking Saijou & Secret in Trash', startPtr: 0, bg: 'bg_18a', route: 'Main' },
      { id: 'g32', title: '魔王的革命宣言', titleEn: 'Devil\'s Revolution Declaration', startPtr: 0, bg: 'bg_18b', route: 'Main' },
      { id: 'g33', title: '血迹追踪与雨夜徘徊', titleEn: 'Blood Tracking & Rainy Night', startPtr: 0, bg: 'bg_10a', route: 'Main' },
      { id: 'g34', title: '山王物产地下交锋', titleEn: 'Underground Clash at Sannou', startPtr: 0, bg: 'bg_10b', route: 'Main' },
      { id: 'g35', title: '第三章尾声：母女和解与分歧', titleEn: 'Ch 3 Epilogue: Kanon Crossroads', startPtr: 0, bg: 'bg_15b', route: 'Main' }
    ]
  },
  {
    chapterId: 'kanon_route',
    titleJp: '美波花音篇：冰上绽放的奇迹 (个人线)',
    titleEn: 'Kanon Route: Miracle on Ice (Branch)',
    description: '京介陪伴花音冲击全国冠军，战胜心魔与家庭枷锁。',
    scenarios: [
      { id: 'gk01', title: '花音线：特训开始 (Ch 1)', titleEn: 'Kanon Route: Training Starts (Ch 1)', startPtr: 0, bg: 'bg_14a', route: 'Kanon', presets: { flag_kanon: 3 } },
      { id: 'gk02', title: '花音线：默契培养 (Ch 2)', titleEn: 'Kanon Route: Harmony (Ch 2)', startPtr: 0, bg: 'bg_14b', route: 'Kanon', presets: { flag_kanon: 3 } },
      { id: 'gk03', title: '花音线：冰场与密语 (Ch 3)', titleEn: 'Kanon Route: Secret Words (Ch 3)', startPtr: 0, bg: 'bg_17a', route: 'Kanon', presets: { flag_kanon: 3 } },
      { id: 'gk04', title: '花音线：彼此的心意 (Ch 4)', titleEn: 'Kanon Route: Shared Feelings (Ch 4)', startPtr: 0, bg: 'bg_15a', route: 'Kanon', presets: { flag_kanon: 3 } },
      { id: 'gk05', title: '花音线：迎战强敌 (Ch 5)', titleEn: 'Kanon Route: Facing Rivals (Ch 5)', startPtr: 0, bg: 'bg_16a', route: 'Kanon', presets: { flag_kanon: 3 } },
      { id: 'gk06', title: '花音线：母亲的期盼 (Ch 6)', titleEn: 'Kanon Route: Mother\'s Hope (Ch 6)', startPtr: 0, bg: 'bg_15b', route: 'Kanon', presets: { flag_kanon: 3 } },
      { id: 'gk07', title: '花音线：心结解开 (Ch 7)', titleEn: 'Kanon Route: Inner Peace (Ch 7)', startPtr: 0, bg: 'bg_14a', route: 'Kanon', presets: { flag_kanon: 3 } },
      { id: 'gk08', title: '花音线：全国大赛前夕 (Ch 8)', titleEn: 'Kanon Route: Nationals Eve (Ch 8)', startPtr: 0, bg: 'bg_15a', route: 'Kanon', presets: { flag_kanon: 3 } },
      { id: 'gk09', title: '花音线：冰上绽放 (Ch 9)', titleEn: 'Kanon Route: Blooming on Ice (Ch 9)', startPtr: 0, bg: 'bg_16a', route: 'Kanon', presets: { flag_kanon: 3 } },
      { id: 'gk10', title: '花音线：巅峰一跃 (Ch 10)', titleEn: 'Kanon Route: Pinnacle Leap (Ch 10)', startPtr: 0, bg: 'bg_16b', route: 'Kanon', presets: { flag_kanon: 3 } },
      { id: 'gked', title: '花音线：大结局 (Ending)', titleEn: 'Kanon Route: Ending', startPtr: 0, bg: 'bg_25a', route: 'Kanon', presets: { flag_kanon: 3, kanon_clear: 1 } },
      { id: 'gkh1', title: '花音特殊场景 1 (冰场更衣室)', titleEn: 'Kanon Special Scene 1 (Locker Room)', startPtr: 0, bg: 'bg_14a', route: 'Kanon', presets: { flag_kanon: 3, kanon_clear: 1 } },
      { id: 'gkh2', title: '花音特殊场景 2 (旅馆心迹)', titleEn: 'Kanon Special Scene 2 (Hotel Room)', startPtr: 0, bg: 'bg_15a', route: 'Kanon', presets: { flag_kanon: 3, kanon_clear: 1 } }
    ]
  },
  {
    chapterId: 'ch4_common',
    titleJp: '第四章：白鸟的羽翼 (水羽篇·共通)',
    titleEn: 'Chapter 4: Swan\'s Wings (Mizuha Arc)',
    description: '水羽家庭秘密与学园理事长纷争，魔王的挑拨与暗夜陷阱。',
    scenarios: [
      { id: 'g36', title: '白鸟水羽的冰冷与疏离', titleEn: 'Mizuha\'s Cold Distance', startPtr: 0, bg: 'bg_02a', route: 'Main' },
      { id: 'g37', title: '奇怪的转折与接近', titleEn: 'Strange Turn & Approach', startPtr: 0, bg: 'bg_01a', route: 'Main' },
      { id: 'g38', title: '校园里的监视与对视', titleEn: 'Surveillance & Stares', startPtr: 0, bg: 'bg_03a', route: 'Main' },
      { id: 'g39', title: '理事长家庭的隐秘裂痕', titleEn: 'Family Secrets of the Chairman', startPtr: 0, bg: 'bg_05a', route: 'Main' },
      { id: 'g40', title: '魔王的挑拨与下雪前夕', titleEn: 'Devil\'s Provocation & Coming Snow', startPtr: 0, bg: 'bg_08a', route: 'Main' },
      { id: 'g41', title: '浅井兴业与暗夜危机', titleEn: 'Asai Enterprise & Night Crisis', startPtr: 0, bg: 'bg_18a', route: 'Main' },
      { id: 'g42', title: '第四章尾声：雪地拯救与分歧', titleEn: 'Ch 4 Epilogue: Rescue in Snow', startPtr: 0, bg: 'bg_25a', route: 'Main' }
    ]
  },
  {
    chapterId: 'mizuha_route',
    titleJp: '白鸟水羽篇：冰雪融化的归宿 (个人线)',
    titleEn: 'Mizuha Route: Thawing of Snow (Branch)',
    description: '京介与水羽冲破家族偏见与流言，彼此扶持走向新生。',
    scenarios: [
      { id: 'gm01', title: '水羽线：学园纠葛 (Ch 1)', titleEn: 'Mizuha Route: School Ties (Ch 1)', startPtr: 0, bg: 'bg_02a', route: 'Mizuha', presets: { flag_mizuha: 2 } },
      { id: 'gm02', title: '水羽线：冰融时刻 (Ch 2)', titleEn: 'Mizuha Route: Thawing Ice (Ch 2)', startPtr: 0, bg: 'bg_01a', route: 'Mizuha', presets: { flag_mizuha: 2 } },
      { id: 'gm03', title: '水羽线：两人世界 (Ch 3)', titleEn: 'Mizuha Route: Two of Us (Ch 3)', startPtr: 0, bg: 'bg_03a', route: 'Mizuha', presets: { flag_mizuha: 2 } },
      { id: 'gm04', title: '水羽线：家族的审判 (Ch 4)', titleEn: 'Mizuha Route: Family Trial (Ch 4)', startPtr: 0, bg: 'bg_05a', route: 'Mizuha', presets: { flag_mizuha: 2 } },
      { id: 'gm05', title: '水羽线：真相大白 (Ch 5)', titleEn: 'Mizuha Route: Truth Revealed (Ch 5)', startPtr: 0, bg: 'bg_01a', route: 'Mizuha', presets: { flag_mizuha: 2 } },
      { id: 'gm06', title: '水羽线：坚定的携手 (Ch 6)', titleEn: 'Mizuha Route: Hand in Hand (Ch 6)', startPtr: 0, bg: 'bg_08a', route: 'Mizuha', presets: { flag_mizuha: 2 } },
      { id: 'gmed', title: '水羽线：大结局 (Ending)', titleEn: 'Mizuha Route: Ending', startPtr: 0, bg: 'bg_25a', route: 'Mizuha', presets: { flag_mizuha: 2, mizuha_clear: 1 } },
      { id: 'gmh1', title: '水羽特殊场景 1 (两人世界)', titleEn: 'Mizuha Special Scene 1 (Two of Us)', startPtr: 0, bg: 'bg_01a', route: 'Mizuha', presets: { flag_mizuha: 2, mizuha_clear: 1 } },
      { id: 'gmh2', title: '水羽特殊场景 2 (破晓缠绵)', titleEn: 'Mizuha Special Scene 2 (At Dawn)', startPtr: 0, bg: 'bg_03a', route: 'Mizuha', presets: { flag_mizuha: 2, mizuha_clear: 1 } }
    ]
  },
  {
    chapterId: 'ch5_haru',
    titleJp: '第五章：魔王与勇者的宿命 (哈尔篇·True End)',
    titleEn: 'Chapter 5: Fate of Hero & Devil (Haru Arc / True)',
    description: '与魔王展开的最终宿命对决，揭开哈尔与魔王过去的真相与救赎。',
    scenarios: [
      { id: 'g43', title: '终章：最后的博弈开始', titleEn: 'Final Game Begins', startPtr: 0, bg: 'bg_08c', route: 'Haru', presets: { flag_haru: 3 } },
      { id: 'g44', title: '致吾儿：血缘的信件', titleEn: 'To My Son: Letter of Blood', startPtr: 0, bg: 'bg_18a', route: 'Haru', presets: { flag_haru: 3 } },
      { id: 'g45', title: '雪地小屋与温暖的心', titleEn: 'Snow Cabin & Warm Heart', startPtr: 0, bg: 'bg_04a', route: 'Haru', presets: { flag_haru: 3 } },
      { id: 'g46', title: '下水道穿行与暗影回溯', titleEn: 'Sewer Passage & Shadows', startPtr: 0, bg: 'bg_10b', route: 'Haru', presets: { flag_haru: 3 } },
      { id: 'g47', title: '相拥入眠与破晓誓言', titleEn: 'Embrace & Dawn Vow', startPtr: 0, bg: 'bg_03a', route: 'Haru', presets: { flag_haru: 3 } },
      { id: 'g48', title: '魔王的严正通告', titleEn: 'Devil\'s Stern Ultimatum', startPtr: 0, bg: 'bg_10c', route: 'Haru', presets: { flag_haru: 3 } },
      { id: 'g49', title: '黑道冲锋枪与绝体绝命', titleEn: 'Submachine Gun Shootout', startPtr: 0, bg: 'bg_18c', route: 'Haru', presets: { flag_haru: 3 } },
      { id: 'g50', title: '宿命对峙与复仇之火', titleEn: 'Fate Confrontation & Fire of Vengeance', startPtr: 0, bg: 'bg_10c', route: 'Haru', presets: { flag_haru: 3 } },
      { id: 'g51', title: '顶楼决战：舍身相救', titleEn: 'Rooftop Showdown: Sacrificial Rescue', startPtr: 0, bg: 'bg_08a', route: 'Haru', presets: { flag_haru: 3 } },
      { id: 'g52', title: '解除封锁与魔王的末路', titleEn: 'Siege Lifted & Fall of the Devil', startPtr: 0, bg: 'bg_01a', route: 'Haru', presets: { flag_haru: 3 } },
      { id: 'g53', title: '日常回忆与融雪之音', titleEn: 'Memory of Warm Days & Melting Snow', startPtr: 0, bg: 'bg_10a', route: 'Haru', presets: { flag_haru: 3 } },
      { id: 'g54', title: '雪夜枪声：顶罪与救赎', titleEn: 'Gunshot in the Snow: Taking the Blame', startPtr: 0, bg: 'bg_01a', route: 'Haru', presets: { flag_haru: 3 } },
      { id: 'g55', title: '真实大结局：提前到来的春天', titleEn: 'True Ending: The Early Spring', startPtr: 0, bg: 'bg_25a', route: 'Haru', presets: { flag_haru: 3, game_clear: 1 } },
      { id: 'ghh1', title: '哈尔特殊场景 1 (废墟依偎)', titleEn: 'Haru Special Scene 1 (Ruins Embrace)', startPtr: 0, bg: 'bg_01a', route: 'Haru', presets: { flag_haru: 3, game_clear: 1 } },
      { id: 'ghh2', title: '哈尔特殊场景 2 (融雪之晨)', titleEn: 'Haru Special Scene 2 (Melting Snow)', startPtr: 0, bg: 'bg_25a', route: 'Haru', presets: { flag_haru: 3, game_clear: 1 } }
    ]
  }
];

export function getScenarioPreset(scenId: string): Record<string, any> {
  const cleanId = scenId.replace('.ks', '').replace('.json', '');
  for (const ch of SCENARIO_INDEX) {
    const found = ch.scenarios.find(s => s.id === cleanId);
    if (found && found.presets) {
      return { ...found.presets };
    }
  }

  // Fallback heuristics based on prefix
  if (cleanId.startsWith('gt') || cleanId.startsWith('gth')) {
    return { flag_tubaki: 4 };
  }
  if (cleanId.startsWith('gk') || cleanId.startsWith('gkh')) {
    return { flag_kanon: 3, badflag_kanon: false };
  }
  if (cleanId.startsWith('gm') || cleanId.startsWith('gmh')) {
    return { flag_mizuha: 2 };
  }
  if (cleanId.startsWith('ghh') || (cleanId.startsWith('g') && parseInt(cleanId.replace('g', ''), 10) >= 43)) {
    return { flag_haru: 3, flag_tubaki: 0, flag_kanon: 0, flag_mizuha: 0 };
  }

  return {};
}

