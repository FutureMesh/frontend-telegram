'use strict';

class Form {
  lastMessage = null;
  constructor({ ctx, api, staticApi, bot }) {
    this.bot = bot;
    this.ctx = ctx;
    this.api = api;
    this.staticApi = staticApi;
    this.start();
  }

  async start() {
    const test = await this.staticApi('FutureFormEng.json');
    await this.ctx.reply('Hello, welcome to the ' + test.name);
    await this.ctx.reply('Please answer the following questions:');
    const form = await this.handleFields(test.fields);
    const prediction = await this.api.ai.ask({ form: form.join('. ') });
    this.ctx.reply(prediction);
  }

  async handleFields(fields, result = []) {
    const nextField = fields.shift();
    console.log({ nextField, result });
    const fieldAnswer = await this.handleField(nextField);
    if (!fields.length) return [...result, fieldAnswer];
    return this.handleFields(fields, [...result, fieldAnswer]);
  }

  async handleField(field) {
    // return new Promise((res, rej) => {
    if (field.type === 'text') {
      this.ctx.reply(field.name + ': ' + field.description);
      const answer = await this.waitForAnswer();
      console.log({ answer });
      return answer;
    }

    if (field.type !== 'choice') throw new Error('Unknown field type');

    // for (const choice of Object.values(field.choices)) {
    //   const choiceMessage = this.ctx.reply(choice.name, {
    //     reply_markup: {
    //       inline_keyboard: [
    //         [{ text: choice.name, callback_data: choice.name }],
    //       ],
    //     },
    //   });
    //   this.ctx.deleteMessage(choiceMessage.message_id);
    //
    //   if (choice.type === 'text') return void res(choice.name);
    //
    //   if (choice.type === 'input') {
    //     this.ctx.reply(choice.name + ': ' + choice.description);
    //     return void res(this.ctx.message.text);
    //   }
    //
    //   // if (choice.type === 'choice') res('Not known');
    //   if (choice.type === 'choice') {
    //     this.handleField(choice).then((answer) => void res(answer));
    //   }
    // }
    // });
  }

  waitForAnswer() {
    return new Promise((res) => {
      this.bot.on('text', (ctx) => {
        console.log(ctx.message.text);
        res(ctx.message.text);
        this.bot.removeAllListeners('text');
      });
    });
  }
}
module.exports = Form;
