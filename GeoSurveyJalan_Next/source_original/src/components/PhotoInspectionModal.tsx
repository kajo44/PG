import React, { useState } from 'react';
import {
  DefectItem,
  PavementCondition,
  PavementType,
  RoadLink,
  SurveyPhoto,
} from '../types/pkrms';
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle,
  Cloud,
  FileCheck,
  MapPin,
  Save,
  Tag,
  Upload,
  X,
} from 'lucide-react';

interface PhotoInspectionModalProps {
  photo: SurveyPhoto | null;
  selectedRoad: RoadLink;
  onClose: () => void;
  onSavePhotoEvaluation: (updatedPhoto: SurveyPhoto) => void;
}

const COMMON_DEFECTS = [
  'Lubang (Potholes)',
  'Retak Buaya (Alligator Cracking)',
  'Alur Roda (Rutting)',
  'Amblas (Depression)',
  'Retak Memanjang / Melintang',
  'Pelepasan Butir (Raveling)',
  'Bahu Jalan Terkikis / Turun',
  'Kegemukan Aspal (Bleeding)',
];

export const PhotoInspectionModal: React.FC<PhotoInspectionModalProps> = ({
  photo,
  selectedRoad,
  onClose,
  onSavePhotoEvaluation,
}) => {
  if (!photo) return null;

  const [condition, setCondition] = useState<PavementCondition>(photo.condition);
  const [pavementType, setPavementType] = useState<PavementType>(photo.pavementType);
  const [drainageCondition, setDrainageCondition] = useState<'Baik' | 'Tersumbat' | 'Rusak'>(
    photo.drainageCondition
  );
  const [sdiScore, setSdiScore] = useState<number>(photo.sdiScore);
  const [pciScore, setPciScore] = useState<number>(photo.pciScore);
  const [notes, setNotes] = useState<string>(photo.notes);
  const [verified, setVerified] = useState<boolean>(photo.verified);
  const [laneWidth, setLaneWidth] = useState<number>(photo.laneWidthMeters);

  // Selected defect types
  const [selectedDefects, setSelectedDefects] = useState<string[]>(
    photo.defects.map((d) => d.type)
  );

  const toggleDefect = (defectName: string) => {
    let nextDefects: string[];
    if (selectedDefects.includes(defectName)) {
      nextDefects = selectedDefects.filter((d) => d !== defectName);
    } else {
      nextDefects = [...selectedDefects, defectName];
    }
    setSelectedDefects(nextDefects);

    // Auto calculate estimated SDI and PCI based on defects
    recalculateIndices(nextDefects, condition);
  };

  const recalculateIndices = (defects: string[], cond: PavementCondition) => {
    let baseSdi = 10;
    let basePci = 95;

    if (cond === 'BAIK') {
      baseSdi = Math.min(25, defects.length * 8);
      basePci = Math.max(85, 100 - defects.length * 5);
    } else if (cond === 'SEDANG') {
      baseSdi = Math.min(65, 30 + defects.length * 10);
      basePci = Math.max(70, 84 - defects.length * 4);
    } else if (cond === 'RUSAK_RINGAN') {
      baseSdi = Math.min(100, 65 + defects.length * 12);
      basePci = Math.max(50, 69 - defects.length * 6);
    } else {
      baseSdi = Math.min(150, 105 + defects.length * 15);
      basePci = Math.max(15, 49 - defects.length * 8);
    }

    setSdiScore(baseSdi);
    setPciScore(basePci);
  };

  const handleConditionChange = (newCond: PavementCondition) => {
    setCondition(newCond);
    recalculateIndices(selectedDefects, newCond);
  };

  const handleSave = () => {
    const defectItems: DefectItem[] = selectedDefects.map((name) => ({
      type: name,
      severity: condition === 'RUSAK_BERAT' ? 'Tinggi' : condition === 'RUSAK_RINGAN' ? 'Sedang' : 'Rendah',
      extentPercent: 15,
    }));

    const updated: SurveyPhoto = {
      ...photo,
      condition,
      pavementType,
      drainageCondition,
      sdiScore,
      pciScore,
      laneWidthMeters: laneWidth,
      defects: defectItems,
      notes,
      verified,
      syncedToCloud: true, // will trigger distributed cloud sync
    };

    onSavePhotoEvaluation(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header (Material 3 Style) */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm">
              <Camera size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Form Penilaian Teknis Kondisi Lapangan
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-100 text-indigo-700">
                  {photo.staLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Ruas: {selectedRoad.code} ({selectedRoad.name})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Photo Preview & Spatial Tagging */}
          <div className="md:col-span-5 space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-[4/3] group shadow-inner">
              <img
                src={photo.imageSrc}
                alt={photo.staLabel}
                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-mono font-semibold flex items-center gap-1.5 border border-white/10">
                <MapPin size={12} className="text-sky-400" />
                {photo.staLabel}
              </div>
              <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-slate-900/85 backdrop-blur-md text-white text-[10px] space-y-0.5 border border-white/10">
                <div className="font-mono text-slate-300">
                  GPS: {photo.lat.toFixed(6)}, {photo.lng.toFixed(6)}
                </div>
                <div className="text-slate-400">
                  Waktu: {new Date(photo.timestamp).toLocaleString('id-ID')}
                </div>
                <div className="text-slate-400">Surveyor: {photo.surveyor}</div>
              </div>
            </div>

            {/* Geometry attributes */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Lebar Perkerasan (m):</span>
                <input
                  type="number"
                  step="0.5"
                  value={laneWidth}
                  onChange={(e) => setLaneWidth(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-right font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Status Drainase:</span>
                <div className="flex gap-1">
                  {(['Baik', 'Tersumbat', 'Rusak'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDrainageCondition(d)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition ${
                        drainageCondition === d
                          ? d === 'Baik'
                            ? 'bg-emerald-600 text-white'
                            : d === 'Tersumbat'
                            ? 'bg-amber-600 text-white'
                            : 'bg-red-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Engineering Condition Grading */}
          <div className="md:col-span-7 space-y-5">
            {/* Condition Selection (Material 3 Segmented Choices) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Klasifikasi Kondisi Jalan (Standar PKRMS / Bina Marga)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'BAIK', label: 'Baik', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                  { id: 'SEDANG', label: 'Sedang', color: 'border-amber-500 bg-amber-50 text-amber-800' },
                  { id: 'RUSAK_RINGAN', label: 'R. Ringan', color: 'border-orange-500 bg-orange-50 text-orange-800' },
                  { id: 'RUSAK_BERAT', label: 'R. Berat', color: 'border-red-500 bg-red-50 text-red-800' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleConditionChange(item.id as PavementCondition)}
                    className={`py-2 px-3 rounded-2xl border-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      condition === item.id
                        ? `${item.color} shadow-sm`
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {condition === item.id && <Check size={14} />}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pavement Type Choice */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Jenis Lapis Perkerasan
              </label>
              <div className="flex flex-wrap gap-2">
                {(['ASPAL', 'BETON', 'KERIKIL', 'TANAH'] as PavementType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setPavementType(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      pavementType === type
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* SDI and PCI Indicator Sliders */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Surface Distress Index (SDI)</span>
                  <span className="font-mono font-bold text-amber-600">{sdiScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={sdiScore}
                  onChange={(e) => setSdiScore(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0 (Sempurna)</span>
                  <span>150 (Kritis)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Pavement Condition (PCI)</span>
                  <span className="font-mono font-bold text-indigo-600">{pciScore} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pciScore}
                  onChange={(e) => setPciScore(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0 (Gagal)</span>
                  <span>100 (Prima)</span>
                </div>
              </div>
            </div>

            {/* Common Defects Multi-Select Checklist */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Daftar Kerusakan Spesifik yang Teridentifikasi
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {COMMON_DEFECTS.map((defect) => {
                  const isChecked = selectedDefects.includes(defect);
                  return (
                    <label
                      key={defect}
                      onClick={() => toggleDefect(defect)}
                      className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer border transition ${
                        isChecked
                          ? 'border-indigo-400 bg-indigo-50/70 text-indigo-950 font-medium'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent onClick
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                      <span>{defect}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Engineering Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan Teknis Lapangan
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Rekomendasi penanganan (contoh: overlay 4cm, patching setempat, rekonstruksi bahu)..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Corporate Verification Checkbox */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <label className="flex items-center gap-2 text-xs font-semibold text-emerald-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  className="rounded text-emerald-600 w-4 h-4"
                />
                <span>Verifikasi dan Setujui Hasil Penilaian Lapangan</span>
              </label>
              <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                <Cloud size={13} /> Sinkronisasi Otomatis Cloud 120TB
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer (Action Buttons) */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Penilaian akan disimpan dan diintegrasikan ke laporan PDF/CSV otomatis.
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition flex items-center gap-2"
            >
              <Save size={14} />
              Simpan & Sinkronkan Penilaian
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
