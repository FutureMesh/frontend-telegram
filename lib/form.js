'use strict';
const EventEmitter = require('events');
const { Markup } = require('telegraf');

class Form {
  constructor({ ctx, api, staticApi, bot }) {
    this.bot = bot;
    this.ctx = ctx;
    this.api = api;
    this.staticApi = staticApi;
    this.responsesEmiter = new EventEmitter();
    this.start();
  }

  async start() {
    const test = await this.staticApi('FutureFormEng.json');
    await this.ctx.reply('Hello, welcome to the ' + test.name);
    await this.ctx.reply('Please answer the following questions:');
    this.listenMessages();
    const form = await this.handleFields(test.fields);
    const prediction = await this.api.ai.predict({ form: form.join('. ') });
    console.log({ prediction });
    this.ctx.reply(prediction.answer);
  }

  async handleFields(fields, result = []) {
    const nextField = fields.shift();
    console.log({ nextField, result });
    const fieldAnswer = await this.handleField(nextField);
    if (!fields.length) return [...result, fieldAnswer];
    return this.handleFields(fields, [...result, fieldAnswer]);
  }

  async handleField(field) {
    if (field.type === 'text') {
      this.ctx.reply(field.description);
      const answer = await this.waitForAnswer();
      console.log({ answer });
      return answer;
    }

    if (field.type !== 'choice') throw new Error('Unknown field type');

    const markups = Object.values(field.choices).map((choice) =>
      Markup.button.callback(choice.name, choice.name),
    );
    console.log(markups);

    this.ctx.reply(
      field.description + ' Choose one:',
      Markup.keyboard(markups).oneTime(),
    );
    const selectedOption = await this.waitForAnswer();
    const choice = Object.values(field.choices).find(
      (c) => c.name === selectedOption,
    );
    if (choice.type === 'text') return choice.name;
    if (choice.type === 'input') {
      this.ctx.reply(choice.name);
      const answer = await this.waitForAnswer();
      return answer;
    }
    if (choice.type === 'choice') {
      return await this.handleField(choice);
    }
  }

  async waitForAnswer() {
    return new Promise((res) => {
      this.responsesEmiter.once('response', (answer) => res(answer));
    });
  }

  listenMessages() {
    const listener = (ctx) => {
      if (!ctx.message.text) return;
      this.responsesEmiter.emit('response', ctx.message.text);
    };
    this.bot.on('text', listener);
    this.bot.on('message', listener);
  }
}
module.exports = Form;
