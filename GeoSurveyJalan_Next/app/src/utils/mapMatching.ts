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
 * HMM/Viterbi map matching for a GPS sequence against one ordered road polyline.
 * Candidate emissions use GPS-to-road distance; transitions compare observed GPS
 * displacement with the difference in cumulative STA between candidate states.
 */
export function executeMapMatching(
  rawPoints: GPSPoint[],
  road: RoadLink,
  options: {
    sigmaZ?: number;
    anomalyDistanceThresholdM?: number;
    smoothTransitions?: boolean;
    transitionBetaM?: number;
    candidateCount?: number;
  } = {}
): MapMatchingResult {
  const startTime = performance.now();
  const sigmaZ = options.sigmaZ ?? 4.5;
  const anomalyDistThreshold = options.anomalyDistanceThresholdM ?? 25;
  const beta = options.transitionBetaM ?? 10;
  const candidateCount = Math.floor(options.candidateCount ?? 8);

  if (!Number.isFinite(sigmaZ) || sigmaZ <= 0) {
    throw new Error('Parameter sigmaZ harus berupa angka lebih besar dari 0.');
  }
  if (!Number.isFinite(anomalyDistThreshold) || anomalyDistThreshold < 0) {
    throw new Error('Ambang anomali harus berupa angka 0 atau lebih.');
  }
  if (!Number.isFinite(beta) || beta <= 0) {
    throw new Error('Parameter transitionBetaM harus lebih besar dari 0.');
  }
  if (!Number.isInteger(candidateCount) || candidateCount < 1 || candidateCount > 32) {
    throw new Error('Jumlah kandidat map matching harus berupa bilangan bulat 1 sampai 32.');
  }
  if (!Array.isArray(road.coordinates) || road.coordinates.length < 2) {
    throw new Error('Geometri ruas harus memiliki minimal dua titik koordinat.');
  }
  if (road.coordinates.some((coord) => !coord || !Number.isFinite(coord[0]) || !Number.isFinite(coord[1]) || Math.abs(coord[0]) > 90 || Math.abs(coord[1]) > 180)) {
    throw new Error('Geometri ruas mengandung koordinat yang tidak valid.');
  }
  if (rawPoints.some((pt) => !pt || !Number.isFinite(pt.lat) || !Number.isFinite(pt.lng) || Math.abs(pt.lat) > 90 || Math.abs(pt.lng) > 180 || !Number.isFinite(new Date(pt.timestamp).getTime()))) {
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
      anomaliesDetected: 0,
      computationTimeMs: Math.round(performance.now() - startTime),
      points: [],
    };
  }

  const roadCache = buildRoadCache(road);
  type Candidate = {
    segmentIndex: number;
    snappedLat: number;
    snappedLng: number;
    distanceM: number;
    sta: number;
    bearing: number;
  };

  const candidateLayers: Candidate[][] = rawPoints.map((point) =>
    roadCache.segments
      .map((segment): Candidate => {
        const projection = projectPointOntoSegment(
          point.lat,
          point.lng,
          segment.startCoord[0],
          segment.startCoord[1],
          segment.endCoord[0],
          segment.endCoord[1]
        );
        return {
          segmentIndex: segment.index,
          snappedLat: projection.snappedLat,
          snappedLng: projection.snappedLng,
          distanceM: projection.distanceM,
          sta: segment.startCumDistM + projection.t * segment.lengthM,
          bearing: segment.bearing,
        };
      })
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, candidateCount)
  );

  // Log-space Viterbi avoids numerical underflow from multiplying probabilities.
  const scoreLayers: number[][] = [];
  const backPointers: number[][] = [];
  const emissionScore = (candidate: Candidate) => -0.5 * Math.pow(candidate.distanceM / sigmaZ, 2);

  scoreLayers[0] = candidateLayers[0].map(emissionScore);
  backPointers[0] = candidateLayers[0].map(() => -1);

  for (let pointIndex = 1; pointIndex < rawPoints.length; pointIndex++) {
    const previousPoint = rawPoints[pointIndex - 1];
    const currentPoint = rawPoints[pointIndex];
    const observedDistance = haversineDistanceMeters(
      previousPoint.lat,
      previousPoint.lng,
      currentPoint.lat,
      currentPoint.lng
    );
    const currentScores: number[] = [];
    const currentBackPointers: number[] = [];

    for (const currentCandidate of candidateLayers[pointIndex]) {
      const emission = emissionScore(currentCandidate);
      let bestScore = Number.NEGATIVE_INFINITY;
      let bestPreviousIndex = 0;

      for (let previousIndex = 0; previousIndex < candidateLayers[pointIndex - 1].length; previousIndex++) {
        const previousCandidate = candidateLayers[pointIndex - 1][previousIndex];
        const routeDistance = Math.abs(currentCandidate.sta - previousCandidate.sta);
        const transition = options.smoothTransitions === false
          ? 0
          : -Math.abs(observedDistance - routeDistance) / beta;
        const score = scoreLayers[pointIndex - 1][previousIndex] + transition + emission;
        if (score > bestScore) {
          bestScore = score;
          bestPreviousIndex = previousIndex;
        }
      }

      currentScores.push(bestScore);
      currentBackPointers.push(bestPreviousIndex);
    }
    scoreLayers.push(currentScores);
    backPointers.push(currentBackPointers);
  }

  const selectedCandidateIndices = new Array<number>(rawPoints.length);
  selectedCandidateIndices[rawPoints.length - 1] = scoreLayers[scoreLayers.length - 1]
    .reduce((bestIndex, score, index, scores) => score > scores[bestIndex] ? index : bestIndex, 0);

  for (let pointIndex = rawPoints.length - 1; pointIndex > 0; pointIndex--) {
    selectedCandidateIndices[pointIndex - 1] = backPointers[pointIndex][selectedCandidateIndices[pointIndex]];
  }

  let totalOffset = 0;
  let maxOffset = 0;
  let anomaliesCount = 0;

  const matchedPoints: GPSPoint[] = rawPoints.map((point, pointIndex) => {
    const candidate = options.smoothTransitions === false
      ? candidateLayers[pointIndex][0]
      : candidateLayers[pointIndex][selectedCandidateIndices[pointIndex]];
    const bestDist = candidate.distanceM;
    let isAnomaly = bestDist > anomalyDistThreshold;
    let anomalyReason: string | undefined;

    if (isAnomaly) {
      anomalyReason = `GPS Drift > ${Math.round(bestDist)}m dari as jalan`;
    } else if (pointIndex > 0) {
      const previousPoint = rawPoints[pointIndex - 1];
      const timeDiffSec = (
        new Date(point.timestamp).getTime() - new Date(previousPoint.timestamp).getTime()
      ) / 1000;
      if (timeDiffSec > 0) {
        const speedKmh = (
          haversineDistanceMeters(point.lat, point.lng, previousPoint.lat, previousPoint.lng) /
          timeDiffSec
        ) * 3.6;
        if (speedKmh > 110) {
          isAnomaly = true;
          anomalyReason = `Lonjakan kecepatan tidak wajar (${Math.round(speedKmh)} km/jam)`;
        }
      }
    }

    if (isAnomaly) anomaliesCount++;
    totalOffset += bestDist;
    maxOffset = Math.max(maxOffset, bestDist);

    return {
      ...point,
      isMatched: true,
      snappedLat: candidate.snappedLat,
      snappedLng: candidate.snappedLng,
      distanceOffsetM: Math.round(bestDist * 10) / 10,
      sta: Math.round(candidate.sta),
      staLabel: formatSTA(candidate.sta),
      heading: candidate.bearing,
      isAnomaly,
      anomalyReason,
    };
  });

  const avgOffset = totalOffset / rawPoints.length;
  // This is a heuristic fit score, not a statistically calibrated probability.
  const confidenceScore = Math.max(
    10,
    Math.min(99.4, Math.round(
      Math.exp(-(avgOffset * avgOffset) / (2 * sigmaZ * sigmaZ * 9)) * 1000
    ) / 10)
  );

  return {
    roadLinkId: road.id,
    rawPointCount: rawPoints.length,
    matchedPointCount: matchedPoints.length,
    averageDeviationMeters: Math.round(avgOffset * 10) / 10,
    maxDeviationMeters: Math.round(maxOffset * 10) / 10,
    confidenceScore,
    anomaliesDetected: anomaliesCount,
    computationTimeMs: Math.round(performance.now() - startTime),
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
