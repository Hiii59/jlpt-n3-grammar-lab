const CONJUGATION_TYPE_DEFS = [
  { key: "dictionary", label: "辞書形", th: "รูปพจนานุกรม", category: "พื้นฐาน", usage: "ใช้จบประโยครูปธรรมดา ขยายนาม และเป็นฐานของไวยกรณ์ N3 หลายตัว เช่น ようにする, ことになる", rule: "ใช้รูปเดิมของกริยา" },
  { key: "stem", label: "語幹", th: "ฐาน ます", category: "พื้นฐาน", usage: "ใช้ต่อ ます และใช้กับรูปประกอบ เช่น Vます切る, Vますかける, Vますたて", rule: "กลุ่ม 1: u -> i / กลุ่ม 2: ตัดる / する -> し / 来る -> 来（き）" },
  { key: "masu", label: "ます形", th: "รูปสุภาพ", category: "สุภาพ", usage: "ใช้พูดสุภาพ และเป็นฐานของรูปประกอบหลายแบบ", rule: "語幹 + ます" },
  { key: "masen", label: "ません形", th: "สุภาพปฏิเสธ", category: "สุภาพ", usage: "ใช้ปฏิเสธแบบสุภาพ", rule: "語幹 + ません" },
  { key: "mashita", label: "ました形", th: "สุภาพอดีต", category: "สุภาพ", usage: "ใช้เล่าเหตุการณ์อดีตแบบสุภาพ", rule: "語幹 + ました" },
  { key: "masenDeshita", label: "ませんでした", th: "สุภาพปฏิเสธอดีต", category: "สุภาพ", usage: "ใช้ปฏิเสธเหตุการณ์อดีตแบบสุภาพ", rule: "語幹 + ませんでした" },
  { key: "nai", label: "ない形", th: "ปฏิเสธธรรมดา", category: "พื้นฐาน", usage: "ใช้กับ ないと, なくちゃ, ように, ことはない, わけではない", rule: "กลุ่ม 1: u -> a + ない / กลุ่ม 2: ตัดる + ない / する -> しない / 来る -> こない" },
  { key: "nakatta", label: "なかった形", th: "ปฏิเสธอดีต", category: "พื้นฐาน", usage: "ใช้เล่าอดีตแบบปฏิเสธ หรือทำ たら แบบปฏิเสธ เช่น Vなかったら", rule: "ない形 ตัด い + かった" },
  { key: "te", label: "て形", th: "รูปเชื่อม", category: "พื้นฐาน", usage: "ใช้กับ ている, ておく, てしまう, てごらん, てほしい", rule: "う・つ・る -> って / む・ぶ・ぬ -> んで / く -> いて / ぐ -> いで / す -> して / 行く -> 行って" },
  { key: "ta", label: "た形", th: "อดีตธรรมดา", category: "พื้นฐาน", usage: "ใช้กับ たところ, たとたん, たびに, ものだ, っけ", rule: "เหมือน て形 แต่เปลี่ยน て/で เป็น た/だ" },
  { key: "potential", label: "可能形", th: "สามารถ", category: "N3", usage: "ใช้กับ ようになる, ように, わけがない และประโยคบอกความสามารถ", rule: "กลุ่ม 1: u -> e + る / กลุ่ม 2: ตัดる + られる / する -> できる / 来る -> こられる" },
  { key: "passive", label: "受身形", th: "ถูกกระทำ", category: "N3", usage: "ใช้กับบท 1-1 และประโยคที่ประธานได้รับผลจากการกระทำ", rule: "กลุ่ม 1: u -> a + れる / กลุ่ม 2: ตัดる + られる / する -> される / 来る -> こられる" },
  { key: "causative", label: "使役形", th: "ให้ทำ/ทำให้", category: "N3", usage: "ใช้กับ V（さ）せてください, Vさせていただく และการให้ใครทำบางอย่าง", rule: "กลุ่ม 1: u -> a + せる / กลุ่ม 2: ตัดる + させる / する -> させる / 来る -> こさせる" },
  { key: "causativePassive", label: "使役受身形", th: "ถูกบังคับให้ทำ", category: "N3", usage: "ใช้เมื่อประธานถูกทำให้ต้องทำ เช่น ถูกบังคับให้รอ/อ่าน/ทำงาน", rule: "กลุ่ม 1: a + される ยกเว้น す -> させられる / กลุ่ม 2: ตัดる + させられる / する -> させられる / 来る -> こさせられる" },
  { key: "volitional", label: "意向形", th: "ตั้งใจ/ชวน", category: "N3", usage: "ใช้กับ ようと思う, ようとする, ようとしない", rule: "กลุ่ม 1: u -> o + う / กลุ่ม 2: ตัดる + よう / する -> しよう / 来る -> こよう" },
  { key: "imperative", label: "命令形", th: "คำสั่ง", category: "คำสั่ง", usage: "ใช้ในคำสั่งตรงๆ หรือเวลาถ่ายทอดคำสั่งด้วย と言われる", rule: "กลุ่ม 1: u -> e / กลุ่ม 2: ตัดる + ろ / する -> しろ / 来る -> こい" },
  { key: "prohibitive", label: "禁止形", th: "ห้ามทำ", category: "คำสั่ง", usage: "ใช้กับ Vるなと注意される และคำสั่งห้ามแบบตรง", rule: "辞書形 + な" },
  { key: "ba", label: "ば形", th: "ถ้า...", category: "เงื่อนไข", usage: "ใช้กับ Vばよかった, Vば...のに, VばVるほど", rule: "กลุ่ม 1: u -> e + ば / กลุ่ม 2: ตัดる + れば / する -> すれば / 来る -> くれば" },
  { key: "tara", label: "たら形", th: "ถ้า/เมื่อ...", category: "เงื่อนไข", usage: "ใช้กับ もし...たら, Vたらよかった, Vたら...のに", rule: "た形 + ら" },
  { key: "tari", label: "たり形", th: "ทำ...บ้าง", category: "เชื่อม", usage: "ใช้ยกตัวอย่างการกระทำ เช่น 読んだり書いたりする", rule: "た形 + り" },
  { key: "tai", label: "たい形", th: "อยากทำ", category: "เชื่อม", usage: "ใช้บอกความอยากของผู้พูด หรือทำเป็น Vたがる เมื่อพูดถึงคนอื่น", rule: "語幹 + たい" },
  { key: "zu", label: "ずに形", th: "โดยไม่...", category: "N3", usage: "ใช้กับ Vずに ในบท 3-1", rule: "ない形 ตัด ない + ずに / する -> せずに" },
  { key: "nakereba", label: "なければ", th: "ถ้าไม่...", category: "เงื่อนไข", usage: "ใช้ในรูปต้องทำ เช่น Vなければならない หรือประโยคเงื่อนไขปฏิเสธ", rule: "ない形 ตัด い + ければ" },
  { key: "nakucha", label: "なくちゃ", th: "ต้อง... (พูด)", category: "พูด", usage: "รูปพูดย่อของ Vなくては / Vなければ ใช้ใน Vなくちゃ", rule: "ない形 ตัด い + くちゃ" }
];

