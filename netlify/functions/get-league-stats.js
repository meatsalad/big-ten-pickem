import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// --- All of your existing helper functions remain exactly the same ---
// export const calculateOracle = ...
// export const calculatePoopstar = ...
// ... etc.

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

export const calculateOracle = (picks, profiles) => {
    const correctPicks = picks.filter(p => p.is_correct);
    const userCorrectCounts = countBy(correctPicks, 'user_id');
    return findTopPlayer(userCorrectCounts, profiles);
};

export const calculatePoopstar = (weeklyResults, profiles) => {
    const poopstars = weeklyResults.filter(r => r.is_poopstar);
    const userPoopstarCounts = countBy(poopstars, 'user_id');
    return findTopPlayer(userPoopstarCounts, profiles);
};

export const calculatePerfectionist = (weeklyResults, profiles) => {
    const perfectWeeks = weeklyResults.filter(r => r.is_perfect);
    const userPerfectCounts = countBy(perfectWeeks, 'user_id');
    return findTopPlayer(userPerfectCounts, profiles);
};

export const calculateHomer = (picks, profiles) => {
    const homerPicks = picks.filter(pick => {
        const profile = profiles.find(p => p.id === pick.user_id);
        return profile && profile.favorite_team === pick.selected_team;
    });
    const userHomerCounts = countBy(homerPicks, 'user_id');
    return findTopPlayer(userHomerCounts, profiles);
};

export const calculateConsistent = (picks, profiles) => {
    const picksByUser = picks.reduce((acc, pick) => {
        if (!acc[pick.user_id]) acc[pick.user_id] = { correct: 0, total: 0 };
        acc[pick.user_id].total++;
        if (pick.is_correct) acc[pick.user_id].correct++;
        return acc;
    }, {});

    let topPlayer = { userId: null, percentage: -1 };
    for (const userId in picksByUser) {
        const userStats = picksByUser[userId];
        if (userStats.total > 5) {
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

export const calculateRoadWarrior = (picks, games, profiles) => {
    const gamesMap = new Map(games.map(g => [g.id, g]));
    const roadWins = picks.filter(p => {
        const game = gamesMap.get(p.game_id);
        return p.is_correct && game && p.selected_team === game.away_team;
    });
    const userRoadWinCounts = countBy(roadWins, 'user_id');
    return findTopPlayer(userRoadWinCounts, profiles);
};

export const calculateFrontRunner = (picks, games, profiles) => {
    const gamesMap = new Map(games.map(g => [g.id, g]));
    const homeWins = picks.filter(p => {
        const game = gamesMap.get(p.game_id);
        return p.is_correct && game && p.selected_team === game.home_team;
    });
    const userHomeWinCounts = countBy(homeWins, 'user_id');
    return findTopPlayer(userHomeWinCounts, profiles);
};

export const calculateRivalryKing = (picks, games, profiles) => {
    const rivalryGameIds = new Set(games.filter(g => g.is_rivalry_game).map(g => g.id));
    const correctRivalryPicks = picks.filter(p => p.is_correct && rivalryGameIds.has(p.game_id));
    const userRivalryWinCounts = countBy(correctRivalryPicks, 'user_id');
    return findTopPlayer(userRivalryWinCounts, profiles);
};

export const calculatePriceIsRight = (picks, games, profiles) => {
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

export const calculateBiggestBlowout = (picks, games, profiles) => {
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

export const calculateContrarian = (picks, profiles) => {
    const pickCountsByGame = picks.reduce((acc, pick) => {
        if (!acc[pick.game_id]) acc[pick.game_id] = {};
        acc[pick.game_id][pick.selected_team] = (acc[pick.game_id][pick.selected_team] || 0) + 1;
        return acc;
    }, {});

    const totalPicksPerGame = countBy(picks, 'game_id');
    const correctPicks = picks.filter(p => p.is_correct);
    const contrarianScores = {};

    correctPicks.forEach(p => {
        const numPicksForTeam = pickCountsByGame[p.game_id]?.[p.selected_team] || 1;
        const totalPicks = totalPicksPerGame[p.game_id] || 1;
        const popularity = numPicksForTeam / totalPicks;
        contrarianScores[p.user_id] = (contrarianScores[p.user_id] || 0) + (1 - popularity);
    });
    
    return findTopPlayer(contrarianScores, profiles);
};

// --- Main Handler ---
export const handler = async (event) => {
  // 1. Get season AND league_id from the request
  const { season, league_id } = event.queryStringParameters;
  if (!season || !league_id) { 
    return { statusCode: 400, body: JSON.stringify({ message: 'Season and league_id are required.' }) };
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 2. Update all queries to filter by league_id
    const [picksRes, weeklyResultsRes, profilesRes, gamesRes] = await Promise.all([
      supabase.from('picks').select('*').eq('season', season).eq('league_id', league_id),
      supabase.from('weekly_results').select('*').eq('season', season).eq('league_id', league_id),
      // This is an efficient way to get all profiles for members of a specific league
      supabase.from('league_members').select('profiles(*)').eq('league_id', league_id),
      supabase.from('games').select('*').eq('season', season),
    ]);

    if (picksRes.error) throw picksRes.error;
    if (weeklyResultsRes.error) throw weeklyResultsRes.error;
    if (profilesRes.error) throw profilesRes.error;
    if (gamesRes.error) throw gamesRes.error;

    // Destructure the nested profiles data
    const profiles = profilesRes.data.map(item => item.profiles);
    const settledWeeksCount = [...new Set(weeklyResultsRes.data.map(r => r.week))].length;

    const stats = {
      oracle: calculateOracle(picksRes.data, profiles),
      pooper_star: calculatePoopstar(weeklyResultsRes.data, profiles),
      perfectionist: calculatePerfectionist(weeklyResultsRes.data, profiles),
      homer: calculateHomer(picksRes.data, profiles),
      consistent: calculateConsistent(picksRes.data, profiles),
      road_warrior: calculateRoadWarrior(picksRes.data, gamesRes.data, profiles),
      front_runner: calculateFrontRunner(picksRes.data, gamesRes.data, profiles),
      rivalry_king: calculateRivalryKing(picksRes.data, gamesRes.data, profiles),
      biggest_blowout: calculateBiggestBlowout(picksRes.data, gamesRes.data, profiles),
      contrarian: calculateContrarian(picksRes.data, profiles),
      price_is_right: settledWeeksCount >= 4 ? calculatePriceIsRight(picksRes.data, gamesRes.data, profiles) : null,
    };

    return { statusCode: 200, body: JSON.stringify(stats) };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message || 'Internal Server Error' }),
    };
  }
};