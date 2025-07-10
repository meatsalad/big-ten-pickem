import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Note: 'node-fetch' is no longer needed. Modern Node.js runtimes,
// which Netlify uses, have `fetch` available globally.

export const handler = async (event, context) => {
  // Get Supabase and CFBD credentials from environment variables
  // IMPORTANT: These must be set in your Netlify site settings for production
  // and in netlify.toml for local dev.
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Using the SERVICE KEY to write to the DB
  const cfbdApiKey = process.env.CFBD_API_KEY;

  if (!supabaseUrl || !supabaseKey || !cfbdApiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing required environment variables.' }),
    };
  }
  
  // Create a Supabase client with the service role key
  const supabase = createClient(supabaseUrl, supabaseKey);

  // --- Dynamically calculate the current year and week ---
  const now = new Date();
  const year = now.getFullYear();
  
  // Simple ISO week calculation
  const startOfYear = new Date(year, 0, 1);
  const week = Math.ceil((((now - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
  // ---------------------------------------------------------

  console.log(`Fetching games for Year: ${year}, Week: ${week}`);

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
    if (gamesData.length === 0) {
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'No new games found for this week.' }),
        };
    }

    // Re-format the data from the API to match our 'games' table structure
    const gamesToInsert = gamesData.map(game => ({
      season: game.season, // Use the season from the API response
      week: game.week,
      home_team: game.home_team,
      away_team: game.away_team,
      game_time: game.start_date,
    }));

    // Insert the game data into our Supabase 'games' table
    const { data, error } = await supabase
      .from('games')
      .upsert(gamesToInsert, { onConflict: 'season, week, home_team, away_team' }); // Make upsert more specific

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