'use strict';

class Form {
  constructor(ctx, api, staticApi) {
    this.ctx = ctx;
    this.api = api;
    this.staticApi = staticApi;
    this.start();
  }

  async start() {
    const test = await this.staticApi('FutureFormEng.json');
    this.ctx.reply('Hello, welcome to the ' + test.name);
    this.ctx.reply('Please answer the following questions:');
    let form = '';
    for (const field of test.fields) {
      const answer = this.handleField(field);
      form += answer;
    }
    const prediction = await this.api.ai.ask({ form });
    this.ctx.reply(prediction);
    return;
  }

  handleField(field) {
    if (field.type === 'text') {
      this.ctx.reply(field.name + ': ' + field.description);
      let answer = this.ctx.message?.text;
      while (!answer) {
        this.ctx.reply(field.name + ': ' + field.description);
        answer = this.ctx.message?.text;
      }
    } else if (field.type === 'choice') {
      for (const choice of field.choices) {
        return;
      }
    }
  }
}
module.exports = Form;
