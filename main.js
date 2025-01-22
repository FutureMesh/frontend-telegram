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

// TODO //
// - remove cohesion between ChatBot and Telegraf
// deploy

(async () => {
  let visitedCount = 0;
  let usersCount = 0;
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

  bot.use(session());
  bot.use((ctx, next) => {
    if (!ctx.session) {
      console.clear();
      console.log(`Visited: ${visitedCount++} \n usersCount: ${usersCount}`);
      ctx.session = {};
    }
    if (!ctx.session.lang) ctx.session.lang = 'ukrainian';
    return next();
  });
  bot.use(stage.middleware());

  const commands = [
    {
      command: 'start',
      action: async (ctx) => {
        console.clear();
        console.log(`Visited: ${visitedCount} \n usersCount: ${usersCount++}`);
        await ctx.scene.enter('form');
      },
      description: 'Start command',
    },
    {
      command: 'language',
      action: (ctx) => {
        const languagesMarkups = Object.keys(languages).map((name) =>
          Markup.button.callback(name, name),
        );
        ctx.reply('Choose', Markup.inlineKeyboard(languagesMarkups).oneTime());
      },
      description: 'Language command',
    },
  ];

  bot.telegram.setMyCommands(commands);
  commands.forEach((command) => bot.command(command.command, command.action));

  Object.keys(languages).forEach((lang) => {
    bot.action(lang, async (ctx) => {
      if (!ctx.session) ctx.session = {};
      ctx.session.lang = lang;
      await ctx.reply(languages[lang].done);
    });
  });

  bot.launch();
  console.log('Listening on ' + process.env.BOT_TOKEN);

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();
