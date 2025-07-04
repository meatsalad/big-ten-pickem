import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom'; // Import useParams
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
  Avatar,
  HStack,
} from '@chakra-ui/react';
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
  const fullData = [];
  for (let i = 1; i <= 14; i++) {
    const weekData = data.find(d => d.week === i);
    fullData.push({ week: `Wk ${i}`, wins: weekData ? weekData.wins : 0 });
  }
  return (
    <Card variant="outline" h="100%">
      <CardHeader><Heading size="md">Weekly Performance</Heading></CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={fullData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="wins" name="Correct Picks" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
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
      <CardHeader><Heading size="md">Picking Tendencies</Heading></CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};

// --- Main Profile Component ---
export default function Profile() {
  const { userId } = useParams(); // Get userId from URL if it exists
  const { user: loggedInUser } = useAuth();
  const targetUserId = userId || loggedInUser.id; // Determine which user's stats to show

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetUserId) return;

    const fetchProfileData = async () => {
      setLoading(true);
      const { data: profileData } = await supabase.from('profiles').select('username, avatar_url').eq('id', targetUserId).single();
      setProfile(profileData);

      const { data: statsData, error } = await supabase.rpc('get_my_stats', { p_user_id: targetUserId });
      if (error) {
        console.error('Error fetching stats:', error);
      } else {
        setStats(statsData);
      }
      setLoading(false);
    };

    fetchProfileData();
  }, [targetUserId]);

  if (loading) {
    return <VStack><Spinner /><Text>Loading Profile...</Text></VStack>;
  }

  if (!profile) {
    return <Heading>Profile not found.</Heading>;
  }

  return (
    <Box>
      <HStack spacing={4} mb={6}>
        <Avatar size="lg" name={profile.username} src={profile.avatar_url} />
        <Heading size="lg">{profile.username}'s Stats</Heading>
      </HStack>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <MyPerformanceChart data={stats?.performance_over_time} />
        <TendenciesPieChart data={stats?.picking_tendencies} />
      </SimpleGrid>
    </Box>
  );
}
