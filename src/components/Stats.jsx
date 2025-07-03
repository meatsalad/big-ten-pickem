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
  Center,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';

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

  // Check if any stats have been earned
  const hasAnyStats = stats && Object.values(stats).some(value => value !== null);

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Season Leaders
      </Heading>
      
      {hasAnyStats ? (
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
      ) : (
        <Center p={10} borderWidth="1px" borderRadius="lg" bg="gray.50">
          <VStack>
            <InfoIcon boxSize="50px" color="blue.500" />
            <Heading size="md" mt={4}>No Awards Yet!</Heading>
            <Text>Stats and awards will appear here as the season progresses.</Text>
          </VStack>
        </Center>
      )}
    </Box>
  );
}
