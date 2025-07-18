import React, { useState, useEffect } from 'react';
import { Box, Text, HStack, Stat, StatNumber, StatLabel, useColorModeValue } from '@chakra-ui/react';
import { FaRegClock } from 'react-icons/fa';

const CountdownTimer = ({ games }) => {
  // Find the earliest game time from the list of games for the week
  const getLockTime = () => {
    const validGameTimes = games
      .map(g => g.game_time)
      .filter(t => t) // Filter out any null/undefined times
      .map(t => new Date(t));
    
    if (validGameTimes.length === 0) return null; // No valid times found
    
    return new Date(Math.min(...validGameTimes));
  };

  const [lockTime] = useState(getLockTime());
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0
  });

  useEffect(() => {
    if (!lockTime || lockTime < new Date()) {
      return; // Don't start a timer if the deadline is null or in the past
    }

    const calculateTimeLeft = () => {
      const difference = lockTime - new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(timer);
  }, [lockTime]);

  // If there's no lock time or the time has passed, render nothing
  if (!lockTime || lockTime < new Date()) {
    return null;
  }

  const boxBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Box p={4} borderRadius="lg" bg={boxBg} mb={4}>
      <HStack spacing={4} justify="center">
        <FaRegClock size="2em" />
        <Text fontWeight="bold">Picks Lock In:</Text>
        <HStack spacing={3}>
          <Stat>
            <StatNumber fontSize="xl">{timeLeft.days}</StatNumber>
            <StatLabel fontSize="xs">Days</StatLabel>
          </Stat>
          <Stat>
            <StatNumber fontSize="xl">{timeLeft.hours}</StatNumber>
            <StatLabel fontSize="xs">Hours</StatLabel>
          </Stat>
          <Stat>
            <StatNumber fontSize="xl">{timeLeft.minutes}</StatNumber>
            <StatLabel fontSize="xs">Minutes</StatLabel>
          </Stat>
          <Stat>
            <StatNumber fontSize="xl">{timeLeft.seconds}</StatNumber>
            <StatLabel fontSize="xs">Seconds</StatLabel>
          </Stat>
        </HStack>
      </HStack>
    </Box>
  );
};

export default CountdownTimer;