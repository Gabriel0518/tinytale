const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = 7002;

app.use(cors());
app.use(express.json());

// ============ Mock Data ============

const mockUsers = [
  { _id: 'u1', email: '111@gmail.com', password: '111111', nickname: 'TinyTale Fan', avatar: '', role: 'vip', status: 'active', coins: 880, vipStatus: 'active', vipExpireDate: '2026-12-31', createdAt: '2025-10-01' },
  { _id: 'u2', email: 'alice@test.com', password: '123456', nickname: 'Alice', avatar: '', role: 'vip', status: 'active', coins: 500, createdAt: '2025-12-01' },
  { _id: 'u3', email: 'bob@test.com', password: '123456', nickname: 'Bob', avatar: '', role: 'user', status: 'active', coins: 120, createdAt: '2025-12-15' },
  { _id: 'u4', email: 'carol@test.com', password: '123456', nickname: 'Carol', avatar: '', role: 'user', status: 'banned', coins: 0, createdAt: '2026-01-05' },
];

// Token -> userId mapping
const tokenMap = {};

// ============ Auth Middleware ============

function authenticateToken(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = tokenMap[token];
  if (!userId) {
    return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
  }
  req.user = { id: userId };
  next();
}

function optionalAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = tokenMap[token];
  if (userId) {
    req.user = { id: userId };
  }
  next();
}

const mockCategories = [
  { _id: 'c1', name: 'Romance', slug: 'romance', dramaCount: 32 },
  { _id: 'c2', name: 'Revenge', slug: 'revenge', dramaCount: 12 },
  { _id: 'c3', name: 'CEO', slug: 'ceo', dramaCount: 12 },
  { _id: 'c4', name: 'Werewolf', slug: 'werewolf', dramaCount: 10 },
  { _id: 'c5', name: 'Suspense', slug: 'suspense', dramaCount: 10 },
  { _id: 'c6', name: 'Fantasy', slug: 'fantasy', dramaCount: 16 },
  { _id: 'c7', name: 'Urban', slug: 'urban', dramaCount: 4 },
  { _id: 'c8', name: 'Drama', slug: 'drama', dramaCount: 10 },
  { _id: 'c9', name: 'Comedy', slug: 'comedy', dramaCount: 6 },
  { _id: 'c10', name: 'Historical', slug: 'historical', dramaCount: 2 },
  { _id: 'c11', name: 'Mystery', slug: 'mystery', dramaCount: 1 }
];