const CONJUGATION_GROUP_GUIDE = [
  { label: "กลุ่ม 1 / 五段", hint: "เสียงท้ายอยู่แถว u เช่น 書く・読む・買う", detail: "เปลี่ยนเสียงท้ายไปแถว a/i/e/o ตามรูปที่ต้องการ โดย て形/た形 ต้องจำเป็นกลุ่มเสียง" },
  { label: "กลุ่ม 2 / 一段", hint: "มักลงท้าย いる・える เช่น 食べる・見る・起きる", detail: "ตัด る แล้วเติมท้ายรูปใหม่ได้ตรงๆ" },
  { label: "กลุ่ม 3 / 不規則", hint: "する・来る และคำกริยา する เช่น 勉強する", detail: "ต้องจำแยก โดย 来る เปลี่ยนเสียงอ่านเป็น こ/き/く ตามรูป" }
];

const CONJUGATION_VERB_SEEDS = [
  { base: "書く", reading: "かく", group: "godan", meaning: "เขียน" },
  { base: "泳ぐ", reading: "およぐ", group: "godan", meaning: "ว่ายน้ำ" },
  { base: "話す", reading: "はなす", group: "godan", meaning: "พูด" },
  { base: "待つ", reading: "まつ", group: "godan", meaning: "รอ" },
  { base: "買う", reading: "かう", group: "godan", meaning: "ซื้อ" },
  { base: "読む", reading: "よむ", group: "godan", meaning: "อ่าน" },
  { base: "遊ぶ", reading: "あそぶ", group: "godan", meaning: "เล่น" },
  { base: "死ぬ", reading: "しぬ", group: "godan", meaning: "ตาย" },
  { base: "行く", reading: "いく", group: "godan", meaning: "ไป", note: "て形/た形 เป็นข้อยกเว้น: 行って・行った" },
  { base: "食べる", reading: "たべる", group: "ichidan", meaning: "กิน" },
  { base: "見る", reading: "みる", group: "ichidan", meaning: "ดู" },
  { base: "起きる", reading: "おきる", group: "ichidan", meaning: "ตื่น/เกิดขึ้น" },
  { base: "借りる", reading: "かりる", group: "ichidan", meaning: "ยืม" },
  { base: "信じる", reading: "しんじる", group: "ichidan", meaning: "เชื่อ" },
  { base: "する", reading: "する", group: "suru", meaning: "ทำ" },
  { base: "勉強する", reading: "べんきょうする", group: "suru", meaning: "เรียน" },
  { base: "来る", reading: "くる", group: "kuru", meaning: "มา" }
];

