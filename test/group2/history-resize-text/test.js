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
      .assert.value('#base64', '[0,{"left":{"v":53,"u":2},"top":{"v":24.5,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":0,"u":0},"height":{"v":0,"u":0},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"Helvetica","u":7},"fontSize":{"v":24,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[78,78,78,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":0,"lineHeight":27.59765625,"width":86,"height":29,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":53,"top":24.5,"right":-39,"bottom":46.5,"visibility":0,"color":[78,78,78,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[43,14.5],"translateX":-43,"translateY":-14.5,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .moveToElement('#main .select .br', 1, 1)
      .mouseButtonDown(0)
      .moveToElement('#main .select .br', 21, 11)
      .mouseButtonUp(0)
      .click('#button2')
      .assert.value('#base64', '[1,{"left":{"v":63,"u":2},"top":{"v":29.5,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":106,"u":1},"height":{"v":39,"u":1},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"Helvetica","u":7},"fontSize":{"v":24,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[78,78,78,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":0,"lineHeight":27.59765625,"width":106,"height":39,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":63,"top":29.5,"right":-69,"bottom":31.5,"visibility":0,"color":[78,78,78,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[53,19.5],"translateX":-53,"translateY":-19.5,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .moveToElement('#main .select .br', 1, 1)
      .mouseButtonDown(0)
      .moveToElement('#main .select .br', 21, 11)
      .mouseButtonUp(0)
      .click('#button2')
      .assert.value('#base64', '[2,{"left":{"v":73,"u":2},"top":{"v":34.5,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":126,"u":1},"height":{"v":49,"u":1},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"Helvetica","u":7},"fontSize":{"v":24,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[78,78,78,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":0,"lineHeight":27.59765625,"width":126,"height":49,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":73,"top":34.5,"right":-99,"bottom":16.5,"visibility":0,"color":[78,78,78,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[63,24.5],"translateX":-63,"translateY":-24.5,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button2')
      .assert.value('#base64', '[3,{"left":{"v":63,"u":2},"top":{"v":29.5,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":106,"u":1},"height":{"v":39,"u":1},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"Helvetica","u":7},"fontSize":{"v":24,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[78,78,78,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":0,"lineHeight":27.59765625,"width":106,"height":39,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":63,"top":29.5,"right":-69,"bottom":31.5,"visibility":0,"color":[78,78,78,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[53,19.5],"translateX":-53,"translateY":-19.5,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button2')
      .assert.value('#base64', '[4,{"left":{"v":53,"u":2},"top":{"v":24,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":0,"u":0},"height":{"v":0,"u":0},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"Helvetica","u":7},"fontSize":{"v":24,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[78,78,78,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":0,"lineHeight":27.59765625,"width":86,"height":28,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":53,"top":24,"right":-39,"bottom":48,"visibility":0,"color":[78,78,78,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[43,14],"translateX":-43,"translateY":-14,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button2')
      .assert.value('#base64', '[5,{"left":{"v":63,"u":2},"top":{"v":29.5,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":106,"u":1},"height":{"v":39,"u":1},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"Helvetica","u":7},"fontSize":{"v":24,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[78,78,78,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":0,"lineHeight":27.59765625,"width":106,"height":39,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":63,"top":29.5,"right":-69,"bottom":31.5,"visibility":0,"color":[78,78,78,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[53,19.5],"translateX":-53,"translateY":-19.5,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .keys(browser.Keys.META)
      .keys(browser.Keys.SHIFT)
      .keys('z')
      .keys(browser.Keys.NULL)
      .click('#button2')
      .assert.value('#base64', '[6,{"left":{"v":73,"u":2},"top":{"v":34.5,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":126,"u":1},"height":{"v":49,"u":1},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"Helvetica","u":7},"fontSize":{"v":24,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[78,78,78,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":0,"lineHeight":27.59765625,"width":126,"height":49,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":73,"top":34.5,"right":-99,"bottom":16.5,"visibility":0,"color":[78,78,78,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[63,24.5],"translateX":-63,"translateY":-24.5,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .moveToElement('#main .select .tl', 1, 1)
      .mouseButtonDown(0)
      .moveToElement('#main .select .tl', 21, 11)
      .mouseButtonUp(0)
      .click('#button2')
      .assert.value('#base64', '[7,{"left":{"v":83,"u":2},"top":{"v":39.5,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":106,"u":1},"height":{"v":38,"u":1},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"Helvetica","u":7},"fontSize":{"v":24,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[78,78,78,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":0,"lineHeight":27.59765625,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":83,"top":39.5,"right":-89,"bottom":22.5,"width":106,"height":38,"visibility":0,"color":[78,78,78,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[53,19],"translateX":-53,"translateY":-19,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .keys(browser.Keys.META)
      .keys('z')
      .keys(browser.Keys.NULL)
      .mouseButtonUp(0)
      .click('#button2')
      .assert.value('#base64', '[8,{"left":{"v":73,"u":2},"top":{"v":34.5,"u":2},"right":{"v":0,"u":0},"bottom":{"v":0,"u":0},"width":{"v":126,"u":1},"height":{"v":49,"u":1},"lineHeight":{"v":0,"u":0},"visibility":{"v":0,"u":3},"fontFamily":{"v":"Helvetica","u":7},"fontSize":{"v":24,"u":1},"fontWeight":{"v":400,"u":3},"fontStyle":{"v":0,"u":3},"color":{"v":[78,78,78,1],"u":5},"backgroundColor":{"v":[0,0,0,0],"u":5},"opacity":{"v":1,"u":3},"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":{"v":0,"u":3},"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":{"v":0,"u":3},"strokeLinejoin":{"v":0,"u":3},"strokeMiterlimit":{"v":10,"u":3},"translateX":{"v":-50,"u":2},"translateY":{"v":-50,"u":2},"scaleX":{"v":1,"u":3},"scaleY":{"v":1,"u":3},"rotateZ":{"v":0,"u":4},"letterSpacing":{"v":0,"u":1},"paragraphSpacing":{"v":0,"u":1},"textAlign":{"v":0,"u":3},"textVerticalAlign":{"v":0,"u":3},"textDecoration":[],"transformOrigin":[{"v":50,"u":2},{"v":50,"u":2}],"booleanOperation":{"v":0,"u":3},"mixBlendMode":{"v":0,"u":3},"pointerEvents":{"v":true,"u":6},"maskMode":{"v":0,"u":3},"breakMask":{"v":false,"u":6},"blur":{"v":{"t":0},"u":9},"shadow":[],"shadowEnable":[],"innerShadow":[],"innerShadowEnable":[],"hueRotate":{"v":0,"u":4},"saturate":{"v":100,"u":2},"brightness":{"v":100,"u":2},"contrast":{"v":100,"u":2}},{"fontFamily":"Helvetica","fontSize":24,"fontWeight":400,"fontStyle":0,"lineHeight":27.59765625,"width":126,"height":49,"letterSpacing":0,"paragraphSpacing":0,"textAlign":0,"textVerticalAlign":0,"left":73,"top":34.5,"right":-99,"bottom":16.5,"visibility":0,"color":[78,78,78,1],"backgroundColor":[0,0,0,0],"fill":[],"fillEnable":[],"fillOpacity":[],"fillMode":[],"fillRule":0,"stroke":[],"strokeEnable":[],"strokeWidth":[],"strokePosition":[],"strokeMode":[],"strokeDasharray":[],"strokeLinecap":0,"strokeLinejoin":0,"strokeMiterlimit":10,"booleanOperation":0,"mixBlendMode":0,"pointerEvents":true,"maskMode":0,"breakMask":false,"innerShadow":[],"innerShadowEnable":[],"textDecoration":[],"transformOrigin":[63,24.5],"translateX":-63,"translateY":-24.5,"rotateZ":0,"scaleX":1,"scaleY":1,"opacity":1,"blur":{"t":0,"radius":0,"center":[0.5,0.5],"saturation":1,"angle":0},"shadow":[],"shadowEnable":[],"hueRotate":0,"saturate":1,"brightness":1,"contrast":1}]')

      .end();
  }
};
