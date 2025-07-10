import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, CFBD_API_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !CFBD_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing required environment variables.' }),
    };
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- Dynamically calculate the current year and week ---
const now = new Date();
const year = now.getFullYear();
  
// Simple ISO week calculation
const startOfYear = new Date(year, 0, 1);
const week = Math.ceil((((now - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
// ---------------------------------------------------------

console.log(`Fetching games for Year: ${year}, Week: ${week}`);

  try {
    const response = await fetch(`https://api.collegefootballdata.com/games?year=${year}&week=${week}&conference=B1G`, {
      headers: {
        'Authorization': `Bearer ${CFBD_API_KEY}`,
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

    // --- THIS BLOCK IS UPDATED ---
    // First, filter out any "games" that are missing essential data, then map the valid ones.
    const gamesToInsert = gamesData
      .filter(game => game.home_team && game.away_team && game.start_date)
      .map(game => ({
        season: game.season,
        week: game.week,
        home_team: game.home_team,
        away_team: game.away_team,
        game_time: game.start_date,
      }));
    // --- END OF UPDATED BLOCK ---

    if (gamesToInsert.length === 0) {
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'No valid games with full data found to insert for this week.' }),
        };
    }

    const { data, error } = await supabase
      .from('games')
      .upsert(gamesToInsert, { onConflict: 'season, week, home_team, away_team' });

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `${gamesToInsert.length} games updated successfully!`, data }),
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};