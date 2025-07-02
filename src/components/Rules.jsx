import {
  Box,
  Heading,
  Text,
  VStack,
  OrderedList,
  ListItem,
} from '@chakra-ui/react';

export default function Rules() {
  return (
    <Box>
      <VStack spacing={8} align="start">
        <Box>
          <Heading as="h2" size="lg" mb={3}>
            General Rules
          </Heading>
          <OrderedList spacing={3}>
            <ListItem>
              All picks must be in by kickoff of the first Big Ten game of the
              week - NO EXCEPTIONS.
            </ListItem>
            <ListItem>
              The participant with the most correct picks wins the week.
            </ListItem>
            <ListItem>
              All losers must pay $10 to the week's winner.
            </ListItem>
            <ListItem>
              If any participant picks a perfect week, all losers must pay
              double the weekly buy-in to the week's winner.
            </ListItem>
          </OrderedList>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            Tiebreaker
          </Heading>
          <OrderedList spacing={3}>
            <ListItem>
              If point totals still result in a tie, score predictions will
              be subtracted from the actual game scores. The lowest total wins.
            </ListItem>
            <ListItem>
              If any participants are tied after applying the above rules, the
              end result is a split of the winnings.
            </ListItem>
          </OrderedList>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={3}>
            The Poopstar 💩
          </Heading>
          <OrderedList spacing={3}>
            <ListItem>
              The participant with the least amount of correct picks each week is
              the Poopstar winner.
            </ListItem>
            <ListItem>
              In the event multiple participants are tied for the lowest total,
              see Tiebreaker rule #1. The HIGHEST total score wins Poopstar.
            </ListItem>
            <ListItem>
              If a tie still exists, all participants tied for the lowest
              total will receive a Poopstar for the week.
            </ListItem>
          </OrderedList>
        </Box>
      </VStack>
    </Box>
  );
}