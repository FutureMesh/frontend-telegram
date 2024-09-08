'use strict';

const { Telegraf, session } = require('telegraf');
const { scaffold, staticApi: staticConnect } = require('./lib/connect');
const dotenv = require('dotenv');
const Form = require('./lib/form');
dotenv.config();
const API_URL = process.env.API_URL;
const endpoints = {
  ai: {
    ask: 'post',
  },
};

const staticApi = staticConnect(API_URL);
const api = scaffold(API_URL, 'rest')(endpoints);

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

bot.start((ctx) => {
  new Form(bot, ctx, api, staticApi);
});
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
