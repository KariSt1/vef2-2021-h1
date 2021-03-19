import { toPositiveNumberOrDefault } from './validation.js';

const {
  PORT: port = 3000,
  HOST: host = '127.0.0.1',
  BASE_URL: baseUrl = '',
} = process.env;

export function addPageMetadata(
  obj,
  path,
  { offset = 0, limit = 10, length = 0 } = {},
) {
  if (obj._links) {
    return obj;
  }

  const offsetAsNumber = toPositiveNumberOrDefault(offset, 0);
  const limitAsNumber = toPositiveNumberOrDefault(limit, 10);
  const lengthAsNumber = toPositiveNumberOrDefault(length, 0);

  const newObj = Object.assign({}, obj);

  const url = new URL(path, baseUrl || `http://${host}`);

  if (!baseUrl) {
    url.port = port;
  }

  newObj._links = {
    self: {
      href: `${url}?offset=${offsetAsNumber}&limit=${limitAsNumber}`,
    },
  };

  if (offsetAsNumber > 0) {
    const prevOffset = offsetAsNumber - limitAsNumber;
    newObj._links.prev = {
      href: `${url}?offset=${prevOffset}&limit=${limitAsNumber}`,
    };
  }

  if (lengthAsNumber >= limitAsNumber) {
    const nextOffset = offsetAsNumber + limitAsNumber;
    newObj._links.next = {
      href: `${url}?offset=${nextOffset}&limit=${limitAsNumber}`,
    };
  }

  return newObj;
}