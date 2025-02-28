const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 50, 50)
      .doubleClick()
      .keys(browser.Keys.META)
      .click('#tree span.name[title="2"]')
      .keys(browser.Keys.NULL)

      .moveToElement('canvas', 30, 10)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 60, 7)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 90, 13)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '[[0,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":0.2,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.2,"fy":0,"tx":0.2,"ty":0,"absX":20,"absY":0,"absTx":20,"absTy":0,"absFx":20,"absFy":0},{"x":0.5,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.5,"fy":0,"tx":0.5,"ty":0,"absX":50,"absY":0,"absTx":50,"absTy":0,"absFx":50,"absFy":0},{"x":0.8,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.8,"fy":0,"tx":0.8,"ty":0,"absX":80,"absY":0,"absTx":80,"absTy":0,"absFx":80,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":100,"absY":0,"absTx":100,"absTy":0,"absFx":100,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]],[0,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":100,"absY":0,"absTx":100,"absTy":0,"absFx":100,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]]')

      .moveToElement('canvas', 110, 30)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 107, 60)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 113, 90)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '[[1,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":0.2,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.2,"fy":0,"tx":0.2,"ty":0,"absX":20,"absY":0,"absTx":20,"absTy":0,"absFx":20,"absFy":0},{"x":0.5,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.5,"fy":0,"tx":0.5,"ty":0,"absX":50,"absY":0,"absTx":50,"absTy":0,"absFx":50,"absFy":0},{"x":0.8,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0.8,"fy":0,"tx":0.8,"ty":0,"absX":80,"absY":0,"absTx":80,"absTy":0,"absFx":80,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":100,"absY":0,"absTx":100,"absTy":0,"absFx":100,"absFy":0},{"x":1,"y":0.2,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0.2,"tx":1,"ty":0.2,"absX":100,"absY":20,"absTx":100,"absTy":20,"absFx":100,"absFy":20},{"x":1,"y":0.5,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0.5,"tx":1,"ty":0.5,"absX":100,"absY":50,"absTx":100,"absTy":50,"absFx":100,"absFy":50},{"x":1,"y":0.8,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0.8,"tx":1,"ty":0.8,"absX":100,"absY":80,"absTx":100,"absTy":80,"absFx":100,"absFy":80},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]],[1,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":1,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":0,"tx":1,"ty":0,"absX":100,"absY":0,"absTx":100,"absTy":0,"absFx":100,"absFy":0},{"x":1,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1,"fy":1,"tx":1,"ty":1,"absX":100,"absY":100,"absTx":100,"absTy":100,"absFx":100,"absFy":100},{"x":0,"y":1,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":1,"tx":0,"ty":1,"absX":0,"absY":100,"absTx":0,"absTy":100,"absFx":0,"absFy":100}]]]')

      .moveToElement('canvas', 30, 220)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 60, 217)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 90, 223)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '')

      .moveToElement('canvas', 10, 150)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 7, 180)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .moveToElement('canvas', 13, 210)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .click('#button6')
      .assert.value('#base64', '')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '')

      .end();
  }
};
