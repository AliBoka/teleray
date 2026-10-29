import React from 'react';
import { Send, Shield, Zap } from 'lucide-react';

export function Navbar() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white flex items-center gap-2">
              TG V2Ray Exporter
              <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-full font-mono">
                v1.0
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              استخراج خودکار کانفیگ و ساخت لینک سابسکرایب زنده
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs">بدون نیاز به توکن تلگرام</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-300">
            <Send className="w-3.5 h-3.5" />
            <span className="text-xs font-mono">t.me/s web crawler</span>
          </div>
        </div>
      </div>
    </header>
  );
}
