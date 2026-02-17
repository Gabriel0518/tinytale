const fs = require('fs');
const path = require('path');

const dramas = [
  { title: "The CEO's Secret Contract", cat: ["Romance","CEO","Drama"], rating: 8.7, eps: 80, views: 2580000, completed: false, featured: true, year: 2024, desc: "When a struggling artist accidentally signs a marriage contract with the city's most powerful CEO, she finds herself trapped in a world of luxury, lies, and unexpected passion." },
  { title: "Revenge of the Princess", cat: ["Revenge","Historical","Drama"], rating: 9.1, eps: 60, views: 1920000, completed: true, featured: true, year: 2024, desc: "Betrayed by her own family, a fallen princess rises from the ashes to reclaim her throne and destroy those who wronged her." },
  { title: "Sweet Love in Office", cat: ["Romance","Comedy"], rating: 8.3, eps: 45, views: 890000, completed: false, year: 2024, desc: "Two rival executives discover unexpected chemistry when they're forced to share an office for a month." },
  { title: "Mysterious Doctor", cat: ["Mystery","Suspense"], rating: 8.6, eps: 55, views: 1150000, completed: false, year: 2024, desc: "A brilliant surgeon with a hidden past uncovers a conspiracy that threatens everyone she loves." },
  { title: "Powerful CEO", cat: ["CEO","Drama"], rating: 8.4, eps: 70, views: 1340000, completed: true, year: 2024, desc: "From the streets to the boardroom — one man's ruthless rise to power and the woman who changes everything." },
  { title: "Love in the City", cat: ["Romance","Urban"], rating: 8.2, eps: 40, views: 760000, completed: false, year: 2024, desc: "Three best friends navigate love, heartbreak, and ambition in the city that never sleeps." },
  { title: "Wolf Moon Rising", cat: ["Werewolf","Fantasy","Romance"], rating: 9.0, eps: 90, views: 2100000, completed: false, featured: true, year: 2024, desc: "A forbidden love between a werewolf prince and a human girl threatens to ignite an ancient war between their worlds." },
  { title: "The Billionaire's Bride", cat: ["Romance","CEO"], rating: 8.8, eps: 65, views: 1780000, completed: true, year: 2024, desc: "A contract marriage between a cold billionaire and a spirited waitress turns into the love story of the century." },
  { title: "Dark Throne", cat: ["Fantasy","Revenge"], rating: 9.2, eps: 100, views: 3200000, completed: false, featured: true, year: 2024, desc: "In a kingdom where magic is forbidden, a young sorceress must reclaim the throne stolen from her bloodline." },
  { title: "Undercover Hearts", cat: ["Suspense","Romance"], rating: 8.5, eps: 50, views: 980000, completed: false, year: 2024, desc: "An undercover agent falls for her target — but when her cover is blown, she must choose between duty and love." },
  { title: "Eternal Flame", cat: ["Fantasy","Romance"], rating: 8.9, eps: 75, views: 1560000, completed: true, year: 2024, desc: "A love that transcends time itself — two souls connected across centuries finally meet in the modern world." },
  { title: "Vengeance is Mine", cat: ["Revenge","Drama"], rating: 9.3, eps: 85, views: 2850000, completed: false, featured: true, year: 2024, desc: "She lost everything — her family, her fortune, her name. Now she's back, and no one is safe." },
  { title: "Forbidden Alpha", cat: ["Werewolf","Romance"], rating: 8.7, eps: 72, views: 1650000, completed: false, year: 2024, desc: "The alpha of the strongest pack falls for a rogue wolf — defying every law of their kind." },
  { title: "My Husband is a Ghost", cat: ["Fantasy","Comedy","Romance"], rating: 8.1, eps: 48, views: 720000, completed: true, year: 2024, desc: "After a freak accident, a woman discovers her new husband is actually a 200-year-old ghost bound to their apartment." },
  { title: "The Dragon King's Mate", cat: ["Fantasy","Romance"], rating: 9.0, eps: 88, views: 2200000, completed: false, year: 2024, desc: "In a world where dragons rule, a human girl is chosen as the mate of the most feared Dragon King." },
  { title: "Betrayed by Blood", cat: ["Revenge","Suspense"], rating: 8.8, eps: 62, views: 1480000, completed: true, year: 2024, desc: "When she discovers her twin sister stole her identity and her life, she wages a war that will destroy them both." },
  { title: "CEO's Hidden Heir", cat: ["CEO","Romance","Drama"], rating: 8.5, eps: 56, views: 1100000, completed: false, year: 2024, desc: "Five years after a one-night stand, she returns to the city — with his child he never knew existed." },
  { title: "Moonlit Wolves", cat: ["Werewolf","Fantasy"], rating: 8.6, eps: 68, views: 1350000, completed: false, year: 2024, desc: "Two rival wolf packs must unite against a common enemy, but the alpha's daughter falls for the enemy's son." },
  { title: "The Perfect Revenge", cat: ["Revenge","Romance"], rating: 9.1, eps: 78, views: 2400000, completed: true, year: 2024, desc: "She married her enemy's son to destroy his empire from within — but she didn't plan on falling in love." },
  { title: "Trapped with the CEO", cat: ["CEO","Romance"], rating: 8.3, eps: 52, views: 950000, completed: false, year: 2024, desc: "An elevator malfunction traps a junior employee with the company's intimidating CEO for 12 hours." },
  { title: "Shadow Assassin", cat: ["Suspense","Romance"], rating: 8.7, eps: 64, views: 1420000, completed: false, year: 2024, desc: "The world's deadliest assassin takes on one final mission — but her target makes her question everything." },
  { title: "Rebirth of the Queen", cat: ["Revenge","Fantasy"], rating: 9.4, eps: 95, views: 3500000, completed: false, featured: true, year: 2024, desc: "After being murdered by her husband, she's reborn 10 years in the past with all her memories — and a plan." },
  { title: "Love After Midnight", cat: ["Romance","Urban"], rating: 8.0, eps: 38, views: 620000, completed: true, year: 2024, desc: "A night-shift nurse and a mysterious patient share stolen moments that change both their lives forever." },
  { title: "The Alpha's Rejected Mate", cat: ["Werewolf","Romance"], rating: 8.9, eps: 82, views: 1900000, completed: false, year: 2024, desc: "Rejected by her fated mate on her 18th birthday, she transforms into the most powerful she-wolf in history." },
  { title: "Billionaire's Secret Baby", cat: ["CEO","Romance","Drama"], rating: 8.4, eps: 58, views: 1050000, completed: true, year: 2024, desc: "She hid his child for three years. Now he's found them — and he wants everything." },
  { title: "Witch's Heart", cat: ["Fantasy","Romance"], rating: 8.6, eps: 66, views: 1280000, completed: false, year: 2024, desc: "The last witch in a world that hunts her kind falls for the hunter sent to capture her." },
  { title: "Deadly Vows", cat: ["Suspense","Revenge"], rating: 8.8, eps: 54, views: 1380000, completed: true, year: 2024, desc: "On her wedding day, she discovers her groom murdered her father. The honeymoon becomes a battlefield." },
  { title: "My CEO Neighbor", cat: ["CEO","Comedy","Romance"], rating: 8.1, eps: 42, views: 780000, completed: false, year: 2024, desc: "She thought her annoying neighbor was a jobless slacker — until she saw him on the cover of Forbes." },
  { title: "Pack Wars", cat: ["Werewolf","Fantasy","Suspense"], rating: 8.7, eps: 76, views: 1580000, completed: false, year: 2024, desc: "When the Blood Moon rises, three wolf packs must fight for dominance — and only one alpha will survive." },
  { title: "The Heiress Returns", cat: ["Revenge","CEO","Drama"], rating: 9.0, eps: 70, views: 2050000, completed: true, year: 2024, desc: "Thrown out as a child, she returns as the richest woman in the country to face the family that abandoned her." },
  { title: "Cursed Love", cat: ["Fantasy","Romance"], rating: 8.5, eps: 60, views: 1180000, completed: false, year: 2024, desc: "Every person she falls in love with dies within a year. Can the curse be broken before it claims him too?" },
  { title: "Office Wars", cat: ["CEO","Comedy"], rating: 8.0, eps: 36, views: 580000, completed: true, year: 2024, desc: "Two department heads wage an epic office war — with pranks, sabotage, and undeniable chemistry." },
  { title: "The Vampire's Bride", cat: ["Fantasy","Romance"], rating: 8.8, eps: 74, views: 1720000, completed: false, year: 2024, desc: "Sold to a vampire lord to pay her family's debt, she discovers he's not the monster everyone fears." },
  { title: "Revenge Wears Prada", cat: ["Revenge","Urban","Drama"], rating: 8.6, eps: 58, views: 1250000, completed: true, year: 2024, desc: "A fashion intern discovers her boss destroyed her mother's career. Now she'll dismantle the empire stitch by stitch." },
  { title: "Fated to the Alpha", cat: ["Werewolf","Romance"], rating: 8.9, eps: 80, views: 1850000, completed: false, year: 2024, desc: "She's an omega — the weakest of her kind. But fate has paired her with the most powerful alpha alive." },
  { title: "The Cold CEO's Warm Heart", cat: ["CEO","Romance"], rating: 8.3, eps: 50, views: 920000, completed: true, year: 2024, desc: "Everyone says CEO Jiang has no heart. His new assistant is about to prove them all wrong." },
  { title: "Demon's Contract", cat: ["Fantasy","Suspense"], rating: 8.7, eps: 68, views: 1450000, completed: false, year: 2024, desc: "She made a deal with a demon to save her sister. The price? Seven years of servitude — and her soul." },
  { title: "Second Chance at Love", cat: ["Romance","Drama"], rating: 8.2, eps: 44, views: 830000, completed: true, year: 2024, desc: "Divorced and broken, she runs into her college sweetheart — who never stopped loving her." },
  { title: "The Luna's Revenge", cat: ["Werewolf","Revenge"], rating: 9.1, eps: 86, views: 2300000, completed: false, year: 2024, desc: "Betrayed by her pack and left for dead, the former Luna rises with a new pack and an unstoppable thirst for justice." },
  { title: "Married to the Mafia Boss", cat: ["Suspense","Romance"], rating: 8.5, eps: 62, views: 1200000, completed: false, year: 2024, desc: "To protect her family, she agrees to marry the city's most dangerous man — and discovers his darkest secret." },
  { title: "The Enchantress", cat: ["Fantasy","Romance"], rating: 8.8, eps: 72, views: 1680000, completed: true, year: 2024, desc: "Born with the power to control emotions, she's feared by all — until a man immune to her magic appears." },
  { title: "CEO's Fake Fiancée", cat: ["CEO","Romance","Comedy"], rating: 8.1, eps: 46, views: 850000, completed: false, year: 2024, desc: "He needs a fake fiancée for his grandmother's birthday. She needs rent money. What could go wrong?" },
  { title: "Blood Moon Pack", cat: ["Werewolf","Fantasy"], rating: 8.6, eps: 78, views: 1520000, completed: false, year: 2024, desc: "The rarest wolf — a white alpha — emerges during the Blood Moon, and every pack wants to claim her." },
  { title: "Empire of Lies", cat: ["Revenge","CEO","Suspense"], rating: 9.2, eps: 92, views: 2700000, completed: false, year: 2024, desc: "Behind the glamorous facade of the Chen empire lies murder, betrayal, and a daughter who knows the truth." },
  { title: "Starlight Romance", cat: ["Romance","Urban"], rating: 8.0, eps: 40, views: 650000, completed: true, year: 2024, desc: "A struggling actress and a famous director clash on set — and spark a romance that captivates the nation." },
  { title: "The Lycan Prince", cat: ["Werewolf","Fantasy","Romance"], rating: 9.0, eps: 84, views: 2150000, completed: false, year: 2024, desc: "The last Lycan prince has been in hiding for centuries. When his mate finally appears, war follows." },
  { title: "Shattered Crown", cat: ["Revenge","Historical"], rating: 8.7, eps: 66, views: 1400000, completed: true, year: 2024, desc: "A dethroned empress plots her return to power in a court filled with poison, politics, and passion." },
  { title: "Love in Disguise", cat: ["Romance","Comedy"], rating: 8.2, eps: 42, views: 790000, completed: false, year: 2024, desc: "To escape an arranged marriage, she disguises herself as a man — and accidentally becomes her crush's roommate." },
  { title: "The Omega's Rise", cat: ["Werewolf","Romance","Drama"], rating: 8.8, eps: 76, views: 1750000, completed: false, year: 2024, desc: "Born the weakest omega, she defies every expectation and rises to become the first female alpha in wolf history." },
  { title: "Midnight Heir", cat: ["Fantasy","Suspense","Romance"], rating: 8.9, eps: 70, views: 1880000, completed: false, year: 2024, desc: "At midnight on her 21st birthday, she inherits powers that make her the target of every supernatural faction in the city." },
];

