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
    ask: 'post',
    leave: 'post',
  },
};

// TODO //
// - remove cohesion between ChatBot and Telegraf
// rewrite static to use camelcase
// deploy

(async () => {
  const visited = { ukrainian: 0, english: 0, russian: 0 };
  const usersCount = 0;
  const api = await scaffold(API_URL, 'rest')(endpoints);
  const staticApi = staticConnect(API_URL);

  const bot = new Telegraf(process.env.BOT_TOKEN);
  const formScene = new Scenes.BaseScene('form');
  const chatBot = new ChatBot({ api, staticApi });
  // eslint-disable-next-line camelcase
  const options = { reply_markup: { remove_keyboard: true } };

  const stage = new Scenes.Stage([formScene]);
  formScene.enter(async (ctx) => await chatBot.start(ctx));
  const listener = async (ctx) => await chatBot.handleField(ctx);
  formScene.on('text', listener);
  formScene.on('message', listener);
  formScene.leave(async (ctx) => {
    ctx.session.test = [];
    ctx.session.form = '';
    await api.ai.leave({ token: ctx.from.id });
    await ctx.reply(ctx.session.lang.leave, options);
    await ctx.reply(ctx.session.lang.help);
  });
  stage.command('stop', async (ctx) => await ctx.scene.leave());
  stage.command('language', async (ctx) => {
    const languagesMarkups = Object.keys(languages).map((name) =>
      Markup.button.callback(name, name),
    );
    ctx.reply('Choose', Markup.inlineKeyboard(languagesMarkups).oneTime());
  });

  const logStatics = () => {
    console.clear();
    for (const [lang, count] of Object.entries(visited)) {
      console.log(`${lang}: ${count}`);
    }
    console.log(`usersCount: ${usersCount}`);
  };

  bot.use(session());
  bot.use((ctx, next) => {
    if (!ctx.session) ctx.session = {};
    if (!ctx.session.lang) ctx.session.lang = languages.ukrainian;
    visited[ctx.session.lang.name] += 1;
    logStatics();
    return next();
  });
  bot.use(stage.middleware());

  const commands = [
    {
      command: 'start',
      action: async (ctx) => {
        console.clear();
        visited[ctx.session.lang.name] += 1;
        logStatics();
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
    {
      command: 'help',
      action: async (ctx) => {
        await ctx.reply(ctx.session.lang.getHelp);
      },
      description: 'Help command',
    },
  ];

  bot.telegram.setMyCommands(commands);
  commands.forEach((command) => bot.command(command.command, command.action));

  Object.keys(languages).forEach((lang) => {
    bot.action(lang, async (ctx) => {
      ctx.session.lang = languages[lang];
      await ctx.reply(ctx.session.lang.done);
      if (ctx.session.test && ctx.session.test.length) await chatBot.start(ctx);
    });
  });

  bot.launch();
  console.log('Listening on ' + process.env.BOT_TOKEN);

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();
