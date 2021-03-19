export function isEmpty(s) {
  return s != null && !s;
}

export function isInt(i) {
  return i !== '' && Number.isInteger(Number(i));
}

export function isString(s) {
  return typeof s === 'string';
}

export function isBoolean(b) {
  return typeof b === 'boolean';
}

export function lengthValidationError(min, max) {
  if ( min != null) {
    return `min ${min} characters, max ${max} characters`
  }
  return `max ${max} characters`;

}

export function isNotEmptyString(s, { min = undefined, max = undefined } = {}) {
  if (typeof s !== 'string' || s.length === 0) {
    return false;
  }

  if (max && s.length > max) {
    return false;
  }

  if (min && s.length < min) {
    return false;
  }

  return true;
}

export function toPositiveNumberOrDefault(value, defaultValue) {
  const cast = Number(value);
  const clean = Number.isInteger(cast) && cast > 0 ? cast : defaultValue;

  return clean;
}