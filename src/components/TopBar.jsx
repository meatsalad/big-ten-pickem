import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useLeague } from '../context/LeagueContext'; // 1. Import the league hook
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
  const { selectedLeague } = useLeague(); // 2. Get the selected league
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navStyles = useStyleConfig("Navbar");

  useEffect(() => {
    // 3. Update the guard clause to wait for the league
    if (!user || !selectedSeason || !selectedLeague) {
      setLoading(false);
      return;
    }

    const fetchSummaryStats = async () => {
      setLoading(true);
      setError(null);
      setStats(null);

      try {
        // 4. Update the fetch URL to include the league_id
        const response = await fetch(`/.netlify/functions/get-user-summary-stats?season=${selectedSeason}&user_id=${user.id}&league_id=${selectedLeague.id}`);
        
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
  }, [user, selectedSeason, selectedLeague]); // 5. Add selectedLeague to the dependency array

  const MainContainer = ({ children }) => (
    <Box as="header" p={2} __css={navStyles}>
      <HStack spacing={{ base: 4, md: 8 }} mx="auto" width="fit-content">
        {children}
      </HStack>
    </Box>
  );
  
  if (loading) {
    return (
      <MainContainer>
        <Spinner size="sm" />
      </MainContainer>
    );
  }
  
  if (error || !stats) {
      return null;
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