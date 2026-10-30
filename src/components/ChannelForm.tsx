'use client';

import React, { useState } from 'react';
import { ProtocolType, SavedChannel, ScrapeOptions } from '@/types/config';
import { Sliders, RefreshCw, BookmarkPlus, Radio, Trash2, Check } from 'lucide-react';

interface ChannelFormProps {
  onScrape: (options: ScrapeOptions) => Promise<void>;
  isLoading: boolean;
  savedChannels: SavedChannel[];
  onAddChannel: (username: string) => Promise<void>;
  onDeleteChannel: (id: string) => Promise<void>;
}

const AVAILABLE_PROTOCOLS: {
  key: ProtocolType;
  label: string;
  activeColor: string;
  checkBg: string;
}[] = [
  {
    key: 'vless',
    label: 'VLESS',
    activeColor: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700/60',
    checkBg: 'bg-blue-600 text-white dark:bg-blue-500 dark:text-zinc-950',
  },
  {
    key: 'vmess',
    label: 'VMess',
    activeColor: 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-700/60',
    checkBg: 'bg-purple-600 text-white dark:bg-purple-500 dark:text-zinc-950',
  },
  {
    key: 'trojan',
    label: 'Trojan',
    activeColor: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/60',
    checkBg: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950',
  },
  {
    key: 'ss',
    label: 'Shadowsocks',
    activeColor: 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/60',
    checkBg: 'bg-amber-600 text-white dark:bg-amber-500 dark:text-zinc-950',
  },
  {
    key: 'hy2',
    label: 'Hysteria 2',
    activeColor: 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700/60',
    checkBg: 'bg-rose-600 text-white dark:bg-rose-500 dark:text-zinc-950',
  },
  {
    key: 'tuic',
    label: 'TUIC',
    activeColor: 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-700/60',
    checkBg: 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-zinc-950',
  },
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
  const [customizeRemark, setCustomizeRemark] = useState(false);
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
      remarkTemplate: customizeRemark ? remarkTemplate.trim() : '',
    });
  };

  const handleSaveChannel = async () => {
    if (!newChannelInput.trim()) return;
    const clean = newChannelInput
      .trim()
      .replace(/^(https?:\/\/)?(t\.me|telegram\.me)\/(s\/)?/i, '')
      .replace(/^@+/, '')
      .split('/')[0]
      .split('?')[0]
      .trim();
    if (!clean) return;
    await onAddChannel(clean);
    setNewChannelInput('');
  };

  const insertVariable = (varName: string) => {
    setRemarkTemplate((prev) => `${prev} ${varName}`);
  };

  const isFilled = channel.trim().length > 0;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-xl transition-colors">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Channel input & submit button */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            آدرس یا نام کاربری کانال عمومی تلگرام
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 w-full">
              {/* @ symbol placed strictly on the left */}
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 font-mono text-sm select-none pointer-events-none">
                @
              </span>
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="مثال: v2rayng_org یا لینک کامل کانال"
                style={{
                  direction: isFilled ? 'ltr' : 'rtl',
                  textAlign: 'left',
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700/80 rounded-xl pl-9 pr-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !channel.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>درحال استخراج...</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  <span>استخراج کانفیگ‌ها</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick select saved channels */}
        {savedChannels.length > 0 && (
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              کانال‌های ذخیره‌شده‌ی سریع:
            </div>
            <div className="flex flex-wrap gap-2">
              {savedChannels.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-lg px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 transition group"
                >
                  <button
                    type="button"
                    onClick={() => setChannel(c.username)}
                    className="font-mono hover:text-cyan-600 dark:hover:text-cyan-400 transition"
                    dir="ltr"
                  >
                    @{c.username}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteChannel(c.id)}
                    className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition mr-1"
                    title="حذف کانال"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Limit & Protocols */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
              تعداد پیام‌های اخیر برای بررسی ({limit} پیام)
            </label>
            <div className="flex items-center gap-2">
              {[20, 50, 100, 200].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setLimit(num)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-mono transition cursor-pointer ${
                    limit === num
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-bold shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
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
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer border ${
                      active
                        ? `${p.activeColor} font-semibold shadow-xs`
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-zinc-400 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {active ? (
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${p.checkBg}`}
                      >
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-zinc-400 dark:border-zinc-600 shrink-0" />
                    )}
                    <span>{p.label}</span>
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
            className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1.5 font-medium transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>تنظیمات پیشرفته (تغییر نام کانفیگ‌ها و حذف تکراری‌ها)</span>
          </button>

          {showAdvanced && (
            <div className="mt-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
              {/* Deduplication Switch */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-medium block">
                    حذف هوشمند کانفیگ‌های تکراری
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    تشخیص سرورهای یکسان با هش آدرس، پورت و هویت
                  </span>
                </div>

                <div dir="ltr">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={deduplicate}
                    onClick={() => setDeduplicate(!deduplicate)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      deduplicate
                        ? 'bg-cyan-600'
                        : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        deduplicate ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Remark template customization toggle */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-medium block">
                      شخصی‌سازی نام کانفیگ‌ها با الگو (Remark Template)
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      در حالت پیش‌فرض نام اصلی هر کانفیگ بدون تغییر حفظ می‌شود
                    </span>
                  </div>

                  <div dir="ltr">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={customizeRemark}
                      onClick={() => setCustomizeRemark(!customizeRemark)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        customizeRemark
                          ? 'bg-cyan-600'
                          : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          customizeRemark ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {customizeRemark && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      value={remarkTemplate}
                      onChange={(e) => setRemarkTemplate(e.target.value)}
                      placeholder="{channel} | {protocol} #{index}"
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 font-mono focus:outline-none focus:border-cyan-500"
                      dir="ltr"
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-zinc-500">متغیرها:</span>
                      {['{channel}', '{protocol}', '{index}', '{server}', '{port}', '{original}'].map(
                        (v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => insertVariable(v)}
                            className="text-xs px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-cyan-700 dark:text-cyan-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 font-mono transition cursor-pointer"
                          >
                            {v}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Add to saved channels form - responsive layout */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1 w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs select-none">
                    @
                  </span>
                  <input
                    type="text"
                    value={newChannelInput}
                    onChange={(e) => setNewChannelInput(e.target.value)}
                    placeholder="نام کانال جهت افزودن به لیست سریع (مثال: v2ray_channel)"
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-7 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-cyan-500"
                    dir="ltr"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveChannel}
                  disabled={!newChannelInput.trim()}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1.5 font-medium transition cursor-pointer disabled:opacity-40"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
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
