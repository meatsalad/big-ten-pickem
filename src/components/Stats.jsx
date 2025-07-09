import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSeason } from '../context/SeasonContext';
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
} from '@chakra-ui/react';
// --- CORRECTED IMPORTS START ---
import { FaTrophy, FaPoop, FaHeart } from 'react-icons/fa';
import { GiCrystalBall } from 'react-icons/gi'; // Use GiCrystalBall from Game Icons
// --- CORRECTED IMPORTS END ---

// A presentational component for displaying a single stat.
const StatCard = ({ title, user, value, icon }) => {
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
      <Box color="gray.500" fontSize="2xl">
        {icon}
      </Box>
      <Text fontSize="md" color="gray.500">
        {title}
      </Text>
      <Text fontSize="2xl" fontWeight="bold">
        {user}
      </Text>
      <Text fontSize="lg">{value}</Text>
    </VStack>
  );
};


const Stats = () => {
  const { selectedSeason } = useSeason();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map stat keys to titles and icons for display
  const statDisplayMap = {
    // --- CORRECTED ICON USAGE START ---
    oracle: { title: 'The Oracle', icon: <GiCrystalBall /> },
    // --- CORRECTED ICON USAGE END ---
    consistent: { title: 'Mr. Consistent', icon: <FaTrophy /> },
    pooper_star: { title: 'Poopstar', icon: <FaPoop /> },
    homer: { title: 'The Homer', icon: <FaHeart /> },
    // Add other stats here...
  };


  useEffect(() => {
    if (!selectedSeason) return;

    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      setStats(null);

       try {
        const response = await fetch(`/.netlify/functions/get-league-stats?season=${selectedSeason}`);
        
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
  }, [selectedSeason]);

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
    
    if (!stats || Object.values(stats).every(val => val === null)) {
        return <Text>No stats available for the {selectedSeason} season yet.</Text>
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {Object.entries(stats)
          .filter(([key, value]) => value && statDisplayMap[key])
          .map(([key, value]) => (
            <StatCard
              key={key}
              title={statDisplayMap[key].title}
              icon={statDisplayMap[key].icon}
              user={value.username}
              value={`${
                key === 'consistent' 
                ? parseFloat(value.value).toFixed(2) + '%' 
                : value.value
              }`}
            />
          ))}
      </SimpleGrid>
    );
  };

  return (
    <Box>
      <Heading as="h1" mb={6}>
        League Stats: {selectedSeason} Season
      </Heading>
      {renderContent()}
    </Box>
  );
};

export default Stats;