const mockDramas = [
  {
    _id: 'd1', title: "The CEO's Secret Contract", cover: 'https://picsum.photos/seed/drama1/400/600',
    description: "When a struggling artist accidentally signs a marriage contract with the city's most powerful CEO, she finds herself trapped in a world of luxury, lies, and unexpected passion.",
    categories: ["Romance","CEO","Drama"], actors: ["Emma Stone","James Chen"], rating: 8.7,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 80, viewCount: 2580000,
    isFeatured: true,
    createdAt: '2024-01-01',
  },
  {
    _id: 'd2', title: "Revenge of the Princess", cover: 'https://picsum.photos/seed/drama2/400/600',
    description: "Betrayed by her own family, a fallen princess rises from the ashes to reclaim her throne and destroy those who wronged her.",
    categories: ["Revenge","Historical","Drama"], actors: ["Alice Wang","Bob Chen"], rating: 9.1,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 60, viewCount: 1920000,
    isFeatured: true,
    createdAt: '2024-02-02',
  },
  {
    _id: 'd3', title: "Sweet Love in Office", cover: 'https://picsum.photos/seed/drama3/400/600',
    description: "Two rival executives discover unexpected chemistry when they're forced to share an office for a month.",
    categories: ["Romance","Comedy"], actors: ["Carol Zhang","David Li"], rating: 8.3,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 45, viewCount: 890000,
    createdAt: '2024-03-03',
  },
  {
    _id: 'd4', title: "Mysterious Doctor", cover: 'https://picsum.photos/seed/drama4/400/600',
    description: "A brilliant surgeon with a hidden past uncovers a conspiracy that threatens everyone she loves.",
    categories: ["Mystery","Suspense"], actors: ["Eve Liu","Frank Wu"], rating: 8.6,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 55, viewCount: 1150000,
    createdAt: '2024-04-04',
  },
  {
    _id: 'd5', title: "Powerful CEO", cover: 'https://picsum.photos/seed/drama5/400/600',
    description: "From the streets to the boardroom — one man's ruthless rise to power and the woman who changes everything.",
    categories: ["CEO","Drama"], actors: ["Grace Yang","Henry Zhou"], rating: 8.4,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 70, viewCount: 1340000,
    createdAt: '2024-05-05',
  },
  {
    _id: 'd6', title: "Love in the City", cover: 'https://picsum.photos/seed/drama6/400/600',
    description: "Three best friends navigate love, heartbreak, and ambition in the city that never sleeps.",
    categories: ["Romance","Urban"], actors: ["Ivy Chen","Jack Ma"], rating: 8.2,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 40, viewCount: 760000,
    createdAt: '2024-06-06',
  },
  {
    _id: 'd7', title: "Wolf Moon Rising", cover: 'https://picsum.photos/seed/drama7/400/600',
    description: "A forbidden love between a werewolf prince and a human girl threatens to ignite an ancient war between their worlds.",
    categories: ["Werewolf","Fantasy","Romance"], actors: ["Luna Park","Derek Moon"], rating: 9,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 90, viewCount: 2100000,
    isFeatured: true,
    createdAt: '2024-07-07',
  },
  {
    _id: 'd8', title: "The Billionaire's Bride", cover: 'https://picsum.photos/seed/drama8/400/600',
    description: "A contract marriage between a cold billionaire and a spirited waitress turns into the love story of the century.",
    categories: ["Romance","CEO"], actors: ["Sophie Lin","Marcus Chen"], rating: 8.8,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 65, viewCount: 1780000,
    createdAt: '2024-08-08',
  },
  {
    _id: 'd9', title: "Dark Throne", cover: 'https://picsum.photos/seed/drama9/400/600',
    description: "In a kingdom where magic is forbidden, a young sorceress must reclaim the throne stolen from her bloodline.",
    categories: ["Fantasy","Revenge"], actors: ["Aria Storm","Kai Blackwood"], rating: 9.2,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 100, viewCount: 3200000,
    isFeatured: true,
    createdAt: '2024-09-09',
  },
  {
    _id: 'd10', title: "Undercover Hearts", cover: 'https://picsum.photos/seed/drama10/400/600',
    description: "An undercover agent falls for her target — but when her cover is blown, she must choose between duty and love.",
    categories: ["Suspense","Romance"], actors: ["Mia Zhang","Leo Wang"], rating: 8.5,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 50, viewCount: 980000,
    createdAt: '2024-10-10',
  },
  {
    _id: 'd11', title: "Eternal Flame", cover: 'https://picsum.photos/seed/drama11/400/600',
    description: "A love that transcends time itself — two souls connected across centuries finally meet in the modern world.",
    categories: ["Fantasy","Romance"], actors: ["Stella Kim","Ryan Park"], rating: 8.9,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 75, viewCount: 1560000,
    createdAt: '2024-11-11',
  },
  {
    _id: 'd12', title: "Vengeance is Mine", cover: 'https://picsum.photos/seed/drama12/400/600',
    description: "She lost everything — her family, her fortune, her name. Now she's back, and no one is safe.",
    categories: ["Revenge","Drama"], actors: ["Victoria Zhao","Nathan Li"], rating: 9.3,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 85, viewCount: 2850000,
    isFeatured: true,
    createdAt: '2024-12-12',
  },
  {
    _id: 'd13', title: "Forbidden Alpha", cover: 'https://picsum.photos/seed/drama13/400/600',
    description: "The alpha of the strongest pack falls for a rogue wolf — defying every law of their kind.",
    categories: ["Werewolf","Romance"], actors: ["Amber Fox","Tyler Reed"], rating: 8.7,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 72, viewCount: 1650000,
    createdAt: '2024-01-13',
  },
  {
    _id: 'd14', title: "My Husband is a Ghost", cover: 'https://picsum.photos/seed/drama14/400/600',
    description: "After a freak accident, a woman discovers her new husband is actually a 200-year-old ghost bound to their apartment.",
    categories: ["Fantasy","Comedy","Romance"], actors: ["Nina Hart","Sam Cross"], rating: 8.1,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 48, viewCount: 720000,
    createdAt: '2024-02-14',
  },
  {
    _id: 'd15', title: "The Dragon King's Mate", cover: 'https://picsum.photos/seed/drama15/400/600',
    description: "In a world where dragons rule, a human girl is chosen as the mate of the most feared Dragon King.",
    categories: ["Fantasy","Romance"], actors: ["Jade Wu","Ethan Lam"], rating: 9,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 88, viewCount: 2200000,
    createdAt: '2024-03-15',
  },
  {
    _id: 'd16', title: "Betrayed by Blood", cover: 'https://picsum.photos/seed/drama16/400/600',
    description: "When she discovers her twin sister stole her identity and her life, she wages a war that will destroy them both.",
    categories: ["Revenge","Suspense"], actors: ["Chloe Tan","Max Rivera"], rating: 8.8,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 62, viewCount: 1480000,
    createdAt: '2024-04-16',
  },
  {
    _id: 'd17', title: "CEO's Hidden Heir", cover: 'https://picsum.photos/seed/drama17/400/600',
    description: "Five years after a one-night stand, she returns to the city — with his child he never knew existed.",
    categories: ["CEO","Romance","Drama"], actors: ["Lily Fang","Owen Blake"], rating: 8.5,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 56, viewCount: 1100000,
    createdAt: '2024-05-17',
  },
  {
    _id: 'd18', title: "Moonlit Wolves", cover: 'https://picsum.photos/seed/drama18/400/600',
    description: "Two rival wolf packs must unite against a common enemy, but the alpha's daughter falls for the enemy's son.",
    categories: ["Werewolf","Fantasy"], actors: ["Ruby Moon","Zane Wolf"], rating: 8.6,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 68, viewCount: 1350000,
    createdAt: '2024-06-18',
  },
  {
    _id: 'd19', title: "The Perfect Revenge", cover: 'https://picsum.photos/seed/drama19/400/600',
    description: "She married her enemy's son to destroy his empire from within — but she didn't plan on falling in love.",
    categories: ["Revenge","Romance"], actors: ["Serena Voss","Dante Cruz"], rating: 9.1,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 78, viewCount: 2400000,
    createdAt: '2024-07-19',
  },
  {
    _id: 'd20', title: "Trapped with the CEO", cover: 'https://picsum.photos/seed/drama20/400/600',
    description: "An elevator malfunction traps a junior employee with the company's intimidating CEO for 12 hours.",
    categories: ["CEO","Romance"], actors: ["Tessa Lin","Jace Park"], rating: 8.3,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 52, viewCount: 950000,
    createdAt: '2024-08-20',
  },
  {
    _id: 'd21', title: "Shadow Assassin", cover: 'https://picsum.photos/seed/drama21/400/600',
    description: "The world's deadliest assassin takes on one final mission — but her target makes her question everything.",
    categories: ["Suspense","Romance"], actors: ["Kira Blade","Axel Storm"], rating: 8.7,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 64, viewCount: 1420000,
    createdAt: '2024-09-21',
  },
  {
    _id: 'd22', title: "Rebirth of the Queen", cover: 'https://picsum.photos/seed/drama22/400/600',
    description: "After being murdered by her husband, she's reborn 10 years in the past with all her memories — and a plan.",
    categories: ["Revenge","Fantasy"], actors: ["Nora Quinn","Rhys Dark"], rating: 9.4,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 95, viewCount: 3500000,
    isFeatured: true,
    createdAt: '2024-10-22',
  },
  {
    _id: 'd23', title: "Love After Midnight", cover: 'https://picsum.photos/seed/drama23/400/600',
    description: "A night-shift nurse and a mysterious patient share stolen moments that change both their lives forever.",
    categories: ["Romance","Urban"], actors: ["Faye Chen","Luke West"], rating: 8,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 38, viewCount: 620000,
    createdAt: '2024-11-23',
  },
  {
    _id: 'd24', title: "The Alpha's Rejected Mate", cover: 'https://picsum.photos/seed/drama24/400/600',
    description: "Rejected by her fated mate on her 18th birthday, she transforms into the most powerful she-wolf in history.",
    categories: ["Werewolf","Romance"], actors: ["Zara Night","Cole Hunter"], rating: 8.9,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 82, viewCount: 1900000,
    createdAt: '2024-12-24',
  },
  {
    _id: 'd25', title: "Billionaire's Secret Baby", cover: 'https://picsum.photos/seed/drama25/400/600',
    description: "She hid his child for three years. Now he's found them — and he wants everything.",
    categories: ["CEO","Romance","Drama"], actors: ["Mila Rose","Dean Frost"], rating: 8.4,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 58, viewCount: 1050000,
    createdAt: '2024-01-25',
  },
  {
    _id: 'd26', title: "Witch's Heart", cover: 'https://picsum.photos/seed/drama26/400/600',
    description: "The last witch in a world that hunts her kind falls for the hunter sent to capture her.",
    categories: ["Fantasy","Romance"], actors: ["Iris Flame","Kai Shadow"], rating: 8.6,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 66, viewCount: 1280000,
    createdAt: '2024-02-26',
  },
  {
    _id: 'd27', title: "Deadly Vows", cover: 'https://picsum.photos/seed/drama27/400/600',
    description: "On her wedding day, she discovers her groom murdered her father. The honeymoon becomes a battlefield.",
    categories: ["Suspense","Revenge"], actors: ["Vera Steel","Ash Knight"], rating: 8.8,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 54, viewCount: 1380000,
    createdAt: '2024-03-27',
  },
  {
    _id: 'd28', title: "My CEO Neighbor", cover: 'https://picsum.photos/seed/drama28/400/600',
    description: "She thought her annoying neighbor was a jobless slacker — until she saw him on the cover of Forbes.",
    categories: ["CEO","Comedy","Romance"], actors: ["Daisy Bright","Rex Gold"], rating: 8.1,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 42, viewCount: 780000,
    createdAt: '2024-04-28',
  },
  {
    _id: 'd29', title: "Pack Wars", cover: 'https://picsum.photos/seed/drama29/400/600',
    description: "When the Blood Moon rises, three wolf packs must fight for dominance — and only one alpha will survive.",
    categories: ["Werewolf","Fantasy","Suspense"], actors: ["Freya Wild","Thor Pack"], rating: 8.7,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 76, viewCount: 1580000,
    createdAt: '2024-05-01',
  },
  {
    _id: 'd30', title: "The Heiress Returns", cover: 'https://picsum.photos/seed/drama30/400/600',
    description: "Thrown out as a child, she returns as the richest woman in the country to face the family that abandoned her.",
    categories: ["Revenge","CEO","Drama"], actors: ["Elena Crown","Victor King"], rating: 9,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 70, viewCount: 2050000,
    createdAt: '2024-06-02',
  },
  {
    _id: 'd31', title: "Cursed Love", cover: 'https://picsum.photos/seed/drama31/400/600',
    description: "Every person she falls in love with dies within a year. Can the curse be broken before it claims him too?",
    categories: ["Fantasy","Romance"], actors: ["Hazel Spell","Finn Curse"], rating: 8.5,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 60, viewCount: 1180000,
    createdAt: '2024-07-03',
  },
  {
    _id: 'd32', title: "Office Wars", cover: 'https://picsum.photos/seed/drama32/400/600',
    description: "Two department heads wage an epic office war — with pranks, sabotage, and undeniable chemistry.",
    categories: ["CEO","Comedy"], actors: ["Penny Sharp","Gil Smooth"], rating: 8,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 36, viewCount: 580000,
    createdAt: '2024-08-04',
  },
  {
    _id: 'd33', title: "The Vampire's Bride", cover: 'https://picsum.photos/seed/drama33/400/600',
    description: "Sold to a vampire lord to pay her family's debt, she discovers he's not the monster everyone fears.",
    categories: ["Fantasy","Romance"], actors: ["Scarlet Fang","Drake Blood"], rating: 8.8,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 74, viewCount: 1720000,
    createdAt: '2024-09-05',
  },
  {
    _id: 'd34', title: "Revenge Wears Prada", cover: 'https://picsum.photos/seed/drama34/400/600',
    description: "A fashion intern discovers her boss destroyed her mother's career. Now she'll dismantle the empire stitch by stitch.",
    categories: ["Revenge","Urban","Drama"], actors: ["Olive Silk","Hugo Stitch"], rating: 8.6,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 58, viewCount: 1250000,
    createdAt: '2024-10-06',
  },
  {
    _id: 'd35', title: "Fated to the Alpha", cover: 'https://picsum.photos/seed/drama35/400/600',
    description: "She's an omega — the weakest of her kind. But fate has paired her with the most powerful alpha alive.",
    categories: ["Werewolf","Romance"], actors: ["Willow Howl","Blaze Alpha"], rating: 8.9,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 80, viewCount: 1850000,
    createdAt: '2024-11-07',
  },
  {
    _id: 'd36', title: "The Cold CEO's Warm Heart", cover: 'https://picsum.photos/seed/drama36/400/600',
    description: "Everyone says CEO Jiang has no heart. His new assistant is about to prove them all wrong.",
    categories: ["CEO","Romance"], actors: ["Pearl Ice","Stone Heart"], rating: 8.3,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 50, viewCount: 920000,
    createdAt: '2024-12-08',
  },
  {
    _id: 'd37', title: "Demon's Contract", cover: 'https://picsum.photos/seed/drama37/400/600',
    description: "She made a deal with a demon to save her sister. The price? Seven years of servitude — and her soul.",
    categories: ["Fantasy","Suspense"], actors: ["Raven Dark","Lucian Fire"], rating: 8.7,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 68, viewCount: 1450000,
    createdAt: '2024-01-09',
  },
  {
    _id: 'd38', title: "Second Chance at Love", cover: 'https://picsum.photos/seed/drama38/400/600',
    description: "Divorced and broken, she runs into her college sweetheart — who never stopped loving her.",
    categories: ["Romance","Drama"], actors: ["Hope Spring","Grant Fall"], rating: 8.2,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 44, viewCount: 830000,
    createdAt: '2024-02-10',
  },
  {
    _id: 'd39', title: "The Luna's Revenge", cover: 'https://picsum.photos/seed/drama39/400/600',
    description: "Betrayed by her pack and left for dead, the former Luna rises with a new pack and an unstoppable thirst for justice.",
    categories: ["Werewolf","Revenge"], actors: ["Sierra Moon","Fenris Claw"], rating: 9.1,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 86, viewCount: 2300000,
    createdAt: '2024-03-11',
  },
  {
    _id: 'd40', title: "Married to the Mafia Boss", cover: 'https://picsum.photos/seed/drama40/400/600',
    description: "To protect her family, she agrees to marry the city's most dangerous man — and discovers his darkest secret.",
    categories: ["Suspense","Romance"], actors: ["Jade Danger","Marco Don"], rating: 8.5,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 62, viewCount: 1200000,
    createdAt: '2024-04-12',
  },
  {
    _id: 'd41', title: "The Enchantress", cover: 'https://picsum.photos/seed/drama41/400/600',
    description: "Born with the power to control emotions, she's feared by all — until a man immune to her magic appears.",
    categories: ["Fantasy","Romance"], actors: ["Crystal Charm","Orion Spell"], rating: 8.8,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 72, viewCount: 1680000,
    createdAt: '2024-05-13',
  },
  {
    _id: 'd42', title: "CEO's Fake Fiancée", cover: 'https://picsum.photos/seed/drama42/400/600',
    description: "He needs a fake fiancée for his grandmother's birthday. She needs rent money. What could go wrong?",
    categories: ["CEO","Romance","Comedy"], actors: ["Poppy Sweet","Beau Fake"], rating: 8.1,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 46, viewCount: 850000,
    createdAt: '2024-06-14',
  },
  {
    _id: 'd43', title: "Blood Moon Pack", cover: 'https://picsum.photos/seed/drama43/400/600',
    description: "The rarest wolf — a white alpha — emerges during the Blood Moon, and every pack wants to claim her.",
    categories: ["Werewolf","Fantasy"], actors: ["Dawn White","Silas Grey"], rating: 8.6,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 78, viewCount: 1520000,
    createdAt: '2024-07-15',
  },
  {
    _id: 'd44', title: "Empire of Lies", cover: 'https://picsum.photos/seed/drama44/400/600',
    description: "Behind the glamorous facade of the Chen empire lies murder, betrayal, and a daughter who knows the truth.",
    categories: ["Revenge","CEO","Suspense"], actors: ["Carmen Truth","Nero Lie"], rating: 9.2,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 92, viewCount: 2700000,
    createdAt: '2024-08-16',
  },
  {
    _id: 'd45', title: "Starlight Romance", cover: 'https://picsum.photos/seed/drama45/400/600',
    description: "A struggling actress and a famous director clash on set — and spark a romance that captivates the nation.",
    categories: ["Romance","Urban"], actors: ["Stella Light","Ray Shine"], rating: 8,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 40, viewCount: 650000,
    createdAt: '2024-09-17',
  },
  {
    _id: 'd46', title: "The Lycan Prince", cover: 'https://picsum.photos/seed/drama46/400/600',
    description: "The last Lycan prince has been in hiding for centuries. When his mate finally appears, war follows.",
    categories: ["Werewolf","Fantasy","Romance"], actors: ["Lyra Fang","Ronan Prince"], rating: 9,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 84, viewCount: 2150000,
    createdAt: '2024-10-18',
  },
  {
    _id: 'd47', title: "Shattered Crown", cover: 'https://picsum.photos/seed/drama47/400/600',
    description: "A dethroned empress plots her return to power in a court filled with poison, politics, and passion.",
    categories: ["Revenge","Historical"], actors: ["Mei Jade","Shen Gold"], rating: 8.7,
    isCompleted: true, status: 'published', year: 2024, totalEpisodes: 66, viewCount: 1400000,
    createdAt: '2024-11-19',
  },
  {
    _id: 'd48', title: "Love in Disguise", cover: 'https://picsum.photos/seed/drama48/400/600',
    description: "To escape an arranged marriage, she disguises herself as a man — and accidentally becomes her crush's roommate.",
    categories: ["Romance","Comedy"], actors: ["Rosie Laugh","Kit Smile"], rating: 8.2,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 42, viewCount: 790000,
    createdAt: '2024-12-20',
  },
  {
    _id: 'd49', title: "The Omega's Rise", cover: 'https://picsum.photos/seed/drama49/400/600',
    description: "Born the weakest omega, she defies every expectation and rises to become the first female alpha in wolf history.",
    categories: ["Werewolf","Romance","Drama"], actors: ["Athena Rise","Titan Fall"], rating: 8.8,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 76, viewCount: 1750000,
    createdAt: '2024-01-21',
  },
  {
    _id: 'd50', title: "Midnight Heir", cover: 'https://picsum.photos/seed/drama50/400/600',
    description: "At midnight on her 21st birthday, she inherits powers that make her the target of every supernatural faction in the city.",
    categories: ["Fantasy","Suspense","Romance"], actors: ["Nova Midnight","Caspian Heir"], rating: 8.9,
    isCompleted: false, status: 'published', year: 2024, totalEpisodes: 70, viewCount: 1880000,
    createdAt: '2024-02-22',
  }
];

