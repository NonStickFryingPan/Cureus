import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read credentials from .env
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, '.env'), 'utf-8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const tmdbToken = env.VITE_TMDB_ACCESS_TOKEN;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Catalog of 60 movies (20 for each reviewer)
const CATALOG = [
  // --- RetroRick Pool (20 Movies) ---
  {
    tmdb_id: 862,
    reviewer: 'RetroRick',
    rating: 5,
    review: "WOAH! The first fully computer-generated 3D movie is finally here and it is cooler than playing Doom on a high-end Pentium processor! Buzz and Woody have more synergy than a brand-new SoundBlaster 16 card. Solid 5 stars!"
  },
  {
    tmdb_id: 679,
    reviewer: 'RetroRick',
    rating: 5,
    review: "This sequel has way more firepower than a dual-speed CD-ROM drive! Ripley is back and she has upgraded her hardware to a giant power loader mech suit. It's totally rad and faster than a 56k dial-up connection!"
  },
  {
    tmdb_id: 120,
    reviewer: 'RetroRick',
    rating: 5,
    review: "This fantasy epic is so massive it literally took 3 CD-ROMs to install! The shire looks brighter than a freshly degaussed CRT screen and the ringwraiths are scarier than a corrupted boot sector. 5 stars!"
  },
  {
    tmdb_id: 121,
    reviewer: 'RetroRick',
    rating: 5,
    review: "The battle of Helm's Deep is the ultimate co-op survival map! Legolas sliding down the stairs is cooler than any cheat code I've ever entered. Totally rad sequel, 5 out of 5!"
  },
  {
    tmdb_id: 122,
    reviewer: 'RetroRick',
    rating: 5,
    review: "The final boss battle is absolutely epic! I haven't seen this much processing power since the launch of the Pentium III. Easy 5 stars, it's the gold master edition!"
  },
  {
    tmdb_id: 597,
    reviewer: 'RetroRick',
    rating: 4,
    review: "A huge disaster movie that literally filled two VHS cassettes in the box set! The CGI water looks cleaner than a fresh AOL install. Solid 4 stars!"
  },
  {
    tmdb_id: 578,
    reviewer: 'RetroRick',
    rating: 5,
    review: "A giant mechanical shark that is scarier than getting a bad sector on your primary hard drive! The music theme is simpler than a MIDI file but way more terrifying. 5 out of 5!"
  },
  {
    tmdb_id: 585,
    reviewer: 'RetroRick',
    rating: 5,
    review: "Sulley and Mike are the ultimate system operators! The door vault scene is faster than a high-speed fiber optic connection. Totally rad 5 stars!"
  },
  {
    tmdb_id: 12,
    reviewer: 'RetroRick',
    rating: 5,
    review: "The animation of the ocean is cleaner than a brand new glass screen protector! Dory's short-term memory is almost as bad as my old 4MB RAM system. 5 stars!"
  },
  {
    tmdb_id: 361743,
    reviewer: 'RetroRick',
    rating: 5,
    review: "This sequel has more G-force than a high-ping multiplayer flight simulator! The practical jet stunts are totally rad and faster than a Pentium II processor! 5 out of 5!"
  },
  {
    tmdb_id: 562,
    reviewer: 'RetroRick',
    rating: 5,
    review: "John McClane is the ultimate network administrator, single-handedly clearing out a hostile system takeover! The action is faster than a 10BaseT ethernet cable. 5 stars!"
  },
  {
    tmdb_id: 19995,
    reviewer: 'RetroRick',
    rating: 4,
    review: "The 3D graphics on Pandora look cooler than a high-end graphics card demo! The jungle has more neon than my customized PC case. Solid 4 stars!"
  },
  {
    tmdb_id: 1892,
    reviewer: 'RetroRick',
    rating: 5,
    review: "The final chapter is absolute peak sci-fi! The speeder bike chase is faster than a dual-channel ISDN connection. 5 out of 5!"
  },
  {
    tmdb_id: 24,
    reviewer: 'RetroRick',
    rating: 5,
    review: "The Bride handles her katana like an absolute pro gamer executing a flawless combo! The soundtrack is cooler than my Winamp MP3 playlist. 5 stars!"
  },
  {
    tmdb_id: 197,
    reviewer: 'RetroRick',
    rating: 4,
    review: "Mel Gibson fights for freedom with more processing power than a high-end mainframe! The battle scenes are massive and totally rad. 4 out of 5!"
  },
  {
    tmdb_id: 49026,
    reviewer: 'RetroRick',
    rating: 4,
    review: "Bane's dialogue is slightly glitchy like a low-bitrate RealPlayer stream, but his physical presence is totally awesome! 4 stars!"
  },
  {
    tmdb_id: 68718,
    reviewer: 'RetroRick',
    rating: 5,
    review: "A wild western shooter that plays like a classic arcade cabinet on maximum difficulty! The action is incredibly fast and satisfying. 5 stars!"
  },
  {
    tmdb_id: 569094,
    reviewer: 'RetroRick',
    rating: 5,
    review: "The art style in this sequel has more layers than a high-end Photoshop file! Every frame is a total visual feast. 5 out of 5!"
  },
  {
    tmdb_id: 76341,
    reviewer: 'RetroRick',
    rating: 5,
    review: "WOAH! Mad Max is a total high-speed adrenaline overload! The practical explosions are faster than a brand-new Voodoo 2 graphics accelerator card. 5 stars!"
  },
  {
    tmdb_id: 438631,
    reviewer: 'RetroRick',
    rating: 5,
    review: "This sand planet epic is so massive it literally needs a high-density ZIP disk to save! The soundtrack rocks my soundcard subwoofers. Totally rad 5 stars!"
  },

  // --- SarcasticSally Pool (20 Movies) ---
  {
    tmdb_id: 497,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "A three-hour long exercise in emotional manipulation that somehow manages to be technically excellent. Tom Hanks is charming as usual, and the supernatural elements are just plausible enough to prevent me from walking out. A solid achievement, if you enjoy crying into your popcorn."
  },
  {
    tmdb_id: 857,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "The opening twenty minutes are a masterpiece of terrifying realism, followed by two hours of men wandering around France looking for one guy because of a public relations stunt. It's a very well-made film, even if it aggressively begs you to feel patriotic."
  },
  {
    tmdb_id: 101,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "A movie about a highly professional hitman who is somehow outsmarted by a twelve-year-old girl. Jean Reno is delightfully deadpan, and Gary Oldman is aggressively overacting like his life depends on it. A classic, if you don't think too hard about the premise."
  },
  {
    tmdb_id: 637,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "A brilliant thriller that relies entirely on the premise that the police will happily believe a detailed, two-hour story told by a guy named 'Verbal.' The twist is iconic, even if it makes the entire movie technically a lie. 4 stars."
  },
  {
    tmdb_id: 98,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "A highly entertaining epic about a general who becomes a slave, who becomes a gladiator, who defies an empire, just to have a dramatic family reunion. Joaquin Phoenix is delightfully pathetic as the villain. A masterpiece, provided you ignore basic historical facts."
  },
  {
    tmdb_id: 1422,
    reviewer: 'SarcasticSally',
    rating: 5,
    review: "Scorsese's tale of Boston gangsters and cops where literally everyone is a double agent and no one can have a normal conversation without shouting. It's a masterfully edited, highly stressful puzzle of betrayal. 5 stars, though it features a literal rat at the end just in case you didn't get the metaphor."
  },
  {
    tmdb_id: 423,
    reviewer: 'SarcasticSally',
    rating: 5,
    review: "A deeply somber, heartbreaking film about survival that features almost no dialogue and a lot of hiding in ruins. It is a masterpiece of historical cinema, even if it is the absolute opposite of a light, fun evening. 5 stars."
  },
  {
    tmdb_id: 73,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "A raw, intense drama that tackles hatred with all the subtlety of a sledgehammer. Edward Norton is terrifyingly excellent. A highly powerful film, even if the ultimate message is delivered with aggressive sentimentality."
  },
  {
    tmdb_id: 694,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "A movie about a writer who goes insane in a hotel, which is honestly the most relatable premise I've ever heard. Kubrick's direction is masterfully creepy, and Jack Nicholson is aggressively unhinged. A classic, though it's basically a two-hour advertisement against taking winter hotel jobs."
  },
  {
    tmdb_id: 213,
    reviewer: 'SarcasticSally',
    rating: 5,
    review: "A classic thriller that proves you should never, under any circumstances, stop at a motel run by a polite young man who is overly attached to his mother. Hitchcock's direction is brilliant. 5 stars."
  },
  {
    tmdb_id: 949,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "A three-hour heist film where Pacino and De Niro finally share a table to have a quiet chat about their feelings before shooting up downtown Los Angeles. It's a masterfully shot thriller. 4 stars."
  },
  {
    tmdb_id: 14627,
    reviewer: 'SarcasticSally',
    rating: 5,
    review: "A tense thriller about a guy who finds a bag of money and a hitman with the worst haircut in human history who decides his fate using a coin toss. It's a brilliant, bleak masterpiece. 5 stars."
  },
  {
    tmdb_id: 640,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "A charming film about a teenager who successfully cons the entire American banking system simply by being polite and wearing a pilot's uniform. Tom Hanks is delightfully exasperated. 4 stars."
  },
  {
    tmdb_id: 10193,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "A kids' movie about toys being held hostage in a daycare that ends with them accepting their own fiery death in a giant incinerator. You know, fun for the whole family! A masterfully manipulative tearjerker."
  },
  {
    tmdb_id: 150540,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "A movie that successfully commercializes the abstract concepts of human emotion, turning them into cute cartoon characters. It's a clever, visually brilliant film that manages to make you feel bad for a fictional pink elephant. 4 stars."
  },
  {
    tmdb_id: 2062,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "A heartwarming tale about a rat that controls a human chef by pulling his hair, which is honestly a major health code violation. The food looks delicious, and the critic character is painfully relatable. 4 stars."
  },
  {
    tmdb_id: 489,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "A movie about a math genius who works as a janitor and prefers fighting in bars to going to MIT. Robin Williams is excellent as the therapist. A lovely drama, even if the Boston accents are laid on with a trowel."
  },
  {
    tmdb_id: 111,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "A three-hour epic about a man who builds a cocaine empire and dies in a massive mansion shootout because he simply refused to listen to basic business advice. Pacino's performance is delightfully over-the-top. 4 stars."
  },
  {
    tmdb_id: 210577,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "A romantic thriller that serves as a highly effective advertisement against ever getting married. Rosamund Pike is terrifyingly brilliant. It's a masterfully dark, twisted ride. 4 stars."
  },
  {
    tmdb_id: 16869,
    reviewer: 'SarcasticSally',
    rating: 4,
    review: "Tarantino's rewrite of WWII where soldiers collect scalps and a cinema host executes a massive trap. It's highly theatrical, blood-drenched, and Waltz is far too charming. 4 stars."
  },

  // --- PoeticPenny Pool (20 Movies) ---
  {
    tmdb_id: 11216,
    reviewer: 'PoeticPenny',
    rating: 5,
    review: "A warm, nostalgia-drenched love letter to the flickering magic of the silver screen and the bittersweet ache of growing up. The final montage of kisses is a breathless, weeping tribute to lost time and enduring memory. Sublime."
  },
  {
    tmdb_id: 14160,
    reviewer: 'PoeticPenny',
    rating: 5,
    review: "The opening silent sequence is an exquisitely painful, beautiful poem on love, loss, and the quiet passage of time. The floating house of balloons is a gorgeous metaphor for letting go of our grief and soaring into the unknown. 5 stars."
  },
  {
    tmdb_id: 354912,
    reviewer: 'PoeticPenny',
    rating: 5,
    review: "A vibrant, gold-lit journey into the land of the ancestors, where the only true death is to be forgotten. The final rendition of 'Remember Me' is a tear-stained, luminous bridge between the living and the dead. Exquisite."
  },
  {
    tmdb_id: 329865,
    reviewer: 'PoeticPenny',
    rating: 5,
    review: "A quiet, deeply philosophical meditation on time, grief, and the circular nature of human existence. The alien language is a gorgeous, ink-spun poem, proving that choosing to love despite knowing the painful end is the ultimate act of grace."
  },
  {
    tmdb_id: 693134,
    reviewer: 'PoeticPenny',
    rating: 5,
    review: "A grand, operatic continuation where the golden sands are stained with the heavy weight of messianic tragedy. The black-and-white arena sequence is a chilling, masterfully composed study of power and shadow."
  },
  {
    tmdb_id: 11324,
    reviewer: 'PoeticPenny',
    rating: 4,
    review: "A stormy, atmospheric descent into the labyrinth of grief and madness, where the lighthouse stands as a bleak monument to the truth. The shadows of memory are too heavy to escape, culminating in a devastating choice. 4 stars."
  },
  {
    tmdb_id: 106646,
    reviewer: 'PoeticPenny',
    rating: 4,
    review: "A dizzying, chaotic carousel of greed and excess, showing the hollow, glittering cage of material indulgence. It operates at a breathless tempo, illustrating the tragic emptiness beneath the laughter. 4 stars."
  },
  {
    tmdb_id: 146233,
    reviewer: 'PoeticPenny',
    rating: 4,
    review: "A dark, rain-soaked descent into the agonizing depths of parental desperation and moral decay, where the search for light leads only into deeper shadow. A heavy, gripping study of faith and vengeance. 4 stars."
  },
  {
    tmdb_id: 152601,
    reviewer: 'PoeticPenny',
    rating: 5,
    review: "A soft, pastel-hued dream of isolation and intimacy in a near future, where the soul seeks connection in the digital ether. It is a tender, deeply moving poem on what it truly means to feel and to be alive."
  },
  {
    tmdb_id: 10681,
    reviewer: 'PoeticPenny',
    rating: 5,
    review: "In the silent, rusted ruins of a forgotten world, a lonely metal heart gathers the green fragments of hope. His journey across the stars is a tender, luminous dance of love and survival. Absolutely sublime."
  },
  {
    tmdb_id: 14,
    reviewer: 'PoeticPenny',
    rating: 4,
    review: "A delicate, hauntingly beautiful study of suburban quietude and the invisible traps of modern domesticity. The floating rose petals and the soft score weave a dreamlike reflection of our desperate need to feel alive. 4 stars."
  },
  {
    tmdb_id: 103,
    reviewer: 'PoeticPenny',
    rating: 5,
    review: "A bleak, neon-drenched exploration of loneliness and existential despair in a city that never sleeps. The steam rising from the grates and the hazy yellow lights compose a hauntingly beautiful poem on isolation. 5 stars."
  },
  {
    tmdb_id: 524,
    reviewer: 'PoeticPenny',
    rating: 4,
    review: "A grand, neon-bathed tragedy of ambition and betrayal in the desert sands of Las Vegas, where empires are built on dust. The glittering lights illuminate the slow, inevitable crumbling of trust. 4 stars."
  },
  {
    tmdb_id: 433,
    reviewer: 'PoeticPenny',
    rating: 5,
    review: "A devastating, operatic descent into the shattering depths of addiction, where the seasons change from summer hope to winter despair. The closing montage is a weeping, visceral poem on human fragility. 5 stars."
  },
  {
    tmdb_id: 44214,
    reviewer: 'PoeticPenny',
    rating: 5,
    review: "A dark, breathtakingly beautiful exploration of artistic obsession and the splitting of the self under pressure. The play of white and black feathers acts as a visceral metaphor for our desperate search for perfection. 5 stars."
  },
  {
    tmdb_id: 934,
    reviewer: 'PoeticPenny',
    rating: 4,
    review: "A fast, rhythmic mosaic of underground London life, filled with rough diamonds and desperate characters. The editing creates a kinetic, stylized ballet out of chaos. 4 stars."
  },
  {
    tmdb_id: 100,
    reviewer: 'PoeticPenny',
    rating: 4,
    review: "A gritty, sepia-toned comic caper of misadventure and high-stakes poker, pulsing with kinetic energy. The rough, stylized visual palette forms a beautifully chaotic portrait of luck and grit."
  },
  {
    tmdb_id: 627,
    reviewer: 'PoeticPenny',
    rating: 5,
    review: "A vibrant, drug-hued exploration of youth and escape in Edinburgh, blending bleak realities with surreal flight. The energy is breathless, sketching a vivid, tragic, yet vital poem on choice and survival."
  },
  {
    tmdb_id: 545611,
    reviewer: 'PoeticPenny',
    rating: 5,
    review: "A breathless, kaleidoscopic ballet of infinite possibilities, where googly eyes on rocks and hot-dog fingers become portals of profound empathy. In the whirling storm of the multiverse, choosing kindness is the ultimate grace."
  },
  {
    tmdb_id: 585,
    reviewer: 'PoeticPenny',
    rating: 4,
    review: "A soft, luminous fairy tale about the doors that connect us and the monsters that guard our childhood dreams. The warm blue fur and the gentle laughs capture a sweet, glowing nostalgia. 4 stars."
  }
];

