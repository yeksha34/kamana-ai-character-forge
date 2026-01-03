
import React from 'react';
import { Header } from '../components/Header';
import { SettingsView } from '../views/SettingsView';

export function SettingsPage(props: any) {
  const { user, onNavigate, onSignOut } = props;
  
  return (
    <>
      <Header
        user={user}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        currentRoute="#/settings"
      />
      <SettingsView onNavigate={onNavigate} />
    </>
  );
}
