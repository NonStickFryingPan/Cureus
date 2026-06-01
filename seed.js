import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load .env
const envText = fs.readFileSync('.env', 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars in .env file!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_EMAIL = 'admin@cureus.local';
// Read password from CLI argument, default to 'supersecretadmin123'
const ADMIN_PASSWORD = process.argv[2] || 'supersecretadmin123';

const SAMPLE_REVIEWS = [
  {
    tmdb_id: 27205,
    type: 'movie',
    title: 'Inception',
    year: 2010,
    poster: '/oYu23NLa00N7Hd9DVtd2R2G6N6C.jpg',
    genres: ['Action', 'Science Fiction', 'Adventure'],
    review: 'A masterclass in high-concept filmmaking. Christopher Nolan bends the rules of reality to deliver an emotionally resonant heist movie where the safe is the human mind. Hans Zimmer\'s earth-shaking score perfectly amplifies the sheer scale and tension of this modern classic.',
    reviewer: 'CinematicScribe',
    rating: 5
  },
  {
    tmdb_id: 1396,
    type: 'tv',
    title: 'Breaking Bad',
    year: 2008,
    poster: '/ztkK6k9ht9a3zxqbLO4oFWuhhNM.jpg',
    genres: ['Drama'],
    review: 'Television at its absolute zenith. Vince Gilligan\'s exploration of Walter White\'s descent into darkness is a masterfully paced character study that never compromises its moral weight. Every performance, especially Cranston and Paul, is legendary.',
    reviewer: 'ShowRunner',
    rating: 5
  },
  {
    tmdb_id: 157336,
    type: 'movie',
    title: 'Interstellar',
    year: 2014,
    poster: '/gEU2QvHOm56Yv741jPM9vGmcP6Y.jpg',
    genres: ['Adventure', 'Drama', 'Science Fiction'],
    review: 'A breathtaking odyssey that balances cosmic ambition with intimate father-daughter emotional truth. Nolan\'s vision of humanity\'s future is visually spectacular and profoundly moving, powered by Zimmer\'s pipe organ score.',
    reviewer: 'Stargazer',
    rating: 5
  },
  {
    tmdb_id: 603,
    type: 'movie',
    title: 'The Matrix',
    year: 1999,
    poster: '/f89U3wz6oo2eCWPG0bbm07Bbg7z.jpg',
    genres: ['Action', 'Science Fiction'],
    review: 'A genre-defining masterpiece that shattered boundaries in both CGI and action choreography. The Wachowskis blended cyberpunk philosophy with bullet-time style to create a cultural milestone that remains as relevant today as it was in 1999.',
    reviewer: 'Neo',
    rating: 5
  },
  {
    tmdb_id: 680,
    type: 'movie',
    title: 'Pulp Fiction',
    year: 1994,
    poster: '/d5i25Cc136t8o206y9t6RURzUpa.jpg',
    genres: ['Thriller', 'Crime'],
    review: 'Quentin Tarantino\'s magnum opus. A brilliant, non-linear anthology of crime, redemption, and pop-culture-infused dialogue that revitalized independent cinema. Exhilarating, hilarious, and unforgettable from start to finish.',
    reviewer: 'TarantinoStan',
    rating: 5
  }
];

async function runSeed() {
  console.log('Connecting to:', supabaseUrl);
  console.log('Checking database status...');
  
  const { data: existingReviews, error: fetchErr } = await supabase
    .from('reviews')
    .select('id')
    .limit(1);

  if (fetchErr) {
    console.error('Error querying reviews table:', fetchErr);
    process.exit(1);
  }

  if (existingReviews && existingReviews.length > 0) {
    console.log('Database already has reviews. Skipping seed to prevent duplicate entries.');
    process.exit(0);
  }

  console.log(`Attempting to sign in as ${ADMIN_EMAIL}...`);

  const authResult = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  if (authResult.error) {
    console.error('\n❌ Login Failed:', authResult.error.message);
    console.log('\nIf you set a custom password for admin@cureus.local, please run the script with your password as an argument:');
    console.log('👉 node seed.js <your_password>\n');
    process.exit(1);
  }

  console.log('✅ Authenticated successfully!');
  console.log('Inserting sample reviews...');
  
  const { data, error: insertErr } = await supabase
    .from('reviews')
    .insert(SAMPLE_REVIEWS)
    .select();

  if (insertErr) {
    console.error('❌ Error inserting reviews:', insertErr.message);
    process.exit(1);
  }

  console.log(`🎉 Successfully seeded ${data.length} sample reviews!`);
}

runSeed();