async function run() {
  console.log('=== Starting Automated Review Generator ===');
  
  // 1. Fetch all existing reviews to build a fast-lookup Set of reviewed movie IDs
  console.log('Fetching currently reviewed movies from Supabase...');
  const { data: dbData, error: dbError } = await supabase
    .from('reviews')
    .select('tmdb_id');

  if (dbError) {
    console.error('Failed to query database reviews:', dbError.message);
    process.exit(1);
  }

  // Fast $O(1)$ membership check Set
  const reviewedIds = new Set(dbData.map(r => r.tmdb_id));
  console.log(`Found ${reviewedIds.size} unique movies already reviewed in the database.`);

  // 2. Filter the catalog to keep only the movies NOT yet reviewed
  const unreviewed = CATALOG.filter(m => !reviewedIds.has(m.tmdb_id));
  console.log(`Unreviewed movies remaining in catalog: ${unreviewed.length}`);

  if (unreviewed.length === 0) {
    console.log('All catalog movies have already been reviewed! No more reviews to generate.');
    process.exit(0);
  }

  // 3. Partition by persona to ensure equal representation if possible
  const rickPool = unreviewed.filter(m => m.reviewer === 'RetroRick');
  const sallyPool = unreviewed.filter(m => m.reviewer === 'SarcasticSally');
  const pennyPool = unreviewed.filter(m => m.reviewer === 'PoeticPenny');

  console.log(`Pool breakdown: RetroRick (${rickPool.length}), SarcasticSally (${sallyPool.length}), PoeticPenny (${pennyPool.length})`);

  // Target: 30 reviews (10 from each reviewer)
  const targetPerPersona = 10;
  const selected = [];

  // Pick up to 10 from each pool
  selected.push(...rickPool.slice(0, targetPerPersona));
  selected.push(...sallyPool.slice(0, targetPerPersona));
  selected.push(...pennyPool.slice(0, targetPerPersona));

  // If we don't have exactly 30 due to unbalance, fill it up from any remaining unreviewed movies
  const selectedIds = new Set(selected.map(m => m.tmdb_id));
  if (selected.length < 30 && selected.length < unreviewed.length) {
    for (const m of unreviewed) {
      if (!selectedIds.has(m.tmdb_id)) {
        selected.push(m);
        selectedIds.add(m.tmdb_id);
        if (selected.length === 30) break;
      }
    }
  }

  const reviewCount = Math.min(30, selected.length);
  const finalSelection = selected.slice(0, reviewCount);
  console.log(`Selected ${finalSelection.length} new reviews to post.`);

  if (finalSelection.length === 0) {
    console.log('No eligible reviews selected.');
    process.exit(0);
  }

  // 4. Authenticate as Administrator
  console.log('Authenticating session...');
  const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
    email: env.VITE_ADMIN_EMAIL,
    password: env.VITE_ADMIN_PASSWORD
  });

  if (authError || !session) {
    console.error('Authentication failed:', authError ? authError.message : 'No session');
    process.exit(1);
  }
  console.log('✅ Session authenticated successfully.');

  // 5. Query TMDB and Insert Reviews
  let success = 0;
  let fail = 0;

  for (let i = 0; i < finalSelection.length; i++) {
    const item = finalSelection[i];
    console.log(`\n[${i + 1}/${finalSelection.length}] Fetching TMDB details for ID: ${item.tmdb_id}...`);

    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${item.tmdb_id}?language=en-US`,
        { headers: { Authorization: `Bearer ${tmdbToken}` } }
      );

      if (!res.ok) {
        throw new Error(`TMDB responded with status ${res.status}`);
      }

      const movieData = await res.json();
      const title = movieData.title;
      const year = movieData.release_date ? parseInt(movieData.release_date.slice(0, 4), 10) : null;
      const poster = movieData.poster_path;
      const genres = (movieData.genres || []).map(g => g.name);

      const record = {
        tmdb_id: item.tmdb_id,
        type: 'movie',
        title,
        year,
        poster,
        genres,
        rating: item.rating,
        reviewer: item.reviewer,
        review: item.review,
        season: null,
        episode: null
      };

      const { data, error } = await supabase
        .from('reviews')
        .insert([record])
        .select();

      if (error) {
        console.error(`  ✗ Failed to save "${title}": ${error.message}`);
        fail++;
      } else {
        console.log(`  ✓ Successfully posted "${title}" by "${item.reviewer}" (ID: ${data[0].id})`);
        success++;
      }

    } catch (err) {
      console.error(`  ✗ Error processing TMDB ID ${item.tmdb_id}:`, err.message);
      fail++;
    }
  }

  console.log(`\n=== Automated Task Finished ===`);
  console.log(`Total successfully added: ${success}`);
  console.log(`Total failed: ${fail}`);

  await supabase.auth.signOut();
  process.exit(fail > 0 ? 1 : 0);
}

run();
