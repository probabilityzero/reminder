import React, { useState } from 'react';
import { Button, Cell, List, Title } from '@telegram-apps/telegram-ui';
import { showPopup } from '@telegram-apps/sdk-react';

export const MainPage: React.FC = () => {
  const [reminders, setReminders] = useState<string[]>([]);

  const handleAddReminder = () => {
    // Simple popup without input field since the callback isn't supported
    showPopup({
      title: 'Add Reminder',
      message: 'Feature coming soon in the next update!',
      buttons: [
        {
          id: 'ok',
          type: 'default',
          text: 'OK',
        },
      ]
    });
    
    // For demonstration, add a sample reminder
    setReminders(prev => [...prev, 'Sample reminder ' + (prev.length + 1)]);
  };

  return (
    <div className="page-container">
      <Title level="1" className="mb-4">
        Reminder App
      </Title>
      
      <List>
        {reminders.length > 0 ? (
          reminders.map((reminder, index) => (
            <Cell key={index}>{reminder}</Cell>
          ))
        ) : (
          <>
            <Cell>No reminders yet</Cell>
            <Cell>Tap the button below to add your first reminder</Cell>
          </>
        )}
      </List>
      
      <Button onClick={handleAddReminder} className="mt-4" stretched>
        Add Reminder
      </Button>
    </div>
  );
};