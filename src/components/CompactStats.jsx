import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import {
  HStack,
  Text,
  Stat,
  StatArrow,
  Spinner,
} from '@chakra-ui/react';

export default function CompactStats() {
  const { user } = useAuth();
  const { selectedSeason } = useSeason();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Don't run if we don't have a user or a season yet
    if (!user || !selectedSeason) {
      setLoading(false);
      return;
    }

    const fetchFinancials = async () => {
      setLoading(true);
      setError(null);
      setStats(null); // Reset stats when fetching for a new season

      try {
        const response = await fetch(`/.netlify/functions/get-user-financials?season=${selectedSeason}&user_id=${user.id}`);

        if (!response.ok) {
          const errorBody = await response.json();
          throw new Error(errorBody.message || 'Failed to fetch financial stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching compact financial stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancials();
  }, [user, selectedSeason]);

  if (loading) {
    return <Spinner size="xs" color="white" />;
  }
  
  // Fail gracefully by showing nothing if there's an error or no stats
  if (error || !stats) {
    return null;
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
          ${net.toFixed(2)}
        </Text>
      </HStack>
    </Stat>
  );
}