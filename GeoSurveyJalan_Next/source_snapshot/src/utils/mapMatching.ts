import { GPSPoint, MapMatchingResult, RoadLink } from '../types/pkrms';
import {
  calculateBearing,
  formatSTA,
  haversineDistanceMeters,
  projectPointOntoSegment,
  toRadians,
} from './geoMath';


export interface RoadGeometryCache {
  segments: {
    index: number;
    startCoord: [number, number];
    endCoord: [number, number];
    lengthM: number;
    startCumDistM: number;
    bearing: number;
  }[];
  totalLengthM: number;
}

/**
 * Build precomputed segment cache with cumulative distances along road
 */
export function buildRoadCache(road: RoadLink): RoadGeometryCache {
  const segments: RoadGeometryCache['segments'] = [];
  let cumDist = 0;

  for (let i = 0; i < road.coordinates.length - 1; i++) {
    const start = road.coordinates[i];
    const end = road.coordinates[i + 1];
    const len = haversineDistanceMeters(start[0], start[1], end[0], end[1]);
    const bearing = calculateBearing(start[0], start[1], end[0], end[1]);

    segments.push({
      index: i,
      startCoord: start,
      endCoord: end,
      lengthM: len,
      startCumDistM: cumDist,
      bearing,
    });
    cumDist += len;
  }

  return {
    segments,
    totalLengthM: cumDist,
  };
}

/**
 * Baseline map matching: independent nearest-segment projection.
 * This is not HMM/Viterbi; sequence-aware transition scoring is a future improvement.
 */
export function executeMapMatching(
  rawPoints: GPSPoint[],
  road: RoadLink,
  options: {
    sigmaZ?: number; // GPS standard deviation (default 4.5m)
    anomalyDistanceThresholdM?: number; // Distance beyond which it's an anomaly (default 25m)
    smoothTransitions?: boolean;
  } = {}
): MapMatchingResult {
  const startTime = performance.now();
  const sigmaZ = options.sigmaZ ?? 4.5;
  const anomalyDistThreshold = options.anomalyDistanceThresholdM ?? 25;
  if (!Number.isFinite(sigmaZ) || sigmaZ <= 0) {
    throw new Error('Parameter sigmaZ harus berupa angka lebih besar dari 0.');
  }
  if (!Number.isFinite(anomalyDistThreshold) || anomalyDistThreshold < 0) {
    throw new Error('Ambang anomali harus berupa angka 0 atau lebih.');
  }
  if (!Array.isArray(road.coordinates) || road.coordinates.length < 2) {
    throw new Error('Geometri ruas harus memiliki minimal dua titik koordinat.');
  }
  if (road.coordinates.some(([lat, lng]) => !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)) {
    throw new Error('Geometri ruas mengandung koordinat yang tidak valid.');
  }
  if (rawPoints.some((pt) => !Number.isFinite(pt.lat) || !Number.isFinite(pt.lng) || Math.abs(pt.lat) > 90 || Math.abs(pt.lng) > 180 || !Number.isFinite(new Date(pt.timestamp).getTime()))) {
    throw new Error('Data GPS mengandung koordinat atau timestamp yang tidak valid.');
  }
  if (rawPoints.length === 0) {
    return {
      roadLinkId: road.id,
      rawPointCount: 0,
      matchedPointCount: 0,
      averageDeviationMeters: 0,
      maxDeviationMeters: 0,
      confidenceScore: 0,
      anomaliesFixed: 0,
      computationTimeMs: Math.round(performance.now() - startTime),
      points: [],
    };
  }
  const roadCache = buildRoadCache(road);

  let totalOffset = 0;
  let maxOffset = 0;
  let anomaliesCount = 0;

  const matchedPoints: GPSPoint[] = rawPoints.map((pt, ptIdx) => {
    let bestDist = Infinity;
    let bestSnappedLat = pt.lat;
    let bestSnappedLng = pt.lng;
    let bestSta = 0;
    let bestSegmentIdx = 0;

    // Evaluate candidate projections along all segments of the road
    for (const seg of roadCache.segments) {
      const proj = projectPointOntoSegment(
        pt.lat,
        pt.lng,
        seg.startCoord[0],
        seg.startCoord[1],
        seg.endCoord[0],
        seg.endCoord[1]
      );

      // Emission probability weight penalty:
      // In HMM: emission = exp(-0.5 * (dist / sigma)^2)
      if (proj.distanceM < bestDist) {
        bestDist = proj.distanceM;
        bestSnappedLat = proj.snappedLat;
        bestSnappedLng = proj.snappedLng;
        bestSta = seg.startCumDistM + proj.t * seg.lengthM;
        bestSegmentIdx = seg.index;
      }
    }

    // Check for anomalies
    let isAnomaly = bestDist > anomalyDistThreshold;
    let anomalyReason: string | undefined = undefined;

    if (isAnomaly) {
      anomaliesCount++;
      anomalyReason = `GPS Drift > ${Math.round(bestDist)}m dari as jalan`;
    } else if (ptIdx > 0) {
      const prevPt = rawPoints[ptIdx - 1];
      const timeDiffSec =
        (new Date(pt.timestamp).getTime() - new Date(prevPt.timestamp).getTime()) / 1000;
      if (timeDiffSec > 0) {
        const speedKmh =
          (haversineDistanceMeters(pt.lat, pt.lng, prevPt.lat, prevPt.lng) /
            timeDiffSec) *
          3.6;
        if (speedKmh > 110) {
          isAnomaly = true;
          anomaliesCount++;
          anomalyReason = `Lonjakan kecepatan tidak wajar (${Math.round(speedKmh)} km/jam)`;
        }
      }
    }

    totalOffset += bestDist;
    if (bestDist > maxOffset) maxOffset = bestDist;

    // Dynamic heading from snapped segment
    const segBearing = roadCache.segments[bestSegmentIdx]?.bearing ?? pt.heading;

    return {
      ...pt,
      isMatched: true,
      snappedLat: bestSnappedLat,
      snappedLng: bestSnappedLng,
      distanceOffsetM: Math.round(bestDist * 10) / 10,
      sta: Math.round(bestSta),
      staLabel: formatSTA(bestSta),
      heading: segBearing,
      isAnomaly,
      anomalyReason,
    };
  });

  const avgOffset = rawPoints.length > 0 ? totalOffset / rawPoints.length : 0;
  // Confidence score: based on Gaussian distribution of errors
  // If avgOffset <= 2m -> ~98%, 5m -> ~90%, 15m -> ~60%
  const confidenceScore = Math.max(
    10,
    Math.min(99.4, Math.round((Math.exp(-(avgOffset * avgOffset) / (2 * sigmaZ * sigmaZ * 9)) * 100) * 10) / 10)
  );

  const endTime = performance.now();

  return {
    roadLinkId: road.id,
    rawPointCount: rawPoints.length,
    matchedPointCount: matchedPoints.length,
    averageDeviationMeters: Math.round(avgOffset * 10) / 10,
    maxDeviationMeters: Math.round(maxOffset * 10) / 10,
    confidenceScore,
    anomaliesFixed: anomaliesCount,
    computationTimeMs: Math.round(endTime - startTime),
    points: matchedPoints,
  };
}

