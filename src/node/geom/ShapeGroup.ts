import { Props } from '../../format';
import bezier from '../../math/bezier';
import bo from '../../math/bo';
import { toPrecision } from '../../math/geom';
import { isE } from '../../math/matrix';
import CanvasCache from '../../refresh/CanvasCache';
import config from '../../refresh/config';
import { canvasPolygon, svgPolygon } from '../../refresh/paint';
import { color2rgbaStr } from '../../style/css';
import {
  BOOLEAN_OPERATION,
  FILL_RULE,
  GRADIENT,
  STROKE_LINE_CAP,
  STROKE_LINE_JOIN,
  STROKE_POSITION,
} from '../../style/define';
import { getLinear, getRadial } from '../../style/gradient';
import inject, { OffScreen } from '../../util/inject';
import Group from '../Group';
import { LayoutData } from '../layout';
import Polyline from './Polyline';

function applyMatrixPoints(points: Array<Array<number>>, m: Float64Array) {
  if (m && !isE(m)) {
    const a1 = m[0],
      b1 = m[1];
    const a2 = m[4],
      b2 = m[5];
    const a4 = m[12],
      b4 = m[13];
    return points.map((item) => {
      const c1 =
        (a1 === 1 ? item[0] : item[0] * a1) + (a2 ? item[1] * a2 : 0) + a4;
      const c2 =
        (b1 === 1 ? item[0] : item[0] * b1) + (b2 ? item[1] * b2 : 0) + b4;
      if (item.length === 4 || item.length === 6) {
        const c3 =
          (a1 === 1 ? item[2] : item[2] * a1) + (a2 ? item[3] * a2 : 0) + a4;
        const c4 =
          (b1 === 1 ? item[2] : item[2] * b1) + (b2 ? item[3] * b2 : 0) + b4;
        if (item.length === 6) {
          const c5 =
            (a1 === 1 ? item[4] : item[4] * a1) + (a2 ? item[5] * a2 : 0) + a4;
          const c6 =
            (b1 === 1 ? item[4] : item[4] * b1) + (b2 ? item[5] * b2 : 0) + b4;
          return [
            toPrecision(c1),
            toPrecision(c2),
            toPrecision(c3),
            toPrecision(c4),
            toPrecision(c5),
            toPrecision(c6),
          ];
        }
        return [
          toPrecision(c1),
          toPrecision(c2),
          toPrecision(c3),
          toPrecision(c4),
        ];
      } else {
        return [toPrecision(c1), toPrecision(c2)];
      }
    });
  }
  return points.map((item) => item.slice(0));
}

class ShapeGroup extends Group {
  points?: Array<Array<Array<number>>>;

  constructor(props: Props, children: Array<Polyline | ShapeGroup>) {
    super(props, children);
    this.isShapeGroup = true;
  }

  override lay(data: LayoutData) {
    super.lay(data);
    this.points = undefined;
  }

  override calContent(): boolean {
    this.buildPoints();
    return (this.hasContent = !!this.points && !!this.points.length);
  }

