import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLeague } from '../context/LeagueContext';
import { BIG_TEN_TEAMS } from '../lib/teams';
import { Link as RouterLink } from 'react-router-dom';
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
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Text,
  List,
  ListItem,
  ListIcon,
  Flex,
  Spacer,
  Tag,
  IconButton,
  useClipboard, // 1. Import new hooks and components
} from '@chakra-ui/react';
import { FaTrophy, FaPlus, FaUserFriends, FaCopy } from 'react-icons/fa'; // 2. Import Copy icon


// 3. UPDATED League Management Component
const LeagueManagementSection = ({ availableLeagues }) => {
  return (
      <Box w="100%" maxW="md">
          <Heading size="md" mb={4}>League Management</Heading>
          <Text mb={2}>You are a member of the following leagues:</Text>
          <List spacing={3} mb={4}>
              {availableLeagues.length > 0 ? (
                  availableLeagues.map(league => (
                      <LeagueListItem key={league.id} league={league} />
                  ))
              ) : (
                  <Text fontStyle="italic">You haven't joined any leagues yet.</Text>
              )}
          </List>
          <HStack spacing={4}>
              <Button 
                  as={RouterLink} 
                  to="/create-league" 
                  leftIcon={<FaPlus />}
                  colorScheme="brand"
              >
                  Create a League
              </Button>
              <Button 
                  as={RouterLink}
                  to="/join-league"
                  leftIcon={<FaUserFriends />}
              >
                  Join a League
              </Button>
          </HStack>
      </Box>
  );
};

// 4. NEW Sub-component for the list item to handle copy logic cleanly
const LeagueListItem = ({ league }) => {
    const { hasCopied, onCopy } = useClipboard(league.invite_code);
    const toast = useToast();

    const handleCopy = () => {
        onCopy();
        toast({
            title: "Copied!",
            description: "Invite code has been copied to your clipboard.",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
    };
    
    return (
        <ListItem>
            <Flex align="center">
                <HStack>
                    <ListIcon as={FaTrophy} color="brand.500" />
                    <Text>{league.name}</Text>
                </HStack>
                <Spacer />
                {league.is_creator && (
                    <HStack>
                        <Tag size="md" colorScheme="teal" variant="solid">
                            Code: {league.invite_code}
                        </Tag>
                        <IconButton
                            aria-label="Copy invite code"
                            icon={<FaCopy />}
                            size="sm"
                            onClick={handleCopy}
                            variant="ghost"
                        />
                    </HStack>
                )}
            </Flex>
        </ListItem>
    );
};


const PasswordUpdateForm = () => {
    const toast = useToast();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast({ title: 'Password must be at least 6 characters long.', status: 'warning' });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ title: 'Passwords do not match.', status: 'error' });
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            toast({ title: 'Error updating password.', description: error.message, status: 'error' });
        } else {
            toast({ title: 'Password updated successfully!', status: 'success' });
            setNewPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    return (
        <Box as="form" onSubmit={handlePasswordUpdate} w="100%" maxW="md">
            <VStack spacing={4} align="start">
                <Heading size="md">Change Password</Heading>
                <FormControl>
                    <FormLabel>New Password</FormLabel>
                    <Input 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                    />
                </FormControl>
                <FormControl>
                    <FormLabel>Confirm New Password</FormLabel>
                    <Input 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                    />
                </FormControl>
                <Button type="submit" colorScheme="brand" isLoading={loading}>
                    Change Password
                </Button>
            </VStack>
        </Box>
    );
};

const DeleteAccountForm = () => {
    const { user, profile, signOut, session } = useAuth();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [confirmationText, setConfirmationText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleDeleteAccount = async () => {
        if (confirmationText !== profile?.username) {
            toast({ title: 'Confirmation text does not match username.', status: 'error' });
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('/.netlify/functions/delete-user', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete account.');
            }
            toast({ title: 'Account deleted successfully.', status: 'success', duration: 5000, isClosable: true });
            signOut(); 
        } catch (error) {
            toast({ title: 'Error deleting account.', description: error.message, status: 'error' });
            setLoading(false);
        }
    };
    
    return (
        <Box w="100%" maxW="md" p={4} borderWidth="1px" borderColor="red.500" borderRadius="md">
            <VStack spacing={4} align="start">
                <Heading size="md" color="red.500">Danger Zone</Heading>
                <Text>Deleting your account is permanent and cannot be undone.</Text>
                <Button colorScheme="red" onClick={onOpen}>Delete My Account</Button>
            </VStack>
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Are you absolutely sure?</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text mb={4}>This action is irreversible. All of your picks and results will be erased. To confirm, please type your username "<strong>{profile?.username}</strong>" below.</Text>
                        <FormControl>
                            <Input 
                                placeholder="Type your username to confirm"
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                            />
                        </FormControl>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                        <Button 
                            colorScheme="red" 
                            onClick={handleDeleteAccount}
                            isLoading={loading}
                            isDisabled={confirmationText !== profile?.username}
                        >
                            I understand, delete my account
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};


export default function Account() {
  const { user, refreshProfile } = useAuth();
  const { availableLeagues, loadingLeagues } = useLeague();
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

    if (user) {
        getProfile();
    }
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
      await refreshProfile();
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
      await refreshProfile();
    }
    setUploading(false);
  };

  if (loading || loadingLeagues) {
    return <Spinner />;
  }

  return (
    <Box>
      <VStack spacing={8} divider={<Divider />} align="start">
        <LeagueManagementSection availableLeagues={availableLeagues} />

        <Box>
          <Heading size="md" mb={4}>Avatar</Heading>
          <HStack spacing={4}>
            <Avatar size="xl" src={avatarUrl} name={username || user.email} />
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
            <Button type="submit" colorScheme="brand" isLoading={loading}>
              Update Profile
            </Button>
          </VStack>
        </Box>

        <PasswordUpdateForm />
        <DeleteAccountForm />
        
      </VStack>
    </Box>
  );
}