'use strict';

const transport = {};

transport.ws = (url) => (structure) => {
  const socket = new WebSocket(url);
  const api = {};
  const services = Object.keys(structure);
  for (const name of services) {
    api[name] = {};
    const service = structure[name];
    const methods = Object.keys(service);
    for (const methodName of methods) {
      api[name][methodName] = (args) => {
        new Promise((resolve) => {
          const method = name + '/' + methodName;
          const packet = { type: 'call', method, args };
          socket.send(JSON.stringify(packet));
          socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            resolve(data);
          };
        });
      };
    }
  }
  return new Promise((resolve) => {
    socket.addEventListener('open', () => resolve(api));
  });
};

transport.http = (url) => (structure) => {
  const api = {};
  const services = Object.keys(structure);
  for (const name of services) {
    api[name] = {};
    const service = structure[name];
    for (const [methodName, methodValue] of Object.entries(service)) {
      api[name][methodName] = (args) =>
        new Promise((res) => {
          const method = name + '/' + methodName;
          const id = args.id ? '/' + args.id : '';
          const fetchUrl = url + '/api/' + method + id;
          const fetchMethod = methodValue.toUpperCase();
          fetch(fetchUrl, {
            method: fetchMethod,
            headers: { 'Content-Type': 'application/json' },
            body: fetchMethod !== 'GET' ? JSON.stringify(args) : null,
          }).then((result) => {
            res(result.json());
          });
        });
    }
  }
  return Promise.resolve(api);
};

const staticApi = (url) => async (filePath) => {
  if (!url || !filePath) return false;
  const fetchUrl = url + '/' + filePath;
  return await fetch(fetchUrl, {
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => {
    if (res.status === 200) return res.json();
    else throw new Error(`Status Code: ${res.status}`);
  });
};

const scaffold = (url, style) => {
  const protocol = url.startsWith('ws:') ? 'ws' : 'http';
  return transport[protocol](url, style);
};

module.exports = { staticApi, scaffold };
