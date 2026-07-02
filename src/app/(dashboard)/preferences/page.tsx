"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { UsageSection } from './components/UsageSection';
import { SubscriptionSection } from './components/SubscriptionSection';
import { AppearanceSection } from './components/AppearanceSection';
import { AIBehaviorSection } from './components/AIBehaviorSection';
import { DataPrivacySection } from './components/DataPrivacySection';

export default function PreferencesPage() {
  const { data: session, update: updateSession } = useSession();
  const [userData, setUserData] = useState<any>(null);

  React.useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/user/me')
        .then(res => res.json())
        .then(data => {
          if (data.user) setUserData(data.user);
        })
        .catch(err => console.error("Failed to fetch user data", err));
    }
  }, [session]);

  return (
    <>
      <div className="flex-1 overflow-y-auto w-full pt-16 relative z-10 bg-background/50 dark:bg-[#1A1918]/50">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 pb-20">
          
          <div className="mb-10">
            <h1 className="text-3xl font-serif font-medium text-foreground dark:text-[#E6E4DF] mb-2 flex items-center gap-3">
              <SettingsIcon size={28} className="text-primary dark:text-[#C36A4F]" />
              Preferences
            </h1>
            <p className="text-muted-foreground dark:text-[#8A8985] text-sm">Customize your Drasa AI experience</p>
          </div>

          <div className="space-y-8">
            <UsageSection userData={userData} />
            <SubscriptionSection userData={userData} setUserData={setUserData} updateSession={updateSession} />
            <AppearanceSection />
            <AIBehaviorSection />
            <DataPrivacySection userData={userData} setUserData={setUserData} />
          </div>
        </div>
      </div>
    </>
  );
}

function SettingsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
