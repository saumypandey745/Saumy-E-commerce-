"use client";

import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h2>
      <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-sm text-center py-12">
        <Bell className="mx-auto mb-4 text-gray-500" size={36} />
        <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">You're all caught up!</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
          No new notifications to display right now. Check back later for updates on your orders and account.
        </p>
      </div>
    </div>
  );
}
