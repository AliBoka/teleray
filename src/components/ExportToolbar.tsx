'use client';

import React, { useState } from 'react';
import { V2RayConfig } from '@/types/config';
import { Check, Copy, Download, Link2, Search } from 'lucide-react';

interface ExportToolbarProps {
  configs: V2RayConfig[];
  channel: string;
  onOpenSubModal: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFilterProto: string;
  onSelectFilterProto: (proto: string) => void;
}

export function ExportToolbar({
  configs,
  channel,
  onOpenSubModal,
  searchQuery,
  onSearchChange,
  selectedFilterProto,
  onSelectFilterProto,
}: ExportToolbarProps) {
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedB64, setCopiedB64] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Group by protocol counts
  const protocolCounts = configs.reduce<Record<string, number>>((acc, curr) => {
    acc[curr.protocol] = (acc[curr.protocol] || 0) + 1;
    return acc;
  }, {});

  const handleCopyRaw = async () => {
    try {
      const text = configs.map((c) => c.raw).join('\n');
      await navigator.clipboard.writeText(text);
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyBase64 = async () => {
    try {
      const text = configs.map((c) => c.raw).join('\n');
      const b64 = btoa(unescape(encodeURIComponent(text)));
      await navigator.clipboard.writeText(b64);
      setCopiedB64(true);
      setTimeout(() => setCopiedB64(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadTxt = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configs: configs.map((c) => c.raw),
          filename: `${channel || 'v2ray'}_configs`,
          format: 'txt',
        }),
      });

      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${channel || 'v2ray'}_configs.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Top row: Summary + Export actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>کانفیگ‌های استخراج شده</span>
            <span className="bg-cyan-950 text-cyan-400 border border-cyan-800/80 px-2.5 py-0.5 rounded-full text-xs font-mono">
              {configs.length} مورد
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <button
              onClick={() => onSelectFilterProto('all')}
              className={`text-xs px-2 py-0.5 rounded-md border font-mono transition ${
                selectedFilterProto === 'all'
                  ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 font-bold'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              همه ({configs.length})
            </button>
            {Object.entries(protocolCounts).map(([proto, count]) => (
              <button
                key={proto}
                onClick={() => onSelectFilterProto(proto)}
                className={`text-xs px-2 py-0.5 rounded-md border font-mono uppercase transition ${
                  selectedFilterProto === proto
                    ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 font-bold'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {proto}: {count}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenSubModal}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition"
          >
            <Link2 className="w-4 h-4" />
            <span>لینک سابسکرایب زنده</span>
          </button>

          <button
            onClick={handleDownloadTxt}
            disabled={isDownloading || configs.length === 0}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 border border-zinc-700/80 transition disabled:opacity-50"
            title="دانلود فایل .txt مستقیم"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>دانلود فایل متنی</span>
          </button>

          <button
            onClick={handleCopyBase64}
            disabled={configs.length === 0}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 border border-zinc-700/80 transition disabled:opacity-50"
            title="کپی کلی برای v2rayNG / کلیپ‌بورد"
          >
            {copiedB64 ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">کپی شد!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-purple-400" />
                <span>کپی Base64</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyRaw}
            disabled={configs.length === 0}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 border border-zinc-700/80 transition disabled:opacity-50"
            title="کپی لینک‌های خام"
          >
            {copiedRaw ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">کپی شد!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>کپی خام</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="pt-2 border-t border-zinc-800 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="جستجو در نام، آدرس سرور یا پورت..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>
    </div>
  );
}
