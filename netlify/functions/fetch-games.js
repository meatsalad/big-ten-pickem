const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Get Supabase and CFBD credentials from environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const cfbdApiKey = process.env.CFBD_API_KEY;

  // Create a Supabase client with the service role key
  const supabase = createClient(supabaseUrl, supabaseKey);

  const year = 2025; // The season year you want to fetch
  const week = 1;   // The week you want to fetch

  try {
    // Fetch the games from the College Football Data API
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

    // Re-format the data from the API to match our 'games' table structure
    const gamesToInsert = gamesData.map(game => ({
      week: game.week,
      home_team: game.home_team,
      away_team: game.away_team,
      game_time: game.start_date,
    }));

    // Insert the game data into our Supabase 'games' table
    const { data, error } = await supabase
      .from('games')
      .upsert(gamesToInsert);

    if (error) {
      throw error;
    }

    // Return a success response
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `${gamesToInsert.length} games updated successfully!`, data }),
    };

  } catch (error) {
    // Return an error response
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};