  buildPoints() {
    if (this.points) {
      return;
    }
    this.textureOutline?.release();
    const { children } = this;
    let res: Array<Array<Array<number>>> = [];
    for (let i = 0, len = children.length; i < len; i++) {
      const item = children[i] as Polyline | ShapeGroup;
      item.buildPoints();
      const { points, matrix } = item;
      if (points && points.length) {
        // 点要考虑matrix变换，因为是shapeGroup的直接子节点，位置可能不一样
        let p: Array<Array<Array<number>>>;
        if (item instanceof ShapeGroup) {
          p = points.map((item) =>
            applyMatrixPoints(item as number[][], matrix),
          );
        } else {
          p = [applyMatrixPoints(points as number[][], matrix)];
        }
        const booleanOperation = item.computedStyle.booleanOperation;
        if (i === 0 || !booleanOperation) {
          res = res.concat(p);
        } else {
          // TODO 连续多个bo运算中间产物优化
          if (booleanOperation === BOOLEAN_OPERATION.INTERSECT) {
            const t = bo.intersect(res, p) as number[][][];
            res = t || [];
          } else if (booleanOperation === BOOLEAN_OPERATION.UNION) {
            // p中可能是条直线，不能用多边形求，直接合并，将非直线提取出来进行求，直线则单独处理
            const pp: Array<Array<Array<number>>> = [],
              pl: Array<Array<Array<number>>> = [];
            p.forEach((item) => {
              if (item.length <= 2) {
                pl.push(item);
              } else {
                pp.push(item);
              }
            });
            if (pp.length) {
              const t = bo.union(res, pp) as number[][][];
              res = t || [];
            }
            if (pl.length) {
              res = res.concat(pl);
            }
          } else if (booleanOperation === BOOLEAN_OPERATION.SUBTRACT) {
            const t = bo.subtract(res, p) as number[][][];
            res = t || [];
          } else if (booleanOperation === BOOLEAN_OPERATION.XOR) {
            const t = bo.xor(res, p) as number[][][];
            res = t || [];
          }
        }
      }
    }
    this.points = res;
  }

