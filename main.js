'use strict';

const { Telegraf, Scenes, session } = require('telegraf');
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
  const api = await scaffold(API_URL, 'rest')(endpoints);
  const staticApi = staticConnect(API_URL);

  const bot = new Telegraf(process.env.BOT_TOKEN);
  const formScene = new Scenes.BaseScene('form');
  const chatBot = new ChatBot({ api, staticApi });
  formScene.enter(async (ctx) => {
    await chatBot.start(ctx);
  });
  formScene.leave(async (ctx) => await ctx.reply('Bye!'));
  const listener = async (ctx) => {
    await chatBot.handleField(ctx);
  };
  formScene.on('text', listener);
  formScene.on('message', listener);
  const stage = new Scenes.Stage([formScene]);

  bot.use(session());
  bot.use(stage.middleware());

  bot.command('start', async (ctx) => await ctx.scene.enter('form'));

  bot.launch();
  console.log('Listening on ' + process.env.BOT_TOKEN);

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();
