import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import JSZip from 'jszip';
import { color2rgbaStr } from '../style/css';
import {
  JArtBoard,
  JBitmap,
  JFile,
  JGroup,
  JNode,
  JPage,
  JPolyline,
  JShapeGroup,
  JSymbolInstance,
  JSymbolMaster,
  JText,
  Point,
  Rich,
  TAG_NAME,
} from './';
import { POINTS_RADIUS_BEHAVIOUR, TEXT_ALIGN, TEXT_DECORATION } from '../style/define';
import font from '../style/font';
import { r2d } from '../math/geom';
import reg from '../style/reg';
import inject from '../util/inject';

// sketch的Page没有尺寸，固定100
const W = 100, H = 100;

// prettier-ignore
export enum ResizingConstraint {
  UNSET = 0b111111,
  RIGHT = 0b000001, // 1
  WIDTH = 0b000010, // 2
  LEFT = 0b000100, // 4
  BOTTOM = 0b001000, // 8
  HEIGHT = 0b010000, // 16
  TOP = 0b100000, // 32
}

export async function openAndConvertSketchBuffer(arrayBuffer: ArrayBuffer) {
  const zipFile = await JSZip.loadAsync(arrayBuffer);
  return openAndConvertSketchZip(zipFile);
}

export async function openAndConvertSketchZip(zipFile: JSZip) {
  const document: SketchFormat.Document = await readJsonFile(
    zipFile,
    'document.json',
  );
  const pages: SketchFormat.Page[] = [];
  for (let i = 0, len = document.pages.length; i < len; i++) {
    pages[i] = await readJsonFile(zipFile, document.pages[i]._ref + '.json');
  }
  const meta = await readJsonFile(zipFile, 'meta.json');
  const user = await readJsonFile(zipFile, 'user.json');
  return await convertSketch(
    {
      document,
      pages,
      meta,
      user,
    },
    zipFile,
  );
}

async function readJsonFile(zipFile: JSZip, filename: string) {
  const docStr = await zipFile.file(filename)?.async('string');
  if (!docStr) {
    return {};
  }
  return JSON.parse(docStr);
}

type Opt = {
  zipFile?: JSZip;
  user: any;
  imgSrcRecord: Record<string, string>;
};

export async function convertSketch(json: any, zipFile?: JSZip): Promise<JFile> {
  // sketch自带的字体，有fontData的才算，没有的只是个使用声明；有可能这个字体本地已经有了，可以跳过
  const fontReferences = (json.document?.fontReferences || []).filter((item: SketchFormat.FontRef) => {
    if (!item.fontData || !item.fontData._ref) {
      return false;
    }
    const fontFamilyName = item.fontFamilyName;
    if (font.hasRegister(fontFamilyName)) {
      return false;
    }
    const postscriptName = item.postscriptNames[0];
    return !!postscriptName;
  });
  if (fontReferences.length) {
    await Promise.all(
      fontReferences.map((item: SketchFormat.FontRef) => {
        if (item.fontData._ref_class === 'MSFontData' && zipFile) {
          return readFontFile(item.fontData._ref, zipFile);
        }
        else if ((item.fontData._ref_class as string) === 'MSNetFontData') {
          return readNetFont(item.fontData._ref, item.postscriptNames[0]);
        }
      })
    );
  }
  const opt: Opt = {
    zipFile,
    user: json.user,
    imgSrcRecord: {},
  };
  // 外部控件
  const symbolMasters: any[] = [];
  const foreignSymbols = json.document?.foreignSymbols || [];
  for (let i = 0, len = foreignSymbols.length; i < len; i++) {
    symbolMasters[i] = await convertItem(foreignSymbols[i].symbolMaster, (i + 1) / (len + 1), opt, W, H);
  }
  const pages: JPage[] = [];
  if (json.pages) {
    for (let i = 0, len = json.pages.length; i < len; i++) {
      pages[i] = await convertPage(json.pages[i], (i + 1) / (len + 1), opt);
    }
  }
  const document = json.document;
  return {
    document: {
      uuid: document.do_objectID,
      assets: {
        uuid: document.assets.do_objectID,
      },
      layerStyles: {
        uuid: document.layerStyles.do_objectID,
      },
      layerTextStyles: {
        uuid: document.layerTextStyles.do_objectID,
      },
    },
    pages,
    currentPageIndex: json.document?.currentPageIndex || 0,
    symbolMasters,
  } as JFile;
}

async function convertPage(page: SketchFormat.Page, index: number, opt: Opt): Promise<JPage> {
  const children: (JNode | undefined)[] = [];
  for (let i = 0, len = page.layers.length; i < len; i++) {
    const res = await convertItem(page.layers[i], (i + 1) / (len + 1), opt, W, H);
    children.push(res);
  }
  let x = 0,
    y = 0,
    zoom = 1;
  const ua = opt.user[page.do_objectID];
  if (ua) {
    const { scrollOrigin, zoomValue } = ua;
    if (scrollOrigin) {
      const match = /\{([+-.\d]+),\s*([+-.\d]+)}/.exec(scrollOrigin);
      if (match) {
        x = parseFloat(match[1]) || 0;
        y = parseFloat(match[2]) || 0;
      }
    }
    if (zoomValue) {
      zoom = zoomValue;
    }
  }
  return {
    tagName: TAG_NAME.PAGE,
    props: {
      uuid: page.do_objectID,
      name: page.name,
      index,
      constrainProportions: page.frame.constrainProportions,
      rule: {
        baseX: page.horizontalRulerData.base,
        baseY: page.verticalRulerData.base,
      },
      style: {
        width: W,
        height: H,
        visible: false,
        translateX: x,
        translateY: y,
        scaleX: zoom,
        scaleY: zoom,
        transformOrigin: [0, 0],
        pointerEvents: false,
      },
      isLocked: false,
      isExpanded: false,
    },
    children: children.filter((item) => item),
  } as JPage;
}

