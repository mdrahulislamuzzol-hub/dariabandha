import {
  BOX_SIZE_METRES,
  COURT_WIDTH_METRES,
  FORMAT_SPECS,
  LANE_WIDTH_METRES,
  LINE_HALF_WIDTH_METRES,
} from './constants.js';
import { assertValidFormat } from './validation.js';

/**
 * Court coordinates use metres on an x/z ground plane: x spans court width,
 * z runs from the front end (0) to the back end (length). Every line zone is
 * the closed rectangle extending LINE_HALF_WIDTH_METRES to either side of its
 * centreline; overlap includes exact edge contact. This is shared by rules
 * and any later renderer.
 */
function line(id, axis, centre, minAlong, maxAlong, halfWidth = LINE_HALF_WIDTH_METRES) {
  return Object.freeze({ id, axis, centre, minAlong, maxAlong, halfWidth });
}

export function createCourt(format) {
  assertValidFormat(format);
  const { rowCount } = FORMAT_SPECS[format];
  const lengthMetres = rowCount * BOX_SIZE_METRES;
  const widthMetres = COURT_WIDTH_METRES;
  const xMin = -widthMetres / 2;
  const xMax = widthMetres / 2;
  const zMin = 0;
  const zMax = lengthMetres;
  const rowLines = Array.from({ length: rowCount - 1 }, (_, index) =>
    line(`row-${index + 1}`, 'z', (index + 1) * BOX_SIZE_METRES, xMin, xMax));
  const endLines = [line('front-end', 'z', zMin, xMin, xMax), line('back-end', 'z', zMax, xMin, xMax)];
  const sideLines = [line('left-side', 'x', xMin, zMin, zMax), line('right-side', 'x', xMax, zMin, zMax)];
  // Cross-court guard strips are centred on each interior row line and the
  // back end line. The front end is the attacker entry and is not a guard lane.
  const laneCentres = [...rowLines.map((entry) => entry.centre), zMax];
  const laneStrips = laneCentres.map((centre, index) => Object.freeze({
    id: `lane-${index + 1}`,
    index,
    zMin: centre - LANE_WIDTH_METRES / 2,
    zMax: centre + LANE_WIDTH_METRES / 2,
    xMin,
    xMax,
    widthMetres: LANE_WIDTH_METRES,
  }));
  // The 6v6 layout follows the master plan's five defender positions: four
  // interior row walkways and the back end. Smaller formats scale down across
  // interior row walkways; 2v2 uses the frontmost interior row as its first
  // defensive barrier (a B1 placement inference where the source is silent).
  const guardLaneIds = Object.freeze(format === '6v6'
    ? laneStrips.map((lane) => lane.id)
    : format === '4v4'
      ? laneStrips.slice(0, rowLines.length).map((lane) => lane.id)
      : [laneStrips[0].id]);
  const spineGeometry = Object.freeze({
    id: 'spine',
    axis: 'z',
    xMin: -LANE_WIDTH_METRES,
    xMax: LANE_WIDTH_METRES,
    zMin,
    zMax,
    widthMetres: 2 * LANE_WIDTH_METRES,
  });

  return Object.freeze({
    format,
    rowCount,
    boxSizeMetres: BOX_SIZE_METRES,
    lengthMetres,
    widthMetres,
    bounds: Object.freeze({ xMin, xMax, zMin, zMax }),
    lineHalfWidthMetres: LINE_HALF_WIDTH_METRES,
    rowLines: Object.freeze(rowLines),
    endLines: Object.freeze(endLines),
    sideLines: Object.freeze(sideLines),
    laneStrips: Object.freeze(laneStrips),
    guardLaneIds,
    spineGeometry,
  });
}

/** Closed rectangle overlap; a circle exactly touching a line zone is on it. */
export function circleOverlapsLineZone({ x, z, radius }, zone) {
  if (![x, z, radius].every(Number.isFinite) || radius < 0) {
    throw new TypeError('circle coordinates and radius must be finite; radius must be non-negative');
  }
  const low = zone.centre - zone.halfWidth;
  const high = zone.centre + zone.halfWidth;
  const cross = zone.axis === 'x' ? x : z;
  const along = zone.axis === 'x' ? z : x;
  const nearestCross = Math.max(low, Math.min(high, cross));
  const nearestAlong = Math.max(zone.minAlong, Math.min(zone.maxAlong, along));
  return (cross - nearestCross) ** 2 + (along - nearestAlong) ** 2 <= radius ** 2;
}
