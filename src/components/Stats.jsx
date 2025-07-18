import React, { useState, useEffect } from 'react';
import { useSeason } from '../context/SeasonContext';
import { useLeague } from '../context/LeagueContext'; // 1. Import the new hook
import PageControls from './PageControls';
import {
  Box,
  Heading,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  VStack,
  useColorModeValue,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { FaTrophy, FaPoop, FaHeart, FaHome, FaBus, FaHandshake, FaDollarSign, FaBomb, FaUserSecret } from 'react-icons/fa';
import { GiCrystalBall } from 'react-icons/gi';


const StatCard = ({ title, user, value, icon, description }) => {
  const bgColor = useColorModeValue('gray.100', 'gray.700');
  return (
    <VStack
      p={5}
      bg={bgColor}
      borderRadius="lg"
      boxShadow="md"
      align="flex-start"
      spacing={1}
    >
      <HStack spacing={3} align="center">
        <Icon as={icon} w={6} h={6} color="brand.500" />
        <Heading size="md">{title}</Heading>
      </HStack>
      <Text fontSize="sm" color="gray.500" fontStyle="italic" pb={2}>
        {description}
      </Text>
      <Text fontSize="xl" fontWeight="bold">
        {user}
      </Text>
      <Text fontSize="lg">{value}</Text>
    </VStack>
  );
};


export default function Stats() {
  const { selectedSeason } = useSeason();
  const { selectedLeague } = useLeague(); // 2. Get the selected league from context
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const statDisplayMap = {
    oracle: { title: 'The Oracle', icon: GiCrystalBall, description: 'Most total correct picks for the season.' },
    consistent: { title: 'Mr. Consistent', icon: FaTrophy, description: 'Highest picking percentage (min. 5 weeks played).' },
    pooper_star: { title: 'Pooperstar', icon: FaPoop, description: 'Most weeks with the lowest score.' },
    homer: { title: 'The Homer', icon: FaHeart, description: 'Most picks for their declared favorite team.'},
    road_warrior: { title: 'Road Warrior', icon: FaBus, description: 'Most correct picks on away teams.'},
    front_runner: { title: 'Front Runner', icon: FaHome, description: 'Most correct picks on home teams.'},
    perfectionist: { title: 'The Perfectionist', icon: FaTrophy, description: 'Most weeks with a perfect score.'},
    rivalry_king: { title: 'Rivalry King', icon: FaHandshake, description: 'Most correct picks in designated rivalry games.'},
    price_is_right: { title: 'The Price is Right', icon: FaDollarSign, description: 'Lowest average score differential in tiebreakers.'},
    biggest_blowout: { title: 'Biggest Blowout', icon: FaBomb, description: 'Correctly picked the game with the largest margin of victory.'},
    contrarian: { title: 'The Contrarian', icon: FaUserSecret, description: 'Most correct picks on unpopular teams.'}
  };


  useEffect(() => {
    // 3. Don't run if either season or league isn't ready
    if (!selectedSeason || !selectedLeague) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      setStats(null);

       try {
        // 4. Add the league_id to the API call
        const response = await fetch(`/.netlify/functions/get-league-stats?season=${selectedSeason}&league_id=${selectedLeague.id}`);
        if (!response.ok) {
          const errorBody = await response.json();
          throw new Error(errorBody.message || `Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching league stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedSeason, selectedLeague]); // 5. Add selectedLeague to the dependency array

  const renderContent = () => {
    if (loading) {
      return <Spinner size="xl" />;
    }
    if (error) {
      return (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          There was an error fetching league stats: {error}
        </Alert>
      );
    }
    
    const hasStats = stats && Object.values(stats).some(val => val !== null);
    if (!hasStats) {
        return <Text>No stats available for this season yet.</Text>
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {Object.entries(stats)
          .filter(([key, value]) => value && statDisplayMap[key])
          .map(([key, value]) => {
            const displayInfo = statDisplayMap[key];
            const statValue = typeof value.value === 'number' ? value.value.toFixed(1) : value.value;
            return (
              <StatCard
                key={key}
                title={displayInfo.title}
                icon={displayInfo.icon}
                description={displayInfo.description}
                user={value.username}
                value={`${
                  key === 'consistent' || key === 'contrarian'
                  ? statValue + '%' 
                  : key === 'price_is_right'
                  ? `${statValue} pts avg diff`
                  : value.value
                }`}
              />
            )
          })}
      </SimpleGrid>
    );
  };

  return (
    <Box>
      <Heading as="h1" mb={4}>
        League Stats
      </Heading>
      <PageControls />
      {renderContent()}
    </Box>
  );
};