const mockEpisodes = [
  { _id: 'e1', dramaId: 'd1', title: 'First Encounter', episodeNumber: 1, duration: 209, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e2', dramaId: 'd1', title: 'Unexpected Feelings', episodeNumber: 2, duration: 188, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e3', dramaId: 'd1', title: 'The Confession', episodeNumber: 3, duration: 198, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e4', dramaId: 'd2', title: 'The Betrayal', episodeNumber: 1, duration: 172, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e5', dramaId: 'd2', title: 'Ashes to Ashes', episodeNumber: 2, duration: 185, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e6', dramaId: 'd2', title: 'The Plan', episodeNumber: 3, duration: 174, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e7', dramaId: 'd3', title: 'First Encounter', episodeNumber: 1, duration: 207, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e8', dramaId: 'd3', title: 'Unexpected Feelings', episodeNumber: 2, duration: 189, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e9', dramaId: 'd3', title: 'The Confession', episodeNumber: 3, duration: 170, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e10', dramaId: 'd4', title: 'The Missing Piece', episodeNumber: 1, duration: 182, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e11', dramaId: 'd4', title: 'Strange Clues', episodeNumber: 2, duration: 180, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e12', dramaId: 'd4', title: 'Hidden Room', episodeNumber: 3, duration: 208, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e13', dramaId: 'd5', title: 'The Interview', episodeNumber: 1, duration: 192, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e14', dramaId: 'd5', title: 'Power Play', episodeNumber: 2, duration: 181, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e15', dramaId: 'd5', title: 'Office Tension', episodeNumber: 3, duration: 207, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e16', dramaId: 'd6', title: 'First Encounter', episodeNumber: 1, duration: 189, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e17', dramaId: 'd6', title: 'Unexpected Feelings', episodeNumber: 2, duration: 206, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e18', dramaId: 'd6', title: 'The Confession', episodeNumber: 3, duration: 183, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e19', dramaId: 'd7', title: 'Blood Moon', episodeNumber: 1, duration: 184, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e20', dramaId: 'd7', title: 'The Pack', episodeNumber: 2, duration: 173, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e21', dramaId: 'd7', title: 'Forbidden Territory', episodeNumber: 3, duration: 177, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e22', dramaId: 'd8', title: 'First Encounter', episodeNumber: 1, duration: 203, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e23', dramaId: 'd8', title: 'Unexpected Feelings', episodeNumber: 2, duration: 178, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e24', dramaId: 'd8', title: 'The Confession', episodeNumber: 3, duration: 190, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e25', dramaId: 'd9', title: 'The Prophecy', episodeNumber: 1, duration: 193, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e26', dramaId: 'd9', title: 'Hidden Powers', episodeNumber: 2, duration: 207, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e27', dramaId: 'd9', title: 'Dark Magic', episodeNumber: 3, duration: 203, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e28', dramaId: 'd10', title: 'The Clue', episodeNumber: 1, duration: 199, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e29', dramaId: 'd10', title: 'Double Cross', episodeNumber: 2, duration: 187, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e30', dramaId: 'd10', title: 'Midnight Chase', episodeNumber: 3, duration: 178, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e31', dramaId: 'd11', title: 'The Prophecy', episodeNumber: 1, duration: 193, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e32', dramaId: 'd11', title: 'Hidden Powers', episodeNumber: 2, duration: 186, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e33', dramaId: 'd11', title: 'Dark Magic', episodeNumber: 3, duration: 188, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e34', dramaId: 'd12', title: 'The Betrayal', episodeNumber: 1, duration: 186, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e35', dramaId: 'd12', title: 'Ashes to Ashes', episodeNumber: 2, duration: 189, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e36', dramaId: 'd12', title: 'The Plan', episodeNumber: 3, duration: 198, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e37', dramaId: 'd13', title: 'Blood Moon', episodeNumber: 1, duration: 202, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e38', dramaId: 'd13', title: 'The Pack', episodeNumber: 2, duration: 172, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e39', dramaId: 'd13', title: 'Forbidden Territory', episodeNumber: 3, duration: 196, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e40', dramaId: 'd14', title: 'The Prophecy', episodeNumber: 1, duration: 208, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e41', dramaId: 'd14', title: 'Hidden Powers', episodeNumber: 2, duration: 185, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e42', dramaId: 'd14', title: 'Dark Magic', episodeNumber: 3, duration: 195, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e43', dramaId: 'd15', title: 'The Prophecy', episodeNumber: 1, duration: 202, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e44', dramaId: 'd15', title: 'Hidden Powers', episodeNumber: 2, duration: 202, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e45', dramaId: 'd15', title: 'Dark Magic', episodeNumber: 3, duration: 199, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e46', dramaId: 'd16', title: 'The Betrayal', episodeNumber: 1, duration: 185, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e47', dramaId: 'd16', title: 'Ashes to Ashes', episodeNumber: 2, duration: 175, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e48', dramaId: 'd16', title: 'The Plan', episodeNumber: 3, duration: 188, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e49', dramaId: 'd17', title: 'The Interview', episodeNumber: 1, duration: 199, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e50', dramaId: 'd17', title: 'Power Play', episodeNumber: 2, duration: 181, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e51', dramaId: 'd17', title: 'Office Tension', episodeNumber: 3, duration: 183, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e52', dramaId: 'd18', title: 'Blood Moon', episodeNumber: 1, duration: 192, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e53', dramaId: 'd18', title: 'The Pack', episodeNumber: 2, duration: 184, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e54', dramaId: 'd18', title: 'Forbidden Territory', episodeNumber: 3, duration: 180, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e55', dramaId: 'd19', title: 'The Betrayal', episodeNumber: 1, duration: 197, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e56', dramaId: 'd19', title: 'Ashes to Ashes', episodeNumber: 2, duration: 185, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e57', dramaId: 'd19', title: 'The Plan', episodeNumber: 3, duration: 178, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e58', dramaId: 'd20', title: 'The Interview', episodeNumber: 1, duration: 187, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e59', dramaId: 'd20', title: 'Power Play', episodeNumber: 2, duration: 196, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e60', dramaId: 'd20', title: 'Office Tension', episodeNumber: 3, duration: 201, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e61', dramaId: 'd21', title: 'The Clue', episodeNumber: 1, duration: 201, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e62', dramaId: 'd21', title: 'Double Cross', episodeNumber: 2, duration: 185, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e63', dramaId: 'd21', title: 'Midnight Chase', episodeNumber: 3, duration: 196, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e64', dramaId: 'd22', title: 'The Betrayal', episodeNumber: 1, duration: 185, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e65', dramaId: 'd22', title: 'Ashes to Ashes', episodeNumber: 2, duration: 200, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e66', dramaId: 'd22', title: 'The Plan', episodeNumber: 3, duration: 182, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e67', dramaId: 'd23', title: 'First Encounter', episodeNumber: 1, duration: 186, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e68', dramaId: 'd23', title: 'Unexpected Feelings', episodeNumber: 2, duration: 202, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e69', dramaId: 'd23', title: 'The Confession', episodeNumber: 3, duration: 171, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e70', dramaId: 'd24', title: 'Blood Moon', episodeNumber: 1, duration: 207, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e71', dramaId: 'd24', title: 'The Pack', episodeNumber: 2, duration: 177, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e72', dramaId: 'd24', title: 'Forbidden Territory', episodeNumber: 3, duration: 194, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e73', dramaId: 'd25', title: 'The Interview', episodeNumber: 1, duration: 193, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e74', dramaId: 'd25', title: 'Power Play', episodeNumber: 2, duration: 209, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e75', dramaId: 'd25', title: 'Office Tension', episodeNumber: 3, duration: 208, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e76', dramaId: 'd26', title: 'The Prophecy', episodeNumber: 1, duration: 187, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e77', dramaId: 'd26', title: 'Hidden Powers', episodeNumber: 2, duration: 205, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e78', dramaId: 'd26', title: 'Dark Magic', episodeNumber: 3, duration: 189, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e79', dramaId: 'd27', title: 'The Clue', episodeNumber: 1, duration: 204, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e80', dramaId: 'd27', title: 'Double Cross', episodeNumber: 2, duration: 195, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e81', dramaId: 'd27', title: 'Midnight Chase', episodeNumber: 3, duration: 195, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e82', dramaId: 'd28', title: 'The Interview', episodeNumber: 1, duration: 201, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e83', dramaId: 'd28', title: 'Power Play', episodeNumber: 2, duration: 208, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e84', dramaId: 'd28', title: 'Office Tension', episodeNumber: 3, duration: 183, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e85', dramaId: 'd29', title: 'Blood Moon', episodeNumber: 1, duration: 197, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e86', dramaId: 'd29', title: 'The Pack', episodeNumber: 2, duration: 174, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e87', dramaId: 'd29', title: 'Forbidden Territory', episodeNumber: 3, duration: 197, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e88', dramaId: 'd30', title: 'The Betrayal', episodeNumber: 1, duration: 202, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e89', dramaId: 'd30', title: 'Ashes to Ashes', episodeNumber: 2, duration: 181, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e90', dramaId: 'd30', title: 'The Plan', episodeNumber: 3, duration: 177, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e91', dramaId: 'd31', title: 'The Prophecy', episodeNumber: 1, duration: 207, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e92', dramaId: 'd31', title: 'Hidden Powers', episodeNumber: 2, duration: 205, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e93', dramaId: 'd31', title: 'Dark Magic', episodeNumber: 3, duration: 177, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e94', dramaId: 'd32', title: 'The Interview', episodeNumber: 1, duration: 196, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e95', dramaId: 'd32', title: 'Power Play', episodeNumber: 2, duration: 182, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e96', dramaId: 'd32', title: 'Office Tension', episodeNumber: 3, duration: 205, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e97', dramaId: 'd33', title: 'The Prophecy', episodeNumber: 1, duration: 188, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e98', dramaId: 'd33', title: 'Hidden Powers', episodeNumber: 2, duration: 183, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e99', dramaId: 'd33', title: 'Dark Magic', episodeNumber: 3, duration: 172, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e100', dramaId: 'd34', title: 'The Betrayal', episodeNumber: 1, duration: 180, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e101', dramaId: 'd34', title: 'Ashes to Ashes', episodeNumber: 2, duration: 175, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e102', dramaId: 'd34', title: 'The Plan', episodeNumber: 3, duration: 188, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e103', dramaId: 'd35', title: 'Blood Moon', episodeNumber: 1, duration: 170, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e104', dramaId: 'd35', title: 'The Pack', episodeNumber: 2, duration: 204, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e105', dramaId: 'd35', title: 'Forbidden Territory', episodeNumber: 3, duration: 182, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e106', dramaId: 'd36', title: 'The Interview', episodeNumber: 1, duration: 199, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e107', dramaId: 'd36', title: 'Power Play', episodeNumber: 2, duration: 195, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e108', dramaId: 'd36', title: 'Office Tension', episodeNumber: 3, duration: 182, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e109', dramaId: 'd37', title: 'The Prophecy', episodeNumber: 1, duration: 207, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e110', dramaId: 'd37', title: 'Hidden Powers', episodeNumber: 2, duration: 174, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e111', dramaId: 'd37', title: 'Dark Magic', episodeNumber: 3, duration: 177, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e112', dramaId: 'd38', title: 'First Encounter', episodeNumber: 1, duration: 200, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e113', dramaId: 'd38', title: 'Unexpected Feelings', episodeNumber: 2, duration: 190, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e114', dramaId: 'd38', title: 'The Confession', episodeNumber: 3, duration: 192, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e115', dramaId: 'd39', title: 'Blood Moon', episodeNumber: 1, duration: 188, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e116', dramaId: 'd39', title: 'The Pack', episodeNumber: 2, duration: 204, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e117', dramaId: 'd39', title: 'Forbidden Territory', episodeNumber: 3, duration: 187, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e118', dramaId: 'd40', title: 'The Clue', episodeNumber: 1, duration: 203, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e119', dramaId: 'd40', title: 'Double Cross', episodeNumber: 2, duration: 188, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e120', dramaId: 'd40', title: 'Midnight Chase', episodeNumber: 3, duration: 170, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e121', dramaId: 'd41', title: 'The Prophecy', episodeNumber: 1, duration: 198, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e122', dramaId: 'd41', title: 'Hidden Powers', episodeNumber: 2, duration: 179, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e123', dramaId: 'd41', title: 'Dark Magic', episodeNumber: 3, duration: 207, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e124', dramaId: 'd42', title: 'The Interview', episodeNumber: 1, duration: 184, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e125', dramaId: 'd42', title: 'Power Play', episodeNumber: 2, duration: 197, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e126', dramaId: 'd42', title: 'Office Tension', episodeNumber: 3, duration: 191, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e127', dramaId: 'd43', title: 'Blood Moon', episodeNumber: 1, duration: 185, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e128', dramaId: 'd43', title: 'The Pack', episodeNumber: 2, duration: 181, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e129', dramaId: 'd43', title: 'Forbidden Territory', episodeNumber: 3, duration: 184, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e130', dramaId: 'd44', title: 'The Betrayal', episodeNumber: 1, duration: 192, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e131', dramaId: 'd44', title: 'Ashes to Ashes', episodeNumber: 2, duration: 195, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e132', dramaId: 'd44', title: 'The Plan', episodeNumber: 3, duration: 186, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e133', dramaId: 'd45', title: 'First Encounter', episodeNumber: 1, duration: 209, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e134', dramaId: 'd45', title: 'Unexpected Feelings', episodeNumber: 2, duration: 203, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e135', dramaId: 'd45', title: 'The Confession', episodeNumber: 3, duration: 182, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e136', dramaId: 'd46', title: 'Blood Moon', episodeNumber: 1, duration: 206, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e137', dramaId: 'd46', title: 'The Pack', episodeNumber: 2, duration: 172, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e138', dramaId: 'd46', title: 'Forbidden Territory', episodeNumber: 3, duration: 200, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e139', dramaId: 'd47', title: 'The Betrayal', episodeNumber: 1, duration: 182, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e140', dramaId: 'd47', title: 'Ashes to Ashes', episodeNumber: 2, duration: 182, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e141', dramaId: 'd47', title: 'The Plan', episodeNumber: 3, duration: 183, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e142', dramaId: 'd48', title: 'First Encounter', episodeNumber: 1, duration: 173, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e143', dramaId: 'd48', title: 'Unexpected Feelings', episodeNumber: 2, duration: 196, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e144', dramaId: 'd48', title: 'The Confession', episodeNumber: 3, duration: 172, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e145', dramaId: 'd49', title: 'Blood Moon', episodeNumber: 1, duration: 204, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e146', dramaId: 'd49', title: 'The Pack', episodeNumber: 2, duration: 184, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e147', dramaId: 'd49', title: 'Forbidden Territory', episodeNumber: 3, duration: 177, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e148', dramaId: 'd50', title: 'The Prophecy', episodeNumber: 1, duration: 189, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e149', dramaId: 'd50', title: 'Hidden Powers', episodeNumber: 2, duration: 182, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e150', dramaId: 'd50', title: 'Dark Magic', episodeNumber: 3, duration: 183, isFree: false, unlockPrice: 50, videoUrl: '' }
];

// Enrich episodes with streamVideoId, previewSeconds, and subtitles
const defaultSubtitles = [
  { language: 'en', label: 'English', src: '/subtitles/en.vtt', regions: ['US', 'GB', 'AU'] },
  { language: 'zh', label: '中文', src: '/subtitles/zh.vtt', regions: ['CN', 'SG', 'TW'] },
];

mockEpisodes.forEach(ep => {
  ep.streamVideoId = `cf-video-${ep.dramaId}-${ep.episodeNumber}`;
  if (!ep.isFree) {
    ep.previewSeconds = 30;
  }
  if (ep.episodeNumber <= 3) {
    ep.subtitles = defaultSubtitles;
  }
});

const mockComments = [
  { _id: 'cm1', userId: 'u1', userName: 'TinyTale Fan', dramaId: 'd1', content: 'This drama is absolutely addictive! Cannot stop watching!', status: 'approved', createdAt: '2026-01-15' },
  { _id: 'cm2', userId: 'u2', userName: 'Alice', dramaId: 'd1', content: 'The chemistry between the leads is incredible.', status: 'approved', createdAt: '2026-01-16' },
  { _id: 'cm3', userId: 'u3', userName: 'Bob', dramaId: 'd9', content: 'Dark Throne is the best fantasy drama this year!', status: 'approved', createdAt: '2026-01-17' },
  { _id: 'cm4', userId: 'u1', userName: 'TinyTale Fan', dramaId: 'd12', content: 'The revenge plot is so satisfying. 10/10', status: 'approved', createdAt: '2026-01-18' },
  { _id: 'cm5', userId: 'u2', userName: 'Alice', dramaId: 'd7', content: 'Wolf Moon Rising has the best werewolf storyline ever!', status: 'pending', createdAt: '2026-01-19' },
];

const mockReviews = [
  { _id: 'rv1', userId: 'u1', userName: 'TinyTale Fan', dramaId: 'd1', rating: 5, content: 'Absolutely loved every episode! The chemistry between the leads is unreal. Best CEO drama on the platform.', likes: 42, createdAt: '2026-01-15' },
  { _id: 'rv2', userId: 'u2', userName: 'Alice', dramaId: 'd1', rating: 4, content: 'Great storyline but the pacing slows down around episode 30. Still worth watching though!', likes: 18, createdAt: '2026-01-16' },
  { _id: 'rv3', userId: 'u3', userName: 'Bob', dramaId: 'd1', rating: 5, content: 'Cannot stop watching. The plot twists are incredible!', likes: 31, createdAt: '2026-01-17' },
  { _id: 'rv4', userId: 'u1', userName: 'TinyTale Fan', dramaId: 'd9', rating: 5, content: 'Dark Throne is a masterpiece. The world-building is phenomenal.', likes: 56, createdAt: '2026-01-18' },
  { _id: 'rv5', userId: 'u2', userName: 'Alice', dramaId: 'd9', rating: 4, content: 'Amazing fantasy drama! The magic system is so creative.', likes: 23, createdAt: '2026-01-19' },
  { _id: 'rv6', userId: 'u3', userName: 'Bob', dramaId: 'd7', rating: 5, content: 'Best werewolf drama ever! The forbidden love angle is perfect.', likes: 38, createdAt: '2026-01-20' },
  { _id: 'rv7', userId: 'u1', userName: 'TinyTale Fan', dramaId: 'd12', rating: 5, content: 'The revenge plot is so satisfying. Every episode keeps you on edge.', likes: 45, createdAt: '2026-01-21' },
  { _id: 'rv8', userId: 'u2', userName: 'Alice', dramaId: 'd2', rating: 4, content: 'Strong female lead! Love the historical setting.', likes: 29, createdAt: '2026-01-22' },
  { _id: 'rv9', userId: 'u3', userName: 'Bob', dramaId: 'd2', rating: 3, content: 'Good but a bit predictable. The acting saves it.', likes: 12, createdAt: '2026-01-23' },
  { _id: 'rv10', userId: 'u1', userName: 'TinyTale Fan', dramaId: 'd22', rating: 5, content: 'Rebirth of the Queen is the best drama on TinyTale. Period.', likes: 67, createdAt: '2026-01-24' },
];

const mockTransactions = [
  { _id: 'TRX-889230', type: 'purchase', itemName: '5000 Coins Pack', amountFiat: 49.99, amountCoins: 5000, status: 'completed', date: '2026-01-18T14:30:00Z', icon: 'coins' },
  { _id: 'UNL-1029', type: 'unlock', itemName: "The CEO's Secret", amountCoins: -150, episodes: '15-20', status: 'completed', date: '2026-01-17T20:15:00Z', cover: '/covers/drama1.jpg', icon: 'film' },
  { _id: 'TRX-889215', type: 'purchase', itemName: '1200 Coins Pack', amountFiat: 9.99, amountCoins: 1200, status: 'completed', date: '2026-01-16T10:00:00Z', icon: 'coins' },
  { _id: 'RWD-5501', type: 'reward', itemName: 'Daily Check-in Bonus', amountCoins: 20, status: 'completed', date: '2026-01-16T08:00:00Z', icon: 'gift' },
  { _id: 'UNL-1028', type: 'unlock', itemName: 'Love in Shanghai', amountCoins: -80, episodes: '8-10', status: 'completed', date: '2026-01-15T19:45:00Z', cover: '/covers/drama2.jpg', icon: 'film' },
  { _id: 'SUB-3301', type: 'subscription', itemName: 'VIP Annual Plan', amountFiat: 99.99, status: 'completed', date: '2026-01-14T12:00:00Z', icon: 'crown' },
  { _id: 'TRX-889200', type: 'purchase', itemName: '550 Coins Pack', amountFiat: 4.99, amountCoins: 550, status: 'pending', date: '2026-01-13T16:20:00Z', icon: 'coins' },
  { _id: 'UNL-1027', type: 'unlock', itemName: 'Midnight Romance', amountCoins: -120, episodes: '1-5', status: 'failed', date: '2026-01-12T22:10:00Z', cover: '/covers/drama3.jpg', icon: 'film' },
  { _id: 'RWD-5500', type: 'reward', itemName: 'New User Welcome Bonus', amountCoins: 100, status: 'completed', date: '2026-01-10T09:00:00Z', icon: 'gift' },
  { _id: 'TRX-889180', type: 'purchase', itemName: '100 Coins Pack', amountFiat: 0.99, amountCoins: 100, status: 'completed', date: '2026-01-08T11:30:00Z', icon: 'coins' },
];

// Track unlocked episodes per user (in-memory)
const unlockedEpisodes = {};

// ============ Auth Routes ============

app.post('/api/auth/google', (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ success: false, error: { message: 'Missing Google credential' } });
  }

  // Fetch Google user info using https module
  const options = {
    hostname: 'www.googleapis.com',
    path: '/oauth2/v3/userinfo',
    headers: { Authorization: `Bearer ${credential}` },
  };

  https.get(options, (gRes) => {
    let data = '';
    gRes.on('data', (chunk) => { data += chunk; });
    gRes.on('end', () => {
      try {
        const googleUser = JSON.parse(data);
        if (!googleUser.email) {
          return res.status(401).json({ success: false, error: { message: 'Invalid Google token' } });
        }

        const { email, name, picture, sub: googleId } = googleUser;

        // Check if user already exists
        let user = mockUsers.find(u => u.email === email);
        if (!user) {
          user = {
            _id: 'u' + Date.now(),
            email,
            password: '',
            nickname: name || email.split('@')[0],
            avatar: picture || '',
            role: 'user',
            status: 'active',
            coins: 100,
            googleId,
            createdAt: new Date().toISOString(),
          };
          mockUsers.push(user);
        }

        const token = 'mock-jwt-token-' + user._id;
        tokenMap[token] = user._id;
        const { password: _, ...safeUser } = user;
        res.json({ success: true, data: { token, user: safeUser } });
      } catch (err) {
        res.status(500).json({ success: false, error: { message: 'Failed to parse Google response' } });
      }
    });
  }).on('error', (err) => {
    res.status(500).json({ success: false, error: { message: 'Google authentication failed: ' + err.message } });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = mockUsers.find(u => u.email === email && u.password === password);
  if (user) {
    const token = 'mock-jwt-token-' + user._id;
    tokenMap[token] = user._id;
    const { password: _, ...safeUser } = user;
    res.json({ success: true, data: { token, user: safeUser } });
  } else {
    res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, nickname } = req.body;
  if (mockUsers.find(u => u.email === email)) {
    return res.status(400).json({ success: false, error: { message: 'Email already registered' } });
  }
  const newUser = { _id: 'u' + Date.now(), email, password, nickname, avatar: '', role: 'user', status: 'active', coins: 100, createdAt: new Date().toISOString() };
  mockUsers.push(newUser);
  const token = 'mock-jwt-token-' + newUser._id;
  tokenMap[token] = newUser._id;
  const { password: _, ...safeUser } = newUser;
  res.json({ success: true, data: { token, user: safeUser } });
});

