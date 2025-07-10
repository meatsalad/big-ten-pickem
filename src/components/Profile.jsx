import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Divider,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Profile = () => {
  const { user } = useAuth();
  const { selectedSeason } = useSeason();

  // State for each data source
  const [summaryStats, setSummaryStats] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [myStats, setMyStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !selectedSeason) {
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);

      try {
        // --- THIS BLOCK IS UPDATED ---
        const [summaryRes, financialsRes, myStatsResponse] = await Promise.all([
          supabase.rpc('get_user_summary_stats', {
            p_season: selectedSeason,
            p_user_id: user.id,
          }),
          supabase.rpc('get_user_financials', {
            p_season: selectedSeason,
            p_user_id: user.id,
          }),
          // This now calls our new serverless function
          fetch(`/.netlify/functions/get-my-stats?season=${selectedSeason}&user_id=${user.id}`),
        ]);

        if (summaryRes.error) throw summaryRes.error;
        if (financialsRes.error) throw financialsRes.error;
        if (!myStatsResponse.ok) {
          const errorBody = await myStatsResponse.json();
          throw new Error(errorBody.message);
        }

        setSummaryStats(summaryRes.data?.[0] || null);
        setFinancials(financialsRes.data?.[0] || null);
        setMyStats(await myStatsResponse.json());
        // --- END OF UPDATED BLOCK ---

      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, selectedSeason]);

  if (loading) {
    return <Spinner size="xl" />;
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        There was an error fetching your profile data: {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Heading as="h1" mb={6}>
        My Profile: {selectedSeason} Season
      </Heading>

      <VStack spacing={8} align="stretch">
        <StatGroup>
          <Stat>
            <StatLabel>Rank</StatLabel>
            <StatNumber>#{summaryStats?.rank || 'N/A'}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Weeks Won</StatLabel>
            <StatNumber>{summaryStats?.weeks_won ?? '0'}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Weeks Lost</StatLabel>
            <StatNumber>{summaryStats?.weeks_lost ?? '0'}</StatNumber>
          </Stat>
        </StatGroup>

        <Divider />

        <Box>
          <Heading as="h2" size="lg" mb={4}>Financials</Heading>
          <HStack spacing={8}>
            <Text fontSize="lg">
              Total Winnings: <strong>${financials?.total_winnings?.toFixed(2) || '0.00'}</strong>
            </Text>
            <Text fontSize="lg">
              Total Losses: <strong>${financials?.total_losses?.toFixed(2) || '0.00'}</strong>
            </Text>
          </HStack>
        </Box>

        <Divider />
        
        <Box>
            <Heading as="h2" size="lg" mb={4}>Picking Tendencies</Heading>
            <HStack spacing={8}>
                <Text fontSize="lg">Home Picks: <strong>{myStats?.picking_tendencies?.home_picks ?? 0}</strong></Text>
                <Text fontSize="lg">Away Picks: <strong>{myStats?.picking_tendencies?.away_picks ?? 0}</strong></Text>
            </HStack>
        </Box>
        
        <Divider />

        <Box>
          <Heading as="h2" size="lg" mb={4}>Performance Over Time</Heading>
          {myStats?.performance_over_time?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={myStats.performance_over_time}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -5 }}/>
                <YAxis allowDecimals={false} label={{ value: 'Correct Picks', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="wins" stroke="#8884d8" activeDot={{ r: 8 }} name="Correct Picks" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Text>No performance data available for this season yet.</Text>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default Profile;