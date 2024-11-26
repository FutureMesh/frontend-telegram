'use strict';

const { Telegraf, Scenes, session, Markup } = require('telegraf');
const { scaffold, staticApi: staticConnect } = require('./lib/connect');
const languages = require('./static/languages.json');
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

  formScene.enter(async (ctx) => await chatBot.start(ctx));

  const listener = async (ctx) => await chatBot.handleField(ctx);
  formScene.on('text', listener);
  formScene.on('message', listener);
  const stage = new Scenes.Stage([formScene]);
  formScene.command('leave', async (ctx) => await ctx.scene.leave());

  bot.use(session());
  bot.use((ctx, next) => {
    if (!ctx.session) ctx.session = {};
    if (!ctx.session.lang) ctx.session.lang = 'ukrainian';
    return next();
  });
  bot.use(stage.middleware());

  bot.command('start', async (ctx) => await ctx.scene.enter('form'));
  bot.command('language', (ctx) => {
    const languagesMarkups = Object.keys(languages).map((name) =>
      Markup.button.callback(name, name),
    );
    ctx.reply('Choose', Markup.inlineKeyboard(languagesMarkups).oneTime());
  });

  Object.keys(languages).forEach((lang) => {
    bot.action(lang, async (ctx) => {
      if (!ctx.session) ctx.session = {};
      ctx.session.lang = lang;
      console.log(ctx.session);
      await ctx.reply(languages[lang].done);
    });
  });

  bot.launch();
  console.log('Listening on ' + process.env.BOT_TOKEN);

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();
