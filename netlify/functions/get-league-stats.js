import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// --- Helper Functions (some are new) ---

const countBy = (arr, key) => arr.reduce((acc, item) => {
  acc[item[key]] = (acc[item[key]] || 0) + 1;
  return acc;
}, {});

const findTopPlayer = (counts, profiles) => {
  if (!counts || Object.keys(counts).length === 0) return null;
  const topPlayerId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  const playerProfile = profiles.find(p => p.id === topPlayerId);
  return { username: playerProfile?.username, value: counts[topPlayerId] };
};

// ... (calculateOracle, Poopstar, Perfectionist, Homer, Consistent helpers remain the same) ...

const calculateRivalryKing = (picks, games, profiles) => {
    const rivalryGameIds = new Set(games.filter(g => g.is_rivalry_game).map(g => g.id));
    const correctRivalryPicks = picks.filter(p => p.is_correct && rivalryGameIds.has(p.game_id));
    const userRivalryWinCounts = countBy(correctRivalryPicks, 'user_id');
    return findTopPlayer(userRivalryWinCounts, profiles);
};

const calculatePriceIsRight = (picks, games, profiles) => {
    const gamesMap = new Map(games.map(g => [g.id, g]));
    const scoreDiffs = {};
    picks.forEach(p => {
        const game = gamesMap.get(p.game_id);
        if (p.predicted_home_score != null && p.predicted_away_score != null && game?.home_team_score != null) {
            const diff = Math.abs(p.predicted_home_score - game.home_team_score) + Math.abs(p.predicted_away_score - game.away_team_score);
            if (!scoreDiffs[p.user_id]) scoreDiffs[p.user_id] = { totalDiff: 0, count: 0 };
            scoreDiffs[p.user_id].totalDiff += diff;
            scoreDiffs[p.user_id].count++;
        }
    });
    
    let bestPlayer = null;
    let lowestAvgDiff = Infinity;
    for (const userId in scoreDiffs) {
        if (scoreDiffs[userId].count > 0) {
            const avgDiff = scoreDiffs[userId].totalDiff / scoreDiffs[userId].count;
            if (avgDiff < lowestAvgDiff) {
                lowestAvgDiff = avgDiff;
                bestPlayer = userId;
            }
        }
    }
    if (!bestPlayer) return null;
    const playerProfile = profiles.find(p => p.id === bestPlayer);
    return { username: playerProfile?.username, value: lowestAvgDiff.toFixed(2) };
};

const calculateBiggestBlowout = (picks, games, profiles) => {
    let biggestBlowout = { margin: -1, userId: null };
    const gamesMap = new Map(games.map(g => [g.id, g]));

    picks.forEach(p => {
        const game = gamesMap.get(p.game_id);
        if (p.is_correct && game?.home_team_score != null) {
            const margin = Math.abs(game.home_team_score - game.away_team_score);
            if (margin > biggestBlowout.margin) {
                biggestBlowout = { margin, userId: p.user_id };
            }
        }
    });

    if (!biggestBlowout.userId) return null;
    const playerProfile = profiles.find(p => p.id === biggestBlowout.userId);
    return { username: playerProfile?.username, value: biggestBlowout.margin };
};

const calculateContrarian = (picks, profiles) => {
    const pickCounts = countBy(picks, 'game_id');
    const correctPicks = picks.filter(p => p.is_correct);
    const contrarianScores = {};

    correctPicks.forEach(p => {
        const gamePicks = picks.filter(pick => pick.game_id === p.game_id && pick.selected_team === p.selected_team);
        const popularity = gamePicks.length / pickCounts[p.game_id];
        // Score is higher for less popular picks (1 - popularity)
        contrarianScores[p.user_id] = (contrarianScores[p.user_id] || 0) + (1 - popularity);
    });
    
    return findTopPlayer(contrarianScores, profiles);
};


// --- Main Handler ---
export const handler = async (event) => {
  const { season } = event.queryStringParameters;
  if (!season) { return { statusCode: 400, body: JSON.stringify({ message: 'Season is required.' }) }; }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Fetch all raw data needed for ALL calculations at once
    const [picksRes, weeklyResultsRes, profilesRes, gamesRes] = await Promise.all([
      supabase.from('picks').select('*').eq('season', season),
      supabase.from('weekly_results').select('*').eq('season', season),
      supabase.from('profiles').select('id, username, favorite_team'),
      supabase.from('games').select('*').eq('season', season),
    ]);

    if (picksRes.error) throw picksRes.error;
    // ... (rest of error checks)

    const settledWeeksCount = [...new Set(weeklyResultsRes.data.map(r => r.week))].length;

    const stats = {
      // ... (existing stats)
      rivalry_king: calculateRivalryKing(picksRes.data, gamesRes.data, profilesRes.data),
      biggest_blowout: calculateBiggestBlowout(picksRes.data, gamesRes.data, profilesRes.data),
      contrarian: calculateContrarian(picksRes.data, profilesRes.data),
      // Only calculate Price is Right if enough weeks have passed
      price_is_right: settledWeeksCount >= 4 ? calculatePriceIsRight(picksRes.data, gamesRes.data, profilesRes.data) : null,
    };

    return { statusCode: 200, body: JSON.stringify(stats) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};