import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext'; // <-- Import the new season hook
import CompactStats from './CompactStats';
import {
  Box,
  Stat,
  StatLabel,
  StatNumber,
  HStack,
  Divider,
  Spinner,
  useStyleConfig,
} from '@chakra-ui/react';

export default function TopBar() {
  const { user } = useAuth();
  const { selectedSeason } = useSeason(); // <-- Get the selected season from our context
  const [stats, setStats] = useState(null);
  const navStyles = useStyleConfig("Navbar");

  useEffect(() => {
    // Don't fetch data if we don't have a user or a selected season yet
    if (!user || !selectedSeason) return;

    const fetchSummaryStats = async () => {
      // Pass the selected season to the database function
      const { data, error } = await supabase.rpc('get_user_summary_stats', {
        p_user_id: user.id,
        p_season: selectedSeason,
      });

      if (error) {
        console.error('Error fetching summary stats:', error);
      } else if (data && data.length > 0) {
        setStats(data[0]);
      }
    };

    fetchSummaryStats();
  }, [user, selectedSeason]); // <-- Re-run this function whenever the user or season changes

  // Main container uses Box for simpler centering
  const MainContainer = ({ children }) => (
    <Box as="header" p={2} __css={navStyles}>
      <HStack spacing={{ base: 4, md: 8 }} mx="auto" width="fit-content">
        {children}
      </HStack>
    </Box>
  );

  if (!stats) {
    return (
      <MainContainer>
        <Spinner size="sm" />
      </MainContainer>
    );
  }

  const totalWeeksPlayed = (stats.weeks_won || 0) + (stats.weeks_lost || 0);
  const winPercentage = totalWeeksPlayed > 0
    ? ((stats.weeks_won / totalWeeksPlayed) * 100).toFixed(0)
    : 0;

  return (
    <MainContainer>
        <Stat>
          <StatLabel fontSize={{ base: 'xs', md: 'sm' }}>Rank</StatLabel>
          <StatNumber fontSize={{ base: 'lg', md: 'xl' }}>#{stats.rank}</StatNumber>
        </Stat>
        <Divider orientation="vertical" h="30px" />
        <Stat>
          <StatLabel fontSize={{ base: 'xs', md: 'sm' }}>Record</StatLabel>
          <StatNumber fontSize={{ base: 'lg', md: 'xl' }}>{stats.weeks_won} - {stats.weeks_lost}</StatNumber>
        </Stat>
        <Divider orientation="vertical" h="30px" />
        <Stat>
          <StatLabel fontSize={{ base: 'xs', md: 'sm' }}>Win %</StatLabel>
          <StatNumber fontSize={{ base: 'lg', md: 'xl' }}>{winPercentage}%</StatNumber>
        </Stat>
        <Divider orientation="vertical" h="30px" />
        <Stat>
          <StatLabel fontSize={{ base: 'xs', md: 'sm' }}>Season Net</StatLabel>
          <CompactStats />
        </Stat>
    </MainContainer>
  );
}
