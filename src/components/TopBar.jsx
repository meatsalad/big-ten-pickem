import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
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
  const [stats, setStats] = useState(null);
  const navStyles = useStyleConfig("Navbar");

  useEffect(() => {
    if (!user) return;

    const fetchSummaryStats = async () => {
      const { data, error } = await supabase.rpc('get_user_summary_stats', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching summary stats:', error);
      } else if (data && data.length > 0) {
        setStats(data[0]);
      }
    };

    fetchSummaryStats();
  }, [user]);

  // Main container uses Box for simpler centering
  const MainContainer = ({ children }) => (
    <Box as="header" p={2} __css={navStyles}>
      <HStack spacing={8} mx="auto" width="fit-content">
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
          <StatLabel>Rank</StatLabel>
          <StatNumber>#{stats.rank}</StatNumber>
        </Stat>
        <Divider orientation="vertical" h="30px" />
        <Stat>
          <StatLabel>Record</StatLabel>
          <StatNumber>{stats.weeks_won} - {stats.weeks_lost}</StatNumber>
        </Stat>
        <Divider orientation="vertical" h="30px" />
        <Stat>
          <StatLabel>Win %</StatLabel>
          <StatNumber>{winPercentage}%</StatNumber>
        </Stat>
        <Divider orientation="vertical" h="30px" />
        <Stat>
          <CompactStats />
        </Stat>
    </MainContainer>
  );
}
