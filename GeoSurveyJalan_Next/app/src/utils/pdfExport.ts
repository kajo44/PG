import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RoadLink, SurveyPhoto, MapMatchingResult } from '../types/pkrms';
import { formatSTA } from './geoMath';

export async function exportPKRMSReportPDF(
  road: RoadLink,
  photos: SurveyPhoto[],
  mapMatchResult: MapMatchingResult | null,
  options: {
    inspectorName?: string;
    organization?: string;
    includePhotos?: boolean;
    intervalMeters?: number;
  } = {}
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const org = options.organization || 'DINAS PEKERJAAN UMUM DAN PENATAAN RUANG';
  const inspector = options.inspectorName || 'Hendra Wijaya, S.T. (Surveyor Madya)';
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate condition stats
  const totalPhotos = photos.length;
  const countBaik = photos.filter((p) => p.condition === 'BAIK').length;
  const countSedang = photos.filter((p) => p.condition === 'SEDANG').length;
  const countRusakRingan = photos.filter((p) => p.condition === 'RUSAK_RINGAN').length;
  const countRusakBerat = photos.filter((p) => p.condition === 'RUSAK_BERAT').length;

  const pctBaik = totalPhotos ? Math.round((countBaik / totalPhotos) * 100) : 0;
  const pctSedang = totalPhotos ? Math.round((countSedang / totalPhotos) * 100) : 0;
  const pctRusakRingan = totalPhotos ? Math.round((countRusakRingan / totalPhotos) * 100) : 0;
  const pctRusakBerat = totalPhotos ? Math.round((countRusakBerat / totalPhotos) * 100) : 0;

  const avgSDI = totalPhotos
    ? Math.round(photos.reduce((acc, p) => acc + p.sdiScore, 0) / totalPhotos)
    : 0;
  const avgPCI = totalPhotos
    ? Math.round(photos.reduce((acc, p) => acc + p.pciScore, 0) / totalPhotos)
    : 0;

  // Header banner
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LAPORAN TEKNIS KONDISI JALAN (PKRMS)', 105, 10, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `${org} - REPUBLIK INDONESIA`,
    105,
    17,
    { align: 'center' }
  );

  // Meta info box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 28, 182, 38, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('KODE RUAS', 18, 34);
  doc.text('NAMA RUAS JALAN', 18, 42);
  doc.text('WILAYAH ADMINISTRASI', 18, 50);
  doc.text('PANJANG / LEBAR', 18, 58);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(road.code, 60, 34);
  doc.text(road.name, 60, 42);
  doc.text(`${road.kabupaten}, Provinsi ${road.province}`, 60, 50);
  doc.text(`${road.lengthKm} KM  |  Lebar Jalur Rata-rata: ${road.widthMeters} m`, 60, 58);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('TANGGAL SURVEY', 130, 34);
  doc.text('SURVEYOR TEKNIS', 130, 42);
  doc.text('AKURASI MAP MATCH', 130, 50);
  doc.text('STATUS BIG DATA', 130, 58);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(currentDate, 168, 34);
  doc.text(inspector.split(' ')[0] + ' ' + (inspector.split(' ')[1] || ''), 168, 42);
  doc.text(mapMatchResult ? `${mapMatchResult.confidenceScore}% (HMM/Viterbi)` : 'Belum dihitung', 168, 50);
  doc.text('Belum terhubung', 168, 58);

  // Executive condition summary cards
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('REKAPITULASI HASIL PENILAIAN VISUAL KONDISI RUAS JALAN', 14, 73);

  // 4 Cards for Baik, Sedang, Rusak Ringan, Rusak Berat
  const cardW = 43;
  const cardH = 22;
  const startY = 76;

  // 1. Baik (Green)
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(14, startY, cardW, cardH, 2, 2, 'FD');
  doc.setTextColor(21, 128, 61);
  doc.setFontSize(8);
  doc.text('BAIK (PCI 85-100)', 18, startY + 6);
  doc.setFontSize(14);
  doc.text(`${pctBaik}%`, 18, startY + 15);
  doc.setFontSize(7.5);
  doc.text(`${((pctBaik * road.lengthKm) / 100).toFixed(2)} KM`, 38, startY + 15);

  // 2. Sedang (Yellow/Amber)
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(234, 179, 8);
  doc.roundedRect(60, startY, cardW, cardH, 2, 2, 'FD');
  doc.setTextColor(161, 98, 7);
  doc.setFontSize(8);
  doc.text('SEDANG (PCI 70-84)', 64, startY + 6);
  doc.setFontSize(14);
  doc.text(`${pctSedang}%`, 64, startY + 15);
  doc.setFontSize(7.5);
  doc.text(`${((pctSedang * road.lengthKm) / 100).toFixed(2)} KM`, 84, startY + 15);

  // 3. Rusak Ringan (Orange)
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(249, 115, 22);
  doc.roundedRect(106, startY, cardW, cardH, 2, 2, 'FD');
  doc.setTextColor(194, 65, 12);
  doc.setFontSize(8);
  doc.text('R. RINGAN (PCI 55-69)', 110, startY + 6);
  doc.setFontSize(14);
  doc.text(`${pctRusakRingan}%`, 110, startY + 15);
  doc.setFontSize(7.5);
  doc.text(`${((pctRusakRingan * road.lengthKm) / 100).toFixed(2)} KM`, 130, startY + 15);

  // 4. Rusak Berat (Red)
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(152, startY, cardW, cardH, 2, 2, 'FD');
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(8);
  doc.text('R. BERAT (PCI < 55)', 156, startY + 6);
  doc.setFontSize(14);
  doc.text(`${pctRusakBerat}%`, 156, startY + 15);
  doc.setFontSize(7.5);
  doc.text(`${((pctRusakBerat * road.lengthKm) / 100).toFixed(2)} KM`, 176, startY + 15);

  // Index metrics
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Indeks Kerusakan Rata-rata:  SDI (Surface Distress Index) = ${avgSDI}  |  PCI (Pavement Condition Index) = ${avgPCI} / 100`,
    14,
    104
  );

  // Detail Table using jspdf-autotable
  const tableData = photos.map((p, idx) => [
    (idx + 1).toString(),
    p.staLabel,
    `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`,
    p.condition.replace('_', ' '),
    `SDI: ${p.sdiScore} | PCI: ${p.pciScore}`,
    p.defects.length > 0 ? p.defects.map((d) => d.type).join(', ') : 'Permukaan Mulus',
    p.drainageCondition,
    p.notes.substring(0, 45) + (p.notes.length > 45 ? '...' : ''),
  ]);

  autoTable(doc, {
    startY: 108,
    head: [
      [
        'No',
        'STA',
        'Koordinat GPS',
        'Kondisi',
        'Indeks Mutu',
        'Tipe Kerusakan',
        'Drainase',
        'Catatan Lapangan',
      ],
    ],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 22, fontStyle: 'bold' },
      4: { cellWidth: 22 },
      5: { cellWidth: 35 },
      6: { cellWidth: 16 },
      7: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const val = data.cell.raw as string;
        if (val.includes('BAIK')) data.cell.styles.textColor = [21, 128, 61];
        else if (val.includes('SEDANG')) data.cell.styles.textColor = [161, 98, 7];
        else if (val.includes('RUSAK RINGAN')) data.cell.styles.textColor = [194, 65, 12];
        else if (val.includes('RUSAK BERAT')) data.cell.styles.textColor = [185, 28, 28];
      }
    },
  });

  // Photo documentation sheet page
  if (options.includePhotos !== false && photos.length > 0) {
    doc.addPage();

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DOKUMENTASI FOTO INSPEKSI LAPANGAN PER INTERVAL STA', 105, 11, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    let photoY = 25;

    // Display first 4 photos with technical stamps
    const photoBatch = photos.slice(0, 4);

    for (let i = 0; i < photoBatch.length; i++) {
      const p = photoBatch[i];
      const isRight = i % 2 === 1;
      const x = isRight ? 110 : 14;
      const y = photoY + Math.floor(i / 2) * 98;

      // Card frame
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(x, y, 86, 90, 2, 2, 'FD');

      // Header stamp
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(p.staLabel, x + 4, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Koor: ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`, x + 4, y + 11);

      // Embedded placeholder box for photo with camera icon/simulation
      doc.setFillColor(226, 232, 240);
      doc.rect(x + 4, y + 14, 78, 48, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.text('[ Dokumentasi Lapangan High-Res ]', x + 43, y + 36, { align: 'center' });
      doc.text(`Surveyor: ${p.surveyor}`, x + 43, y + 42, { align: 'center' });

      // Condition badge
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      if (p.condition === 'BAIK') {
        doc.setTextColor(21, 128, 61);
        doc.text('Kondisi: BAIK (PCI ' + p.pciScore + ')', x + 4, y + 68);
      } else if (p.condition === 'SEDANG') {
        doc.setTextColor(161, 98, 7);
        doc.text('Kondisi: SEDANG (PCI ' + p.pciScore + ')', x + 4, y + 68);
      } else if (p.condition === 'RUSAK_RINGAN') {
        doc.setTextColor(194, 65, 12);
        doc.text('Kondisi: RUSAK RINGAN (PCI ' + p.pciScore + ')', x + 4, y + 68);
      } else {
        doc.setTextColor(185, 28, 28);
        doc.text('Kondisi: RUSAK BERAT (PCI ' + p.pciScore + ')', x + 4, y + 68);
      }

      // Notes & defects
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const defectSummary = p.defects.length > 0 ? p.defects.map(d => d.type).join(', ') : 'Tidak ada kerusakan kritis';
      doc.text(`Kerusakan: ${defectSummary}`.substring(0, 48), x + 4, y + 74);
      doc.text(`Catatan: ${p.notes}`.substring(0, 50), x + 4, y + 80);
      doc.text(`Waktu Rekam: ${new Date(p.timestamp).toLocaleString('id-ID')}`, x + 4, y + 86);
    }
  }

  // Signature Block Page Bottom
  const finalY = 245;
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Diverifikasi oleh Penanggung Jawab Teknis:', 20, finalY);
  doc.text('Surveyor Lapangan:', 140, finalY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Belum ditentukan', 20, finalY + 22);
  doc.text(inspector, 140, finalY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Belum ada pengesahan resmi', 20, finalY + 26);
  doc.text('Status: draf hasil aplikasi', 140, finalY + 26);

  // Footer stamp
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Laporan draf PKRMS GeoSurvey Pro | Integrasi cloud/GEE belum dikonfigurasi | Perlu verifikasi teknis`,
    105,
    290,
    { align: 'center' }
  );

  // Save to file
  const fileName = `Laporan_PKRMS_${road.code}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
}
