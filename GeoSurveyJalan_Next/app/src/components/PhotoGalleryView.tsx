import React, { useRef, useState } from 'react';
import { PavementCondition, RoadLink, SurveyPhoto } from '../types/pkrms';
import {
  Camera,
  CheckCircle,
  Clock,
  Filter,
  Image as ImageIcon,
  MapPin,
  Plus,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import { formatSTA } from '../utils/geoMath';

interface PhotoGalleryViewProps {
  selectedRoad: RoadLink;
  photos: SurveyPhoto[];
  staInterval: number;
  onChangeStaInterval: (interval: number) => void;
  onSelectPhoto: (photo: SurveyPhoto) => void;
  onImportNewPhoto: (newPhoto: SurveyPhoto) => void;
}

export const PhotoGalleryView: React.FC<PhotoGalleryViewProps> = ({
  selectedRoad,
  photos,
  staInterval,
  onChangeStaInterval,
  onSelectPhoto,
  onImportNewPhoto,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterCondition, setFilterCondition] = useState<string>('ALL');
  const [filterVerified, setFilterVerified] = useState<string>('ALL');

  // Filter photos by selected road and interval
  const roadPhotos = photos.filter((p) => p.roadLinkId === selectedRoad.id);

  // Interval filter: match photos nearest to intervals (e.g., if interval=100m, show 0, 100, 200...)
  const filteredPhotos = roadPhotos.filter((p) => {
    // Condition filter
    if (filterCondition !== 'ALL' && p.condition !== filterCondition) return false;
    // Verification filter
    if (filterVerified === 'VERIFIED' && !p.verified) return false;
    if (filterVerified === 'UNVERIFIED' && p.verified) return false;

    // STA interval tolerance check (within ±(interval/2) meters from an interval boundary)
    if (staInterval > 0) {
      const remainder = p.sta % staInterval;
      const isNearInterval =
        remainder <= staInterval * 0.4 || remainder >= staInterval * 0.6;
      return isNearInterval;
    }

    return true;
  });

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;

      // Assign to current road mid-point or random STA for survey realism
      const randomSta = Math.floor(Math.random() * (selectedRoad.lengthKm * 1000));
      const coordIdx = Math.min(
        Math.floor((randomSta / (selectedRoad.lengthKm * 1000)) * selectedRoad.coordinates.length),
        selectedRoad.coordinates.length - 1
      );
      const coord = selectedRoad.coordinates[coordIdx];

      const newPhoto: SurveyPhoto = {
        id: `photo-import-${Date.now()}`,
        roadLinkId: selectedRoad.id,
        sta: randomSta,
        staLabel: formatSTA(randomSta),
        lat: coord[0] + (Math.random() * 0.0004 - 0.0002),
        lng: coord[1] + (Math.random() * 0.0004 - 0.0002),
        imageSrc: base64Url,
        timestamp: new Date().toISOString(),
        surveyor: 'Surveyor Lapangan',
        condition: 'SEDANG',
        pavementType: selectedRoad.primaryPavement,
        sdiScore: 40,
        pciScore: 75,
        defects: [{ type: 'Retak Permukaan', severity: 'Sedang', extentPercent: 15 }],
        laneWidthMeters: selectedRoad.widthMeters,
        notes: 'Foto dokumentasi lapangan baru diimpor dari perangkat surveyor.',
        verified: false,
        syncedToCloud: false,
        drainageCondition: 'Baik',
      };

      onImportNewPhoto(newPhoto);
    };

    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Gallery Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera size={18} className="text-indigo-600" />
              Galeri Dokumentasi & Penilaian Foto STA
            </h2>
            <p className="text-xs text-slate-500">
              {filteredPhotos.length} foto terpilih untuk {selectedRoad.code} (Interval: {staInterval}m)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Upload size={14} />
              Import Foto Lapangan
            </button>
          </div>
        </div>

        {/* Filter Toolbar & STA Interval Selector */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {/* STA Interval Picker */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-2xl">
            <SlidersHorizontal size={13} className="text-slate-500" />
            <span className="font-medium text-slate-600">Interval STA:</span>
            <div className="flex gap-1 ml-1">
              {[25, 50, 100, 200, 500].map((int) => (
                <button
                  key={int}
                  onClick={() => onChangeStaInterval(int)}
                  className={`px-2 py-0.5 rounded-xl font-medium transition ${
                    staInterval === int
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {int}m
                </button>
              ))}
            </div>
          </div>

          {/* Condition Filter */}
          <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-2xl">
            <Filter size={13} className="text-slate-500" />
            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none text-xs"
            >
              <option value="ALL">Semua Kondisi</option>
              <option value="BAIK">Baik</option>
              <option value="SEDANG">Sedang</option>
              <option value="RUSAK_RINGAN">Rusak Ringan</option>
              <option value="RUSAK_BERAT">Rusak Berat</option>
            </select>
          </div>

          {/* Verification status filter */}
          <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-2xl">
            <CheckCircle size={13} className="text-slate-500" />
            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none text-xs"
            >
              <option value="ALL">Semua Verifikasi</option>
              <option value="VERIFIED">Diverifikasi Saja</option>
              <option value="UNVERIFIED">Belum Verifikasi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gallery Cards Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredPhotos.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
            <ImageIcon size={32} className="text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">
              Tidak ada foto pada interval STA {staInterval}m dengan filter ini
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Klik "Import Foto Lapangan" atau ganti interval ke jarak lainnya.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {filteredPhotos.map((photo) => {
              const conditionBadge =
                photo.condition === 'BAIK'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : photo.condition === 'SEDANG'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : photo.condition === 'RUSAK_RINGAN'
                  ? 'bg-orange-100 text-orange-800 border-orange-300'
                  : 'bg-red-100 text-red-800 border-red-300';

              return (
                <div
                  key={photo.id}
                  onClick={() => onSelectPhoto(photo)}
                  className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-400 transition cursor-pointer overflow-hidden flex flex-col"
                >
                  {/* Photo Thumbnail */}
                  <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                    <img
                      src={photo.imageSrc}
                      alt={photo.staLabel}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {/* STA Pill */}
                    <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-mono font-bold border border-white/20">
                      {photo.staLabel}
                    </div>

                    {/* Condition Pill */}
                    <div
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold border ${conditionBadge}`}
                    >
                      {photo.condition.replace('_', ' ')}
                    </div>

                    {/* Verification checkmark */}
                    {photo.verified && (
                      <div className="absolute bottom-2 right-2 p-1 rounded-full bg-emerald-500 text-white shadow-xs">
                        <CheckCircle size={12} />
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin size={12} className="text-sky-500" />
                          {photo.lat.toFixed(4)}, {photo.lng.toFixed(4)}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          PCI: {photo.pciScore} | SDI: {photo.sdiScore}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {photo.notes || 'Belum ada catatan teknis.'}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{photo.surveyor}</span>
                      <span className="text-indigo-600 font-semibold group-hover:underline">
                        Nilai / Edit &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
