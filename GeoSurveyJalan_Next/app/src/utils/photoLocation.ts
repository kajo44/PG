import { RoadLink } from '../types/pkrms';
import { projectPointOntoSegment } from './geoMath';
import { buildRoadCache } from './mapMatching';

export interface PhotoRoadLocation {
  sta: number;
  distanceM: number;
  snappedLat: number;
  snappedLng: number;
}

/**
 * Projects an EXIF GPS coordinate onto the selected road and returns cumulative STA.
 * The input GPS coordinate should be retained separately as the photo's original location.
 */
export function locatePhotoOnRoad(lat: number, lng: number, road: RoadLink): PhotoRoadLocation {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new Error('Koordinat GPS foto tidak valid.');
  }
  if (!Array.isArray(road.coordinates) || road.coordinates.length < 2) {
    throw new Error('Geometri ruas harus memiliki minimal dua titik koordinat.');
  }

  const cache = buildRoadCache(road);
  let best: PhotoRoadLocation | null = null;

  for (const segment of cache.segments) {
    const projection = projectPointOntoSegment(
      lat,
      lng,
      segment.startCoord[0],
      segment.startCoord[1],
      segment.endCoord[0],
      segment.endCoord[1]
    );
    if (!best || projection.distanceM < best.distanceM) {
      best = {
        sta: segment.startCumDistM + projection.t * segment.lengthM,
        distanceM: projection.distanceM,
        snappedLat: projection.snappedLat,
        snappedLng: projection.snappedLng,
      };
    }
  }

  if (!best) throw new Error('Tidak ada segmen ruas yang dapat digunakan untuk menentukan STA.');
  return best;
}