async function convertItem(
  layer: SketchFormat.AnyLayer,
  index: number,
  opt: Opt,
  w: number,
  h: number,
): Promise<JNode | undefined> {
  let width: number | string = layer.frame.width || 0.5;
  let height: number | string = layer.frame.height || 0.5;
  let translateX: number | string = layer.frame.x || 0;
  let translateY: number | string = layer.frame.y || 0;
  if (w < 0) {
    w = 0;
  }
  if (h < 0) {
    h = 0;
  }
  // sketch不会出现非正数，但人工可能修改，sketch对此做了兼容转换
  if (width < 0) {
    translateX += width;
    width = Math.abs(width);
  }
  if (height < 0) {
    translateY += height;
    height = Math.abs(height);
  }
  const visible = layer.isVisible;
  const opacity = layer.style?.contextSettings?.opacity ?? 1;
  const rotateZ = -layer.rotation;
  let scaleX = layer.isFlippedHorizontal ? -1 : 1;
  let scaleY = layer.isFlippedVertical ? -1 : 1;
  if (layer._class === SketchFormat.ClassValue.SymbolInstance && layer.scale !== 1) {
    scaleX *= layer.scale;
    scaleY *= layer.scale;
    const w = width / layer.scale;
    const h = height / layer.scale;
    const dw = w - width;
    const dh = h - height;
    translateX -= dw * 0.5;
    translateY -= dh * 0.5;
    width /= layer.scale;
    height /= layer.scale;
  }
  // 渲染无关的锁定/展开/固定宽高比
  const isLocked = layer.isLocked;
  const isExpanded =
    layer.layerListExpandedType === SketchFormat.LayerListExpanded.Expanded;
  const constrainProportions = layer.frame.constrainProportions;
  // artBoard也是固定尺寸和page一样，但x/y用translate代替，symbolMaster类似但多了symbolID
  if (layer._class === SketchFormat.ClassValue.Artboard
    || layer._class === SketchFormat.ClassValue.SymbolMaster) {
    const children: (JNode | undefined)[] = [];
    for (let i = 0, len = layer.layers.length; i < len; i++) {
      const res = await convertItem(layer.layers[i], (i + 1) / (len + 1), opt, width as number, height as number);
      if (res) {
        children.push(res);
      }
    }
    const hasBackgroundColor = layer.hasBackgroundColor;
    const backgroundColor = hasBackgroundColor
      ? [
        Math.floor(layer.backgroundColor.red * 255),
        Math.floor(layer.backgroundColor.green * 255),
        Math.floor(layer.backgroundColor.blue * 255),
        layer.backgroundColor.alpha,
      ]
      : [255, 255, 255, 1];
    if (layer._class === SketchFormat.ClassValue.SymbolMaster) {
      const symbolId = layer.symbolID;
      const includeBackgroundColorInInstance = layer.includeBackgroundColorInInstance;
      return {
        tagName: TAG_NAME.SYMBOL_MASTER,
        props: {
          uuid: layer.do_objectID,
          name: layer.name,
          constrainProportions,
          hasBackgroundColor,
          resizesContent: layer.resizesContent,
          symbolId,
          includeBackgroundColorInInstance,
          style: {
            width, // 画板始终相对于page的原点，没有百分比单位
            height,
            visible,
            opacity,
            translateX,
            translateY,
            rotateZ,
            backgroundColor,
          },
          isLocked,
          isExpanded,
        },
        children: children.filter((item) => item),
      } as JSymbolMaster;
    }
    return {
      tagName: TAG_NAME.ART_BOARD,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        constrainProportions,
        hasBackgroundColor,
        resizesContent: layer.resizesContent,
        style: {
          width, // 画板始终相对于page的原点，没有百分比单位
          height,
          visible,
          opacity,
          translateX,
          translateY,
          rotateZ,
          backgroundColor,
        },
        isLocked,
        isExpanded,
      },
      children: children.filter((item) => item),
    } as JArtBoard;
  }
  // 其它子元素都有布局规则约束，需模拟计算出类似css的absolute定位
  const resizingConstraint =
    layer.resizingConstraint ^ ResizingConstraint.UNSET;
  let left: number | string = 0,
    top: number | string = 0,
    right: number | string = 'auto',
    bottom: number | string = 'auto';
  // left
  if (resizingConstraint & ResizingConstraint.LEFT) {
    left = translateX;
    // left+right忽略width
    if (resizingConstraint & ResizingConstraint.RIGHT) {
      right = w - translateX - width;
      width = 'auto';
    }
    // left+width
    else if (resizingConstraint & ResizingConstraint.WIDTH) {
      // 默认right就是auto啥也不做
    }
    // 仅left，right是百分比忽略width
    else {
      right = ((w - translateX - width) * 100) / w + '%';
      width = 'auto';
    }
    translateX = 0;
  }
  // right
  else if (resizingConstraint & ResizingConstraint.RIGHT) {
    right = w - translateX - width;
    // right+width
    if (resizingConstraint & ResizingConstraint.WIDTH) {
      left = 'auto';
    }
    // 仅right，left是百分比忽略width
    else {
      left = (translateX * 100) / w + '%';
      width = 'auto';
    }
    translateX = 0;
  }
  // 左右都不固定
  else {
    // 仅固定宽度，以中心点占left的百分比
    if (resizingConstraint & ResizingConstraint.WIDTH) {
      left = ((translateX + width * 0.5) * 100) / w + '%';
      translateX = '-50%';
    }
    // 左右皆为百分比
    else {
      left = (translateX * 100) / w + '%';
      right = ((w - translateX - width) * 100) / w + '%';
      translateX = 0;
      width = 'auto';
    }
  }
  // top
  if (resizingConstraint & ResizingConstraint.TOP) {
    top = translateY;
    // top+bottom忽略height
    if (resizingConstraint & ResizingConstraint.BOTTOM) {
      bottom = h - translateY - height;
      height = 'auto';
    }
    // top+height
    else if (resizingConstraint & ResizingConstraint.HEIGHT) {
      // 默认啥也不做
    }
    // 仅top，bottom是百分比忽略height
    else {
      bottom = ((h - translateY - height) * 100) / h + '%';
      height = 'auto';
    }
    translateY = 0;
  }
  // bottom
  else if (resizingConstraint & ResizingConstraint.BOTTOM) {
    bottom = h - translateY - height;
    // bottom+height
    if (resizingConstraint & ResizingConstraint.HEIGHT) {
      top = 'auto';
    }
    // 仅bottom，top是百分比忽略height
    else {
      top = (translateY * 100) / h + '%';
      height = 'auto';
    }
    translateY = 0;
  }
  // 上下都不固定
  else {
    // 仅固定高度，以中心点占top的百分比
    if (resizingConstraint & ResizingConstraint.HEIGHT) {
      top = ((translateY + height * 0.5) * 100) / h + '%';
      translateY = '-50%';
    }
    // 上下皆为百分比
    else {
      top = (translateY * 100) / h + '%';
      bottom = ((h - translateY - height) * 100) / h + '%';
      translateY = 0;
      height = 'auto';
    }
  }
  // 兜底防止生成数据不合法
  if (!w || w < 0) {
    if (left !== 'auto') {
      left = '0%';
    }
    if (right !== 'auto') {
      right = '0%';
    }
  }
  if (!h || h < 0) {
    if (top !== 'auto') {
      top = '0%';
    }
    if (bottom !== 'auto') {
      bottom = '0%';
    }
  }
  // 遮罩转换
  let maskMode = 'none';
  const { hasClippingMask, clippingMaskMode } = layer;
  if (hasClippingMask) {
    if (clippingMaskMode) {
      maskMode = 'alpha';
    }
    else {
      maskMode = 'outline';
    }
  }
  const breakMask = layer.shouldBreakMaskChain;
  // 模糊
  let blur = 'none';
  if (layer.style?.blur?.isEnabled) {
    const b = layer.style.blur;
    const type = b.type;
    if (type === SketchFormat.BlurType.Gaussian) {
      blur = `gauss(${b.radius}px)`;
    }
    else if (type === SketchFormat.BlurType.Background) {
      blur = `background(${b.radius}px) saturation(${(b.saturation || 0) * 100}%)`;
    }
    else if (type === SketchFormat.BlurType.Zoom) {
      const center = b.center.match(reg.number) || ['0.5', '0.5'];
      const p = center.map(item => {
        return parseFloat(item) * 100 + '%';
      });
      blur = `radial(${b.radius}px) center(${p[0]}, ${p[1]})`;
    }
    else if (type === SketchFormat.BlurType.Motion) {
      blur = `motion(${b.radius}px) angle(${(b.motionAngle || 0) * -1})`;
    }
  }
  // 颜色调整
  let hueRotate = 0;
  let saturate = 1;
  let brightness = 1;
  let contrast = 1;
  const colorControls = layer.style?.colorControls;
  if (colorControls && colorControls.isEnabled) {
    if (colorControls.hue) {
      hueRotate = r2d(colorControls.hue);
    }
    saturate = colorControls.saturation;
    if (colorControls.brightness) {
      brightness = colorControls.brightness + 1;
    }
    contrast = colorControls.contrast;
  }
  // 混合模式
  const blend = layer.style?.contextSettings?.blendMode;
  const mixBlendMode = getBlendMode(blend);
  // 阴影
  const shadow: string[] = [];
  const shadowEnable: boolean[] = [];
  const innerShadow: string[] = [];
  const innerShadowEnable: boolean[] = [];
  const shadows = layer.style?.shadows;
  if (shadows) {
    shadows.forEach((item) => {
      const color = [
        Math.floor(item.color.red * 255),
        Math.floor(item.color.green * 255),
        Math.floor(item.color.blue * 255),
        item.color.alpha,
      ];
      shadow.push(`${color2rgbaStr(color)} ${item.offsetX} ${item.offsetY} ${item.blurRadius} ${item.spread} `);
      shadowEnable.push(item.isEnabled);
    });
  }
  const innerShadows = layer.style?.innerShadows;
  if (innerShadows) {
    innerShadows.forEach((item) => {
      const color = [
        Math.floor(item.color.red * 255),
        Math.floor(item.color.green * 255),
        Math.floor(item.color.blue * 255),
        item.color.alpha,
      ];
      innerShadow.push(`${color2rgbaStr(color)} ${item.offsetX} ${item.offsetY} ${item.blurRadius} ${item.spread}`);
      innerShadowEnable.push(item.isEnabled);
    });
  }
  if (layer._class === SketchFormat.ClassValue.SymbolInstance) {
    const {
      fill,
      fillEnable,
      fillOpacity,
    } = await geomStyle(layer, opt);
    return {
      tagName: TAG_NAME.SYMBOL_INSTANCE,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        index,
        constrainProportions,
        symbolId: layer.symbolID,
        overrideValues: layer.overrideValues.map(item => {
          return {
            name: item.overrideName as string,
            value: item.value as string,
          };
        }),
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visible,
          opacity,
          fill,
          fillEnable,
          fillOpacity,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          mixBlendMode,
          maskMode,
          breakMask,
          blur,
          shadow,
          shadowEnable,
          innerShadow,
          innerShadowEnable,
        },
        isLocked,
        isExpanded,
      },
    } as JSymbolInstance;
  }
  if (layer._class === SketchFormat.ClassValue.Group) {
    const children: (JNode | undefined)[] = [];
    for (let i = 0, len = layer.layers.length; i < len; i++) {
      const res = await convertItem(layer.layers[i], (i + 1) / (len + 1), opt, layer.frame.width, layer.frame.height);
      if (res) {
        children.push(res);
      }
    }
    const {
      fill,
      fillEnable,
      fillOpacity,
    } = await geomStyle(layer, opt);
    return {
      tagName: TAG_NAME.GROUP,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        index,
        constrainProportions,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visible,
          opacity,
          fill,
          fillEnable,
          fillOpacity,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          mixBlendMode,
          maskMode,
          breakMask,
          blur,
          shadow,
          shadowEnable,
          innerShadow,
          innerShadowEnable,
        },
        isLocked,
        isExpanded,
      },
      children: children.filter((item) => item),
    } as JGroup;
  }
  if (layer._class === SketchFormat.ClassValue.Bitmap) {
    let src = '';
    let md5 = '';
    if (layer.image._ref_class === 'MSImageData') {
      md5 = layer.image._ref.replace(/^images\//, '');
      src = await readImageFile(layer.image._ref, opt);
    }
    else if ((layer.image._ref_class as string) === 'MSNetworkImage') {
      src = layer.image._ref;
    }
    const {
      fill,
      fillEnable,
      fillOpacity,
      fillMode,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeMode,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
      strokeMiterlimit,
    } = await geomStyle(layer, opt);
    return {
      tagName: TAG_NAME.BITMAP,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        index,
        constrainProportions,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visible,
          opacity,
          fill,
          fillEnable,
          fillOpacity,
          fillMode,
          stroke,
          strokeEnable,
          strokeWidth,
          strokePosition,
          strokeMode,
          strokeDasharray,
          strokeLinecap,
          strokeLinejoin,
          strokeMiterlimit,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          mixBlendMode,
          maskMode,
          breakMask,
          blur,
          shadow,
          shadowEnable,
          innerShadow,
          innerShadowEnable,
          hueRotate,
          saturate,
          brightness,
          contrast,
        },
        isLocked,
        isExpanded,
        src,
        md5,
      },
    } as JBitmap;
  }
  if (layer._class === SketchFormat.ClassValue.Text) {
    const tb = layer.textBehaviour;
    // sketch冗余的信息，文本的宽高在自动情况下实时测量获得，另外优先级高于ResizingConstraint
    if (tb === SketchFormat.TextBehaviour.Flexible) {
      if (left !== 'auto' && right !== 'auto') {
        right = 'auto';
      }
      if (top !== 'auto' && bottom !== 'auto') {
        bottom = 'auto';
      }
      width = 'auto';
      height = 'auto';
    }
    else if (tb === SketchFormat.TextBehaviour.Fixed) {
      // 可能width是auto（left+right），也可能是left+width，或者right固定+width
      if (top !== 'auto' && bottom !== 'auto') {
        bottom = 'auto';
      }
      height = 'auto';
    }
    else if (tb === SketchFormat.TextBehaviour.FixedWidthAndHeight) {
      // 啥也不干，等同普通节点的固定宽高
    }
    const { string, attributes } = layer.attributedString;
    const rich: Rich[] = attributes.length
      ? attributes.map((item: any) => {
        const {
          location,
          length,
          attributes: {
            MSAttributedStringFontAttribute: {
              attributes: { name = inject.defaultFontFamily, size: fontSize = inject.defaultFontSize } = {},
            } = {},
            MSAttributedStringColorAttribute: { red = 0, green = 0, blue = 0, alpha = 1 } = {},
            kerning = 0,
            underlineStyle = SketchFormat.UnderlineStyle.None,
            strikethroughStyle = SketchFormat.StrikethroughStyle.None,
            paragraphStyle: {
              alignment = 0,
              maximumLineHeight = 0,
              paragraphSpacing = 0,
            } = {},
          },
        } = item;
        const textDecoration: TEXT_DECORATION[] = [];
        if (underlineStyle !== SketchFormat.UnderlineStyle.None) {
          textDecoration.push(TEXT_DECORATION.UNDERLINE);
        }
        if (strikethroughStyle !== SketchFormat.StrikethroughStyle.None) {
          textDecoration.push(TEXT_DECORATION.LINE_THROUGH);
        }
        return {
          location,
          length,
          fontFamily: name,
          fontSize,
          fontWeight: 400, // 无用写死
          fontStyle: 'normal', // 同
          letterSpacing: kerning,
          textAlign: [TEXT_ALIGN.LEFT, TEXT_ALIGN.RIGHT, TEXT_ALIGN.CENTER, TEXT_ALIGN.JUSTIFY][alignment || 0],
          textDecoration,
          lineHeight: maximumLineHeight,
          paragraphSpacing,
          color: [
            Math.floor(red * 255),
            Math.floor(green * 255),
            Math.floor(blue * 255),
            alpha,
          ],
        };
      })
      : [];
    const MSAttributedStringFontAttribute =
      layer.style?.textStyle?.encodedAttributes?.MSAttributedStringFontAttribute
        ?.attributes;
    const fontSize = MSAttributedStringFontAttribute?.size || rich[0]?.fontSize || inject.defaultFontSize;
    const fontFamily = MSAttributedStringFontAttribute?.name || rich[0]?.fontFamily || inject.defaultFontFamily;
    const paragraphStyle =
      layer.style?.textStyle?.encodedAttributes?.paragraphStyle;
    const alignment = paragraphStyle?.alignment ?? rich[0]?.textAlign;
    const lineHeight = paragraphStyle?.maximumLineHeight || 'normal';
    const { underlineStyle = 0, strikethroughStyle = 0, kerning: letterSpacing = 0, MSAttributedStringColorAttribute } = layer.style?.textStyle?.encodedAttributes || {};
    const textAlign = ['left', 'right', 'center', 'justify'][alignment || 0];
    const verticalAlignment = layer.style?.textStyle?.verticalAlignment;
    const textVerticalAlign = ['top', 'middle', 'bottom'][verticalAlignment || 0];
    const textDecoration: Array<'none' | 'underline' | 'line-through' | 'lineThrough'> = [];
    if (underlineStyle !== SketchFormat.UnderlineStyle.None) {
      textDecoration.push('underline');
    }
    if (underlineStyle && strikethroughStyle !== SketchFormat.StrikethroughStyle.None) {
      textDecoration.push('lineThrough');
    }
    const paragraphSpacing = paragraphStyle?.paragraphSpacing || 0;
    const color = MSAttributedStringColorAttribute
      ? [
        Math.floor(MSAttributedStringColorAttribute.red * 255),
        Math.floor(MSAttributedStringColorAttribute.green * 255),
        Math.floor(MSAttributedStringColorAttribute.blue * 255),
        MSAttributedStringColorAttribute.alpha,
      ]
      : (rich[0]?.color || [0, 0, 0, 1]);
    // 脏数据没有rich更新不了样式
    if (string.length && !rich.length) {
      rich.push({
        location: 0,
        length: string.length,
        fontFamily,
        fontSize,
        fontWeight: 400,
        fontStyle: 'normal',
        letterSpacing,
        textAlign: [TEXT_ALIGN.LEFT, TEXT_ALIGN.RIGHT, TEXT_ALIGN.CENTER, TEXT_ALIGN.JUSTIFY][alignment || 0],
        textDecoration: textDecoration.map(item => {
          if (item === 'underline') {
            return TEXT_DECORATION.UNDERLINE;
          }
          else if (item === 'lineThrough') {
            return TEXT_DECORATION.LINE_THROUGH;
          }
          else {
            return TEXT_DECORATION.NONE;
          }
        }),
        lineHeight: typeof lineHeight === 'number' ? lineHeight : 0,
        paragraphSpacing,
        color,
      });
    }
    const {
      fill,
      fillEnable,
      fillOpacity,
      fillMode,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeMode,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
      strokeMiterlimit,
      styleId,
    } = await geomStyle(layer, opt);
    return {
      tagName: TAG_NAME.TEXT,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        index,
        constrainProportions,
        styleId,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visible,
          opacity,
          fill,
          fillEnable,
          fillOpacity,
          fillMode,
          stroke,
          strokeEnable,
          strokeWidth,
          strokePosition,
          strokeMode,
          strokeDasharray,
          strokeLinecap,
          strokeLinejoin,
          strokeMiterlimit,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          fontSize,
          fontFamily,
          color,
          textAlign,
          textVerticalAlign,
          textDecoration,
          letterSpacing,
          lineHeight,
          paragraphSpacing,
          mixBlendMode,
          maskMode,
          breakMask,
          blur,
          shadow,
          shadowEnable,
          innerShadow,
          innerShadowEnable,
        },
        isLocked,
        isExpanded,
        content: string,
        rich,
      },
    } as JText;
  }
  if (
    layer._class === SketchFormat.ClassValue.Rectangle ||
    layer._class === SketchFormat.ClassValue.Oval ||
    layer._class === SketchFormat.ClassValue.Star ||
    layer._class === SketchFormat.ClassValue.Triangle ||
    layer._class === SketchFormat.ClassValue.Polygon ||
    layer._class === SketchFormat.ClassValue.ShapePath
  ) {
    const points: Point[] = layer.points.map((item: any) => {
      const point = parseStrPoint(item.point);
      const curveFrom = parseStrPoint(item.curveFrom);
      const curveTo = parseStrPoint(item.curveTo);
      return {
        x: point.x,
        y: point.y,
        cornerRadius: item.cornerRadius,
        cornerStyle: item.cornerStyle,
        curveMode: item.curveMode,
        hasCurveFrom: item.hasCurveFrom,
        hasCurveTo: item.hasCurveTo,
        fx: curveFrom.x,
        fy: curveFrom.y,
        tx: curveTo.x,
        ty: curveTo.y,
      };
    });
    const {
      fill,
      fillEnable,
      fillOpacity,
      fillMode,
      fillRule,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeMode,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
      strokeMiterlimit,
      styleId,
    } = await geomStyle(layer, opt);
    let pointRadiusBehaviour = POINTS_RADIUS_BEHAVIOUR.DISABLED;
    if (
      layer.pointRadiusBehaviour === SketchFormat.PointsRadiusBehaviour.Legacy
    ) {
      pointRadiusBehaviour = POINTS_RADIUS_BEHAVIOUR.LEGACY;
    }
    else if (
      layer.pointRadiusBehaviour === SketchFormat.PointsRadiusBehaviour.Rounded
    ) {
      pointRadiusBehaviour = POINTS_RADIUS_BEHAVIOUR.ROUNDED;
    }
    else if (
      layer.pointRadiusBehaviour === SketchFormat.PointsRadiusBehaviour.Smooth
    ) {
      pointRadiusBehaviour = POINTS_RADIUS_BEHAVIOUR.SMOOTH;
    }
    return {
      tagName: TAG_NAME.POLYLINE,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        index,
        constrainProportions,
        points,
        isClosed: layer.isClosed,
        // @ts-ignore
        fixedRadius: layer.fixedRadius || 0,
        pointRadiusBehaviour,
        isRectangle: layer._class === 'rectangle',
        isOval: layer._class === 'oval',
        styleId,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visible,
          opacity,
          fill,
          fillEnable,
          fillOpacity,
          fillMode,
          fillRule,
          stroke,
          strokeEnable,
          strokeWidth,
          strokePosition,
          strokeMode,
          strokeDasharray,
          strokeLinecap,
          strokeLinejoin,
          strokeMiterlimit,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          booleanOperation:
            ['union', 'subtract', 'intersect', 'xor'][layer.booleanOperation] ||
            'none',
          mixBlendMode,
          maskMode,
          breakMask,
          blur,
          shadow,
          shadowEnable,
          innerShadow,
          innerShadowEnable,
        },
        isLocked,
        isExpanded,
      },
    } as JPolyline;
  }
  if (layer._class === SketchFormat.ClassValue.ShapeGroup) {
    const {
      fill,
      fillEnable,
      fillOpacity,
      fillMode,
      fillRule,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeMode,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
      strokeMiterlimit,
      styleId,
    } = await geomStyle(layer, opt);
    const children: (JNode | undefined)[] = [];
    for (let i = 0, len = layer.layers.length; i < len; i++) {
      const res = await convertItem(layer.layers[i], (i + 1) / (len + 1), opt, layer.frame.width, layer.frame.height);
      if (res) {
        children.push(res);
      }
    }
    return {
      tagName: TAG_NAME.SHAPE_GROUP,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        index,
        constrainProportions,
        styleId,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visible,
          opacity,
          fill,
          fillEnable,
          fillOpacity,
          fillMode,
          fillRule,
          stroke,
          strokeEnable,
          strokeWidth,
          strokePosition,
          strokeMode,
          strokeDasharray,
          strokeLinecap,
          strokeLinejoin,
          strokeMiterlimit,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          booleanOperation:
            ['union', 'subtract', 'intersect', 'xor'][layer.booleanOperation] ||
            'none',
          mixBlendMode,
          maskMode,
          breakMask,
          blur,
          shadow,
          shadowEnable,
          innerShadow,
          innerShadowEnable,
        },
        isLocked,
        isExpanded,
      },
      children,
    } as JShapeGroup;
  }
  if (layer._class === SketchFormat.ClassValue.Slice) {
    return {
      tagName: TAG_NAME.SLICE,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        index,
        constrainProportions,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visible,
          opacity,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          breakMask,
        },
        isLocked,
      },
    };
  }
  inject.error(layer);
}