  override renderCanvas(scale: number) {
    super.renderCanvas(scale);
    this.buildPoints();
    const points = this.points!;
    const bbox = this._rect || this.rect;
    const x = bbox[0],
      y = bbox[1],
      w = bbox[2] - x,
      h = bbox[3] - y;
    // 暂时这样防止超限，TODO 超大尺寸
    while (
      w * scale > config.MAX_TEXTURE_SIZE ||
      h * scale > config.MAX_TEXTURE_SIZE
      ) {
      if (scale <= 1) {
        break;
      }
      scale = scale >> 1;
    }
    if (
      w * scale > config.MAX_TEXTURE_SIZE ||
      h * scale > config.MAX_TEXTURE_SIZE
    ) {
      return;
    }
    const dx = -x * scale,
      dy = -y * scale;
    const canvasCache = (this.canvasCache = CanvasCache.getInstance(
      w * scale,
      h * scale,
      dx,
      dy,
    ));
    canvasCache.available = true;
    const ctx = canvasCache.offscreen.ctx;
    const {
      fill,
      fillEnable,
      fillRule,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
      strokeMiterlimit,
    } = this.computedStyle;
    if (scale !== 1) {
      ctx.setLineDash(strokeDasharray.map((i) => i * scale));
    } else {
      ctx.setLineDash(strokeDasharray);
    }
    ctx.setLineDash(strokeDasharray);
    // 先下层的fill
    for (let i = 0, len = fill.length; i < len; i++) {
      if (!fillEnable[i]) {
        continue;
      }
      const f = fill[i];
      if (Array.isArray(f)) {
        if (!f[3]) {
          continue;
        }
        ctx.fillStyle = color2rgbaStr(f);
      } else {
        if (f.t === GRADIENT.LINEAR) {
          const gd = getLinear(f.stops, f.d, -x, -y, this.width, this.height);
          const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
          gd.stop.forEach((item) => {
            lg.addColorStop(item[1]!, color2rgbaStr(item[0]));
          });
          ctx.fillStyle = lg;
        } else if (f.t === GRADIENT.RADIAL) {
          const gd = getRadial(f.stops, f.d, -x, -y, this.width, this.height);
          const rg = ctx.createRadialGradient(
            gd.cx,
            gd.cy,
            0,
            gd.cx,
            gd.cy,
            gd.total,
          );
          gd.stop.forEach((item) => {
            rg.addColorStop(item[1]!, color2rgbaStr(item[0]));
          });
          ctx.fillStyle = rg;
        }
      }
      points.forEach((item) => {
        canvasPolygon(ctx, item, scale, dx, dy);
        ctx.closePath();
      });
      ctx.fill(fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero');
    }
    // 线帽设置
    if (strokeLinecap === STROKE_LINE_CAP.ROUND) {
      ctx.lineCap = 'round';
    } else if (strokeLinecap === STROKE_LINE_CAP.SQUARE) {
      ctx.lineCap = 'square';
    } else {
      ctx.lineCap = 'butt';
    }
    if (strokeLinejoin === STROKE_LINE_JOIN.ROUND) {
      ctx.lineJoin = 'round';
    } else if (strokeLinejoin === STROKE_LINE_JOIN.BEVEL) {
      ctx.lineJoin = 'bevel';
    } else {
      ctx.lineJoin = 'miter';
    }
    ctx.miterLimit = strokeMiterlimit * scale;
    // 再上层的stroke
    for (let i = 0, len = stroke.length; i < len; i++) {
      if (!strokeEnable[i] || !strokeWidth[i]) {
        continue;
      }
      const s = stroke[i];
      if (Array.isArray(s)) {
        ctx.strokeStyle = color2rgbaStr(s);
        ctx.lineWidth = strokeWidth[i];
      } else {
        if (s.t === GRADIENT.LINEAR) {
          const gd = getLinear(s.stops, s.d, -x, -y, this.width, this.height);
          const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
          gd.stop.forEach((item) => {
            lg.addColorStop(item[1]!, color2rgbaStr(item[0]));
          });
          ctx.strokeStyle = lg;
        } else if (s.t === GRADIENT.RADIAL) {
          const gd = getRadial(s.stops, s.d, -x, -y, this.width, this.height);
          const rg = ctx.createRadialGradient(
            gd.cx,
            gd.cy,
            0,
            gd.cx,
            gd.cy,
            gd.total,
          );
          gd.stop.forEach((item) => {
            rg.addColorStop(item[1]!, color2rgbaStr(item[0]));
          });
          ctx.strokeStyle = rg;
        }
      }
      // 注意canvas只有居中描边，内部需用clip模拟，外部比较复杂需离屏擦除
      const p = strokePosition[i];
      let os: OffScreen | undefined, ctx2: CanvasRenderingContext2D | undefined;
      if (p === STROKE_POSITION.INSIDE) {
        ctx.lineWidth = strokeWidth[i] * 2 * scale;
        points.forEach((item) => {
          canvasPolygon(ctx, item, scale, dx, dy);
          ctx.closePath();
        });
      } else if (p === STROKE_POSITION.OUTSIDE) {
        os = inject.getOffscreenCanvas(w, h, 'outsideStroke');
        ctx2 = os.ctx;
        ctx2.setLineDash(strokeDasharray);
        ctx2.lineCap = ctx.lineCap;
        ctx2.lineJoin = ctx.lineJoin;
        ctx2.miterLimit = ctx.miterLimit * scale;
        ctx2.strokeStyle = ctx.strokeStyle;
        ctx2.lineWidth = strokeWidth[i] * 2 * scale;
        points.forEach((item) => {
          canvasPolygon(ctx2!, item, scale, dx, dy);
          ctx2!.closePath();
        });
      } else {
        ctx.lineWidth = strokeWidth[i] * scale;
        points.forEach((item) => {
          canvasPolygon(ctx, item, scale, dx, dy);
          ctx.closePath();
        });
      }
      if (ctx2) {
        ctx2.closePath();
      } else {
        ctx.closePath();
      }
      if (p === STROKE_POSITION.INSIDE) {
        ctx.save();
        ctx.clip();
        ctx.stroke();
        ctx.restore();
      } else if (p === STROKE_POSITION.OUTSIDE) {
        ctx2!.stroke();
        ctx2!.save();
        ctx2!.clip();
        ctx2!.globalCompositeOperation = 'destination-out';
        ctx2!.strokeStyle = '#FFF';
        ctx2!.stroke();
        ctx2!.restore();
        ctx.drawImage(os!.canvas, 0, 0);
        os!.release();
      } else {
        ctx.stroke();
      }
    }
  }

  toSvg(scale: number) {
    this.buildPoints();
    const computedStyle = this.computedStyle;
    const fillRule =
      computedStyle.fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero';
    let s = `<svg width="${this.width}" height="${this.height}">`;
    this.points!.forEach((item) => {
      const d = svgPolygon(item) + 'Z';
      const props = [
        ['d', d],
        ['fill', '#D8D8D8'],
        ['fill-rule', fillRule],
        ['stroke', '#979797'],
        ['stroke-width', (1 / scale).toString()],
      ];
      s += '<path';
      props.forEach((item) => {
        s += ' ' + item[0] + '="' + item[1] + '"';
      });
      s += '></path>';
    });
    return s + '</svg>';
  }

  override get bbox(): Float64Array {
    if (!this._bbox) {
      const bbox = (this._bbox = super.bbox);
      // 可能不存在
      this.buildPoints();
      const { strokeWidth, strokeEnable, strokePosition } = this.computedStyle;
      // 所有描边最大值，影响bbox，可能链接点会超过原本的线粗，先用4倍弥补
      let border = 0;
      strokeWidth.forEach((item, i) => {
        if (strokeEnable[i]) {
          if (strokePosition[i] === STROKE_POSITION.CENTER) {
            border = Math.max(border, item * 0.5 * 4);
          } else if (strokePosition[i] === STROKE_POSITION.INSIDE) {
            // 0
          } else if (strokePosition[i] === STROKE_POSITION.OUTSIDE) {
            border = Math.max(border, item * 4);
          }
        }
      });
      const points = this.points;
      if (points && points.length) {
        const first = points[0][0];
        let xa: number, ya: number;
        if (first.length === 4) {
          xa = first[2];
          ya = first[3];
        } else if (first.length === 6) {
          xa = first[4];
          ya = first[5];
        } else {
          xa = first[0];
          ya = first[1];
        }
        bbox[0] = Math.min(bbox[0], xa - border);
        bbox[1] = Math.min(bbox[1], ya - border);
        bbox[2] = Math.max(bbox[2], xa + border);
        bbox[3] = Math.max(bbox[3], ya + border);
        for (let i = 0, len = points.length; i < len; i++) {
          const item = points[i];
          for (let j = 0, len = item.length; j < len; j++) {
            if (!i && !j) {
              continue;
            }
            const item2 = item[j];
            if (!j) {
              if (item2.length === 4) {
                xa = item2[2];
                ya = item2[3];
              } else if (item2.length === 6) {
                xa = item2[4];
                ya = item2[5];
              } else {
                xa = item2[0];
                ya = item2[1];
              }
              bbox[0] = Math.min(bbox[0], xa - border);
              bbox[1] = Math.min(bbox[1], ya - border);
              bbox[2] = Math.max(bbox[2], xa + border);
              bbox[3] = Math.max(bbox[3], ya + border);
              continue;
            }
            let xb: number, yb: number;
            if (item2.length === 4) {
              xb = item2[2];
              yb = item2[3];
              const b = bezier.bboxBezier(xa, ya, item2[0], item2[1], xb, yb);
              bbox[0] = Math.min(bbox[0], b[0] - border);
              bbox[1] = Math.min(bbox[1], b[1] - border);
              bbox[2] = Math.max(bbox[2], b[2] + border);
              bbox[3] = Math.max(bbox[3], b[3] + border);
            } else if (item2.length === 6) {
              xb = item2[4];
              yb = item2[5];
              const b = bezier.bboxBezier(
                xa,
                ya,
                item2[0],
                item2[1],
                item2[2],
                item2[3],
                xb,
                yb,
              );
              bbox[0] = Math.min(bbox[0], b[0] - border);
              bbox[1] = Math.min(bbox[1], b[1] - border);
              bbox[2] = Math.max(bbox[2], b[2] + border);
              bbox[3] = Math.max(bbox[3], b[3] + border);
            } else {
              xb = item2[0];
              yb = item2[1];
              bbox[0] = Math.min(bbox[0], xb - border);
              bbox[1] = Math.min(bbox[1], yb - border);
              bbox[2] = Math.max(bbox[2], xb + border);
              bbox[3] = Math.max(bbox[3], yb + border);
            }
            xa = xb!;
            ya = yb!;
          }
        }
      }
    }
    return this._bbox;
  }
}

export default ShapeGroup;