const actors = [
  ['Emma Stone','James Chen'], ['Alice Wang','Bob Chen'], ['Carol Zhang','David Li'],
  ['Eve Liu','Frank Wu'], ['Grace Yang','Henry Zhou'], ['Ivy Chen','Jack Ma'],
  ['Luna Park','Derek Moon'], ['Sophie Lin','Marcus Chen'], ['Aria Storm','Kai Blackwood'],
  ['Mia Zhang','Leo Wang'], ['Stella Kim','Ryan Park'], ['Victoria Zhao','Nathan Li'],
  ['Amber Fox','Tyler Reed'], ['Nina Hart','Sam Cross'], ['Jade Wu','Ethan Lam'],
  ['Chloe Tan','Max Rivera'], ['Lily Fang','Owen Blake'], ['Ruby Moon','Zane Wolf'],
  ['Serena Voss','Dante Cruz'], ['Tessa Lin','Jace Park'], ['Kira Blade','Axel Storm'],
  ['Nora Quinn','Rhys Dark'], ['Faye Chen','Luke West'], ['Zara Night','Cole Hunter'],
  ['Mila Rose','Dean Frost'], ['Iris Flame','Kai Shadow'], ['Vera Steel','Ash Knight'],
  ['Daisy Bright','Rex Gold'], ['Freya Wild','Thor Pack'], ['Elena Crown','Victor King'],
  ['Hazel Spell','Finn Curse'], ['Penny Sharp','Gil Smooth'], ['Scarlet Fang','Drake Blood'],
  ['Olive Silk','Hugo Stitch'], ['Willow Howl','Blaze Alpha'], ['Pearl Ice','Stone Heart'],
  ['Raven Dark','Lucian Fire'], ['Hope Spring','Grant Fall'], ['Sierra Moon','Fenris Claw'],
  ['Jade Danger','Marco Don'], ['Crystal Charm','Orion Spell'], ['Poppy Sweet','Beau Fake'],
  ['Dawn White','Silas Grey'], ['Carmen Truth','Nero Lie'], ['Stella Light','Ray Shine'],
  ['Lyra Fang','Ronan Prince'], ['Mei Jade','Shen Gold'], ['Rosie Laugh','Kit Smile'],
  ['Athena Rise','Titan Fall'], ['Nova Midnight','Caspian Heir'],
];

