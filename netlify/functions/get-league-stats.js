import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = process.env;

// --- Helper Functions for Calculating Stats ---

const countBy = (arr, key) => arr.reduce((acc, item) => {
  acc[item[key]] = (acc[item[key]] || 0) + 1;
  return acc;
}, {});

const findTopPlayer = (counts, profiles) => {
  const topPlayerId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  if (!topPlayerId) return null;

  const playerProfile = profiles.find(p => p.id === topPlayerId);
  return {
    username: playerProfile?.username,
    value: counts[topPlayerId],
  };
};

const calculateOracle = (picks, profiles) => {
  const correctPicks = picks.filter(p => p.is_correct);
  const userCorrectCounts = countBy(correctPicks, 'user_id');
  return findTopPlayer(userCorrectCounts, profiles);
};

const calculatePoopstar = (weeklyResults, profiles) => {
  const poopstars = weeklyResults.filter(r => r.is_poopstar);
  const userPoopstarCounts = countBy(poopstars, 'user_id');
  return findTopPlayer(userPoopstarCounts, profiles);
};

const calculateHomer = (picks, profiles) => {
  const homerPicks = picks.filter(pick => {
    const profile = profiles.find(p => p.id === pick.user_id);
    return profile && profile.favorite_team === pick.selected_team;
  });
  const userHomerCounts = countBy(homerPicks, 'user_id');
  return findTopPlayer(userHomerCounts, profiles);
};

const calculateConsistent = (picks, profiles) => {
    const picksByUser = picks.reduce((acc, pick) => {
        if (!acc[pick.user_id]) {
            acc[pick.user_id] = { correct: 0, total: 0 };
        }
        acc[pick.user_id].total++;
        if (pick.is_correct) {
            acc[pick.user_id].correct++;
        }
        return acc;
    }, {});

    let topPlayer = { userId: null, percentage: -1 };

    for (const userId in picksByUser) {
        const userStats = picksByUser[userId];
        if (userStats.total > 5) { // Minimum 5 picks to qualify
            const percentage = (userStats.correct / userStats.total) * 100;
            if (percentage > topPlayer.percentage) {
                topPlayer = { userId, percentage };
            }
        }
    }

    if (!topPlayer.userId) return null;

    const playerProfile = profiles.find(p => p.id === topPlayer.userId);
    return {
        username: playerProfile?.username,
        value: topPlayer.percentage,
    };
};


// --- Main Handler ---

export const handler = async (event) => {
  const { season } = event.queryStringParameters;
  if (!season) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Season is required.' }) };
  }

  const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

  try {
    const [picksRes, weeklyResultsRes, profilesRes] = await Promise.all([
      supabase.from('picks').select('*').eq('season', season),
      supabase.from('weekly_results').select('*').eq('season', season),
      supabase.from('profiles').select('id, username, favorite_team'),
    ]);

    if (picksRes.error) throw picksRes.error;
    if (weeklyResultsRes.error) throw weeklyResultsRes.error;
    if (profilesRes.error) throw profilesRes.error;

    const stats = {
      oracle: calculateOracle(picksRes.data, profilesRes.data),
      pooper_star: calculatePoopstar(weeklyResultsRes.data, profilesRes.data),
      homer: calculateHomer(picksRes.data, profilesRes.data),
      consistent: calculateConsistent(picksRes.data, profilesRes.data),
    };

    return {
      statusCode: 200,
      body: JSON.stringify(stats),
    };
  } catch (error) {
    console.error('Error in get-league-stats:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message || 'Internal Server Error' }),
    };
  }
};