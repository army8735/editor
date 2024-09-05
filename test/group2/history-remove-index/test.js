const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 50, 50)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.DELETE)
      .keys(browser.Keys.NULL)
      .pause(20)
      .moveToElement('canvas', 300, 300)
      .mouseButtonDown(0)
      .moveToElement('canvas', 20, 20)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[[0,"2"],[0,"3"]]')
      .assert.not.elementPresent('#tree span.name[title="1"]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .moveToElement('canvas', 300, 300)
      .mouseButtonDown(0)
      .moveToElement('canvas', 20, 20)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[[1,"1"],[1,"2"],[1,"3"]]')
      .assert.elementPresent('#tree span.name[title="1"]')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .pause(20)

      .moveToElement('canvas', 50, 150)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.DELETE)
      .keys(browser.Keys.NULL)
      .pause(20)
      .moveToElement('canvas', 300, 300)
      .mouseButtonDown(0)
      .moveToElement('canvas', 20, 20)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[[2,"1"],[2,"3"]]')
      .assert.not.elementPresent('#tree span.name[title="2"]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .moveToElement('canvas', 300, 300)
      .mouseButtonDown(0)
      .moveToElement('canvas', 20, 20)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[[3,"1"],[3,"2"],[3,"3"]]')
      .assert.elementPresent('#tree span.name[title="2"]')
      .keys(browser.Keys.ESCAPE)
      .keys(browser.Keys.NULL)
      .pause(20)

      .moveToElement('canvas', 50, 280)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .keys(browser.Keys.DELETE)
      .keys(browser.Keys.NULL)
      .pause(20)
      .moveToElement('canvas', 300, 300)
      .mouseButtonDown(0)
      .moveToElement('canvas', 20, 20)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[[4,"1"],[4,"2"]]')
      .assert.not.elementPresent('#tree span.name[title="3"]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .pause(20)
      .moveToElement('canvas', 300, 300)
      .mouseButtonDown(0)
      .moveToElement('canvas', 20, 20)
      .mouseButtonUp(0)
      .click('#button4')
      .assert.value('#base64', '[[5,"1"],[5,"2"],[5,"3"]]')
      .assert.elementPresent('#tree span.name[title="3"]')

      .end();
  }
};
