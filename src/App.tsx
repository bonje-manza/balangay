import React from 'react';
import {
  Wallet,
  ShieldCheck,
  WifiOff,
  Database,
  ArrowUpRight,
  PiggyBank,
  CheckCircle2,
} from 'lucide-react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F2E8] text-[#111111] font-sans antialiased flex flex-col selection:bg-butter selection:text-dark-anchor">
      {/* Top Navigation */}
      <header className="w-full border-b-2 border-dark-anchor bg-[#F7F2E8] px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-butter border-2 border-dark-anchor flex items-center justify-center shadow-[2px_2px_0px_0px_#111111]">
              <Wallet className="w-5 h-5 text-dark-anchor" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl tracking-tight leading-none text-dark-anchor">
                Balangay
              </h1>
              <p className="text-xs font-medium text-dark-forest/80 tracking-wide mt-0.5">
                Offline Finance Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pistachio border border-dark-anchor text-xs font-bold text-dark-forest shadow-[2px_2px_0px_0px_#111111]">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col justify-center">
        {/* Welcome Shell / Hero Card */}
        <section className="bg-white/80 border-2 border-dark-anchor rounded-3xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_#111111] relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-butter border border-dark-anchor text-xs font-bold uppercase tracking-wider mb-5 shadow-[2px_2px_0px_0px_#111111]">
              <ShieldCheck className="w-3.5 h-3.5 text-dark-anchor" />
              <span>Private & Local-First</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-dark-anchor leading-[1.15] mb-4">
              Financial clarity with zero cloud dependencies.
            </h2>

            <p className="text-base sm:text-lg text-dark-anchor/80 font-normal leading-relaxed mb-8">
              Balangay stores 100% of your financial accounts, transactions, and budgets locally in your browser using IndexedDB. No accounts to register, no telemetry, and fully functional without an active network connection.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-dark-forest text-[#F7F2E8] font-bold text-sm sm:text-base border-2 border-dark-anchor shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#111111] transition-all cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F7F2E8] border-2 border-dark-anchor text-xs sm:text-sm font-semibold text-dark-anchor shadow-[2px_2px_0px_0px_#111111]">
                <Database className="w-4 h-4 text-dark-forest" />
                <span>Powered by Dexie.js</span>
              </div>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 pt-8 border-t-2 border-dark-anchor/15">
            <div className="bg-blossom/30 border-2 border-dark-anchor rounded-2xl p-4 shadow-[3px_3px_0px_0px_#111111]">
              <div className="flex items-center gap-2 mb-2 font-bold text-dark-anchor">
                <CheckCircle2 className="w-4 h-4 text-dark-forest" />
                <span className="text-sm">PWA Installable</span>
              </div>
              <p className="text-xs text-dark-anchor/80 leading-normal">
                Install directly onto desktop or mobile home screens for native-grade offline execution.
              </p>
            </div>

            <div className="bg-pistachio/30 border-2 border-dark-anchor rounded-2xl p-4 shadow-[3px_3px_0px_0px_#111111]">
              <div className="flex items-center gap-2 mb-2 font-bold text-dark-anchor">
                <PiggyBank className="w-4 h-4 text-dark-forest" />
                <span className="text-sm">Local Storage</span>
              </div>
              <p className="text-xs text-dark-anchor/80 leading-normal">
                IndexedDB persistence keeps all ledger data safely encrypted and local on this device.
              </p>
            </div>

            <div className="bg-sky/30 border-2 border-dark-anchor rounded-2xl p-4 shadow-[3px_3px_0px_0px_#111111]">
              <div className="flex items-center gap-2 mb-2 font-bold text-dark-anchor">
                <ShieldCheck className="w-4 h-4 text-dark-forest" />
                <span className="text-sm">Complete Privacy</span>
              </div>
              <p className="text-xs text-dark-anchor/80 leading-normal">
                No telemetry, no tracking servers, and zero third-party cloud backends.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t-2 border-dark-anchor/20 px-4 sm:px-8 py-4 text-center">
        <p className="text-xs font-medium text-dark-anchor/60">
          Balangay &copy; {new Date().getFullYear()} — Offline-First PWA Finance Tracker
        </p>
      </footer>
    </div>
  );
};

export default App;
