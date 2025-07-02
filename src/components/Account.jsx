import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { BIG_TEN_TEAMS } from '../lib/teams';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  Avatar,
  Spinner,
  HStack,
  Select,
} from '@chakra-ui/react';

export default function Account() {
  const { user, refreshProfile } = useAuth(); // <-- Get the refresh function
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, favorite_team')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn(error);
      } else if (data) {
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url || '');
        setFavoriteTeam(data.favorite_team || '');
      }
      setLoading(false);
    };

    getProfile();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username, favorite_team: favoriteTeam })
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Error updating profile.', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Profile updated!', status: 'success' });
      await refreshProfile(); // <-- Call the refresh function here
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const allowedTypes = ['png', 'jpg', 'jpeg'];
    if (!allowedTypes.includes(fileExt.toLowerCase())) {
      toast({ title: 'Invalid file type.', description: 'Please upload a PNG or JPG image.', status: 'error' });
      return;
    }
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: 'File is too large.', description: 'Please upload an image smaller than 2MB.', status: 'error' });
      return;
    }
    setUploading(true);
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
    if (uploadError) {
      toast({ title: 'Error uploading avatar.', description: uploadError.message, status: 'error' });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    if (updateError) {
      toast({ title: 'Error updating avatar URL.', description: updateError.message, status: 'error' });
    } else {
      setAvatarUrl(publicUrl);
      toast({ title: 'Avatar updated!', status: 'success' });
      await refreshProfile(); // <-- Also refresh after avatar upload
    }
    setUploading(false);
  };


  if (loading && !username) {
    return <Spinner />;
  }

  return (
    <Box>
      <VStack spacing={8} align="start">
        <Box>
          <Heading size="md" mb={4}>Avatar</Heading>
          <HStack spacing={4}>
            <Avatar size="xl" src={avatarUrl} />
            <FormControl>
              <FormLabel htmlFor="avatar-upload" cursor="pointer">
                <Button as="span" isLoading={uploading}>
                  Upload New Avatar
                </Button>
              </FormLabel>
              <Input id="avatar-upload" type="file" accept="image/png, image/jpeg" onChange={handleAvatarUpload} display="none" />
            </FormControl>
          </HStack>
        </Box>

        <Box as="form" onSubmit={handleUpdateProfile} w="100%" maxW="md">
          <VStack spacing={4} align="start">
            <Heading size="md">Profile</Heading>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input type="text" value={user.email} isDisabled />
            </FormControl>
            <FormControl>
              <FormLabel>Username</FormLabel>
              <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g., The Commish" />
            </FormControl>
            
            <FormControl>
              <FormLabel>Favorite Team</FormLabel>
              <Select
                placeholder="Select your team"
                value={favoriteTeam}
                onChange={(e) => setFavoriteTeam(e.target.value)}
              >
                {BIG_TEN_TEAMS.map((team) => (
                  <option key={team.name} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <Button type="submit" colorScheme="blue" isLoading={loading}>
              Update Profile
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}