async function geomStyle(layer: SketchFormat.AnyLayer, opt: Opt) {
  const {
    borders,
    borderOptions,
    fills,
    windingRule,
    miterLimit: strokeMiterlimit,
    do_objectID: styleId,
  } = layer.style || {};
  const fill: Array<string | number[]> = [],
    fillEnable: boolean[] = [],
    fillOpacity: number[] = [],
    fillMode: string[] = [];
  if (fills) {
    for (let i = 0, len = fills.length; i < len; i++) {
      const item = fills[i];
      if (item.fillType === SketchFormat.FillType.Pattern) {
        let url = '';
        const image = item.image!;
        if (image._ref_class === 'MSImageData') {
          url = await readImageFile(image._ref, opt);
        }
        else if ((image._ref_class as string) === 'MSNetworkImage') {
          url = image._ref;
        }
        const type = ['tile', 'fill', 'stretch', 'fit'][item.patternFillType];
        const scale = item.patternTileScale;
        fill.push(`url(${url}) ${type} ${scale * 100}%`);
      }
      else if (item.fillType === SketchFormat.FillType.Gradient) {
        const g = item.gradient;
        const from = parseStrPoint(g.from);
        const to = parseStrPoint(g.to);
        const stops = g.stops.map((item) => {
          const color = color2rgbaStr([
            Math.floor(item.color.red * 255),
            Math.floor(item.color.green * 255),
            Math.floor(item.color.blue * 255),
            item.color.alpha,
          ]);
          return color + ' ' + item.position * 100 + '%';
        });
        if (g.gradientType === SketchFormat.GradientType.Linear) {
          fill.push(
            `linearGradient(${from.x} ${from.y} ${to.x} ${to.y},${stops.join(
              ',',
            )})`,
          );
        }
        else if (g.gradientType === SketchFormat.GradientType.Radial) {
          const ellipseLength = g.elipseLength;
          fill.push(
            `radialGradient(${from.x} ${from.y} ${to.x} ${to.y} ${ellipseLength},${stops.join(',')})`,
          );
        }
        else if (g.gradientType === SketchFormat.GradientType.Angular) {
          fill.push(
            `conicGradient(${0.5} ${0.5} ${0.5} ${0.5},${stops.join(
              ',',
            )})`,
          );
        }
        else {
          throw new Error('Unknown gradient');
        }
      }
      else {
        fill.push([
          Math.floor(item.color.red * 255),
          Math.floor(item.color.green * 255),
          Math.floor(item.color.blue * 255),
          item.color.alpha,
        ]);
      }
      fillEnable.push(item.isEnabled);
      fillOpacity.push(item.contextSettings.opacity ?? 1);
      const blend = item.contextSettings.blendMode;
      fillMode.push(getBlendMode(blend));
    }
  }
  const stroke: Array<string | number[]> = [],
    strokeEnable: boolean[] = [],
    strokeWidth: number[] = [],
    strokePosition: string[] = [],
    strokeMode: string[] = [];
  if (borders) {
    for (let i = 0, len = borders.length; i < len; i++) {
      const item = borders[i];
      if (item.fillType === SketchFormat.FillType.Gradient) {
        const g = item.gradient;
        const from = parseStrPoint(g.from);
        const to = parseStrPoint(g.to);
        const stops = g.stops.map((item) => {
          const color = color2rgbaStr([
            Math.floor(item.color.red * 255),
            Math.floor(item.color.green * 255),
            Math.floor(item.color.blue * 255),
            item.color.alpha,
          ]);
          return color + ' ' + item.position * 100 + '%';
        });
        if (g.gradientType === SketchFormat.GradientType.Linear) {
          stroke.push(
            `linearGradient(${from.x} ${from.y} ${to.x} ${to.y},${stops.join(
              ',',
            )})`,
          );
        }
        else if (g.gradientType === SketchFormat.GradientType.Radial) {
          const ellipseLength = g.elipseLength;
          stroke.push(
            `radialGradient(${from.x} ${from.y} ${to.x} ${
              to.y
            } ${ellipseLength},${stops.join(',')})`,
          );
        }
        else if (g.gradientType === SketchFormat.GradientType.Angular) {
          stroke.push(
            `conicGradient(${from.x} ${from.y} ${to.x} ${to.y},${stops.join(
              ',',
            )})`,
          );
        }
        else {
          throw new Error('Unknown gradient');
        }
      }
      else {
        stroke.push([
          Math.floor(item.color.red * 255),
          Math.floor(item.color.green * 255),
          Math.floor(item.color.blue * 255),
          item.color.alpha,
        ]);
      }
      strokeEnable.push(item.isEnabled);
      strokeWidth.push(item.thickness || 0);
      if (item.position === SketchFormat.BorderPosition.Inside) {
        strokePosition.push('inside');
      }
      else if (item.position === SketchFormat.BorderPosition.Outside) {
        strokePosition.push('outside');
      }
      else {
        strokePosition.push('center');
      }
      const blend = item.contextSettings.blendMode;
      strokeMode.push(getBlendMode(blend));
    }
  }
  const strokeDasharray: number[] = [];
  let strokeLinecap = 'butt',
    strokeLinejoin = 'miter';
  if (borderOptions) {
    borderOptions.dashPattern.forEach((item) => {
      strokeDasharray.push(item);
    });
    if (borderOptions.lineCapStyle === SketchFormat.LineCapStyle.Round) {
      strokeLinecap = 'round';
    }
    else if (
      borderOptions.lineCapStyle === SketchFormat.LineCapStyle.Projecting
    ) {
      strokeLinecap = 'square';
    }
    if (borderOptions.lineJoinStyle === SketchFormat.LineJoinStyle.Round) {
      strokeLinejoin = 'round';
    }
    else if (
      borderOptions.lineJoinStyle === SketchFormat.LineJoinStyle.Bevel
    ) {
      strokeLinejoin = 'bevel';
    }
  }
  return {
    fill,
    fillEnable,
    fillOpacity,
    fillMode,
    fillRule: windingRule === SketchFormat.WindingRule.EvenOdd ? 'evenodd' : 'nonzero',
    stroke,
    strokeEnable,
    strokeWidth,
    strokePosition,
    strokeMode,
    strokeDasharray,
    strokeLinecap,
    strokeLinejoin,
    strokeMiterlimit,
    styleId,
  };
}

