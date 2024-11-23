'use strict';
const { Markup } = require('telegraf');

class ChatBot {
  constructor({ api, staticApi }) {
    this.api = api;
    this.staticApi = staticApi;
  }

  async start(ctx) {
    const test = await this.staticApi('FutureFormEng.json');
    ctx.session.form = '';
    ctx.session.test = test.fields;
    await ctx.reply('Hello, welcome to the ' + test.name);
    await ctx.reply('Please answer the following questions:');
    ctx.session.actualField = ctx.session.test[0];
    await ctx.reply(ctx.session.actualField.description);
  }

  async showQuestion(ctx) {
    if (ctx.session.test.length === 0) {
      const prediction = await this.api.ai.predict({
        form: ctx.session.form,
        language: 'english',
      });
      console.log({ prediction });
      await ctx.reply(prediction.answer);
      return ctx.scene.leave();
    }
    console.log(ctx.session.form);
    const question = ctx.session.actualField;
    if (question.type === 'text' || question.type === 'input') {
      return await ctx.reply(question.description);
    }
    if (question.type === 'choice') {
      const markups = Object.values(question.choices).map((choice) =>
        Markup.button.callback(choice.name, choice.name),
      );
      return await ctx.reply(
        question.description + ' Choose one:',
        Markup.keyboard(markups).oneTime(),
      );
    }
  }

  async handleField(ctx) {
    const answer = ctx.message.text;
    console.log(answer);
    const field = ctx.session.actualField;
    const question = ctx.session.test[0];
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
      if (!choice) return await ctx.reply('Please choose one of the options');
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
  }
}
module.exports = ChatBot;