app.get('/api/auth/me', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = tokenMap[token];
  const user = userId ? mockUsers.find(u => u._id === userId) : null;
  if (user) {
    const { password: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } else {
    res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
  }
});

// ============ Client Routes ============

app.get('/api/dramas', (req, res) => {
  res.json({ data: { dramas: mockDramas, total: mockDramas.length } });
});

app.get('/api/dramas/:id', (req, res) => {
  const drama = mockDramas.find(d => d._id === req.params.id);
  if (drama) {
    const episodes = mockEpisodes.filter(e => e.dramaId === drama._id);
    res.json({ data: { drama, episodes } });
  } else {
    res.status(404).json({ error: { message: 'Drama not found' } });
  }
});

app.get('/api/dramas/:id/related', (req, res) => {
  const drama = mockDramas.find(d => d._id === req.params.id);
  if (!drama) return res.status(404).json({ error: { message: 'Drama not found' } });
  const related = mockDramas.filter(d =>
    d._id !== drama._id && d.categories.some(c => drama.categories.includes(c))
  ).slice(0, 8);
  res.json({ data: related });
});

app.get('/api/dramas/:id/reviews', (req, res) => {
  const reviews = mockReviews.filter(r => r.dramaId === req.params.id);
  const total = reviews.length;
  const avgRating = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
  res.json({ data: { reviews, total, avgRating } });
});

