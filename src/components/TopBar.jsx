import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
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
  const { selectedSeason } = useSeason();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navStyles = useStyleConfig("Navbar");

  useEffect(() => {
    if (!user || !selectedSeason) {
      setLoading(false);
      return;
    }

    const fetchSummaryStats = async () => {
      setLoading(true);
      setError(null);
      setStats(null);

      try {
        const response = await fetch(`/.netlify/functions/get-user-summary-stats?season=${selectedSeason}&user_id=${user.id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch summary stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching top bar summary stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryStats();
  }, [user, selectedSeason]);

  const MainContainer = ({ children }) => (
    <Box as="header" p={2} __css={navStyles}>
      <HStack spacing={{ base: 4, md: 8 }} mx="auto" width="fit-content">
        {children}
      </HStack>
    </Box>
  );
  
  // If loading, show a spinner. If there's an error, show nothing.
  if (loading) {
    return (
      <MainContainer>
        <Spinner size="sm" />
      </MainContainer>
    );
  }
  
  if (error || !stats) {
      return null; // Don't render the bar if there's an error or no stats
  }

  const totalWeeksPlayed = (stats.weeks_won || 0) + (stats.weeks_lost || 0);
  const winPercentage = totalWeeksPlayed > 0
    ? ((stats.weeks_won / totalWeeksPlayed) * 100).toFixed(0)
    : 0;

  return (
    <MainContainer>
        <Stat>
          <StatLabel fontSize={{ base: 'xs', md: 'sm' }}>Rank</StatLabel>
          <StatNumber fontSize={{ base: 'lg', md: 'xl' }}>#{stats.rank || 'N/A'}</StatNumber>
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