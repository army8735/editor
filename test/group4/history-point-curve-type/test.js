const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .moveToElement('canvas', 60, 60)
      .doubleClick()
      .assert.cssProperty('#main .geometry', 'display', 'block')
      .click('#button6')
      .assert.value('#base64', '[0,[{"x":0,"y":0.047619047619047616,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.047619047619047616,"tx":0,"ty":0.047619047619047616,"absX":0,"absY":6.25,"absTx":0,"absTy":6.25,"absFx":0,"absFy":6.25},{"x":0.842105263157894,"y":0.047619047619047616,"cornerRadius":0,"cornerStyle":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":1.0526315789473686,"fy":0.3333333333333333,"tx":0.6315789473684202,"ty":-0.047619047619047616,"absX":150.00000000000006,"absY":6.25,"absTx":112.5,"absTy":-6.25,"absFx":187.50000000000026,"absFy":43.75},{"x":0.842105263157894,"y":0.9047619047619048,"cornerRadius":0,"cornerStyle":0,"curveMode":4,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.6315789473684202,"fy":1.0952380952380953,"tx":1.0526315789473686,"ty":0.7142857142857143,"absX":150.00000000000006,"absY":118.75,"absTx":187.50000000000026,"absTy":93.75,"absFx":112.5,"absFy":143.75},{"x":0,"y":0.9047619047619048,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.9047619047619048,"tx":0,"ty":0.9047619047619048,"absX":0,"absY":118.75,"absTx":0,"absTy":118.75,"absFx":0,"absFy":118.75}]]')

      .moveToElement('canvas', 60, 60)
      .doubleClick()
      .assert.cssClassPresent('#side .point-panel .type', ['type'])
      .moveToElement('#main .geometry .vt[title="0"]', 0, 0)
      .mouseButtonDown(0)
      .assert.cssClassPresent('#main .geometry .vt[title="0"]', ['vt', 'cur'])
      .assert.cssClassPresent('#side .point-panel .type', ['type', 'enable'])
      .mouseButtonUp(0)
      .assert.cssProperty('#side .point-panel', 'display', 'block')
      .assert.cssClassPresent('#side .point-panel .type .straight', ['straight', 'cur'])
      .assert.cssClassPresent('#side .point-panel .type .mirrored', ['mirrored'])
      .assert.cssClassPresent('#side .point-panel .type .disconnected', ['disconnected'])
      .assert.cssClassPresent('#side .point-panel .type .asymmetric', ['asymmetric'])

      .moveToElement('#main .geometry .vt[title="1"]', 0, 0)
      .mouseButtonDown(0)
      .assert.cssClassPresent('#main .geometry .vt[title="1"]', ['vt', 'cur'])
      .mouseButtonUp(0)
      .assert.cssClassPresent('#side .point-panel .type .straight', ['straight'])
      .assert.cssClassPresent('#side .point-panel .type .mirrored', ['mirrored', 'cur'])
      .assert.cssClassPresent('#side .point-panel .type .disconnected', ['disconnected'])
      .assert.cssClassPresent('#side .point-panel .type .asymmetric', ['asymmetric'])
      .click('#side .point-panel .type .straight')
      .assert.cssClassPresent('#side .point-panel .type .straight', ['straight', 'cur'])
      .assert.cssClassPresent('#side .point-panel .type .mirrored', ['mirrored'])
      .assert.cssClassPresent('#side .point-panel .type .disconnected', ['disconnected'])
      .assert.cssClassPresent('#side .point-panel .type .asymmetric', ['asymmetric'])
      .click('#button6')
      .assert.value('#base64', '[1,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":0.8888888888888883,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1.1111111111111116,"fy":0.3,"tx":0.666666666666666,"ty":-0.1,"absX":150.00000000000006,"absY":0,"absTx":112.5,"absTy":-12.5,"absFx":187.50000000000028,"absFy":37.5},{"x":0.8888888888888883,"y":0.9,"cornerRadius":0,"cornerStyle":0,"curveMode":4,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.666666666666666,"fy":1.1,"tx":1.1111111111111116,"ty":0.7,"absX":150.00000000000006,"absY":112.5,"absTx":187.50000000000028,"absTy":87.5,"absFx":112.5,"absFy":137.5},{"x":0,"y":0.9,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.9,"tx":0,"ty":0.9,"absX":0,"absY":112.5,"absTx":0,"absTy":112.5,"absFx":0,"absFy":112.5}]]')
      .click('#button2')
      .assert.value('#base64', '[2,{"left":{"v":50,"u":2},"top":{"v":37.5,"u":2},"right":{"v":-118.75000000000017,"u":2},"bottom":{"v":-62.5,"u":2},"width":{"v":0,"u":0},"height":{"v":0,"u":0},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"arial","u":7},"fontSize":{"v":16,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[0,0,0,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[{"v":[215,215,215,1],"u":5}],"fillEnable":[{"v":true,"u":6}],"fillOpacity":[{"v":1,"u":3}],"fillMode":[{"v":0,"u":3}],"fillRule":{"v":1,"u":3},"stroke":[{"v":[150,150,150,1],"u":5}],"strokeEnable":[{"v":false,"u":6}],"strokeWidth":[{"v":1,"u":1}],"strokePosition":[{"v":1,"u":3}],"strokeMode":[{"v":0,"u":3}],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":0,"u":1},"translateY":{"v":0,"u":1},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"arial","fontSize":16,"fontWeight":400,"fontStyle":0,"lineHeight":18.3984375,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":50,"right":-118.75000000000017,"top":37.5,"bottom":-62.5,"width":168.75000000000017,"height":125,"visibility":0,"color":[0,0,0,1],"backgroundColor":[0,0,0,0],"fill":[[215,215,215,1]],"fillEnable":[true],"fillOpacity":[1],"fillMode":[0],"fillRule":1,"stroke":[[150,150,150,1]],"strokeEnable":[false],"strokeWidth":[1],"strokePosition":[1],"strokeMode":[0],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[84.3750000000001,62.5],"translateX":0,"translateY":0,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .moveToElement('canvas', 60, 60)
      .doubleClick()
      .moveToElement('#main .geometry .vt[title="1"]', 0, 0)
      .mouseButtonDown(0)
      .mouseButtonUp(0)
      .assert.cssClassPresent('#side .point-panel .type .straight', ['straight', 'cur'])
      .assert.cssClassPresent('#side .point-panel .type .mirrored', ['mirrored'])
      .assert.cssClassPresent('#side .point-panel .type .disconnected', ['disconnected'])
      .assert.cssClassPresent('#side .point-panel .type .asymmetric', ['asymmetric'])
      .click('#side .point-panel .type .mirrored')
      .assert.cssClassPresent('#side .point-panel .type .straight', ['straight'])
      .assert.cssClassPresent('#side .point-panel .type .mirrored', ['mirrored', 'cur'])
      .assert.cssClassPresent('#side .point-panel .type .disconnected', ['disconnected'])
      .assert.cssClassPresent('#side .point-panel .type .asymmetric', ['asymmetric'])
      .click('#button6')
      .assert.value('#base64', '[3,[{"x":0,"y":0.047619047619047616,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.047619047619047616,"tx":0,"ty":0.047619047619047616,"absX":0,"absY":6.25,"absTx":0,"absTy":6.25,"absFx":0,"absFy":6.25},{"x":0.8421052631578942,"y":0.047619047619047616,"cornerRadius":0,"cornerStyle":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":1.0526315789473681,"fy":0.14285714285714285,"tx":0.6315789473684205,"ty":-0.047619047619047616,"absX":150.00000000000006,"absY":6.25,"absTx":112.5,"absTy":-6.25,"absFx":187.50000000000014,"absFy":18.75},{"x":0.8421052631578942,"y":0.9047619047619048,"cornerRadius":0,"cornerStyle":0,"curveMode":4,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.6315789473684205,"fy":1.0952380952380953,"tx":1.052631578947369,"ty":0.7142857142857143,"absX":150.00000000000006,"absY":118.75,"absTx":187.50000000000028,"absTy":93.75,"absFx":112.5,"absFy":143.75},{"x":0,"y":0.9047619047619048,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.9047619047619048,"tx":0,"ty":0.9047619047619048,"absX":0,"absY":118.75,"absTx":0,"absTy":118.75,"absFx":0,"absFy":118.75}]]')
      .click('#button2')
      .assert.value('#base64', '[4,{"left":{"v":50,"u":2},"top":{"v":31.25,"u":2},"right":{"v":-128.12500000000017,"u":2},"bottom":{"v":-62.5,"u":2},"width":{"v":0,"u":0},"height":{"v":0,"u":0},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"arial","u":7},"fontSize":{"v":16,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[0,0,0,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[{"v":[215,215,215,1],"u":5}],"fillEnable":[{"v":true,"u":6}],"fillOpacity":[{"v":1,"u":3}],"fillMode":[{"v":0,"u":3}],"fillRule":{"v":1,"u":3},"stroke":[{"v":[150,150,150,1],"u":5}],"strokeEnable":[{"v":false,"u":6}],"strokeWidth":[{"v":1,"u":1}],"strokePosition":[{"v":1,"u":3}],"strokeMode":[{"v":0,"u":3}],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":0,"u":1},"translateY":{"v":0,"u":1},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"arial","fontSize":16,"fontWeight":400,"fontStyle":0,"lineHeight":18.3984375,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":50,"right":-128.12500000000017,"top":31.25,"bottom":-62.5,"width":178.12500000000017,"height":131.25,"visibility":0,"color":[0,0,0,1],"backgroundColor":[0,0,0,0],"fill":[[215,215,215,1]],"fillEnable":[true],"fillOpacity":[1],"fillMode":[0],"fillRule":1,"stroke":[[150,150,150,1]],"strokeEnable":[false],"strokeWidth":[1],"strokePosition":[1],"strokeMode":[0],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[89.0625000000001,65.625],"translateX":0,"translateY":0,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[5,[{"x":0,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0,"tx":0,"ty":0,"absX":0,"absY":0,"absTx":0,"absTy":0,"absFx":0,"absFy":0},{"x":0.8888888888888883,"y":0,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":1.1111111111111116,"fy":0.3,"tx":0.666666666666666,"ty":-0.1,"absX":150.00000000000006,"absY":0,"absTx":112.5,"absTy":-12.5,"absFx":187.50000000000028,"absFy":37.5},{"x":0.8888888888888883,"y":0.9,"cornerRadius":0,"cornerStyle":0,"curveMode":4,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.666666666666666,"fy":1.1,"tx":1.1111111111111116,"ty":0.7,"absX":150.00000000000006,"absY":112.5,"absTx":187.50000000000028,"absTy":87.5,"absFx":112.5,"absFy":137.5},{"x":0,"y":0.9,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.9,"tx":0,"ty":0.9,"absX":0,"absY":112.5,"absTx":0,"absTy":112.5,"absFx":0,"absFy":112.5}]]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button6')
      .assert.value('#base64', '[6,[{"x":0,"y":0.047619047619047616,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.047619047619047616,"tx":0,"ty":0.047619047619047616,"absX":0,"absY":6.25,"absTx":0,"absTy":6.25,"absFx":0,"absFy":6.25},{"x":0.8421052631578942,"y":0.047619047619047616,"cornerRadius":0,"cornerStyle":0,"curveMode":2,"hasCurveFrom":true,"hasCurveTo":true,"fx":1.0526315789473681,"fy":0.14285714285714285,"tx":0.6315789473684205,"ty":-0.047619047619047616,"absX":150.00000000000006,"absY":6.25,"absTx":112.5,"absTy":-6.25,"absFx":187.50000000000014,"absFy":18.75},{"x":0.8421052631578942,"y":0.9047619047619048,"cornerRadius":0,"cornerStyle":0,"curveMode":4,"hasCurveFrom":true,"hasCurveTo":true,"fx":0.6315789473684205,"fy":1.0952380952380953,"tx":1.052631578947369,"ty":0.7142857142857143,"absX":150.00000000000006,"absY":118.75,"absTx":187.50000000000028,"absTy":93.75,"absFx":112.5,"absFy":143.75},{"x":0,"y":0.9047619047619048,"cornerRadius":0,"cornerStyle":0,"curveMode":1,"hasCurveFrom":false,"hasCurveTo":false,"fx":0,"fy":0.9047619047619048,"tx":0,"ty":0.9047619047619048,"absX":0,"absY":118.75,"absTx":0,"absTy":118.75,"absFx":0,"absFy":118.75}]]')

      .end();
  }
};
