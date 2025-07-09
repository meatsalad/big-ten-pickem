import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext'; // <-- Import the season hook
import {
  HStack,
  Text,
  Stat,
  StatArrow,
  Spinner,
} from '@chakra-ui/react';

export default function CompactStats() {
  const { user } = useAuth();
  const { selectedSeason } = useSeason(); // <-- Get the selected season
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Don't run if we don't have a user or a season yet
    if (!user || !selectedSeason) return;

    const fetchFinancials = async () => {
      setStats(null); // Reset stats when fetching for a new season
      const { data, error } = await supabase.rpc('get_user_financials', {
        p_user_id: user.id,
        p_season: selectedSeason, // <-- Pass the selected season to the function
      });

      if (error) {
        console.error('Error fetching financial stats:', error);
      } else if (data && data.length > 0) {
        setStats(data[0]);
      }
    };

    fetchFinancials();
  }, [user, selectedSeason]); // <-- Re-run when the season changes

  if (!stats) {
    return <Spinner size="xs" color="white" />;
  }

  const net = stats.total_winnings - stats.total_losses;
  const net_type = net >= 0 ? 'increase' : 'decrease';
  const net_color = net >= 0 ? 'green.400' : 'red.400';

  return (
    <Stat>
      <HStack>
        <Text fontSize={{ base: 'xs', md: 'sm' }}>Season Net:</Text>
        <Text fontWeight="bold" color={net_color} fontSize={{ base: 'md', md: 'lg' }}>
          <StatArrow type={net_type} />
          ${net}
        </Text>
      </HStack>
    </Stat>
  );
}