app.post('/api/dramas/:id/reviews', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = tokenMap[token];
  const user = userId ? mockUsers.find(u => u._id === userId) : null;
  const review = {
    _id: 'rv' + Date.now(),
    userId: user?._id || 'anonymous',
    userName: user?.nickname || 'Anonymous',
    dramaId: req.params.id,
    rating: req.body.rating,
    content: req.body.content,
    likes: 0,
    createdAt: new Date().toISOString(),
  };
  mockReviews.push(review);
  res.json({ data: review });
});

app.get('/api/featured', (req, res) => {
  const featured = mockDramas.filter(d => d.isFeatured);
  const sorted = [...mockDramas].sort((a, b) => b.viewCount - a.viewCount);
  res.json({ data: { banners: featured.slice(0, 5), trending: sorted.slice(0, 20), newReleases: mockDramas.slice(-10).reverse() } });
});

app.get('/api/featured/rankings', (req, res) => {
  const sorted = [...mockDramas].sort((a, b) => b.viewCount - a.viewCount);
  res.json({ data: sorted });
});

app.get('/api/featured/trending', (req, res) => {
  const sorted = [...mockDramas].sort((a, b) => b.viewCount - a.viewCount);
  res.json({ data: sorted.slice(0, 20) });
});

app.get('/api/categories', (req, res) => {
  res.json({ data: mockCategories });
});