const epTitles = {
  Romance: ['First Encounter','Unexpected Feelings','The Confession','Jealousy Strikes','Secret Date'],
  Revenge: ['The Betrayal','Ashes to Ashes','The Plan','Striking Back','No Mercy'],
  CEO: ['The Interview','Power Play','Office Tension','The Deal','Boardroom Secrets'],
  Werewolf: ['Blood Moon','The Pack','Forbidden Territory','Alpha Challenge','Moonlit Chase'],
  Fantasy: ['The Prophecy','Hidden Powers','Dark Magic','The Quest','Enchanted Night'],
  Suspense: ['The Clue','Double Cross','Midnight Chase','The Reveal','No Escape'],
  Comedy: ['The Mix-Up','Awkward Moments','The Prank','Caught Red-Handed','Happy Chaos'],
  Urban: ['City Lights','Chance Meeting','Rooftop Confessions','Late Night Talks','New Beginnings'],
  Historical: ['The Fall','Royal Intrigue','Palace Secrets','The Alliance','Crown of Thorns'],
  Drama: ['Breaking Point','Torn Apart','The Truth','Forgiveness','New Dawn'],
  Mystery: ['The Missing Piece','Strange Clues','Hidden Room','The Suspect','Final Answer'],
};

// Count categories
const catCounts = {};
dramas.forEach(d => d.cat.forEach(c => { catCounts[c] = (catCounts[c] || 0) + 1; }));

