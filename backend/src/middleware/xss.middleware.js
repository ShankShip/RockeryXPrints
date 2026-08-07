import xss from 'xss';

const clean = (data) => {
  if (typeof data === 'string') {
    return xss(data);
  }
  if (Array.isArray(data)) {
    return data.map(item => clean(item));
  }
  if (typeof data === 'object' && data !== null) {
    const cleanedObj = {};
    for (const [key, value] of Object.entries(data)) {
      cleanedObj[key] = clean(value);
    }
    return cleanedObj;
  }
  return data;
};

export const xssClean = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.query) {
    for (const key in req.query) {
      req.query[key] = clean(req.query[key]);
    }
  }
  if (req.params) {
    for (const key in req.params) {
      req.params[key] = clean(req.params[key]);
    }
  }
  next();
};
