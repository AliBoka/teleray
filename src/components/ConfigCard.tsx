'use client';

import React, { useState } from 'react';
import { V2RayConfig } from '@/types/config';
import { Check, Copy, Edit2, Server } from 'lucide-react';

interface ConfigCardProps {
  config: V2RayConfig;
  onUpdateRemark: (id: string, newRemark: string) => void;
}

const BADGE_COLORS: Record<string, string> = {
  vless: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800/60',
  vmess: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800/60',
  trojan: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60',
  ss: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800/60',
  ssr: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800/60',
  hy2: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/60',
  hysteria2: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/60',
  tuic: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800/60',
  wireguard: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800/60',
};

export function ConfigCard({ config, onUpdateRemark }: ConfigCardProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [remarkInput, setRemarkInput] = useState(config.remark);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(config.raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSaveRemark = () => {
    if (remarkInput.trim()) {
      onUpdateRemark(config.id, remarkInput.trim());
    }
    setIsEditing(false);
  };

  const badgeClass =
    BADGE_COLORS[config.protocol.toLowerCase()] ||
    'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700';

  return (
    <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl p-4 transition shadow-xs hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <span
            className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold border ${badgeClass}`}
          >
            {config.protocol.toUpperCase()}
          </span>

          {isEditing ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
              <input
                type="text"
                value={remarkInput}
                onChange={(e) => setRemarkInput(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-950 border border-cyan-500 rounded px-2 py-1 text-xs text-zinc-900 dark:text-white w-full"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveRemark}
                className="px-2.5 py-1 bg-cyan-600 text-white rounded text-xs font-medium cursor-pointer"
              >
                ذخیره
              </button>
            </div>
          ) : (
            <span
              className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition"
              title={config.remark}
              onClick={() => setIsEditing(true)}
            >
              {config.remark}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="ویرایش نام"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              copied
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800/80'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>کپی شد!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>کپی لینک</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 font-mono pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center gap-1.5 truncate max-w-[65%]" dir="ltr">
          <Server className="w-3 h-3 text-zinc-400 shrink-0" />
          <span className="truncate">{config.server || 'آدرس پنهان'}</span>
          <span>:{config.port}</span>
        </div>
        {/* Channel username with @ on left */}
        <div dir="ltr" className="shrink-0 font-medium text-zinc-600 dark:text-zinc-400">
          @{config.channel}
        </div>
      </div>
    </div>
  );
}
