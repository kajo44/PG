import React from 'react';
import { RoadLink } from '../types/pkrms';
import {
  BarChart3,
  Camera,
  Cloud,
  FileDown,
  Globe2,
  HardHat,
  MapPin,
  RefreshCw,
  Route,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface HeaderProps {
  roads: RoadLink[];
  selectedRoad: RoadLink;
  onSelectRoad: (road: RoadLink) => void;
  activeNavTab: 'map' | 'photos' | 'analytics' | 'earthengine';
  onSelectNavTab: (tab: 'map' | 'photos' | 'analytics' | 'earthengine') => void;
  onOpenExportModal: () => void;
  isOfflineMode: boolean;
  onToggleOffline: () => void;
  pendingSyncCount: number;
  onSyncNow: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roads,
  selectedRoad,
  onSelectRoad,
  activeNavTab,
  onSelectNavTab,
  onOpenExportModal,
  isOfflineMode,
  onToggleOffline,
  pendingSyncCount,
  onSyncNow,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/90 shadow-2xs z-30 sticky top-0">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Road Link Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-sm">
              <Route size={20} />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                <span className="text-indigo-600 font-extrabold">GeoSurvey Jalan Next</span>
                <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-mono font-bold">
                  DEV
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Sistem Pengelolaan Jalan Daerah & Map Matching
              </div>
            </div>
          </div>

          {/* Road Link Dropdown */}
          <div className="ml-2 pl-3 border-l border-slate-200 hidden md:block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pilih Ruas Jalan:
            </div>
            <select
              value={selectedRoad.id}
              onChange={(e) => {
                const found = roads.find((r) => r.id === e.target.value);
                if (found) onSelectRoad(found);
              }}
              className="font-semibold text-xs text-slate-800 bg-transparent cursor-pointer hover:text-indigo-600 outline-none max-w-[210px] truncate"
            >
              {roads.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} - {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs (Material 3 Segmented Navigation) */}
        <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl text-xs font-semibold text-slate-600 overflow-x-auto max-w-full">
          <button
            onClick={() => onSelectNavTab('map')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeNavTab === 'map'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <Route size={14} />
            <span>Peta & Tracking</span>
          </button>

          <button
            onClick={() => onSelectNavTab('photos')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeNavTab === 'photos'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <Camera size={14} />
            <span>Foto & STA</span>
          </button>

          <button
            onClick={() => onSelectNavTab('analytics')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeNavTab === 'analytics'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <BarChart3 size={14} />
            <span>Analitik Tim</span>
          </button>

          <button
            onClick={() => onSelectNavTab('earthengine')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeNavTab === 'earthengine'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <Globe2 size={14} />
            <span>Geospasial & Integrasi</span>
          </button>
        </nav>

        {/* Right Actions: Offline, Sync, and PDF Export */}
        <div className="flex items-center gap-2">
          {/* Offline/Online toggle badge */}
          <button
            onClick={onToggleOffline}
            title={isOfflineMode ? 'Beralih ke mode Online demo (belum terhubung server)' : 'Beralih ke mode lokal'}
            className={`p-2 rounded-2xl border text-xs font-medium transition flex items-center gap-1 ${
              isOfflineMode
                ? 'border-amber-400 bg-amber-50 text-amber-800'
                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isOfflineMode ? <WifiOff size={15} /> : <Wifi size={15} className="text-emerald-500" />}
            <span className="hidden lg:inline text-[11px]">
              {isOfflineMode ? 'Lokal' : 'Online (demo)'}
            </span>
          </button>

          {/* Sync status */}
          <button
            onClick={onSyncNow}
            title="Periksa antrean lokal; backend sinkronisasi belum dikonfigurasi"
            className="p-2 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition relative flex items-center gap-1"
          >
            <Cloud size={15} className="text-sky-600" />
            {pendingSyncCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[9px] font-bold">
                {pendingSyncCount}
              </span>
            )}
            <span className="hidden xl:inline text-xs font-medium">Sync</span>
          </button>

          {/* Export Report PDF/CSV Button */}
          <button
            onClick={onOpenExportModal}
            className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <FileDown size={15} />
            <span>Ekspor Laporan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
