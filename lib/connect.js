'use strict';

const request = (url) => async (method, body = {}) => {
  const response = await fetch(url + method, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return data;
};

module.exports = { request };
