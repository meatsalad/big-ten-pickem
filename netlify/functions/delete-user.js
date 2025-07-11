import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

  // Get the user's token from the request header
  const { authorization } = event.headers;
  if (!authorization) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
  }
  const token = authorization.replace('Bearer ', '');

  // Get the user's ID from their token to ensure they can only delete themselves
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Invalid token' }) };
  }

  try {
    // Initialize the Admin client with the service role key to perform the deletion
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // Perform the deletion
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return { statusCode: 200, body: JSON.stringify({ message: 'User deleted successfully.' }) };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};