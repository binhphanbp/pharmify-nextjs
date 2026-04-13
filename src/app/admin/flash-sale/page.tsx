'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import CampaignTab from './CampaignTab';
import TimeSlotTab from './TimeSlotTab';
import FlashItemTab from './FlashItemTab';

interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}
interface TimeSlot {
  id: string;
  campaign_id: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export default function AdminFlashSalePage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'slots' | 'items'>(
    'campaigns',
  );
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [c, ts] = await Promise.all([
      supabase
        .from('flash_sale_campaigns')
        .select('*')
        .order('start_date', { ascending: false }),
      supabase
        .from('flash_sale_time_slots')
        .select('*')
        .order('start_time', { ascending: false }),
    ]);
    setCampaigns(c.data || []);
    setTimeSlots(ts.data || []);
    setLoading(false);
  };

  const tabs = [
    { key: 'campaigns' as const, icon: 'campaign', label: 'Chiến dịch' },
    { key: 'slots' as const, icon: 'schedule', label: 'Khung giờ' },
    { key: 'items' as const, icon: 'flash_on', label: 'Sản phẩm' },
  ];

  return (
    <>
      <div className="page-header">
        <h2 className="text-xl font-bold">Quản lý Flash Sale</h2>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
          >
            <span className="material-icons text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-text-muted">Đang tải...</div>
      ) : (
        <>
          {activeTab === 'campaigns' && (
            <CampaignTab
              campaigns={campaigns}
              onReload={loadAll}
              supabase={supabase}
            />
          )}
          {activeTab === 'slots' && (
            <TimeSlotTab
              timeSlots={timeSlots}
              campaigns={campaigns}
              onReload={loadAll}
              supabase={supabase}
            />
          )}
          {activeTab === 'items' && (
            <FlashItemTab timeSlots={timeSlots} supabase={supabase} />
          )}
        </>
      )}
    </>
  );
}
