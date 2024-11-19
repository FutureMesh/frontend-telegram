'use strict';

const { Telegraf, session } = require('telegraf');
const { scaffold, staticApi: staticConnect } = require('./lib/connect');
const dotenv = require('dotenv');
const ChatBot = require('./lib/chatbot');
dotenv.config();
const API_URL = process.env.API_URL;
const endpoints = {
  ai: {
    predict: 'post',
  },
};

(async () => {
  // bag when i finished my form and want to start new
  const api = await scaffold(API_URL, 'rest')(endpoints);
  const staticApi = staticConnect(API_URL);

  const bot = new Telegraf(process.env.BOT_TOKEN);
  bot.use(session());

  bot.command('start', (ctx) => new ChatBot({ ctx, api, staticApi, bot }));

  bot.launch();

  console.log('Listening on ' + process.env.BOT_TOKEN);

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();
