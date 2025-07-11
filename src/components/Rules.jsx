import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Box,
  Heading,
  Text,
  VStack,
  OrderedList,
  ListItem,
  Spinner,
  HStack,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { FaGavel, FaBalanceScale, FaPoop } from 'react-icons/fa';

export default function Rules() {
  const [settings, setSettings] = useState({
    weekly_buy_in: 10,
    perfect_week_multiplier: 2
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('settings').select('setting_name, value');
      if (error) {
        console.error("Could not fetch settings", error);
      } else if (data) {
        const settingsMap = data.reduce((acc, setting) => {
          if (setting.value !== null) { // Only map settings that have a numeric value
            acc[setting.setting_name] = setting.value;
          }
          return acc;
        }, {});
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <Box>
        <Heading as="h1" size="xl" mb={8}>League Rules</Heading>
        <VStack spacing={8} align="start" divider={<Divider />}>
            <Box>
                <HStack mb={3}>
                    <Icon as={FaGavel} w={5} h={5} color="brand.500" />
                    <Heading as="h2" size="lg">General Rules</Heading>
                </HStack>
                <OrderedList spacing={3} pl={6}>
                    <ListItem>
                        All picks must be in by kickoff of the first Big Ten game of the week - NO EXCEPTIONS.
                    </ListItem>
                    <ListItem>
                        The participant with the most correct picks wins the week.
                    </ListItem>
                    <ListItem>
                        All losers must pay <strong>${settings.weekly_buy_in}</strong> to the week's winner.
                    </ListItem>
                    <ListItem>
                        If any participant picks a perfect week, all losers must pay double (<strong>${settings.weekly_buy_in * settings.perfect_week_multiplier}</strong>) the weekly buy-in to that winner.
                    </ListItem>
                </OrderedList>
            </Box>

            <Box>
                <HStack mb={3}>
                    <Icon as={FaBalanceScale} w={5} h={5} color="brand.500" />
                    <Heading as="h2" size="lg">Tiebreaker</Heading>
                </HStack>
                <OrderedList spacing={3} pl={6}>
                    <ListItem>
                        If point totals still result in a tie, score predictions will be subtracted from the actual game scores. The lowest total differential wins.
                    </ListItem>
                    <ListItem>
                        If any participants are tied after applying the above rule, the end result is a split of the winnings.
                    </ListItem>
                </OrderedList>
            </Box>

            <Box>
                <HStack mb={3}>
                    <Icon as={FaPoop} w={5} h={5} color="brand.500" />
                    <Heading as="h2" size="lg">The Poopstar 💩</Heading>
                </HStack>
                <OrderedList spacing={3} pl={6}>
                    <ListItem>
                        The participant with the least amount of correct picks each week is the Poopstar winner.
                    </ListItem>
                    <ListItem>
                        In the event multiple participants are tied for the lowest total, see Tiebreaker rule #1. The HIGHEST total score differential wins Poopstar.
                    </ListItem>
                    <ListItem>
                        If a tie still exists, all participants tied for the lowest total will receive a Poopstar for the week.
                    </ListItem>
                </OrderedList>
            </Box>
        </VStack>
    </Box>
  );
}