app.get('/api/comments', (req, res) => {
  const { dramaId } = req.query;
  const filtered = dramaId
    ? mockComments.filter(c => c.dramaId === dramaId)
    : mockComments;
  res.json({ data: { comments: filtered, total: filtered.length } });
});

app.post('/api/comments', (req, res) => {
  const comment = { _id: 'cm' + Date.now(), ...req.body, status: 'pending', createdAt: new Date().toISOString() };
  mockComments.push(comment);
  res.json({ data: comment });
});

app.get('/api/coins/balance', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = tokenMap[token];
  const user = userId ? mockUsers.find(u => u._id === userId) : null;
  res.json({ data: { balance: user ? user.coins : 0 } });
});

app.get('/api/coins/packages', (req, res) => {
  res.json({ data: [
    { _id: 'p1', coins: 100, price: 0.99, bonus: 0, tag: null, originalPrice: null },
    { _id: 'p2', coins: 550, price: 4.99, bonus: 50, tag: 'Popular', originalPrice: 5.99 },
    { _id: 'p3', coins: 1200, price: 9.99, bonus: 200, tag: null, originalPrice: 12.99 },
    { _id: 'p4', coins: 2500, price: 19.99, bonus: 500, tag: 'Best Value', originalPrice: 24.99 },
    { _id: 'p5', coins: 5500, price: 49.99, bonus: 1000, tag: null, originalPrice: 59.99 },
    { _id: 'p6', coins: 12000, price: 99.99, bonus: 3000, tag: null, originalPrice: 129.99 },
  ]});
});

app.post('/api/coins/create-order', (req, res) => {
  const { packageId, paymentMethod } = req.body;
  res.json({ data: { orderId: 'ord_' + Date.now(), clientSecret: 'cs_mock_' + Date.now(), status: 'completed', coinsAdded: 550, balance: 1350 } });
});

app.post('/api/coins/redeem', (req, res) => {
  const { code } = req.body;
  if (code === 'TINYTALE100') {
    res.json({ data: { success: true, coins: 100, message: 'Redeemed 100 coins!' } });
  } else {
    res.status(400).json({ error: { message: 'Invalid or expired code' } });
  }
});

app.post('/api/coins/recharge', (req, res) => {
  res.json({ data: { success: true, balance: 800 } });
});

