import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Box,
  Heading,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Text,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  VStack,
} from '@chakra-ui/react';
// Import Recharts components
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

// A reusable StatCard component for our page
const StatCard = ({ title, description, stat, helpText, icon }) => {
  return (
    <Card variant="outline" h="100%">
      <CardHeader>
        <Heading size="md">{title}</Heading>
        <Text fontSize="sm" color="gray.500" mt={1}>{description}</Text>
      </CardHeader>
      <CardBody>
        <Stat>
          <StatLabel fontSize="xl">{stat?.username || 'N/A'}</StatLabel>
          <StatNumber fontSize="4xl">
            {icon} {stat?.value?.toFixed(1) || '0'}{helpText}
          </StatNumber>
          <StatHelpText>
            {stat ? `Based on available data.` : 'Not enough data to calculate.'}
          </StatHelpText>
        </Stat>
      </CardBody>
    </Card>
  );
};

// --- New Sub-component for the Performance Line Chart ---
const PerformanceChart = () => {
  const [chartData, setChartData] = useState([]);
  const [playerNames, setPlayerNames] = useState([]);
  const [loading, setLoading] = useState(true);

  // A list of distinct colors for the chart lines
  const lineColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_performance_chart_data');
      if (error) {
        console.error("Error fetching chart data:", error);
        setLoading(false);
        return;
      }

      if (!data) {
        setLoading(false);
        return;
      }

      // Process the data to pivot it for the chart
      const formattedData = [];
      const players = [...new Set(data.map(item => item.username))];
      setPlayerNames(players);

      for (let i = 1; i <= 14; i++) {
        const weekEntry = { week: `Wk ${i}` };
        players.forEach(player => {
          const weekData = data.find(d => d.week === i && d.username === player);
          weekEntry[player] = weekData ? weekData.wins : 0;
        });
        formattedData.push(weekEntry);
      }
      
      setChartData(formattedData);
      setLoading(false);
    };
    fetchChartData();
  }, []);

  if (loading) return <Spinner />;

  return (
    <Box mt={10}>
      <Heading size="lg" mb={4}>Performance Over Time</Heading>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis allowDecimals={false} label={{ value: 'Correct Picks', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          {playerNames.map((player, index) => (
            <Line
              key={player}
              type="monotone"
              dataKey={player}
              stroke={lineColors[index % lineColors.length]}
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};


export default function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_league_stats');

      if (error) {
        console.error('Error fetching league stats:', error);
      } else {
        setStats(data);
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <VStack>
        <Spinner />
        <Text>Calculating league stats...</Text>
      </VStack>
    );
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Season Leaders
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        {stats?.oracle && (
          <StatCard
            title="The Oracle"
            description="Most total correct picks for the season."
            stat={stats.oracle}
            icon="🔮"
            helpText=" Correct Picks"
          />
        )}
        {stats?.consistent && (
          <StatCard
            title="Mr. Consistent"
            description="Highest overall pick accuracy."
            stat={stats.consistent}
            icon="🎯"
            helpText="%"
          />
        )}
        {stats?.pooper_star && (
          <StatCard
            title="The Pooper Star"
            description="Most weeks with the lowest score."
            stat={stats.pooper_star}
            icon="💩"
            helpText=" Poopstars"
          />
        )}
        {stats?.perfectionist && (
          <StatCard
            title="Perfectionist"
            description="Most weeks with a perfect score."
            stat={stats.perfectionist}
            icon="⭐"
            helpText=" Perfect Weeks"
          />
        )}
        {stats?.homer && (
          <StatCard
            title="The Homer"
            description="Most picks for their favorite team."
            stat={stats.homer}
            icon="🏠"
            helpText=" Picks"
          />
        )}
        {stats?.biggest_blowout && (
          <StatCard
            title="Biggest Blowout Call"
            description="Correctly picked the game with the largest point differential."
            stat={stats.biggest_blowout}
            icon="💣"
            helpText=" Point Win"
          />
        )}
        {stats?.price_is_right && (
          <StatCard
            title="The Price is Right"
            description="Lowest average tiebreaker differential (min. 4 weeks)."
            stat={stats.price_is_right}
            icon="💰"
            helpText=" Avg Diff"
          />
        )}
        {stats?.road_warrior && (
          <StatCard
            title="Road Warrior"
            description="Most correct picks for away teams."
            stat={stats.road_warrior}
            icon="🚌"
            helpText=" Road Wins"
          />
        )}
        {stats?.rivalry_king && (
          <StatCard
            title="Rivalry King"
            description="Most correct picks in rivalry games."
            stat={stats.rivalry_king}
            icon="👑"
            helpText=" Rivalry Wins"
          />
        )}
        {stats?.front_runner && (
          <StatCard
            title="Frontrunner"
            description="Most correct picks for home teams."
            stat={stats.front_runner}
            icon="🏟️"
            helpText=" Home Wins"
          />
        )}
      </SimpleGrid>

      {/* Add the new chart component here */}
      <PerformanceChart />
    </Box>
  );
}
