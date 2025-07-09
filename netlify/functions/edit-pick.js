// netlify/functions/edit-pick.js

import { createClient } from '@supabase/supabase-js';
import { authorizeCommissioner } from './lib/auth'; // Adjust path if needed

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = process.env;

export const handler = async (event) => {
  // Disallow non-POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' },
    };
  }

  const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

  try {
    // 1. Authorize the user first
    await authorizeCommissioner(supabase, event);

    // 2. Proceed with business logic only if authorization succeeds
    const { pickId, newSelectedTeam } = JSON.parse(event.body);

    if (!pickId || !newSelectedTeam) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Pick ID and new team are required.' }) };
    }

    const { data, error } = await supabase
      .from('picks')
      .update({ selected_team: newSelectedTeam })
      .eq('id', pickId)
      .select();

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Pick updated successfully', data }),
    };

  } catch (error) {
    // Catch errors from both authorization and the database operation
    console.error('Error in edit-pick:', error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message || 'Internal Server Error' }),
    };
  }
};