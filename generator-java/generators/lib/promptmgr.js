/*
 * Copyright IBM Corporation 2017
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

function PromptManager(config) {
  this.prompts = [];
  this.types = {};
  this.prompt = {
    type    : 'list',
    name    : 'promptType',
    message : 'Select from the list of available generation options.\n',
    choices : []
  };
  this.config = config;
}

PromptManager.prototype.add = function(prompt) {
  //allow already resolved names to be passed in
  const Ext = (typeof prompt === 'string') ? require('../prompts/' + prompt + '.js') : prompt;
  const ext = new Ext(this.config);
  this.prompts.push(ext);

  const value = ext.getChoice();
  if(value) {
    this.prompt.choices.push(value);
  }

  //create an index of createType by extension
  const extqs = ext.getQuestions();
  for(let i = 0; i < extqs.length; i++) {
    if(extqs[i].prompt === 'createType') {
      for(let j = 0; j < extqs[i].choices.length; j++) {
        this.types[extqs[i].choices[j].value] = ext;
      }
      break;
    }
  }
  return ext;     //return the configured extension so that it can configured further if required
}

PromptManager.prototype.getQuestions = function() {
  let questions = [];
  questions.push(this.prompt);
  for(let i = 0; i < this.prompts.length; i++) {
    questions = questions.concat(this.prompts[i].getQuestions());
  }
  return questions;
}

//this was run headless, so need to work out which extension provides the selected createType
PromptManager.prototype.setExtension = function(createType) {
  for (const type in this.types) {
    if (this.types.hasOwnProperty(type)) {
      if(type === createType) {
        // answers.promptType = this.types[type].id;
        break;
      }
    }
  }
}

PromptManager.prototype.afterPrompt = function(answers, config) {
  for(let i = 0; i < this.prompts.length; i++) {
    const prompt = this.prompts[i];
    const questions = prompt.getQuestions();
    const promptAnswers = {};
    for(let j = 0; j < questions.length; j++) {
      const name = questions[j].name;
      if(answers[name]) {
        promptAnswers[name] = answers[name];
      }
    }
    if(Object.keys(promptAnswers)) {
      this.prompts[i].afterPrompt(promptAnswers, config);
    }
  }
}

module.exports = exports = PromptManager;
