import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Heading,
  Spinner,
  VStack,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Center,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// --- Sub-component for the Performance Line Chart ---
const MyPerformanceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <Text>No weekly performance data yet.</Text>;
  }

  // Ensure every week from 1 to 14 is present for a continuous line
  const fullData = [];
  for (let i = 1; i <= 14; i++) {
    const weekData = data.find(d => d.week === i);
    fullData.push({
      week: `Wk ${i}`,
      wins: weekData ? weekData.wins : 0,
    });
  }

  return (
    <Card variant="outline" h="100%">
      <CardHeader>
        <Heading size="md">Weekly Performance</Heading>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={fullData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="wins"
              name="Correct Picks"
              stroke="#8884d8"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};

// --- Sub-component for the Picking Tendencies Pie Chart ---
const TendenciesPieChart = ({ data }) => {
  if (!data || (data.home_picks === 0 && data.away_picks === 0)) {
    return <Text>No picking tendency data yet.</Text>;
  }

  const chartData = [
    { name: 'Home Picks', value: data.home_picks },
    { name: 'Away Picks', value: data.away_picks },
  ];
  const COLORS = ['#0088FE', '#00C49F'];

  return (
    <Card variant="outline" h="100%">
      <CardHeader>
        <Heading size="md">Picking Tendencies</Heading>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};


// --- Main MyStats Component ---
export default function MyStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMyStats = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_my_stats', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching my stats:', error);
      } else {
        setStats(data);
      }
      setLoading(false);
    };

    fetchMyStats();
  }, [user]);

  if (loading) {
    return (
      <VStack>
        <Spinner />
        <Text>Loading your personal stats...</Text>
      </VStack>
    );
  }

  // Check if there is any meaningful data to display
  const hasPerformanceData = stats?.performance_over_time && stats.performance_over_time.length > 0;

  return (
    <Box>
      <Heading size="lg" mb={6}>
        My Stats Dashboard
      </Heading>
      {hasPerformanceData ? (
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <MyPerformanceChart data={stats?.performance_over_time} />
          <TendenciesPieChart data={stats?.picking_tendencies} />
        </SimpleGrid>
      ) : (
        <Center p={10} borderWidth="1px" borderRadius="lg" bg="gray.50">
          <VStack>
            <InfoIcon boxSize="50px" color="blue.500" />
            <Heading size="md" mt={4}>No Stats to Show Yet</Heading>
            <Text>Your personal stats and charts will appear here once you've made some picks.</Text>
          </VStack>
        </Center>
      )}
    </Box>
  );
}