function parseStrPoint(s: string) {
  const res = /{(.+),\s*(.+)}/.exec(s);
  if (!res) {
    throw new Error('Unknown point: ' + s);
  }
  return { x: parseFloat(res[1]), y: parseFloat(res[2]) };
}

async function readImageFile(filename: string, opt: Opt) {
  if (!filename || !opt.zipFile) {
    return '';
  }
  if (opt.imgSrcRecord.hasOwnProperty(filename)) {
    return opt.imgSrcRecord[filename];
  }
  let file = opt.zipFile.file(filename);
  if (!file) {
    file = opt.zipFile.file(filename);
    if (!file) {
      inject.error(`image not exist: >>>${filename}<<<`);
      return '';
    }
  }
  const ab = await file.async('arraybuffer');
  const uint8View = new Uint8Array(ab);
  let isPdf = false;
  // https://en.wikipedia.org/wiki/Magic_number_(programming)#Magic_numbers_in_files
  if (uint8View[0] === 0x25 && uint8View[1] === 0x50 && uint8View[2] === 0x44 && uint8View[3] === 0x46) {
    isPdf = true;
  }
  if (!ab.byteLength) {
    inject.error(`image is empty: >>>${filename}<<<`);
    return '';
  }
  let img: HTMLImageElement;
  if (isPdf) {
    try {
      img = await inject.loadArrayBufferPdf(ab);
    }
    catch(e) {
      inject.error(e);
      return '';
    }
  }
  else {
    try {
      img = await inject.loadArrayBufferImg(ab);
    }
    catch (e) {
      inject.error(e);
      return '';
    }
  }
  // nodejs环境下，使用node-canvas创建的img无src，暂时用原本url代替
  const src = img.src || ('blob:file://' + filename);
  inject.IMG[src] = {
    success: true,
    state: inject.LOADED,
    width: img.width,
    height: img.height,
    source: img,
    url: src,
  };
  opt.imgSrcRecord[filename] = src;
  return src;
}

