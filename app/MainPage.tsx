import React, { useState, useEffect } from 'react';
import { Button, Title, Spinner, Cell, List, Card, Avatar } from '@telegram-apps/telegram-ui';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { supabase } from '@/lib/supabase';
import * as RadixAvatar from '@radix-ui/react-avatar';
import * as Popover from '@radix-ui/react-popover';
import { useThemeParams } from '@/lib/ThemeUtils';

interface TelegramWebAppUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface LaunchParams {
  tgWebAppInitDataUnsafe?: {
    user?: TelegramWebAppUser;
  };
  user?: TelegramWebAppUser;
}

interface WaterIntake {
  id: string;
  userId: string;
  amount: number;
  timestamp: string;
  date: string;
}

interface UserProfile {
  userId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  dailyGoal: number;
  created_at?: string;
  photoUrl?: string;
}

export const MainPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayIntake, setTodayIntake] = useState<WaterIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalToday, setTotalToday] = useState(0);
  const [goalInput, setGoalInput] = useState('');
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramWebAppUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const themeParams = useThemeParams();
  
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const lp = retrieveLaunchParams() as unknown as LaunchParams;
        const user = lp.user || lp.tgWebAppInitDataUnsafe?.user || window.Telegram?.WebApp?.initDataUnsafe?.user;
        
        if (!user) {
          console.error('No user found in launch params');
          setError('Unable to retrieve user data from Telegram');
          setLoading(false);
          return;
        }

        setTelegramUser(user);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('userId', user.id.toString())
          .single();

        let userProfile = profileData;

        if (!userProfile || profileError) {
          const newProfile: UserProfile = {
            userId: user.id.toString(),
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            dailyGoal: 2000,
            photoUrl: user.photo_url
          };
          
          const { data: insertedProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select();

          if (insertError) {
            console.error('Error creating profile:', insertError);
            setError('Failed to create user profile');
          } else if (insertedProfile && insertedProfile.length > 0) {
            userProfile = insertedProfile[0];
          }
        } else {
          if (user.photo_url !== userProfile.photoUrl || 
              user.first_name !== userProfile.firstName ||
              user.last_name !== userProfile.lastName ||
              user.username !== userProfile.username) {
            
            const updates = {
              firstName: user.first_name,
              lastName: user.last_name,
              username: user.username,
              photoUrl: user.photo_url
            };
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update(updates)
              .eq('userId', user.id.toString());
              
            if (updateError) {
              console.error('Error updating profile:', updateError);
            } else {
              userProfile = { ...userProfile, ...updates };
            }
          }
        }

        const { data: intakeData, error: intakeError } = await supabase
          .from('water_intake')
          .select('*')
          .eq('userId', user.id.toString())
          .eq('date', today);

        if (intakeError) {
          console.error('Error fetching intake:', intakeError);
          setError('Failed to fetch water intake data');
        }

        const total = (intakeData || []).reduce((sum, entry) => sum + entry.amount, 0);

        setProfile(userProfile);
        setTodayIntake(intakeData || []);
        setTotalToday(total);
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const addWaterIntake = async (amount: number) => {
    if (!profile) return;

    try {
      const newIntake: Partial<WaterIntake> = {
        userId: profile.userId,
        amount,
        date: today,
        timestamp: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('water_intake')
        .insert(newIntake)
        .select();

      if (error) {
        console.error('Error adding water intake:', error);
        setError('Failed to save water intake');
        return;
      }

      if (data && data.length > 0) {
        setTodayIntake([...todayIntake, data[0]]);
        setTotalToday(totalToday + amount);
      }
    } catch (err) {
      console.error('Unexpected error in addWaterIntake:', err);
      setError('Failed to add water intake');
    }
  };

  const updateDailyGoal = async () => {
    if (!profile || !goalInput) return;
    
    try {
      const newGoal = parseInt(goalInput, 10);
      if (isNaN(newGoal) || newGoal <= 0) return;
      
      const { error } = await supabase
        .from('profiles')
        .update({ dailyGoal: newGoal })
        .eq('userId', profile.userId);

      if (error) {
        console.error('Error updating goal:', error);
        setError('Failed to update daily goal');
        return;
      }

      setProfile({ ...profile, dailyGoal: newGoal });
      setShowGoalInput(false);
      setGoalInput('');
    } catch (err) {
      console.error('Unexpected error in updateDailyGoal:', err);
      setError('Failed to update daily goal');
    }
  };

  const getProgressPercentage = () => {
    if (!profile) return 0;
    return Math.min(Math.round((totalToday / profile.dailyGoal) * 100), 100);
  };

  const toggleProfilePopover = () => {
    setShowProfilePopover(!showProfilePopover);
  };

  if (loading) {
    return (
      <div className="page-container center-content">
        <Spinner size="m" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container center-content">
        <div className="error-message">
          <Title level="2">Error</Title>
          <p>{error}</p>
          <Button size="m" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Choose between Telegram UI and Radix UI for avatar
  const AvatarComponent = telegramUser?.photo_url ? (
    // Try with Telegram UI first
    <div className="profile-avatar" onClick={toggleProfilePopover}>
      <Avatar size={40} src={telegramUser.photo_url} />
    </div>
  ) : (
    // Fallback to Radix UI Avatar
    <RadixAvatar.Root className="profile-avatar" onClick={toggleProfilePopover}>
      <RadixAvatar.Image
        className="avatar-image"
        src={telegramUser?.photo_url}
        alt={telegramUser?.first_name}
      />
      <RadixAvatar.Fallback className="avatar-fallback" delayMs={600}>
        {telegramUser?.first_name?.charAt(0) || 'U'}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );

  return (
    <div className="page-container">
      <div className="header-container">
        <Title level="1" className="mb-4">
          Water Reminder
        </Title>
        
        <div className="profile-container">
          <Popover.Root open={showProfilePopover} onOpenChange={setShowProfilePopover}>
            <Popover.Trigger asChild>
              {AvatarComponent}
            </Popover.Trigger>
            
            <Popover.Portal>
              <Popover.Content className="profile-popover" sideOffset={5}>
                <div className="profile-header">
                  <RadixAvatar.Root className="profile-avatar-large">
                    <RadixAvatar.Image
                      className="avatar-image"
                      src={telegramUser?.photo_url}
                      alt={telegramUser?.first_name}
                    />
                    <RadixAvatar.Fallback className="avatar-fallback-large">
                      {telegramUser?.first_name?.charAt(0) || 'U'}
                    </RadixAvatar.Fallback>
                  </RadixAvatar.Root>
                  
                  <div className="profile-name">
                    <h3>{telegramUser?.first_name} {telegramUser?.last_name}</h3>
                    {telegramUser?.username && <p>@{telegramUser.username}</p>}
                  </div>
                </div>
                
                <div className="profile-details">
                  <p><strong>User ID:</strong> {telegramUser?.id}</p>
                  <p><strong>Daily Goal:</strong> {profile?.dailyGoal}ml</p>
                  <p><strong>Today's Progress:</strong> {getProgressPercentage()}%</p>
                </div>
                
                <Button size="s" mode="outline" onClick={() => setShowProfilePopover(false)}>Close</Button>
                <Popover.Arrow className="popover-arrow" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </div>

      <Card>
        <div className="water-goal-container">
          <div className="water-progress">
            <div 
              className="water-level" 
              style={{ 
                height: `${getProgressPercentage()}%`,
                backgroundColor: themeParams.button_color || '#50a8eb'
              }}
            ></div>
            <div className="water-text">
              <div className="water-amount">{totalToday}ml</div>
              <div className="water-goal">of {profile?.dailyGoal}ml</div>
            </div>
          </div>
          <div 
            className="water-percentage"
            style={{ color: themeParams.button_color || '#50a8eb' }}
          >
            {getProgressPercentage()}%
          </div>
        </div>
      </Card>

      <Title level="2" className="mt-4 mb-2">
        Add Water
      </Title>

      <div className="water-actions">
        <Button size="m" mode="outline" onClick={() => addWaterIntake(250)}>+ 250ml</Button>
        <Button size="m" mode="outline" onClick={() => addWaterIntake(500)}>+ 500ml</Button>
        <Button size="m" mode="filled" onClick={() => addWaterIntake(1000)}>+ 1L</Button>
      </div>

      <div className="mt-4 mb-2 settings-actions">
        {showGoalInput ? (
          <div className="goal-input-container">
            <input
              type="number"
              className="goal-input"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Enter goal in ml"
              style={{
                borderColor: themeParams.hint_color || '#999',
                color: themeParams.text_color || '#000',
                backgroundColor: themeParams.bg_color || '#fff'
              }}
            />
            <Button size="m" mode="outline" onClick={updateDailyGoal}>Save</Button>
            <Button size="m" mode="outline" onClick={() => setShowGoalInput(false)}>Cancel</Button>
          </div>
        ) : (
          <Button size="m" mode="outline" stretched onClick={() => setShowGoalInput(true)}>
            Set Daily Goal
          </Button>
        )}
      </div>

      {todayIntake.length > 0 && (
        <>
          <Title level="2" className="mt-4 mb-2">
            Today's Log
          </Title>

          <List>
            {todayIntake
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map(intake => (
                <Cell key={intake.id}>
                  <div className="intake-log">
                    <div className="intake-amount">{intake.amount}ml</div>
                    <div className="intake-time">
                      {new Date(intake.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </Cell>
              ))
            }
          </List>
        </>
      )}
    </div>
  );
};