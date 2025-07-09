const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Helper function to get the current college football week
const getCurrentNCAAFWeek = () => {
  const now = new Date();
  // Season starts around the last week of August
  const seasonStart = new Date(now.getFullYear(), 7, 24); 
  const week = Math.ceil((now - seasonStart) / (1000 * 60 * 60 * 24 * 7));
  return week > 0 ? week : 1; // Ensure week is at least 1
};

export const handler = async (event) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const cfbdApiKey = process.env.CFBD_API_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey);

  const year = new Date().getFullYear();
  const week = getCurrentNCAAFWeek();

  try {
    const response = await fetch(`https://api.collegefootballdata.com/games?year=${year}&week=${week}&conference=B1G`, {
      headers: {
        'Authorization': `Bearer ${cfbdApiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch games: ${response.statusText}`);
    }

    const gamesData = await response.json();

    if (!gamesData || gamesData.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: `No Big Ten games found for Week ${week}.` }),
      };
    }

    const gamesToInsert = gamesData.map(game => ({
      week: game.week,
      home_team: game.home_team,
      away_team: game.away_team,
      game_time: game.start_date,
    }));

    const { data, error } = await supabase
      .from('games')
      .upsert(gamesToInsert);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `${gamesToInsert.length} games for Week ${week} updated successfully!`, data }),
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};