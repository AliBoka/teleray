'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ChannelForm } from '@/components/ChannelForm';
import { ConfigCard } from '@/components/ConfigCard';
import { ExportToolbar } from '@/components/ExportToolbar';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { SavedChannel, ScrapeOptions, V2RayConfig } from '@/types/config';
import { AlertCircle, CheckCircle2, Inbox } from 'lucide-react';

export default function Home() {
  const [configs, setConfigs] = useState<V2RayConfig[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('');
  const [snapshotId, setSnapshotId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ scanned: number; found: number } | null>(null);
  const [savedChannels, setSavedChannels] = useState<SavedChannel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProto, setFilterProto] = useState('all');
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  // Load saved channels on initial mount
  useEffect(() => {
    fetch('/api/channels')
      .then((res) => res.json())
      .then((data) => {
        if (data.channels) {
          setSavedChannels(data.channels);
        }
      })
      .catch(() => {});
  }, []);

  const handleScrape = async (options: ScrapeOptions) => {
    setIsLoading(true);
    setError(null);
    setStats(null);
    setActiveChannel(options.channel);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'خطا در استخراج پیام‌ها');
      }

      setConfigs(data.result.configs);
      setSnapshotId(data.snapshotId);
      setStats({
        scanned: data.result.totalMessagesScanned,
        found: data.result.configsFound,
      });

      // Refresh saved channels list in case stats updated
      fetch('/api/channels')
        .then((r) => r.json())
        .then((d) => d.channels && setSavedChannels(d.channels))
        .catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطای برقراری ارتباط';
      setError(msg);
      setConfigs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChannel = async (username: string) => {
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (data.channel) {
        setSavedChannels((prev) => [...prev, data.channel]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      await fetch(`/api/channels?id=${id}`, { method: 'DELETE' });
      setSavedChannels((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRemark = (id: string, newRemark: string) => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            remark: newRemark,
          };
        }
        return c;
      })
    );
  };

  // Filtered configs by search query and protocol
  const filteredConfigs = configs.filter((c) => {
    const matchesProto =
      filterProto === 'all' || c.protocol.toLowerCase() === filterProto.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.remark.toLowerCase().includes(query) ||
      c.server.toLowerCase().includes(query) ||
      c.port.toString().includes(query) ||
      c.protocol.toLowerCase().includes(query);

    return matchesProto && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Scraper Control Card */}
        <ChannelForm
          onScrape={handleScrape}
          isLoading={isLoading}
          savedChannels={savedChannels}
          onAddChannel={handleAddChannel}
          onDeleteChannel={handleDeleteChannel}
        />

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success stats notification */}
        {stats && (
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/70 text-cyan-200 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>
                اسکن کانال با موفقیت انجام شد: بررسی{' '}
                <strong className="text-white font-mono">{stats.scanned}</strong> پیام اخیر، و
                استخراج <strong className="text-white font-mono">{stats.found}</strong> کانفیگ
                معتبر.
              </span>
            </div>
            {stats.found > 0 && (
              <button
                onClick={() => setIsSubModalOpen(true)}
                className="text-xs bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold px-3 py-1.5 rounded-lg transition"
              >
                دریافت سابسکرایب زنده
              </button>
            )}
          </div>
        )}

        {/* Configs toolbar and grid */}
        {configs.length > 0 && (
          <div className="space-y-4">
            <ExportToolbar
              configs={configs}
              channel={activeChannel}
              onOpenSubModal={() => setIsSubModalOpen(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedFilterProto={filterProto}
              onSelectFilterProto={setFilterProto}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredConfigs.map((cfg) => (
                <ConfigCard
                  key={cfg.id}
                  config={cfg}
                  onUpdateRemark={handleUpdateRemark}
                />
              ))}
            </div>

            {filteredConfigs.length === 0 && (
              <div className="py-12 text-center text-zinc-500 text-sm">
                هیچ کانفیگی مطابق با فیلتر یا جستجوی شما یافت نشد.
              </div>
            )}
          </div>
        )}

        {/* Empty state when nothing has been scraped yet */}
        {!isLoading && configs.length === 0 && !error && (
          <div className="border border-dashed border-zinc-800 rounded-2xl py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-500 mb-4">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-zinc-300">
              هنوز هیچ کانفیگی استخراج نشده است
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1.5">
              نام یا لینک کانال عمومی تلگرام مورد نظرتان را در کادر بالا وارد کرده و دکمه «استخراج کانفیگ‌ها» را فشار دهید.
            </p>
          </div>
        )}
      </main>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        channel={activeChannel}
        snapshotId={snapshotId}
        configsCount={configs.length}
      />
    </div>
  );
}
