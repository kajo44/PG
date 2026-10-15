import React, { useState } from 'react';
import { CloudPipelineStats, RoadLink } from '../types/pkrms';
import {
  Activity,
  CheckCircle,
  Clock,
  Cloud,
  Cpu,
  Database,
  Globe2,
  HardDrive,
  Layers,
  RefreshCw,
  Server,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface EarthEnginePanelProps {
  selectedRoad: RoadLink;
  cloudStats: CloudPipelineStats;
  geeLayerType: 'NONE' | 'SENTINEL_2' | 'NDVI' | 'SURFACE_MOISTURE';
  onChangeGeeLayer: (layer: 'NONE' | 'SENTINEL_2' | 'NDVI' | 'SURFACE_MOISTURE') => void;
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
  onTriggerCloudSync: () => void;
  pendingSyncCount: number;
}

export const EarthEnginePanel: React.FC<EarthEnginePanelProps> = ({
  selectedRoad,
  cloudStats,
  geeLayerType,
  onChangeGeeLayer,
  isOfflineMode,
  onToggleOfflineMode,
  onTriggerCloudSync,
  pendingSyncCount,
}) => {
  const [lastSyncText, setLastSyncText] = useState<string>('Belum tersinkron');

  const handleSyncClick = () => {
    onTriggerCloudSync();
    setLastSyncText('Backend belum dikonfigurasi');
  };

  const processedPercent = Math.round(
    (cloudStats.processedTB / cloudStats.totalVolumeTB) * 100
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500 text-white rounded-2xl shadow-sm">
              <Globe2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                Geospasial & Status Integrasi
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-semibold">
                  Simulasi lokal
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Visualisasi demo; layanan eksternal belum terhubung
              </p>
            </div>
          </div>

          {/* Offline/Online Mode Switch */}
          <button
            onClick={onToggleOfflineMode}
            className={`px-3 py-1 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition ${
              isOfflineMode
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {isOfflineMode ? <WifiOff size={13} /> : <Wifi size={13} />}
            {isOfflineMode ? 'Mode Lokal Aktif' : 'Mode Online (demo)'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Demo imagery selector; these layers are not GEE-derived products */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers size={14} className="text-indigo-600" />
              Layer peta demonstrasi
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full">
              Data demo
            </span>
          </div>

          <p className="text-[11px] text-slate-500 mb-3">
            Pilihan ini hanya mengganti layer peta dasar untuk demonstrasi. Ini bukan NDVI, kelembapan tanah, atau produk analisis Sentinel-2 dari Google Earth Engine.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'NONE', label: 'Mati (Normal GIS)' },
              { id: 'SENTINEL_2', label: 'Sentinel-2 True Color' },
              { id: 'NDVI', label: 'NDVI (Vegetasi Koridor)' },
              { id: 'SURFACE_MOISTURE', label: 'Kelembaban / Genangan' },
            ].map((layer) => (
              <button
                key={layer.id}
                onClick={() => onChangeGeeLayer(layer.id as any)}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition ${
                  geeLayerType === layer.id
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>

        {/* 120 TB Big Data Cloud Pipeline Architecture Monitoring */}
        <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 shadow-sm border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server size={16} className="text-sky-400" />
              <span className="text-xs font-bold text-white">
                Statistik pemrosesan simulasi
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <Activity size={12} className="animate-pulse" />
              Statistik demo
            </span>
          </div>

          {/* Progress bar for 120 TB Processing */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Volume simulasi:</span>
              <span className="font-mono text-sky-400 font-bold">
                {cloudStats.processedTB.toFixed(1)} / {cloudStats.totalVolumeTB} unit demo ({processedPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${processedPercent}%` }}
              />
            </div>
          </div>

          {/* Cluster specs grid */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
              <div className="text-[10px] text-slate-400">Node Worker</div>
              <div className="text-sm font-mono font-bold text-slate-200 mt-0.5">
                Simulasi
              </div>
            </div>
            <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
              <div className="text-[10px] text-slate-400">Backend</div>
              <div className="text-[11px] font-mono font-bold text-sky-300 mt-0.5 truncate">
                Belum dikonfigurasi
              </div>
            </div>
            <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
              <div className="text-[10px] text-slate-400">Status koneksi</div>
              <div className="text-[11px] font-mono font-bold text-slate-200 mt-0.5">
                Belum terhubung
              </div>
            </div>
          </div>
        </div>

        {/* Cross-device Synchronization & Offline Queue */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">
                Status Penyimpanan dan Sinkronisasi
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Status sinkronisasi: {lastSyncText}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Data survei dan antrean perubahan disimpan pada penyimpanan lokal browser (localStorage) yang memiliki batas kapasitas. Sinkronisasi server belum tersedia; antrean tidak akan dihapus sampai backend mengonfirmasi penerimaan data.
          </p>

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs">
              <span className="text-slate-500">Item Antrian Offline: </span>
              <span className="font-bold text-slate-900 font-mono">
                {pendingSyncCount} perubahan
              </span>
            </div>

            <button
              onClick={handleSyncClick}
              disabled={false}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <RefreshCw size={13}  />
              Periksa status integrasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
