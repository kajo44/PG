import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatSTA, haversineDistanceMeters, parseSTA, projectPointOntoSegment } from './geoMath';
import { executeMapMatching } from './mapMatching';
import type { GPSPoint, RoadLink } from '../types/pkrms';

const road: RoadLink = {
  id: 'test-road',
  code: 'TEST-001',
  name: 'Test Road',
  province: 'Test',
  kabupaten: 'Test',
  lengthKm: 2.2,
  widthMeters: 5,
  startSta: 0,
  endSta: 2200,
  primaryPavement: 'ASPAL',
  coordinates: [[0, 0], [0, 0.02]],
};

function gps(id: string, lat: number, lng: number, timestamp: string): GPSPoint {
  return {
    id, lat, lng, altitude: 0, speedKmh: 0, heading: 90, accuracyM: 3,
    timestamp, isMatched: false,
  };
}

describe('geoMath', () => {
  it('returns zero distance for identical coordinates', () => {
    assert.equal(haversineDistanceMeters(-1, 100, -1, 100), 0);
  });

  it('calculates plausible equatorial distance', () => {
    const distance = haversineDistanceMeters(0, 0, 0, 1);
    assert.ok(distance > 111_000 && distance < 111_300);
  });

  it('formats and parses STA consistently', () => {
    assert.equal(formatSTA(1250), 'STA 01+250');
    assert.equal(parseSTA('STA 01+250'), 1250);
  });

  it('clamps projection to the segment endpoints', () => {
    const projection = projectPointOntoSegment(0, -0.01, 0, 0, 0, 0.02);
    assert.equal(projection.t, 0);
    assert.ok(projection.distanceM > 1_000);
  });
});

describe('executeMapMatching baseline', () => {
  it('projects GPS points and calculates STA', () => {
    const points = [
      gps('p1', 0.00001, 0.005, '2026-01-01T00:00:00.000Z'),
      gps('p2', 0.00001, 0.010, '2026-01-01T00:00:03.000Z'),
    ];
    const result = executeMapMatching(points, road);
    assert.equal(result.rawPointCount, 2);
    assert.equal(result.matchedPointCount, 2);
    assert.ok((result.points[0].sta ?? -1) >= 0);
    assert.ok((result.points[1].sta ?? -1) > (result.points[0].sta ?? -1));
    assert.ok(result.points.every((point) => point.isMatched));
  });

  it('marks a speed spike as an anomaly consistently', () => {
    const points = [
      gps('p1', 0, 0.001, '2026-01-01T00:00:00.000Z'),
      gps('p2', 0, 0.010, '2026-01-01T00:00:01.000Z'),
    ];
    const result = executeMapMatching(points, road);
    assert.equal(result.points[1].isAnomaly, true);
    assert.match(result.points[1].anomalyReason ?? '', /Lonjakan kecepatan/);
  });

  it('returns zero confidence for an empty GPS sequence', () => {
    const result = executeMapMatching([], road);
    assert.equal(result.confidenceScore, 0);
    assert.equal(result.matchedPointCount, 0);
  });

  it('rejects invalid road geometry with a useful message', () => {
    assert.throws(
      () => executeMapMatching([gps('p1', 0, 0, '2026-01-01T00:00:00.000Z')], { ...road, coordinates: [] }),
      /minimal dua titik koordinat/,
    );
  });
});