async function readFontFile(filename: string, zipFile: JSZip) {
  const file = zipFile.file(filename);
  if (!file) {
    inject.error(`font not exist: >>>${filename}<<<`);
    return;
  }
  const ab = await file.async('arraybuffer');
  font.registerAb(ab);
}

async function readNetFont(url: string, postscriptName: string) {
  if (font.hasRegister(postscriptName)) {
    return;
  }
  return new Promise<void>((resolve, reject) => {
    fetch(url).then((res) => res.arrayBuffer()).then(ab => {
      font.registerAb(ab);
      resolve();
    }).catch(() => {
      reject();
    });
  });
}

function getBlendMode(blend: SketchFormat.BlendMode = SketchFormat.BlendMode.Normal) {
  let blendMode = 'normal';
  if (blend === SketchFormat.BlendMode.Darken) {
    blendMode = 'darken';
  }
  else if (blend === SketchFormat.BlendMode.Multiply) {
    blendMode = 'multiply';
  }
  else if (blend === SketchFormat.BlendMode.ColorBurn) {
    blendMode = 'color-burn';
  }
  else if (blend === SketchFormat.BlendMode.Lighten) {
    blendMode = 'lighten';
  }
  else if (blend === SketchFormat.BlendMode.Screen) {
    blendMode = 'screen';
  }
  else if (blend === SketchFormat.BlendMode.ColorDodge) {
    blendMode = 'color-dodge';
  }
  else if (blend === SketchFormat.BlendMode.Overlay) {
    blendMode = 'overlay';
  }
  else if (blend === SketchFormat.BlendMode.SoftLight) {
    blendMode = 'soft-light';
  }
  else if (blend === SketchFormat.BlendMode.HardLight) {
    blendMode = 'hard-light';
  }
  else if (blend === SketchFormat.BlendMode.Difference) {
    blendMode = 'difference';
  }
  else if (blend === SketchFormat.BlendMode.Exclusion) {
    blendMode = 'exclusion';
  }
  else if (blend === SketchFormat.BlendMode.Hue) {
    blendMode = 'hue';
  }
  else if (blend === SketchFormat.BlendMode.Saturation) {
    blendMode = 'saturation';
  }
  else if (blend === SketchFormat.BlendMode.Color) {
    blendMode = 'color';
  }
  else if (blend === SketchFormat.BlendMode.Luminosity) {
    blendMode = 'luminosity';
  }
  else if (blend === SketchFormat.BlendMode.PlusDarker) {
    // blendMode = 'plus-darker';
  }
  else if (blend === SketchFormat.BlendMode.PlusLighter) {
    // blendMode = 'plus-lighter';
  }
  return blendMode;
}

export function toSketchColor(color: number[], obj?: SketchFormat.Color): SketchFormat.Color {
  if (obj) {
    obj.alpha = color[3];
    obj.red = color[0] / 255;
    obj.green = color[1] / 255;
    obj.blue = color[2] / 255;
    return obj;
  }
  return {
    _class: 'color',
    alpha: color[3],
    red: color[0] / 255,
    green: color[1] / 255,
    blue: color[2] / 255,
  };
}
