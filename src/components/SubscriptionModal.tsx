'use client';

import React, { useState } from 'react';
import { Check, Copy, ExternalLink, X, Zap } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: string;
  snapshotId?: string;
  configsCount: number;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  channel,
  snapshotId,
  configsCount,
}: SubscriptionModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const subTarget = snapshotId || channel;
  const subUrl = `${origin}/api/sub/${subTarget}`;
  const rawUrl = `${subUrl}?format=raw`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(subUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              لینک سابسکرایب زنده (Live Subscription)
            </h3>
            <p className="text-xs text-zinc-400">
              شامل {configsCount} کانفیگ استخراج‌شده از @{channel}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              آدرس سابسکرایب (جهت وارد کردن در v2rayNG / V2RayN / Streisand):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={subUrl}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 select-all"
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 transition ${
                  copied
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>کپی شد</span>
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

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-2">
            <div className="font-semibold text-zinc-200">
              💡 نحوه استفاده در کلاینت‌های V2Ray:
            </div>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>
                <strong className="text-zinc-200">v2rayNG (اندروید):</strong> منوی کناری ➔ گروه‌های اشتراک ➔ افزودن (+) ➔ نشانی اشتراک را پیست کرده و ذخیره کنید.
              </li>
              <li>
                <strong className="text-zinc-200">V2RayN (ویندوز):</strong> Subscription group ➔ Subscription setting ➔ Add ➔ لینک را وارد و Update کنید.
              </li>
              <li>
                <strong className="text-zinc-200">Shadowrocket / Streisand (iOS):</strong> دکمه + ➔ Type: Subscribe ➔ URL را پیست کنید.
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
            <a
              href={rawUrl}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-cyan-400 flex items-center gap-1 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>مشاهده خروجی به صورت متنی خام</span>
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
