import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useLeague } from '../context/LeagueContext'; // 1. Import the league hook
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
  const { selectedLeague } = useLeague(); // 2. Get the selected league
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 3. Wait for all required data before fetching
    if (!user || !selectedSeason || !selectedLeague) {
      setLoading(false);
      return;
    }

    const fetchFinancials = async () => {
      setLoading(true);
      setStats(null);
      try {
        // 4. Add the league_id to the API call
        const response = await fetch(`/.netlify/functions/get-user-financials?season=${selectedSeason}&user_id=${user.id}&league_id=${selectedLeague.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch financial stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching compact financial stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancials();
  }, [user, selectedSeason, selectedLeague]); // 5. Add selectedLeague to the dependency array

  if (loading) {
    return <Spinner size="xs" color="white" />;
  }

  if (!stats) {
    return (
        <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold">$0.00</Text>
    );
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