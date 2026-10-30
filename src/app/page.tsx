'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ChannelForm } from '@/components/ChannelForm';
import { ConfigCard } from '@/components/ConfigCard';
import { ExportToolbar } from '@/components/ExportToolbar';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { SavedChannel, ScrapeOptions, V2RayConfig } from '@/types/config';
import { AlertCircle, AlertTriangle, CheckCircle2, Inbox } from 'lucide-react';

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
    const cleaned = options.channel
      .trim()
      .replace(/^(https?:\/\/)?(t\.me|telegram\.me)\/(s\/)?/i, '')
      .replace(/^@+/, '')
      .split('/')[0]
      .split('?')[0]
      .trim();
    setActiveChannel(cleaned);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...options, channel: cleaned }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'خطا در استخراج پیام‌ها');
      }

      setActiveChannel(data.result.channel);
      setConfigs(data.result.configs);
      setSnapshotId(data.snapshotId);
      setStats({
        scanned: data.result.totalMessagesScanned,
        found: data.result.configsFound,
      });

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
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Scraper Control Card */}
        <ChannelForm
          onScrape={handleScrape}
          isLoading={isLoading}
          savedChannels={savedChannels}
          onAddChannel={handleAddChannel}
          onDeleteChannel={handleDeleteChannel}
        />

        {/* Error notification (e.g. invalid username, channel not found) */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Channel scanned but 0 configs found notification */}
        {stats && stats.found === 0 && !error && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start sm:items-center gap-2.5 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              کانال{' '}
              <strong dir="ltr" className="font-mono text-zinc-900 dark:text-white">
                @{activeChannel}
              </strong>{' '}
              بررسی شد و تعداد{' '}
              <strong className="font-mono font-bold">{stats.scanned}</strong> پیام اخیر اسکن گردید، اما هیچ کانفیگ معتبری در این محدوده یافت نشد. می‌توانید تعداد پیام‌های بررسی را افزایش دهید (مثلاً ۱۰۰ یا ۲۰۰) یا کانال دیگری را امتحان کنید.
            </div>
          </div>
        )}

        {/* Success stats notification when configs found */}
        {stats && stats.found > 0 && (
          <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/70 text-cyan-900 dark:text-cyan-200 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>
                بررسی کانال{' '}
                <strong dir="ltr" className="font-mono text-zinc-900 dark:text-white">
                  @{activeChannel}
                </strong>{' '}
                با موفقیت انجام شد: بررسی{' '}
                <strong className="font-mono">{stats.scanned}</strong> پیام اخیر، و استخراج{' '}
                <strong className="font-mono font-bold text-cyan-700 dark:text-cyan-300">
                  {stats.found}
                </strong>{' '}
                کانفیگ معتبر.
              </span>
            </div>
            <button
              onClick={() => setIsSubModalOpen(true)}
              className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3.5 py-1.5 rounded-lg transition shrink-0 cursor-pointer text-center"
            >
              دریافت Subscription
            </button>
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
              <div className="py-12 text-center text-zinc-500 text-xs sm:text-sm">
                هیچ کانفیگی مطابق با فیلتر یا جستجوی شما یافت نشد.
              </div>
            )}
          </div>
        )}

        {/* Empty state when nothing has been scraped yet */}
        {!isLoading && configs.length === 0 && !error && !stats && (
          <div className="border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl py-14 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mx-auto flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-zinc-700 dark:text-zinc-300">
              هنوز هیچ کانفیگی استخراج نشده است
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1.5">
              نام یا لینک کانال عمومی تلگرام مورد نظرتان را در کادر بالا وارد کرده و دکمه «استخراج کانفیگ‌ها» را لمس کنید.
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
        configs={configs}
      />
    </div>
  );
}
