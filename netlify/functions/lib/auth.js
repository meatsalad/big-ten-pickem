// netlify/functions/lib/auth.js

/**
 * Checks if the user making the request is a commissioner.
 * It verifies the JWT from the request, fetches the user's profile,
 * and checks their role.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase The Supabase client instance.
 * @param {object} event The Netlify function event object.
 * @returns {Promise<object>} The user's profile object if authorized.
 * @throws {{ statusCode: number, message: string }} Throws an error if unauthorized.
 */
export const authorizeCommissioner = async (supabase, event) => {
  const { authorization } = event.headers;
  if (!authorization) {
    throw { statusCode: 401, message: 'Unauthorized' };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authorization.replace('Bearer ', '')
  );

  if (authError || !user) {
    throw { statusCode: 401, message: 'Unauthorized' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw { statusCode: 500, message: 'Error retrieving user profile.' };
  }

  if (profile.role !== 'commissioner') {
    throw { statusCode: 403, message: 'Forbidden: Insufficient privileges.' };
  }

  return profile;
};