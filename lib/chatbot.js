'use strict';
const { Markup } = require('telegraf');
const languages = require('../static/languages.json'); // make as ChatBot's prop

class ChatBot {
  constructor({ api, staticApi }) {
    this.api = api;
    this.staticApi = staticApi;
    this.lang = 'ukrainian'; // Default language
  }

  getTextData(lang) {
    return languages[lang] || languages[this.lang];
  }

  async start(ctx) {
    this.lang = ctx.session.lang;
    await ctx.reply(languages[this.lang].publicity);
    const textData = this.getTextData(this.lang);
    const test = await this.staticApi(`${this.lang.toLowerCase()}.json`);
    ctx.session.form = '';
    ctx.session.test = test.fields;
    await ctx.reply(textData.welcome + test.name);
    await ctx.reply(textData.please_answer);
    ctx.session.actualField = ctx.session.test[0];
    await ctx.reply(ctx.session.actualField.description);
  }

  async showQuestion(ctx) {
    const textData = this.getTextData(this.lang);
    // eslint-disable-next-line camelcase
    const options = { reply_markup: { remove_keyboard: true } };
    if (ctx.session.test.length === 0) {
      await ctx.reply(textData.wait_moment);
      const prediction = await this.api.ai.predict({
        form: ctx.session.form,
        language: this.lang, // Use the ChatBot's prop for language
      });
      await ctx.reply(prediction.answer);
      return ctx.scene.leave();
    }
    const question = ctx.session.actualField;
    if (question.type === 'text' || question.type === 'input') {
      return await ctx.reply(question.description, options);
    }
    if (question.type === 'choice') {
      const markups = Object.values(question.choices).map((choice) =>
        Markup.button.callback(choice.name, choice.name),
      );
      return await ctx.reply(
        question.description + textData.choose_one,
        Markup.keyboard(markups).oneTime(),
      );
    }
    return true;
  }

  async handleField(ctx) {
    // think about how to remove it from here -> cohesion
    if (ctx.message.text === '/stop') return ctx.scene.leave();
    if (ctx.message.text === '/language') {
      await ctx.scene.leave();
      // cohesion
      const languagesMarkups = Object.keys(languages).map((name) =>
        Markup.button.callback(name, name),
      );
      ctx.reply('Choose', Markup.inlineKeyboard(languagesMarkups).oneTime());
      return true;
    }
    const answer = ctx.message.text;
    const field = ctx.session.actualField;
    const question = ctx.session.test[0];
    const textData = this.getTextData(this.lang);
    if (question.type === 'text') {
      ctx.session.form += question.name + ': ' + answer + '\n';
      ctx.session.test.shift();
      ctx.session.actualField = ctx.session.test[0];
      await this.showQuestion(ctx);
      return true;
    }
    // only 2 types of questions
    if (field.type === 'choice') {
      const choice = Object.values(field.choices).find(
        (c) => c.name === answer,
      );
      if (!choice) return await ctx.reply(textData.choose_options);
      if (choice.type === 'text') {
        ctx.session.form += question.name + ': ' + choice.name + '\n';
        ctx.session.test.shift();
        ctx.session.actualField = ctx.session.test[0];
        await this.showQuestion(ctx);
        return true;
      }
      // for input and choice types
      await ctx.reply(choice.description);
      ctx.session.actualField = choice;
      ctx.session.form += question.name + ': ' + answer + ', ';
    }
    if (field.type === 'input') {
      ctx.session.form += answer + '\n';
      ctx.session.test.shift();
      ctx.session.actualField = ctx.session.test[0];
      await this.showQuestion(ctx);
      return true;
    }
    return false;
  }
}
module.exports = ChatBot;
