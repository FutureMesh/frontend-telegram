'use strict';
const { Markup } = require('telegraf');
const languages = require('../static/languages.json'); // make as ChatBot's prop

class ChatBot {
  constructor({ api, staticApi }) {
    this.api = api;
    this.staticApi = staticApi;
    this.lang = languages['ukrainian']; // Default language
  }

  // getTextData(lang) {
  //   return languages[lang] || languages[this.lang];
  // }

  async start(ctx) {
    this.lang = ctx.session.lang;
    await ctx.reply(this.lang.publicity);
    // const textData = this.getTextData(this.lang);
    const test = await this.staticApi(`${this.lang.name.toLowerCase()}.json`);
    ctx.session.form = '';
    ctx.session.test = test.fields;
    await ctx.reply(this.lang.welcome + test.name);
    await ctx.reply(this.lang.please_answer);
    ctx.session.actualField = ctx.session.test[0];
    await ctx.reply(ctx.session.actualField.description);
  }

  async showQuestion(ctx) {
    // const textData = this.getTextData(this.lang);
    // eslint-disable-next-line camelcase
    const options = { reply_markup: { remove_keyboard: true } };
    if (ctx.session.test.length === 0) {
      await ctx.reply(this.lang.wait_moment);
      const prediction = await this.api.ai.predict({
        form: ctx.session.form,
        language: this.lang.name, // Use the ChatBot's prop for language
        token: ctx.from.id,
      });
      await ctx.reply(prediction.answer);
      return await ctx.reply(ctx.session.lang.furtherQuestion);
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
        question.description + this.lang.choose_one,
        Markup.keyboard(markups).oneTime(),
      );
    }
    return true;
  }

  async handleField(ctx) {
    if (ctx.session.test.length === 0) {
      const prediction = await this.api.ai.ask({
        question: ctx.message.text,
        language: this.lang.name, // Use the ChatBot's prop for language
        token: ctx.from.id,
      });
      await ctx.reply(prediction.answer);
      return;
    }

    const answer = ctx.message.text;
    const field = ctx.session.actualField;
    const question = ctx.session.test[0];
    // const textData = this.getTextData(this.lang);
    if (question.type === 'text') {
      ctx.session.form += question.name + ': ' + answer + '\n';
      ctx.session.test.shift();
      ctx.session.actualField = ctx.session.test[0];
      await this.showQuestion(ctx);
      return;
    }
    // only 2 types of questions
    if (field.type === 'choice') {
      const choice = Object.values(field.choices).find(
        (c) => c.name === answer,
      );
      if (!choice) {
        await ctx.reply(this.lang.choose_options);
        return;
      }
      if (choice.type === 'text') {
        ctx.session.form += question.name + ': ' + choice.name + '\n';
        ctx.session.test.shift();
        ctx.session.actualField = ctx.session.test[0];
        await this.showQuestion(ctx);
        return;
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
      return;
    }
    return;
  }
}
module.exports = ChatBot;
