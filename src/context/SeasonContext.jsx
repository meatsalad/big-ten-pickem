import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SeasonContext = createContext();

export const SeasonProvider = ({ children }) => {
  const [availableSeasons, setAvailableSeasons] = useState([]);
  // Default to the current year, but it will be updated once seasons are fetched.
  const [selectedSeason, setSelectedSeason] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeasons = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('games')
          .select('season');
        
        if (error) {
          console.error("Error fetching seasons:", error);
        } else if (data) {
          const uniqueSeasons = [...new Set(data.map(g => g.season).filter(Boolean))];
          const sortedSeasons = uniqueSeasons.sort((a, b) => b - a); // Sort descending
          setAvailableSeasons(sortedSeasons);
          
          // **BUG FIX:** If there are available seasons, default to the most recent one.
          if (sortedSeasons.length > 0) {
            setSelectedSeason(sortedSeasons[0]);
          }
        }
      } catch (error) {
        console.error("Error in fetchSeasons:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSeasons();
  }, []);

  const value = {
    availableSeasons,
    selectedSeason,
    setSelectedSeason,
    loading,
  };

  return (
    <SeasonContext.Provider value={value}>
      {/* Only render children when not loading */}
      {!loading && children}
    </SeasonContext.Provider>
  );
};

export const useSeason = () => {
  return useContext(SeasonContext);
};
