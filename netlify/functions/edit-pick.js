// netlify/functions/edit-pick.js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { authorizeCommissioner } from './lib/auth';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' },
    };
  }

  // Use the service key for robust permissions
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    await authorizeCommissioner(supabase, event);

    // Now requires league_id
    const { pickId, newSelectedTeam, league_id } = JSON.parse(event.body);

    if (!pickId || !newSelectedTeam || !league_id) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Pick ID, new team, and league ID are required.' }) };
    }

    // The update is now scoped to the specific pick AND league
    const { data, error } = await supabase
      .from('picks')
      .update({ selected_team: newSelectedTeam })
      .eq('id', pickId)
      .eq('league_id', league_id)
      .select();

    if (error) throw error;
    if (data.length === 0) throw new Error("Pick not found in the specified league.");

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Pick updated successfully', data }),
    };

  } catch (error) {
    console.error('Error in edit-pick:', error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message || 'An internal error occurred.' }),
    };
  }
};