const GODAN_ENDINGS = {
  "う": { a: "わ", i: "い", e: "え", o: "お", te: "って", ta: "った" },
  "つ": { a: "た", i: "ち", e: "て", o: "と", te: "って", ta: "った" },
  "る": { a: "ら", i: "り", e: "れ", o: "ろ", te: "って", ta: "った" },
  "む": { a: "ま", i: "み", e: "め", o: "も", te: "んで", ta: "んだ" },
  "ぶ": { a: "ば", i: "び", e: "べ", o: "ぼ", te: "んで", ta: "んだ" },
  "ぬ": { a: "な", i: "に", e: "ね", o: "の", te: "んで", ta: "んだ" },
  "く": { a: "か", i: "き", e: "け", o: "こ", te: "いて", ta: "いた" },
  "ぐ": { a: "が", i: "ぎ", e: "げ", o: "ご", te: "いで", ta: "いだ" },
  "す": { a: "さ", i: "し", e: "せ", o: "そ", te: "して", ta: "した" }
};

function splitGodan(verb) {
  const end = verb.base.slice(-1);
  const stem = verb.base.slice(0, -1);
  const row = GODAN_ENDINGS[end];
  return { end, stem, row };
}

function suruStem(verb) {
  return verb.base === "する" ? "" : verb.base.slice(0, -"する".length);
}

function buildGodan(verb) {
  const { end, stem, row } = splitGodan(verb);
  const a = stem + row.a;
  const i = stem + row.i;
  const e = stem + row.e;
  const o = stem + row.o;
  const te = verb.base === "行く" ? "行って" : stem + row.te;
  const ta = verb.base === "行く" ? "行った" : stem + row.ta;
  return {
    ...verb,
    groupLabel: verb.base === "行く" ? "กลุ่ม 1 ข้อยกเว้น" : `กลุ่ม 1・${end}`,
    dictionary: verb.base,
    stem: i,
    masu: `${i}ます`,
    masen: `${i}ません`,
    mashita: `${i}ました`,
    masenDeshita: `${i}ませんでした`,
    nai: `${a}ない`,
    nakatta: `${a}なかった`,
    te,
    ta,
    potential: `${e}る`,
    passive: `${a}れる`,
    causative: `${a}せる`,
    causativePassive: end === "す" ? `${a}せられる` : `${a}される`,
    volitional: `${o}う`,
    imperative: e,
    prohibitive: `${verb.base}な`,
    ba: `${e}ば`,
    tara: `${ta}ら`,
    tari: `${ta}り`,
    tai: `${i}たい`,
    zu: `${a}ずに`,
    nakereba: `${a}なければ`,
    nakucha: `${a}なくちゃ`
  };
}

