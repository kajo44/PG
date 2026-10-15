import { RoadLink, SurveyPhoto } from '../types/pkrms';

export function exportPKRMStoCSV(road: RoadLink, photos: SurveyPhoto[]): string {
  const headers = [
    'No',
    'Kode Ruas',
    'Nama Ruas',
    'Kabupaten',
    'Provinsi',
    'STA (Meter)',
    'Label STA',
    'Latitude',
    'Longitude',
    'Tipe Perkerasan',
    'Lebar Jalur (m)',
    'Kondisi Jalan',
    'Nilai SDI',
    'Nilai PCI',
    'Daftar Kerusakan',
    'Kondisi Drainase',
    'Nama Surveyor',
    'Waktu Inspeksi',
    'Status Verifikasi',
    'Tersinkron Cloud',
    'Catatan Teknis',
  ];

  const escapeCSV = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = photos.map((p, idx) => {
    const defectsStr = p.defects.length > 0
      ? p.defects.map(d => `${d.type} (${d.severity} - ${d.extentPercent}%)`).join('; ')
      : 'Nihil Kerusakan';

    return [
      idx + 1,
      escapeCSV(road.code),
      escapeCSV(road.name),
      escapeCSV(road.kabupaten),
      escapeCSV(road.province),
      p.sta,
      escapeCSV(p.staLabel),
      p.lat.toFixed(6),
      p.lng.toFixed(6),
      escapeCSV(p.pavementType),
      p.laneWidthMeters,
      escapeCSV(p.condition),
      p.sdiScore,
      p.pciScore,
      escapeCSV(defectsStr),
      escapeCSV(p.drainageCondition),
      escapeCSV(p.surveyor),
      escapeCSV(p.timestamp),
      escapeCSV(p.verified ? 'DIVERIFIKASI' : 'BELUM DIVERIFIKASI'),
      escapeCSV(p.syncedToCloud ? 'TERCATAT TERSINKRON (perlu verifikasi server)' : 'BELUM TERSINKRON / LOKAL'),
      escapeCSV(p.notes),
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures Excel opens Indonesian characters correctly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `Data_Survey_PKRMS_${road.code}_${new Date().toISOString().slice(0, 10)}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Export Road Link and GPS Track as standard GeoJSON
 */
export function exportTrackGeoJSON(road: RoadLink, photos: SurveyPhoto[]): void {
  const geojson = {
    type: 'FeatureCollection',
    metadata: {
      generatedBy: 'PKRMS GeoSurvey Pro',
      roadCode: road.code,
      roadName: road.name,
      lengthKm: road.lengthKm,
      exportedAt: new Date().toISOString(),
      integrationStatus: 'Backend cloud/GEE belum dikonfigurasi; metadata ini bukan bukti sinkronisasi.',
    },
    features: [
      {
        type: 'Feature',
        properties: {
          type: 'ROAD_CENTERLINE',
          code: road.code,
          name: road.name,
          pavement: road.primaryPavement,
          widthM: road.widthMeters,
        },
        geometry: {
          type: 'LineString',
          coordinates: road.coordinates.map((c) => [c[1], c[0]]), // GeoJSON is [lng, lat]
        },
      },
      ...photos.map((p) => ({
        type: 'Feature',
        properties: {
          type: 'INSPECTION_PHOTO_POINT',
          id: p.id,
          sta: p.sta,
          staLabel: p.staLabel,
          condition: p.condition,
          sdi: p.sdiScore,
          pci: p.pciScore,
          surveyor: p.surveyor,
          defects: p.defects,
          notes: p.notes,
        },
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat],
        },
      })),
    ],
  };

  const blob = new Blob([JSON.stringify(geojson, null, 2)], {
    type: 'application/geo+json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `PKRMS_${road.code}_Spatial.geojson`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
