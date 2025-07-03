const { createClient } = require('@supabase/supabase-js');

exports.handler = async function() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Find all weeks that have at least one completed game
    const { data: completedGameWeeksData, error: gamesError } = await supabase
      .from('games')
      .select('week')
      .not('winning_team', 'is', null);
    if (gamesError) throw gamesError;
    
    const completableWeeks = [...new Set(completedGameWeeksData.map(g => g.week))];

    // 2. Find all weeks that have already been settled
    const { data: settledWeeksData, error: settledError } = await supabase
      .from('weekly_results')
      .select('week');
    if (settledError) throw settledError;

    const settledWeeks = [...new Set(settledWeeksData.map(r => r.week))];

    // 3. Find the most recent week that is completable but not yet settled
    const weeksToSettle = completableWeeks.filter(w => !settledWeeks.includes(w));
    if (weeksToSettle.length === 0) {
      // **BUG FIX:** Return a valid JSON object with a message
      return { 
        statusCode: 200, 
        body: JSON.stringify({ message: 'All completed weeks are already settled.' }) 
      };
    }
    const weekToSettle = Math.max(...weeksToSettle);

    // --- The rest of the logic is the same settlement process ---
    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select(`*, games ( home_team_score, away_team_score )`)
      .eq('week', weekToSettle);
    if (picksError) throw picksError;

    const { data: gamesInWeek } = await supabase.from('games').select('id').eq('week', weekToSettle);
    const totalGamesInWeek = gamesInWeek.length;

    const userScores = picks.reduce((acc, pick) => {
      if (!acc[pick.user_id]) {
        acc[pick.user_id] = { userId: pick.user_id, correctPicks: 0, tiebreakerDiff: Infinity };
      }
      if (pick.is_correct) acc[pick.user_id].correctPicks++;
      if (pick.predicted_home_score !== null && pick.games) {
        const diff = Math.abs(pick.predicted_home_score - pick.games.home_team_score) + Math.abs(pick.predicted_away_score - pick.games.away_team_score);
        acc[pick.user_id].tiebreakerDiff = diff;
      }
      return acc;
    }, {});

    const scoresArray = Object.values(userScores);
    if (scoresArray.length === 0) {
        return { statusCode: 200, body: JSON.stringify({ message: `No picks to settle for week ${weekToSettle}.`}) };
    }

    const maxScore = Math.max(...scoresArray.map(u => u.correctPicks));
    let potentialWinners = scoresArray.filter(u => u.correctPicks === maxScore);
    let winners = (potentialWinners.length > 1)
      ? potentialWinners.filter(u => u.tiebreakerDiff === Math.min(...potentialWinners.map(p => p.tiebreakerDiff)))
      : potentialWinners;

    const minScore = Math.min(...scoresArray.map(u => u.correctPicks));
    let potentialPoopstars = scoresArray.filter(u => u.correctPicks === minScore);
    let poopstars = (potentialPoopstars.length > 1)
      ? potentialPoopstars.filter(u => u.tiebreakerDiff === Math.max(...potentialPoopstars.map(p => p.tiebreakerDiff).filter(d => d !== Infinity)))
      : potentialPoopstars;
    if (poopstars.length === 0 && potentialPoopstars.length > 1) poopstars = potentialPoopstars;


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

    await supabase.from('weekly_results').upsert(weeklyResults);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Successfully settled results for week ${weekToSettle}.` }),
    };

  } catch (error) {
    console.error('Error in smart settlement function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