// Generate episodes (3 per drama, first 2 free)
let epId = 1;
const episodes = [];
dramas.forEach((d, i) => {
  const id = `d${i+1}`;
  const mainCat = d.cat[0];
  const titles = epTitles[mainCat] || epTitles.Drama;
  for (let e = 0; e < 3; e++) {
    episodes.push({
      _id: `e${epId}`, dramaId: id, title: titles[e] || `Episode ${e+1}`,
      episodeNumber: e+1, duration: 170 + Math.floor(Math.random()*40),
      isFree: e < 2, unlockPrice: e < 2 ? 0 : 50, videoUrl: ''
    });
    epId++;
  }
});

// ===== Generate server/index.js mockDramas =====
const serverDramas = dramas.map((d, i) => {
  const id = `d${i+1}`;
  const seed = `drama${i+1}`;
  const feat = d.featured ? `\n    isFeatured: true,` : '';
  return `  {
    _id: '${id}', title: ${JSON.stringify(d.title)}, cover: 'https://picsum.photos/seed/${seed}/400/600',
    description: ${JSON.stringify(d.desc)},
    categories: ${JSON.stringify(d.cat)}, actors: ${JSON.stringify(actors[i])}, rating: ${d.rating},
    isCompleted: ${d.completed}, status: 'published', year: ${d.year}, totalEpisodes: ${d.eps}, viewCount: ${d.views},${feat}
    createdAt: '2024-${String(((i % 12) + 1)).padStart(2, '0')}-${String(((i % 28) + 1)).padStart(2, '0')}',
  }`;
}).join(',\n');

