import React from 'react';
import { useSeason } from '../context/SeasonContext';
import {
  Box,
  Button,
  ButtonGroup,
  HStack,
  IconButton,
  Text,
  Flex,
  Divider,
} from '@chakra-ui/react';
import { ArrowLeftIcon, ArrowRightIcon } from '@chakra-ui/icons';

export default function PageControls({ showWeekNav = false }) {
  const {
    availableSeasons,
    selectedSeason,
    setSelectedSeason,
    availableWeeks,
    selectedWeek,
    setSelectedWeek,
  } = useSeason();

  const handleWeekChange = (direction) => {
    const currentIndex = availableWeeks.indexOf(selectedWeek);
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < availableWeeks.length) {
      setSelectedWeek(availableWeeks[nextIndex]);
    }
  };

  return (
    <Box mb={6}>
      <Flex direction={{base: 'column', md: 'row'}} justify="space-between" align="center">
        {/* Season Selector */}
        {availableSeasons.length > 1 && (
          <ButtonGroup isAttached variant="outline" size="sm">
            {availableSeasons.map(season => (
              <Button
                key={season}
                colorScheme="brand" // <-- THIS IS THE ONLY CHANGE
                variant={season === selectedSeason ? 'solid' : 'outline'}
                onClick={() => setSelectedSeason(season)}
              >
                {season}
              </Button>
            ))}
          </ButtonGroup>
        )}

        {/* Week Navigator (conditionally rendered) */}
        {showWeekNav && availableWeeks.length > 0 && (
          <HStack my={{base: 4, md: 0}}>
            <IconButton
              aria-label="Previous Week"
              icon={<ArrowLeftIcon />}
              onClick={() => handleWeekChange(-1)}
              isDisabled={availableWeeks.indexOf(selectedWeek) === 0}
              size="sm"
            />
            <Text fontWeight="bold" fontSize="lg">Week {selectedWeek}</Text>
            <IconButton
              aria-label="Next Week"
              icon={<ArrowRightIcon />}
              onClick={() => handleWeekChange(1)}
              isDisabled={!selectedWeek || availableWeeks.indexOf(selectedWeek) === availableWeeks.length - 1}
              size="sm"
            />
          </HStack>
        )}
      </Flex>
      <Divider mt={6} />
    </Box>
  );
}