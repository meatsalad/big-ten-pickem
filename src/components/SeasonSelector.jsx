import React from 'react';
import { useSeason } from '../context/SeasonContext';
import { Button, ButtonGroup, HStack, Text } from '@chakra-ui/react';

export default function SeasonSelector() {
  const { availableSeasons, selectedSeason, setSelectedSeason } = useSeason();

  // Don't render the component if there's only one season or none
  if (availableSeasons.length <= 1) {
    return null;
  }

  return (
    <HStack mb={4}>
      <Text fontWeight="bold">Season:</Text>
      <ButtonGroup isAttached variant="outline" size="sm">
        {availableSeasons.map((season) => (
          <Button
            key={season}
            variant={selectedSeason === season ? 'solid' : 'outline'}
            colorScheme={selectedSeason === season ? 'brand' : 'gray'}
            onClick={() => setSelectedSeason(season)}
          >
            {season}
          </Button>
        ))}
      </ButtonGroup>
    </HStack>
  );
}
