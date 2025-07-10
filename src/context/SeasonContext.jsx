import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const SeasonContext = createContext();

export const SeasonProvider = ({ children }) => {
  const [availableSeasons, setAvailableSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  
  // Add state for available and selected weeks
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);

  // 1. Fetch available seasons on initial load
  useEffect(() => {
    const fetchSeasons = async () => {
      const { data } = await supabase.rpc('get_distinct_seasons');
      if (data) {
        const seasonList = data.map(s => s.season);
        setAvailableSeasons(seasonList);
        if (seasonList.length > 0) {
          setSelectedSeason(seasonList[0]);
        }
      }
    };
    fetchSeasons();
  }, []);

  // 2. Fetch available weeks whenever the selected season changes
  useEffect(() => {
    if (!selectedSeason) return;
    const fetchWeeks = async () => {
      const { data, error } = await supabase.rpc('get_distinct_weeks_for_season', { p_season: selectedSeason });
      if (error) {
        setAvailableWeeks([]);
        setSelectedWeek(null);
      } else {
        const weekList = data.map(w => w.week);
        setAvailableWeeks(weekList);
        // Default to the first week of the new season
        setSelectedWeek(weekList[0] || null);
      }
    };
    fetchWeeks();
  }, [selectedSeason]);

  const value = {
    availableSeasons,
    selectedSeason,
    setSelectedSeason,
    availableWeeks,
    selectedWeek,
    setSelectedWeek,
  };

  return (
    <SeasonContext.Provider value={value}>
      {children}
    </SeasonContext.Provider>
  );
};

export const useSeason = () => {
  return useContext(SeasonContext);
};