import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const LeagueContext = createContext();

export const LeagueProvider = ({ children }) => {
  const { user } = useAuth();
  const [availableLeagues, setAvailableLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setAvailableLeagues([]);
      setSelectedLeague(null);
      return;
    }

    const fetchLeagues = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_leagues_for_user', {
        p_user_id: user.id,
      });

      if (error) {
        console.error("Failed to fetch user's leagues", error);
        setAvailableLeagues([]);
        setSelectedLeague(null);
      } else if (data) {
        setAvailableLeagues(data);
        // Default to selecting the user's first league
        if (data.length > 0) {
          setSelectedLeague(data[0]);
        }
      }
      setLoading(false);
    };

    fetchLeagues();
  }, [user]);

  const value = {
    availableLeagues,
    selectedLeague,
    setSelectedLeague,
    loadingLeagues: loading,
  };

  return (
    <LeagueContext.Provider value={value}>
      {children}
    </LeagueContext.Provider>
  );
};

export const useLeague = () => {
  return useContext(LeagueContext);
};