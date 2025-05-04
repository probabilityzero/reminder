import React, { useState, useEffect } from 'react';
import { Button, Title, Spinner, Cell, List, Card, Avatar } from '@telegram-apps/telegram-ui';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';
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
  user_id: string;
  amount: number;
  timestamp: string;
  date: string;
}

interface UserProfile {
  user_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  daily_goal: number;
  created_at?: string;
  photo_url?: string;
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
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        setError('Cannot connect to database. Please try again later.');
        setLoading(false);
        return;
      }
      
      const lp = retrieveLaunchParams() as unknown as LaunchParams;
      const user = lp.user || 
                  lp.tgWebAppInitDataUnsafe?.user || 
                  window.Telegram?.WebApp?.initDataUnsafe?.user;
      
      if (!user) {
        setError('Unable to retrieve user data from Telegram');
        setLoading(false);
        return;
      }

      setTelegramUser(user);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id.toString())
        .single();

      let userProfile = profileData;

      if (!userProfile || profileError) {
        const newProfile = {
          user_id: user.id.toString(),
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          daily_goal: 2000,
          photo_url: user.photo_url
        };
        
        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select();

        if (insertError) {
          setError(`Failed to create user profile: ${insertError.message}`);
          setLoading(false);
          return;
        } else if (insertedProfile && insertedProfile.length > 0) {
          userProfile = insertedProfile[0];
        } else {
          setError('Failed to create user profile: No data returned');
          setLoading(false);
          return;
        }
      } 
      else {
        if (user.photo_url !== userProfile.photo_url || 
            user.first_name !== userProfile.first_name ||
            user.last_name !== userProfile.last_name ||
            user.username !== userProfile.username) {
          
          const updates = {
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            photo_url: user.photo_url
          };
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', user.id.toString());
            
          if (!updateError) {
            userProfile = { ...userProfile, ...updates };
          }
        }
      }

      setProfile(userProfile);

      const { data: intakeData, error: intakeError } = await supabase
        .from('water_intake')
        .select('*')
        .eq('user_id', user.id.toString())
        .eq('date', today);

      if (intakeError) {
        setError(`Failed to fetch water intake data: ${intakeError.message}`);
        setLoading(false);
        return;
      }

      const intakeList = intakeData || [];
      const total = intakeList.reduce((sum, entry) => sum + entry.amount, 0);

      setTodayIntake(intakeList);
      setTotalToday(total);
      setLoading(false);
    } catch (error) {
      setError(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
      setLoading(false);
    }
  };

  const addWaterIntake = async (amount: number) => {
    if (!profile) return;

    try {
      const newIntake = {
        user_id: profile.user_id,
        amount,
        date: today,
        timestamp: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('water_intake')
        .insert(newIntake)
        .select();

      if (error) {
        setError('Failed to save water intake');
        return;
      }

      if (data && data.length > 0) {
        setTodayIntake([...todayIntake, data[0]]);
        setTotalToday(totalToday + amount);
      }
    } catch (err) {
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
        .update({ daily_goal: newGoal }) 
        .eq('user_id', profile.user_id);

      if (error) {
        setError('Failed to update daily goal');
        return;
      }

      setProfile({ ...profile, daily_goal: newGoal });
      setShowGoalInput(false);
      setGoalInput('');
    } catch (err) {
      setError('Failed to update daily goal');
    }
  };

  const getProgressPercentage = () => {
    if (!profile) return 0;
    return Math.min(Math.round((totalToday / (profile.daily_goal || 2000)) * 100), 100);
  };

  const logTableSchema = async (tableName: string) => {
    try {
      const { data: columns } = await supabase.rpc('get_schema_info', { table_name: tableName });
      console.log(`Schema for table ${tableName}:`, columns);
    } catch (error) {
      console.error(`Failed to fetch schema for table ${tableName}:`, error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="page-container center-content">
        <Spinner size="m" />
        <p className="loading-message">Connecting to database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container center-content">
        <div className="error-message">
          <Title level="2">Connection Error</Title>
          <p>{error}</p>
          <div className="debug-info">
            <p><strong>Debug Info:</strong></p>
            <p>Telegram User: {telegramUser?.id ? 'Found' : 'Not Found'}</p>
            <p>Platform: {window.Telegram?.WebApp?.platform || 'Unknown'}</p>
            <p>Browser: {navigator.userAgent}</p>
          </div>
          <div className="error-actions">
            <Button size="m" onClick={() => window.location.reload()}>Try Again</Button>
            <Button 
              size="m" 
              mode="outline" 
              onClick={async () => {
                try {
                  await logTableSchema('profiles');
                  alert('Schema info logged to console. Please check developer tools.');
                } catch (e) {
                  alert('Failed to check schema: ' + e);
                }
              }}
            >
              Check Schema
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const AvatarComponent = telegramUser?.photo_url ? (
    <div className="profile-avatar" onClick={() => setShowProfilePopover(true)}>
      <Avatar size={40} src={telegramUser.photo_url} />
    </div>
  ) : (
    <RadixAvatar.Root className="profile-avatar" onClick={() => setShowProfilePopover(true)}>
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
                  <p><strong>Daily Goal:</strong> {profile?.daily_goal}ml</p>
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
              <div className="water-goal">of {profile?.daily_goal || 2000}ml</div>
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