const serverEpisodes = episodes.map(e => {
  return `  { _id: '${e._id}', dramaId: '${e.dramaId}', title: '${e.title}', episodeNumber: ${e.episodeNumber}, duration: ${e.duration}, isFree: ${e.isFree}, unlockPrice: ${e.unlockPrice}, videoUrl: '' }`;
}).join(',\n');

const serverCats = [
  ['c1','Romance','romance'], ['c2','Revenge','revenge'], ['c3','CEO','ceo'],
  ['c4','Werewolf','werewolf'], ['c5','Suspense','suspense'], ['c6','Fantasy','fantasy'],
  ['c7','Urban','urban'], ['c8','Drama','drama'], ['c9','Comedy','comedy'],
  ['c10','Historical','historical'], ['c11','Mystery','mystery'],
].map(([id,name,slug]) => {
  return `  { _id: '${id}', name: '${name}', slug: '${slug}', dramaCount: ${catCounts[name] || 0} }`;
}).join(',\n');

// Read and replace server/index.js
const serverPath = path.join(__dirname, '..', 'server', 'index.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Replace mockCategories
serverContent = serverContent.replace(
  /const mockCategories = \[[\s\S]*?\];/,
  `const mockCategories = [\n${serverCats}\n];`
);

// Replace mockDramas
serverContent = serverContent.replace(
  /const mockDramas = \[[\s\S]*?\];/,
  `const mockDramas = [\n${serverDramas}\n];`
);

// Replace mockEpisodes
serverContent = serverContent.replace(
  /const mockEpisodes = \[[\s\S]*?\];/,
  `const mockEpisodes = [\n${serverEpisodes}\n];`
);

fs.writeFileSync(serverPath, serverContent);
console.log(`✅ server/index.js updated with ${dramas.length} dramas, ${episodes.length} episodes`);

// ===== Generate mockData.ts =====
const tsDramas = dramas.map((d, i) => {
  const id = `${i+1}`;
  const seed = `drama${i+1}`;
  const feat = d.featured ? `\n    isFeatured: true,` : '';
  return `  {
    _id: "${id}",
    title: ${JSON.stringify(d.title)},
    cover: "https://picsum.photos/seed/${seed}/400/600",
    description: ${JSON.stringify(d.desc)},
    categories: ${JSON.stringify(d.cat)},
    actors: ${JSON.stringify(actors[i])},
    rating: ${d.rating},
    episodes: [],
    isCompleted: ${d.completed},
    year: ${d.year},
    totalEpisodes: ${d.eps},${feat}
    createdAt: "2024-${String(((i % 12) + 1)).padStart(2, '0')}-${String(((i % 28) + 1)).padStart(2, '0')}",
  }`;
}).join(',\n');

const tsContent = `import type { Drama, Category } from "@/types";

// Mock data for development — 50 short dramas
export const mockDramas: Drama[] = [
${tsDramas}
];

export const mockCategories: Category[] = [
  { _id: "1", name: "Romance", slug: "romance" },
  { _id: "2", name: "Revenge", slug: "revenge" },
  { _id: "3", name: "CEO", slug: "ceo" },
  { _id: "4", name: "Werewolf", slug: "werewolf" },
  { _id: "5", name: "Suspense", slug: "suspense" },
  { _id: "6", name: "Fantasy", slug: "fantasy" },
  { _id: "7", name: "Urban", slug: "urban" },
  { _id: "8", name: "Drama", slug: "drama" },
  { _id: "9", name: "Comedy", slug: "comedy" },
  { _id: "10", name: "Historical", slug: "historical" },
  { _id: "11", name: "Mystery", slug: "mystery" },
];
`;

const tsPath = path.join(__dirname, '..', 'src', 'lib', 'mockData.ts');
fs.writeFileSync(tsPath, tsContent);
console.log(`✅ src/lib/mockData.ts updated with ${dramas.length} dramas`);

// Print category counts
console.log('\nCategory counts:');
Object.entries(catCounts).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