function buildIchidan(verb) {
  const stem = verb.base.slice(0, -1);
  return {
    ...verb,
    groupLabel: "กลุ่ม 2",
    dictionary: verb.base,
    stem,
    masu: `${stem}ます`,
    masen: `${stem}ません`,
    mashita: `${stem}ました`,
    masenDeshita: `${stem}ませんでした`,
    nai: `${stem}ない`,
    nakatta: `${stem}なかった`,
    te: `${stem}て`,
    ta: `${stem}た`,
    potential: `${stem}られる`,
    passive: `${stem}られる`,
    causative: `${stem}させる`,
    causativePassive: `${stem}させられる`,
    volitional: `${stem}よう`,
    imperative: `${stem}ろ`,
    prohibitive: `${verb.base}な`,
    ba: `${stem}れば`,
    tara: `${stem}たら`,
    tari: `${stem}たり`,
    tai: `${stem}たい`,
    zu: `${stem}ずに`,
    nakereba: `${stem}なければ`,
    nakucha: `${stem}なくちゃ`
  };
}

function buildSuru(verb) {
  const noun = suruStem(verb);
  const prefix = noun;
  return {
    ...verb,
    groupLabel: verb.base === "する" ? "กลุ่ม 3・する" : "กลุ่ม 3・Nする",
    dictionary: verb.base,
    stem: `${prefix}し`,
    masu: `${prefix}します`,
    masen: `${prefix}しません`,
    mashita: `${prefix}しました`,
    masenDeshita: `${prefix}しませんでした`,
    nai: `${prefix}しない`,
    nakatta: `${prefix}しなかった`,
    te: `${prefix}して`,
    ta: `${prefix}した`,
    potential: `${prefix}できる`,
    passive: `${prefix}される`,
    causative: `${prefix}させる`,
    causativePassive: `${prefix}させられる`,
    volitional: `${prefix}しよう`,
    imperative: `${prefix}しろ`,
    prohibitive: `${verb.base}な`,
    ba: `${prefix}すれば`,
    tara: `${prefix}したら`,
    tari: `${prefix}したり`,
    tai: `${prefix}したい`,
    zu: `${prefix}せずに`,
    nakereba: `${prefix}しなければ`,
    nakucha: `${prefix}しなくちゃ`
  };
}

function buildKuru(verb) {
  return {
    ...verb,
    groupLabel: "กลุ่ม 3・来る",
    dictionary: "来る（くる）",
    stem: "来（き）",
    masu: "来ます（きます）",
    masen: "来ません（きません）",
    mashita: "来ました（きました）",
    masenDeshita: "来ませんでした（きませんでした）",
    nai: "来ない（こない）",
    nakatta: "来なかった（こなかった）",
    te: "来て（きて）",
    ta: "来た（きた）",
    potential: "来られる（こられる）",
    passive: "来られる（こられる）",
    causative: "来させる（こさせる）",
    causativePassive: "来させられる（こさせられる）",
    volitional: "来よう（こよう）",
    imperative: "来い（こい）",
    prohibitive: "来るな（くるな）",
    ba: "来れば（くれば）",
    tara: "来たら（きたら）",
    tari: "来たり（きたり）",
    tai: "来たい（きたい）",
    zu: "来ずに（こずに）",
    nakereba: "来なければ（こなければ）",
    nakucha: "来なくちゃ（こなくちゃ）"
  };
}

function buildVerb(verb) {
  if (verb.group === "godan") return buildGodan(verb);
  if (verb.group === "ichidan") return buildIchidan(verb);
  if (verb.group === "suru") return buildSuru(verb);
  return buildKuru(verb);
}

window.N3_CONJUGATION_TYPES = CONJUGATION_TYPE_DEFS;
window.N3_CONJUGATION_GROUPS = CONJUGATION_GROUP_GUIDE;
window.N3_CONJUGATION_VERBS = CONJUGATION_VERB_SEEDS.map(buildVerb);
