import React from 'react';
import {
  Box,
  Text,
  Button,
  VStack,
  HStack,
  Image,
  useColorModeValue,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import TEAM_LOGOS from '../data/team-logos.json'; // ✅ Import our local logo data

export default function GameCard({ game, myPick, onPick }) {
  const isLocked = new Date(game.game_time) < new Date();
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  const gameTimeDisplay = game.game_time
    ? format(new Date(game.game_time), 'EEE, MMM d, h:mm a')
    : 'Date & Time TBD';

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      bg={cardBg}
      boxShadow="md"
      opacity={isLocked ? 0.6 : 1}
    >
      <VStack spacing={3}>
        <Text fontSize="sm" color={textColor}>
          {gameTimeDisplay}
        </Text>
        <HStack justifyContent="space-around" w="full" alignItems="center">
          {/* Away Team */}
          <VStack w="40%">
            <Image
              boxSize="50px"
              objectFit="contain"
              // ✅ Look up the logo from our local JSON file
              src={TEAM_LOGOS[game.away_team]}
              alt={`${game.away_team} logo`}
              fallbackSrc="https://via.placeholder.com/50" // Fallback now works for teams not in our JSON
            />
            <Text fontWeight="bold" textAlign="center">{game.away_team}</Text>
          </VStack>

          <Text fontSize="xl" color={textColor}>@</Text>

          {/* Home Team */}
          <VStack w="40%">
            <Image
              boxSize="50px"
              objectFit="contain"
              // ✅ Look up the logo from our local JSON file
              src={TEAM_LOGOS[game.home_team]}
              alt={`${game.home_team} logo`}
              fallbackSrc="https://via.placeholder.com/50"
            />
            <Text fontWeight="bold" textAlign="center">{game.home_team}</Text>
          </VStack>
        </HStack>

        <HStack w="full">
          <Button
            w="full"
            colorScheme={myPick?.selected_team === game.away_team ? 'brand' : 'gray'}
            onClick={() => onPick(game, game.away_team)}
            isDisabled={isLocked}
          >
            Pick {game.away_team}
          </Button>
          <Button
            w="full"
            colorScheme={myPick?.selected_team === game.home_team ? 'brand' : 'gray'}
            onClick={() => onPick(game, game.home_team)}
            isDisabled={isLocked}
          >
            Pick {game.home_team}
          </Button>
        </HStack>
        {isLocked && <Text fontSize="xs" color="red.500">This game has started. Picks are locked.</Text>}
      </VStack>
    </Box>
  );
}