import React, { useState, useEffect } from 'react';
import { Button, Title, Spinner, Cell, List, Card } from '@telegram-apps/telegram-ui';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { supabase } from '@/lib/supabase';

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
}

export const MainPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayIntake, setTodayIntake] = useState<WaterIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalToday, setTotalToday] = useState(0);
  const [goalInput, setGoalInput] = useState('');
  const [showGoalInput, setShowGoalInput] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const lp = retrieveLaunchParams() as unknown as LaunchParams;
        const user = lp.user || lp.tgWebAppInitDataUnsafe?.user;
        
        if (!user) {
          console.error('No user found in launch params');
          setLoading(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('userId', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }

        let userProfile = profileData;

        if (!userProfile) {
          const newProfile: UserProfile = {
            userId: user.id.toString(),
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            dailyGoal: 2000
          };

          const { data: insertedProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select();

          if (insertError) {
            console.error('Error creating profile:', insertError);
          } else if (insertedProfile) {
            userProfile = insertedProfile[0];
          }
        }

        const { data: intakeData, error: intakeError } = await supabase
          .from('water_intake')
          .select('*')
          .eq('userId', user.id)
          .eq('date', today);

        if (intakeError) {
          console.error('Error fetching intake:', intakeError);
        }

        const total = (intakeData || []).reduce((sum, entry) => sum + entry.amount, 0);

        setProfile(userProfile);
        setTodayIntake(intakeData || []);
        setTotalToday(total);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const addWaterIntake = async (amount: number) => {
    if (!profile) return;

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
      return;
    }

    if (data) {
      setTodayIntake([...todayIntake, data[0]]);
      setTotalToday(totalToday + amount);
    }
  };

  const updateDailyGoal = async () => {
    if (!profile || !goalInput) return;
    
    const newGoal = parseInt(goalInput, 10);
    if (isNaN(newGoal) || newGoal <= 0) return;

    const { error } = await supabase
      .from('profiles')
      .update({ dailyGoal: newGoal })
      .eq('userId', profile.userId);

    if (error) {
      console.error('Error updating goal:', error);
      return;
    }

    setProfile({ ...profile, dailyGoal: newGoal });
    setShowGoalInput(false);
    setGoalInput('');
  };

  const getProgressPercentage = () => {
    if (!profile) return 0;
    return Math.min(Math.round((totalToday / profile.dailyGoal) * 100), 100);
  };

  if (loading) {
    return (
      <div className="page-container center-content">
        <Spinner size="m" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Title level="1" className="mb-4">
        Water Reminder
      </Title>

      <Card>
        <div className="water-goal-container">
          <div className="water-progress">
            <div className="water-level" style={{ height: `${getProgressPercentage()}%` }}></div>
            <div className="water-text">
              <div className="water-amount">{totalToday}ml</div>
              <div className="water-goal">of {profile?.dailyGoal}ml</div>
            </div>
          </div>
          <div className="water-percentage">{getProgressPercentage()}%</div>
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