app.post('/api/coins/unlock', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = tokenMap[token];
  if (!userId) return res.status(401).json({ error: { message: 'Unauthorized' } });

  const user = mockUsers.find(u => u._id === userId);
  if (!user) return res.status(404).json({ error: { message: 'User not found' } });

  const { episodeId } = req.body;
  if (!episodeId) return res.status(400).json({ error: { message: 'Missing episodeId' } });

  // Check if already unlocked
  if (!unlockedEpisodes[userId]) unlockedEpisodes[userId] = [];
  if (unlockedEpisodes[userId].includes(episodeId)) {
    return res.json({ success: true, data: { success: true, balance: user.coins, alreadyUnlocked: true } });
  }

  // Find episode and get price
  const episode = mockEpisodes.find(e => e._id === episodeId);
  const price = episode ? episode.unlockPrice : 50;

  // Check sufficient balance
  if (user.coins < price) {
    return res.status(400).json({ error: { message: 'Insufficient coins', required: price, current: user.coins } });
  }

  // Deduct coins and track unlock
  user.coins -= price;
  unlockedEpisodes[userId].push(episodeId);

  res.json({ success: true, data: { success: true, balance: user.coins, cost: price } });
});

app.get('/api/user/favorites', (req, res) => {
  res.json({ data: [mockDramas[0], mockDramas[6], mockDramas[8], mockDramas[11], mockDramas[21]] });
});

app.post('/api/user/favorites', (req, res) => {
  res.json({ data: { success: true } });
});

app.delete('/api/user/favorites/:id', (req, res) => {
  res.json({ data: { success: true } });
});

app.get('/api/user/history', (req, res) => {
  res.json({ data: [
    { ...mockDramas[0], lastEpisode: 4, watchedAt: '2026-01-18' },
    { ...mockDramas[8], lastEpisode: 2, watchedAt: '2026-01-17' },
    { ...mockDramas[21], lastEpisode: 5, watchedAt: '2026-01-16' },
    { ...mockDramas[14], lastEpisode: 1, watchedAt: '2026-01-15' },
    { ...mockDramas[6], lastEpisode: 3, watchedAt: '2026-01-14' },
  ] });
});

app.post('/api/user/history', (req, res) => {
  res.json({ data: { success: true } });
});

app.put('/api/user/profile', (req, res) => {
  res.json({ data: { success: true } });
});

app.put('/api/user/password', (req, res) => {
  res.json({ data: { success: true } });
});

app.get('/api/user/purchases', (req, res) => {
  res.json({ data: { purchases: mockTransactions, total: mockTransactions.length } });
});

app.get('/api/subscriptions/plans', (req, res) => {
  res.json({ data: [
    { _id: 'sp1', name: 'Monthly', price: 9.99, period: 'month', duration: 30, features: ['Unlimited access to all dramas', 'Ad-free experience', 'HD quality streaming'], recommended: false, savings: null, monthlyEquivalent: null },
    { _id: 'sp2', name: 'Annual', price: 99.99, period: 'year', duration: 365, features: ['Everything in Monthly', 'Early access to new releases', 'Download for offline', 'Exclusive VIP content', '500 bonus coins/month'], recommended: true, savings: 'Save 16%', monthlyEquivalent: '$8.33/month' },
  ]});
});

app.post('/api/subscriptions/subscribe', (req, res) => {
  const { planId, paymentMethod } = req.body;
  res.json({ data: { subscriptionId: 'sub_' + Date.now(), planId, status: 'active', startDate: new Date().toISOString(), endDate: new Date(Date.now() + 30 * 86400000).toISOString() } });
});

app.get('/api/subscriptions/status', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = tokenMap[token];
  const user = userId ? mockUsers.find(u => u._id === userId) : null;
  res.json({ data: { isActive: user?.vipStatus === 'active', plan: 'Annual', expiresAt: user?.vipExpireDate || null } });
});

app.post('/api/auth/reset-password', (req, res) => {
  res.json({ data: { success: true } });
});

app.post('/api/auth/verify-code', (req, res) => {
  res.json({ data: { valid: true } });
});

app.post('/api/auth/reset-password/confirm', (req, res) => {
  res.json({ data: { success: true } });
});

// ============ Account Settings Mock Data ============

const mockUserSettings = {
  preferences: {
    autoplay: true,
    videoQuality: "auto",
    audioLang: "en",
    subtitleLang: "en",
    dataSaver: false,
    cacheSize: "156 MB"
  },
  notifications: {
    push: { newReleases: true, recommendations: true, accountActivity: true },
    email: { newsletter: false, promoOffers: true, weeklyDigests: false },
    inApp: { systemMessages: true }
  }
};

const mockSecurityData = {
  passwordLastChanged: "2024-10-15",
  twoFactorEnabled: false,
  sessions: [
    { id: "sess_1", device: "Macbook Pro 16\"", location: "San Francisco, USA", browser: "Chrome", ip: "192.168.1.1", isCurrent: true, lastActive: "Active Now" },
    { id: "sess_2", device: "iPhone 14 Pro", location: "Los Angeles, USA", browser: "App", ip: "10.0.0.1", isCurrent: false, lastActive: "Active 2 hours ago" },
    { id: "sess_3", device: "iPad Air", location: "New York, USA", browser: "Safari", ip: "172.16.0.1", isCurrent: false, lastActive: "Active 3 days ago" }
  ],
  connections: { google: "jane.c***@example.com", facebook: null }
};

// ============ Account Settings Routes ============

app.get('/api/user/settings', (req, res) => {
  res.json({ success: true, data: mockUserSettings });
});

app.put('/api/user/settings', (req, res) => {
  const updates = req.body;
  Object.assign(mockUserSettings, updates);
  res.json({ success: true, data: mockUserSettings });
});

app.get('/api/user/security', (req, res) => {
  res.json({ success: true, data: mockSecurityData });
});

app.delete('/api/user/sessions/:id', (req, res) => {
  mockSecurityData.sessions = mockSecurityData.sessions.filter(s => s.id !== req.params.id);
  res.json({ success: true, data: { sessions: mockSecurityData.sessions } });
});

app.post('/api/user/sessions/logout-all', (req, res) => {
  mockSecurityData.sessions = mockSecurityData.sessions.filter(s => s.isCurrent);
  res.json({ success: true, data: { sessions: mockSecurityData.sessions } });
});

// ============ Admin Routes ============

app.get('/api/admin/stats', (req, res) => {
  res.json({ data: { totalUsers: mockUsers.length, totalDramas: mockDramas.length, totalRevenue: 285600, activeSubscriptions: 3420, todayNewUsers: 86, todayRevenue: 4280 } });
});

app.get('/api/admin/stats/charts', (req, res) => {
  res.json({ data: { revenue: [1200, 1800, 1500, 2200, 1900, 2800, 2400], users: { vip: 3420, free: 9160 }, topDramas: mockDramas } });
});

app.get('/api/admin/dramas', (req, res) => {
  res.json({ data: { dramas: mockDramas, total: mockDramas.length } });
});

app.get('/api/admin/dramas/:id', (req, res) => {
  const drama = mockDramas.find(d => d._id === req.params.id) || mockDramas[0];
  res.json({ data: drama });
});

app.post('/api/admin/dramas', (req, res) => {
  const drama = { _id: 'd' + Date.now(), ...req.body, createdAt: new Date().toISOString() };
  mockDramas.push(drama);
  res.json({ data: drama });
});

app.put('/api/admin/dramas/:id', (req, res) => {
  res.json({ data: { _id: req.params.id, ...req.body } });
});

app.delete('/api/admin/dramas/:id', (req, res) => {
  res.json({ data: { success: true } });
});

app.get('/api/admin/episodes', (req, res) => {
  const { dramaId } = req.query;
  const episodes = dramaId ? mockEpisodes.filter(e => e.dramaId === dramaId) : mockEpisodes;
  res.json({ data: { episodes } });
});

app.post('/api/admin/episodes', (req, res) => {
  const ep = { _id: 'e' + Date.now(), ...req.body };
  mockEpisodes.push(ep);
  res.json({ data: ep });
});

app.put('/api/admin/episodes/:id', (req, res) => {
  res.json({ data: { _id: req.params.id, ...req.body } });
});

app.delete('/api/admin/episodes/:id', (req, res) => {
  res.json({ data: { success: true } });
});

app.get('/api/admin/users', (req, res) => {
  res.json({ data: { users: mockUsers, total: mockUsers.length } });
});

app.get('/api/admin/users/:id', (req, res) => {
  const user = mockUsers.find(u => u._id === req.params.id) || mockUsers[0];
  res.json({ data: { user } });
});

app.put('/api/admin/users/:id', (req, res) => {
  res.json({ data: { _id: req.params.id, ...req.body } });
});

app.get('/api/admin/categories', (req, res) => {
  res.json({ data: mockCategories });
});

