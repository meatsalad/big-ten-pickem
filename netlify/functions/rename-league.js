import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { authorizeCommissioner } from './lib/auth.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    await authorizeCommissioner(supabase, event);

    const { league_id, new_name } = JSON.parse(event.body);
    if (!league_id || !new_name) {
      return { statusCode: 400, body: JSON.stringify({ message: 'League ID and new name are required.' }) };
    }

    if (new_name.length < 3) {
      return { statusCode: 400, body: JSON.stringify({ message: 'New name must be at least 3 characters long.' }) };
    }

    const { error } = await supabase
      .from('leagues')
      .update({ name: new_name })
      .eq('id', league_id);

    if (error) {
        // Check for the unique violation error
        if(error.code === '23505') {
            throw new Error('A league with this name already exists.');
        }
        throw error;
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'League renamed successfully.' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};