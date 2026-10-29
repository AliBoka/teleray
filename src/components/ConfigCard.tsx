'use client';

import React, { useState } from 'react';
import { V2RayConfig } from '@/types/config';
import { Check, Copy, Edit2, Server } from 'lucide-react';

interface ConfigCardProps {
  config: V2RayConfig;
  onUpdateRemark: (id: string, newRemark: string) => void;
}

const BADGE_COLORS: Record<string, string> = {
  vless: 'bg-blue-950/60 text-blue-400 border-blue-800/60',
  vmess: 'bg-purple-950/60 text-purple-400 border-purple-800/60',
  trojan: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
  ss: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
  ssr: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
  hy2: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
  hysteria2: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
  tuic: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60',
  wireguard: 'bg-indigo-950/60 text-indigo-400 border-indigo-800/60',
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
    'bg-zinc-800 text-zinc-300 border-zinc-700';

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 transition shadow-sm hover:shadow-md">
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
                className="bg-zinc-950 border border-cyan-500 rounded px-2 py-1 text-xs text-white w-full"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveRemark}
                className="px-2 py-1 bg-cyan-600 text-white rounded text-xs"
              >
                ذخیره
              </button>
            </div>
          ) : (
            <span
              className="text-sm font-medium text-zinc-200 truncate cursor-pointer hover:text-cyan-400 transition"
              title={config.remark}
              onClick={() => setIsEditing(true)}
            >
              {config.remark}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            title="ویرایش نام"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              copied
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
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

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 font-mono pt-2 border-t border-zinc-800/60">
        <div className="flex items-center gap-1.5 truncate max-w-[70%]" dir="ltr">
          <Server className="w-3 h-3 text-zinc-400 shrink-0" />
          <span className="truncate">{config.server || 'آدرس پنهان'}</span>
          <span>:{config.port}</span>
        </div>
        <div>@{config.channel}</div>
      </div>
    </div>
  );
}