app.post('/api/admin/categories', (req, res) => {
  const cat = { _id: 'c' + Date.now(), ...req.body, dramaCount: 0 };
  mockCategories.push(cat);
  res.json({ data: cat });
});

app.put('/api/admin/categories/:id', (req, res) => {
  res.json({ data: { _id: req.params.id, ...req.body } });
});

app.delete('/api/admin/categories/:id', (req, res) => {
  res.json({ data: { success: true } });
});

app.get('/api/admin/featured', (req, res) => {
  res.json({ data: mockDramas.slice(0, 2) });
});

app.post('/api/admin/featured', (req, res) => {
  res.json({ data: { _id: 'f' + Date.now(), ...req.body } });
});

app.delete('/api/admin/featured/:id', (req, res) => {
  res.json({ data: { success: true } });
});

app.get('/api/admin/transactions', (req, res) => {
  res.json({ data: { transactions: mockTransactions, total: mockTransactions.length } });
});

app.get('/api/admin/comments', (req, res) => {
  res.json({ data: { comments: mockComments, total: mockComments.length } });
});

app.post('/api/admin/comments/:id/approve', (req, res) => {
  res.json({ data: { success: true } });
});

app.post('/api/admin/comments/:id/reject', (req, res) => {
  res.json({ data: { success: true } });
});

app.delete('/api/admin/comments/:id', (req, res) => {
  res.json({ data: { success: true } });
});

// ============ Contact / Help Center ============

app.post('/api/v1/contact/inquiry', (req, res) => {
  const { name, email, subject, message, type } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: { message: 'Name, email and message are required' } });
  }
  res.json({ success: true, data: { ticketId: 'TKT-' + Date.now(), status: 'received', message: 'Your inquiry has been submitted. We will get back to you within 24 hours.' } });
});

// ============ User Unlock Check & History Management ============

app.get('/api/user/unlocked/:episodeId', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = tokenMap[token];
  if (!userId) {
    return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
  }
  const episodeId = req.params.episodeId;
  const episode = mockEpisodes.find(e => e._id === episodeId);
  if (!episode) {
    return res.status(404).json({ success: false, error: { message: 'Episode not found' } });
  }
  // Free episodes are always unlocked
  if (episode.isFree) {
    return res.json({ data: { unlocked: true } });
  }
  const userUnlocked = unlockedEpisodes[userId] || [];
  const unlocked = userUnlocked.includes(episodeId);
  res.json({ data: { unlocked } });
});

app.delete('/api/user/history', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = tokenMap[token];
  if (!userId) {
    return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
  }
  res.json({ data: { message: 'History cleared' } });
});

app.delete('/api/user/history/:id', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = tokenMap[token];
  if (!userId) {
    return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
  }
  res.json({ data: { message: 'History entry deleted' } });
});

// ============ Video Stream & Playback Endpoints ============

// In-memory progress storage
const playbackProgress = {};

// GET /api/episodes/:id/stream — Returns stream playback info for an episode
app.get('/api/episodes/:id/stream', optionalAuth, (req, res) => {
  const episodeId = req.params.id;

  // Find the episode and its drama
  let episode = null;
  let drama = null;
  const ep = mockEpisodes.find(e => e._id === episodeId);
  if (ep) {
    episode = ep;
    drama = mockDramas.find(d => d._id === ep.dramaId);
  }

  if (!episode) return res.status(404).json({ error: 'Episode not found' });

  const subdomain = process.env.CF_STREAM_SUBDOMAIN || 'mock-subdomain';
  const videoUid = episode.streamVideoId || `mock-${episodeId}`;

  res.json({
    data: {
      videoUid,
      playbackUrl: subdomain
        ? `https://customer-${subdomain}.cloudflarestream.com/${videoUid}/manifest/video.m3u8`
        : '',
      signedToken: null, // Mock: no signing in dev mode
      thumbnailUrl: episode.thumbnail || drama?.cover || '',
      duration: episode.duration || 120,
      subtitles: episode.subtitles || [],
    }
  });
});

// GET /api/episodes/:id/access — Checks if user has access to an episode
app.get('/api/episodes/:id/access', optionalAuth, (req, res) => {
  const episodeId = req.params.id;
  const userId = req.user?.id;

  // Find episode
  const episode = mockEpisodes.find(e => e._id === episodeId);

  if (!episode) return res.status(404).json({ error: 'Episode not found' });

  // Free episodes are always accessible
  if (episode.isFree) {
    return res.json({ data: { hasAccess: true, reason: 'free' } });
  }

  // Check if user has unlocked this episode
  if (userId && unlockedEpisodes[userId]?.includes(episodeId)) {
    return res.json({ data: { hasAccess: true, reason: 'unlocked' } });
  }

  // Check if user is VIP
  if (userId) {
    const user = mockUsers.find(u => u._id === userId);
    if (user?.vipStatus === 'active' || user?.role === 'vip') {
      return res.json({ data: { hasAccess: true, reason: 'vip' } });
    }
  }

  res.json({
    data: {
      hasAccess: false,
      reason: 'payment_required',
      price: episode.unlockPrice || 30,
      previewSeconds: episode.previewSeconds || 30,
    }
  });
});

// POST /api/episodes/:id/progress — Records playback progress
app.post('/api/episodes/:id/progress', authenticateToken, (req, res) => {
  const episodeId = req.params.id;
  const userId = req.user.id;
  const { currentTime, duration, completed } = req.body;

  if (!playbackProgress[userId]) playbackProgress[userId] = {};
  playbackProgress[userId][episodeId] = {
    currentTime,
    duration,
    completed: completed || false,
    updatedAt: new Date().toISOString(),
  };

  res.json({ data: { success: true } });
});

// ============ Subtitle Management ============

// SRT to VTT conversion utility
function srtToVtt(srtContent) {
  let vtt = 'WEBVTT\n\n';
  vtt += srtContent
    .replace(/\r\n/g, '\n')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2'); // comma → dot in timestamps
  return vtt;
}

// POST /api/admin/episodes/:id/subtitles — Upload subtitle track
app.post('/api/admin/episodes/:id/subtitles', (req, res) => {
  const episodeId = req.params.id;
  const { language, label, regions } = req.body;

  // In production: parse SRT → convert to VTT → store file → return URL
  // Mock: return a fake VTT URL
  const subtitleTrack = {
    language: language || 'en',
    label: label || 'English',
    src: `/subtitles/${episodeId}/${language || 'en'}.vtt`,
    regions: regions ? (Array.isArray(regions) ? regions : [regions]) : ['US'],
  };

  const ep = mockEpisodes.find(e => e._id === episodeId);
  if (!ep) {
    return res.status(404).json({ error: 'Episode not found' });
  }

  if (!ep.subtitles) ep.subtitles = [];
  // Replace if same language exists
  ep.subtitles = ep.subtitles.filter(s => s.language !== subtitleTrack.language);
  ep.subtitles.push(subtitleTrack);

  res.json({ data: subtitleTrack });
});

// DELETE /api/admin/episodes/:id/subtitles/:lang — Remove subtitle track
app.delete('/api/admin/episodes/:id/subtitles/:lang', (req, res) => {
  const { id: episodeId, lang } = req.params;

  const ep = mockEpisodes.find(e => e._id === episodeId);
  if (!ep || !ep.subtitles) {
    return res.status(404).json({ error: 'Episode not found' });
  }

  ep.subtitles = ep.subtitles.filter(s => s.language !== lang);
  res.json({ data: { success: true } });
});

// ============ Admin Video Upload Endpoints ============

// POST /api/admin/upload/video — Get TUS upload URL for video upload
app.post('/api/admin/upload/video', (req, res) => {
  const { filename, filesize } = req.body || {};

  // In production: call Cloudflare Stream API to get TUS upload URL
  // Mock: return a fake upload URL and video UID
  const videoUid = `cf-video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  res.json({
    data: {
      upload_url: `https://upload.cloudflarestream.com/tus/${videoUid}`,
      video_uid: videoUid,
    }
  });
});

// PUT /api/admin/episodes/:id/video — Attach uploaded video to an episode
app.put('/api/admin/episodes/:id/video', (req, res) => {
  const episodeId = req.params.id;
  const { videoUid } = req.body || {};

  // Find and update episode's streamVideoId
  const ep = mockEpisodes.find(e => e._id === episodeId);
  if (ep) {
    ep.streamVideoId = videoUid;
    return res.json({ data: { success: true, streamVideoId: videoUid } });
  }

  res.status(404).json({ error: 'Episode not found' });
});

// ============ Start Server ============

app.listen(PORT, () => {
  console.log(`[Backend] Mock API server running on http://localhost:${PORT}`);
  console.log(`  Client API:  http://localhost:${PORT}/api/*`);
  console.log(`  Admin API:   http://localhost:${PORT}/api/admin/*`);
});
