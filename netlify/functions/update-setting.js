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

    const { setting_name, is_enabled, value } = JSON.parse(event.body);
    if (!setting_name) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Setting name is required.' }) };
    }

    // Build the update object dynamically based on what was passed
    const updatePayload = {};
    if (is_enabled !== undefined) {
      updatePayload.is_enabled = is_enabled;
    }
    if (value !== undefined) {
      updatePayload.value = value;
    }

    const { error } = await supabase
      .from('settings')
      .update(updatePayload)
      .eq('setting_name', setting_name);

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ message: 'Setting updated.' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};