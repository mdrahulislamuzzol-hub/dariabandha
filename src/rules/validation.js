import { FORMAT_SPECS, PROFILE_SPECS } from './constants.js';

const formatValues = Object.keys(FORMAT_SPECS);
const profileIdValues = Object.keys(PROFILE_SPECS);

function describeValue(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return JSON.stringify(value);
  return Object.prototype.toString.call(value);
}

function quotedValues(values) {
  return values.map((value) => JSON.stringify(value)).join(', ');
}

/**
 * Validates a format identifier before match construction.
 * @param {string} format
 * @returns {string} the same, validated format value
 */
export function assertValidFormat(format) {
  if (typeof format !== 'string') {
    throw new TypeError(`format must be a string; received ${describeValue(format)}`);
  }
  if (!Object.hasOwn(FORMAT_SPECS, format)) {
    throw new RangeError(
      `format must be one of ${quotedValues(formatValues)}; received ${describeValue(format)}`,
    );
  }
  return format;
}

/**
 * Validates a replay-safe rule profile reference before match construction.
 * @param {{id: string, version: string, timingShape: string}} profile
 * @returns {{id: string, version: string, timingShape: string}} the same, validated profile value
 */
export function assertValidProfile(profile) {
  if (profile === null || typeof profile !== 'object' || Array.isArray(profile)) {
    throw new TypeError(`profile must be an object; received ${describeValue(profile)}`);
  }
  if (typeof profile.id !== 'string') {
    throw new TypeError(`profile.id must be a string; received ${describeValue(profile.id)}`);
  }
  if (!Object.hasOwn(PROFILE_SPECS, profile.id)) {
    throw new RangeError(
      `profile.id must be one of ${quotedValues(profileIdValues)}; received ${describeValue(profile.id)}`,
    );
  }
  if (typeof profile.version !== 'string') {
    throw new TypeError(
      `profile.version must be a string; received ${describeValue(profile.version)}`,
    );
  }

  const expectedVersion = PROFILE_SPECS[profile.id].version;
  if (profile.version !== expectedVersion) {
    throw new RangeError(
      `profile.version must be ${JSON.stringify(expectedVersion)} for profile.id ${JSON.stringify(profile.id)}; received ${describeValue(profile.version)}`,
    );
  }
  if (typeof profile.timingShape !== 'string') {
    throw new TypeError(
      `profile.timingShape must be a string; received ${describeValue(profile.timingShape)}`,
    );
  }

  const expectedTimingShape = PROFILE_SPECS[profile.id].timingShape;
  if (profile.timingShape !== expectedTimingShape) {
    throw new RangeError(
      `profile.timingShape must be ${JSON.stringify(expectedTimingShape)} for profile.id ${JSON.stringify(profile.id)}; received ${describeValue(profile.timingShape)}`,
    );
  }
  return profile;
}