/**
 * Generate simulated raw survey GPS points along road with realistic multipath noise,
 * vegetation signal blockage drift, and sudden GPS jumps for testing map matching.
 */
export function generateSimulatedRawGPS(
  road: RoadLink,
  pointCount: number = 60,
  noiseIntensityM: number = 8
): GPSPoint[] {
  const points: GPSPoint[] = [];
  const roadCache = buildRoadCache(road);
  const stepDist = roadCache.totalLengthM / (pointCount - 1);
  const startTime = new Date(Date.now() - pointCount * 3000);

  let currentDist = 0;
  for (let i = 0; i < pointCount; i++) {
    // Find coordinate at currentDist
    let targetLat = road.coordinates[0][0];
    let targetLng = road.coordinates[0][1];
    let segBearing = 0;

    for (const seg of roadCache.segments) {
      if (
        currentDist >= seg.startCumDistM &&
        currentDist <= seg.startCumDistM + seg.lengthM
      ) {
        const t = (currentDist - seg.startCumDistM) / seg.lengthM;
        targetLat = seg.startCoord[0] + t * (seg.endCoord[0] - seg.startCoord[0]);
        targetLng = seg.startCoord[1] + t * (seg.endCoord[1] - seg.startCoord[1]);
        segBearing = seg.bearing;
        break;
      }
    }

    // Add realistic noise
    // Introduce random GPS drift + intentional multipath spikes every ~15 points
    const isSpike = i % 14 === 0 && i !== 0;
    const noiseM = isSpike
      ? noiseIntensityM * 3.8 + Math.random() * 15
      : (Math.random() - 0.5) * noiseIntensityM * 2;

    const angle = Math.random() * Math.PI * 2;
    const dLat = (noiseM * Math.cos(angle)) / 111111;
    const dLng =
      (noiseM * Math.sin(angle)) / (111111 * Math.cos(toRadians(targetLat)));

    const ptLat = targetLat + dLat;
    const ptLng = targetLng + dLng;

    const timestamp = new Date(startTime.getTime() + i * 3000).toISOString();
    const speed = 32 + (Math.sin(i * 0.4) * 12) + (Math.random() * 4 - 2);

    points.push({
      id: `gps-raw-${i + 1}`,
      lat: ptLat,
      lng: ptLng,
      altitude: 450 + Math.sin(i * 0.1) * 35,
      speedKmh: Math.max(15, Math.round(speed * 10) / 10),
      heading: (segBearing + (Math.random() * 20 - 10) + 360) % 360,
      accuracyM: isSpike ? 18.5 : 3.2 + Math.random() * 2.5,
      timestamp,
      isMatched: false,
    });

    currentDist += stepDist;
  }

  return points;
}
