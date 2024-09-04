'use strict';

const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const { request } = require('./lib/connect');
const dotenv = require('dotenv');

dotenv.config();
const API_URL = process.env.API_URL;
const send = request(API_URL);

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Welcome'));
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
