'use client';

import React, { useState } from 'react';
import { ProtocolType, SavedChannel, ScrapeOptions } from '@/types/config';
import { Sliders, RefreshCw, BookmarkPlus, Radio, Trash2 } from 'lucide-react';

interface ChannelFormProps {
  onScrape: (options: ScrapeOptions) => Promise<void>;
  isLoading: boolean;
  savedChannels: SavedChannel[];
  onAddChannel: (username: string) => Promise<void>;
  onDeleteChannel: (id: string) => Promise<void>;
}

const AVAILABLE_PROTOCOLS: { key: ProtocolType; label: string; color: string }[] = [
  { key: 'vless', label: 'VLESS', color: 'border-blue-500/40 text-blue-400 bg-blue-950/20' },
  { key: 'vmess', label: 'VMess', color: 'border-purple-500/40 text-purple-400 bg-purple-950/20' },
  { key: 'trojan', label: 'Trojan', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20' },
  { key: 'ss', label: 'Shadowsocks', color: 'border-amber-500/40 text-amber-400 bg-amber-950/20' },
  { key: 'hy2', label: 'Hysteria 2', color: 'border-rose-500/40 text-rose-400 bg-rose-950/20' },
  { key: 'tuic', label: 'TUIC', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20' },
];

export function ChannelForm({
  onScrape,
  isLoading,
  savedChannels,
  onAddChannel,
  onDeleteChannel,
}: ChannelFormProps) {
  const [channel, setChannel] = useState('');
  const [limit, setLimit] = useState(100);
  const [selectedProtocols, setSelectedProtocols] = useState<ProtocolType[]>([
    'vless',
    'vmess',
    'trojan',
    'ss',
    'hy2',
    'tuic',
  ]);
  const [deduplicate, setDeduplicate] = useState(true);
  const [remarkTemplate, setRemarkTemplate] = useState('{channel} | {protocol} #{index}');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newChannelInput, setNewChannelInput] = useState('');

  const toggleProtocol = (proto: ProtocolType) => {
    if (selectedProtocols.includes(proto)) {
      if (selectedProtocols.length > 1) {
        setSelectedProtocols(selectedProtocols.filter((p) => p !== proto));
      }
    } else {
      setSelectedProtocols([...selectedProtocols, proto]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel.trim()) return;
    onScrape({
      channel: channel.trim(),
      limit,
      protocols: selectedProtocols,
      deduplicate,
      remarkTemplate,
    });
  };

  const handleSaveChannel = async () => {
    if (!newChannelInput.trim()) return;
    await onAddChannel(newChannelInput.trim());
    setNewChannelInput('');
  };

  const insertVariable = (varName: string) => {
    setRemarkTemplate((prev) => `${prev} ${varName}`);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Channel input */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            آدرس یا نام کاربری کانال عمومی تلگرام
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">
                @
              </span>
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="مثال: v2rayng_org یا لینک کامل کانال"
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pr-8 pl-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                dir="ltr"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !channel.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>درحال استخراج...</span>
                </>
              ) : (
                <>
                  <Radio className="w-5 h-5" />
                  <span>استخراج کانفیگ‌ها</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick select saved channels */}
        {savedChannels.length > 0 && (
          <div>
            <div className="text-xs text-zinc-400 mb-2 flex items-center gap-1">
              <span>کانال‌های ذخیره‌شده‌ی سریع:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedChannels.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-1.5 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg px-2.5 py-1 text-xs text-zinc-300 transition group"
                >
                  <button
                    type="button"
                    onClick={() => setChannel(c.username)}
                    className="font-mono hover:text-cyan-400 transition"
                  >
                    @{c.username}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteChannel(c.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition"
                    title="حذف کانال"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Basic options: Limit & Protocols */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              تعداد پیام‌های اخیر برای بررسی ({limit} پیام)
            </label>
            <div className="flex items-center gap-2">
              {[20, 50, 100, 200].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setLimit(num)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-mono transition ${
                    limit === num
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-bold'
                      : 'border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              پروتکل‌های مجاز
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_PROTOCOLS.map((p) => {
                const active = selectedProtocols.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => toggleProtocol(p.key)}
                    className={`px-2.5 py-1 rounded-md text-xs border font-mono transition ${
                      active
                        ? p.color + ' font-medium'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-500 line-through'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Advanced customization accordion */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-medium transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>تنظیمات پیشرفته (تغییر نام کانفیگ‌ها و حذف تکراری‌ها)</span>
          </button>

          {showAdvanced && (
            <div className="mt-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-zinc-200 font-medium block">
                    حذف هوشمند کانفیگ‌های تکراری
                  </span>
                  <span className="text-xs text-zinc-500">
                    تشخیص سرورهای یکسان با هش آدرس، پورت و هویت
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={deduplicate}
                  onChange={(e) => setDeduplicate(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-zinc-800 border-zinc-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  قالب نام‌گذاری کانفیگ‌ها (Remark Template)
                </label>
                <input
                  type="text"
                  value={remarkTemplate}
                  onChange={(e) => setRemarkTemplate(e.target.value)}
                  placeholder="{channel} | {protocol} #{index}"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-cyan-500"
                  dir="ltr"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs text-zinc-500">متغیرهای در دسترس:</span>
                  {['{channel}', '{protocol}', '{index}', '{server}', '{port}', '{original}'].map(
                    (v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 hover:bg-zinc-700 font-mono transition"
                      >
                        {v}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Add to saved channels form */}
              <div className="pt-2 border-t border-zinc-800 flex items-center gap-2">
                <input
                  type="text"
                  value={newChannelInput}
                  onChange={(e) => setNewChannelInput(e.target.value)}
                  placeholder="افزودن کانال جدید به لیست سریع (مثال: v2ray_channel)"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={handleSaveChannel}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1 font-medium transition"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ذخیره کانال</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
