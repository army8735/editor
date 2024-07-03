const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 20, 20)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button2')
      .assert.value('#base64', '[0,{"v":2.5,"u":2},{"v":72.5,"u":2},{"v":2.5,"u":2},{"v":72.5,"u":2},{"v":0,"u":0},{"v":0,"u":0},{"v":0,"u":1},{"v":0,"u":1},10,290,10,290,100,100,0,0]')
      .moveToElement('.side .basic-panel .w input', 1, 1)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .moveToElement('.side .basic-panel .h input', 1, 1)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[1,{"v":2.5,"u":2},{"v":72.25,"u":2},{"v":2.5,"u":2},{"v":72.25,"u":2},{"v":0,"u":0},{"v":0,"u":0},{"v":0,"u":1},{"v":0,"u":1},10,289,10,289,101,101,0,0]')
      .moveToElement('.side .basic-panel .w input', 1, 1)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.SHIFT)
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .moveToElement('.side .basic-panel .h input', 1, 1)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.SHIFT)
      .keys(browser.Keys.ARROW_UP)
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[2,{"v":2.5,"u":2},{"v":69.75,"u":2},{"v":2.5,"u":2},{"v":69.75,"u":2},{"v":0,"u":0},{"v":0,"u":0},{"v":0,"u":1},{"v":0,"u":1},10,279,10,279,111,111,0,0]')
      .moveToElement('.side .basic-panel .w input', 1, 1)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.NULL)
      .moveToElement('.side .basic-panel .h input', 1, 1)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.ARROW_DOWN)
      .keys(browser.Keys.NULL)
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[3,{"v":2.5,"u":2},{"v":70,"u":2},{"v":2.5,"u":2},{"v":70,"u":2},{"v":0,"u":0},{"v":0,"u":0},{"v":0,"u":1},{"v":0,"u":1},10,280,10,280,110,110,0,0]')
      .updateValue('.side .basic-panel .x input', ['100', browser.Keys.ENTER])
      .updateValue('.side .basic-panel .y input', ['100', browser.Keys.ENTER])
      .pause(20)
      .click('#button2')
      .assert.value('#base64', '[4,{"v":2.5,"u":2},{"v":72.5,"u":2},{"v":2.5,"u":2},{"v":72.5,"u":2},{"v":0,"u":0},{"v":0,"u":0},{"v":0,"u":1},{"v":0,"u":1},10,290,10,290,100,100,0,0]')
      .end();
  }
};
