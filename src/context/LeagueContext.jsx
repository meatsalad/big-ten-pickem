import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const LeagueContext = createContext();

export const LeagueProvider = ({ children }) => {
  const { user } = useAuth();
  const [availableLeagues, setAvailableLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Encapsulate the league fetching logic in a useCallback hook.
  const fetchLeagues = useCallback(async () => {
    if (!user) {
      setAvailableLeagues([]);
      setSelectedLeague(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_leagues_for_user', {
        p_user_id: user.id,
      });

      if (error) {
        throw error;
      }

      if (data) {
        setAvailableLeagues(data);
        // If no league is selected, or the selected one is no longer available,
        // default to the first one in the new list.
        setSelectedLeague(currentSelected => {
          const isCurrentLeagueStillAvailable = data.some(league => league.id === currentSelected?.id);
          if (isCurrentLeagueStillAvailable) {
            return currentSelected;
          }
          return data.length > 0 ? data[0] : null;
        });
      }
    } catch (error) {
      console.error("Failed to fetch user's leagues", error);
      setAvailableLeagues([]);
      setSelectedLeague(null);
    } finally {
      setLoading(false);
    }
  }, [user]); // The function depends on the user object.

  // 2. Call fetchLeagues on initial load when the user object is available.
  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]); // The effect depends on the fetchLeagues function.

  // 3. Define the value to be provided by the context.
  // We now include the `refreshLeagues` function (which is just an alias for fetchLeagues).
  const value = {
    availableLeagues,
    selectedLeague,
    setSelectedLeague,
    loadingLeagues: loading,
    refreshLeagues: fetchLeagues, // Expose the fetch function so other components can call it.
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