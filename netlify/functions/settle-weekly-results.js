const { createClient } = require('@supabase/supabase-js');

// Helper function to get the PREVIOUS college football week
const getPreviousNCAAFWeek = () => {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 7, 24); 
  const week = Math.ceil((now - seasonStart) / (1000 * 60 * 60 * 24 * 7));
  return week > 1 ? week - 1 : 1;
};

exports.handler = async function(event) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let weekToSettle;

  if (event.body) {
    try {
      const body = JSON.parse(event.body);
      weekToSettle = body.week;
    } catch (e) {
      weekToSettle = getPreviousNCAAFWeek();
    }
  } else {
    weekToSettle = getPreviousNCAAFWeek();
  }

  if (!weekToSettle) {
      return { statusCode: 400, body: 'Week to settle is not defined.' };
  }

  try {
    // 1. Get all picks and game data for the week
    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select(`
        *,
        games ( home_team_score, away_team_score )
      `)
      .eq('week', weekToSettle);
    if (picksError) throw picksError;

    // --- NEW ROBUSTNESS CHECK ---
    // If there are no picks for this week, there's nothing to do.
    if (!picks || picks.length === 0) {
      return {
        statusCode: 200,
        body: `No picks found for week ${weekToSettle}. Nothing to settle.`,
      };
    }
    // --- END CHECK ---

    const { data: gamesInWeek } = await supabase.from('games').select('id').eq('week', weekToSettle);
    const totalGamesInWeek = gamesInWeek.length;

    // 2. Tally scores for each user
    const userScores = picks.reduce((acc, pick) => {
      if (!acc[pick.user_id]) {
        acc[pick.user_id] = {
          userId: pick.user_id,
          correctPicks: 0,
          tiebreakerDiff: Infinity,
          picks: [],
        };
      }
      if (pick.is_correct) {
        acc[pick.user_id].correctPicks++;
      }
      if (pick.predicted_home_score !== null && pick.games) {
        const game = pick.games;
        const diff = Math.abs(pick.predicted_home_score - game.home_team_score) + Math.abs(pick.predicted_away_score - game.away_team_score);
        acc[pick.user_id].tiebreakerDiff = diff;
      }
      acc[pick.user_id].picks.push(pick);
      return acc;
    }, {});

    const scoresArray = Object.values(userScores);
    
    // 3. Determine Winners
    const maxScore = Math.max(...scoresArray.map(u => u.correctPicks));
    let potentialWinners = scoresArray.filter(u => u.correctPicks === maxScore);
    let winners = [];

    if (potentialWinners.length === 1) {
      winners = potentialWinners;
    } else if (potentialWinners.length > 1) {
      const minTiebreaker = Math.min(...potentialWinners.map(u => u.tiebreakerDiff));
      winners = potentialWinners.filter(u => u.tiebreakerDiff === minTiebreaker);
    }

    // 4. Determine Poopstars
    const minScore = Math.min(...scoresArray.map(u => u.correctPicks));
    let potentialPoopstars = scoresArray.filter(u => u.correctPicks === minScore);
    let poopstars = [];

    if (potentialPoopstars.length === 1) {
      poopstars = potentialPoopstars;
    } else if (potentialPoopstars.length > 1) {
      const maxTiebreaker = Math.max(...potentialPoopstars.map(u => u.tiebreakerDiff).filter(d => d !== Infinity));
      poopstars = potentialPoopstars.filter(u => u.tiebreakerDiff === maxTiebreaker);
      if (poopstars.length === 0) {
          poopstars = potentialPoopstars;
      }
    }

    // 5. Prepare results for insertion
    const weeklyResults = scoresArray.map(user => {
      const isPerfect = user.correctPicks === totalGamesInWeek && totalGamesInWeek > 0;
      const isWinner = winners.some(w => w.userId === user.userId) || isPerfect;
      const isPoopstar = poopstars.some(p => p.userId === user.userId);
      
      return {
        user_id: user.userId,
        week: weekToSettle,
        is_winner: isWinner,
        is_poopstar: isPoopstar,
        is_perfect: isPerfect,
        has_paid: isWinner,
      };
    });

    // 6. Upsert results into the database
    const { error: upsertError } = await supabase.from('weekly_results').upsert(weeklyResults);
    if (upsertError) throw upsertError;

    return {
      statusCode: 200,
      body: `Successfully settled results for week ${weekToSettle}.`,
    };

  } catch (error) {
    console.error('Error in settle-weekly-results function:', error);
    return { statusCode: 500, body: error.toString() };
  }
};
