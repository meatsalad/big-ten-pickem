import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SeasonContext = createContext();

export const SeasonProvider = ({ children }) => {
  // Default states to null to indicate they haven't been loaded yet.
  const [availableSeasons, setAvailableSeasons] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('season');
        
        if (error) throw error;

        if (data) {
          const uniqueSeasons = [...new Set(data.map(g => g.season).filter(Boolean))];
          const sortedSeasons = uniqueSeasons.sort((a, b) => b - a);
          setAvailableSeasons(sortedSeasons);
          
          // If there are seasons in the DB, set the most recent one as selected.
          if (sortedSeasons.length > 0) {
            setSelectedSeason(sortedSeasons[0]);
          } else {
            // Otherwise, fallback to the current year.
            setSelectedSeason(new Date().getFullYear());
          }
        } else {
            // If there's no data, set an empty array and the current year.
            setAvailableSeasons([]);
            setSelectedSeason(new Date().getFullYear());
        }
      } catch (error) {
        console.error("Error in fetchSeasons:", error);
        // On error, still set default values to allow the app to render.
        setAvailableSeasons([]);
        setSelectedSeason(new Date().getFullYear());
      }
    };
    fetchSeasons();
  }, []);

  const value = {
    availableSeasons,
    selectedSeason,
    setSelectedSeason,
  };

  // Only render the rest of the app if the seasons have been determined.
  return (
    <SeasonContext.Provider value={value}>
      {availableSeasons !== null && children}
    </SeasonContext.Provider>
  );
};

export const useSeason = () => {
  return useContext(SeasonContext);
};
