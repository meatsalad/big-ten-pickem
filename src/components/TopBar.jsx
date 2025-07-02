import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import CompactStats from './CompactStats';
import {
  Box, // Use Box as the main container
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

  if (!stats) {
    return (
      <Box as="header" p={2} __css={navStyles} textAlign="center">
        <Spinner size="sm" />
      </Box>
    );
  }

  const winPercentage = stats.total_picks > 0
    ? ((stats.correct_picks / stats.total_picks) * 100).toFixed(1)
    : 0;

  return (
    <Box as="header" p={2} __css={navStyles}>
      {/* This HStack is now centered using auto horizontal margins */}
      <HStack spacing={8} mx="auto" width="fit-content">
        <Stat>
          <StatLabel>Rank</StatLabel>
          <StatNumber>#{stats.rank}</StatNumber>
        </Stat>
        <Divider orientation="vertical" h="30px" />
        <Stat>
          <StatLabel>Record</StatLabel>
          <StatNumber>{stats.correct_picks} - {stats.total_picks - stats.correct_picks}</StatNumber>
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
      </HStack>
    </Box>
  );
}
