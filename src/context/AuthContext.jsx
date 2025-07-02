import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch the user's profile data
  const refreshProfile = async () => {
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url, favorite_team')
        .eq('id', user.id)
        .single();
      setProfile(profileData || null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
        }
      );

      return () => {
        subscription?.unsubscribe();
      };
    });
  }, []);

  useEffect(() => {
    // Fetch profile whenever the user object changes
    refreshProfile();
  }, [user]);

  const value = {
    session,
    user,
    profile,
    refreshProfile, // <-- Expose the refresh function to the app
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
