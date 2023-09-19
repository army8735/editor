import * as uuid from 'uuid';
import { BitmapProps, Override } from '../format';
import CanvasCache from '../refresh/CanvasCache';
import config from '../refresh/config';
import { RefreshLevel } from '../refresh/level';
import { canvasPolygon } from '../refresh/paint';
import TextureCache from '../refresh/TextureCache';
import { color2rgbaStr } from '../style/css';
import inject, { OffScreen } from '../util/inject';
import { isFunction } from '../util/type';
import { clone } from '../util/util';
import { LayoutData } from './layout';
import Node from './Node';
import {
  ComputedGradient,
  ComputedPattern,
  GRADIENT,
  MIX_BLEND_MODE,
  PATTERN_FILL_TYPE,
  STROKE_LINE_CAP,
  STROKE_LINE_JOIN,
  STROKE_POSITION,
} from '../style/define';
import { getConic, getLinear, getRadial } from '../style/gradient';
import { getCanvasGCO } from '../style/mbm';

type Loader = {
  error: boolean;
  loading: boolean;
  source?: HTMLImageElement;
  width: number;
  height: number;
};

class Bitmap extends Node {
  _src: string;
  loader: Loader;
  onlyImg: boolean;

  constructor(props: BitmapProps) {
    super(props);
    this.isBitmap = true;
    this.onlyImg = true;
    const src = (this._src = props.src || '');
    this.loader = {
      error: false,
      loading: false,
      width: 0,
      height: 0,
    };
    if (!src) {
      this.loader.error = true;
    } else {
      const isBlob = /^blob:/.test(src);
      if (isBlob) {
        // fetch('https://karas.alipay.com/api/uploadbase64', {
        //   method: 'post',
        //   headers: {
        //     Accept: 'application/json',
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     data: src,
        //     quality: 1,
        //   }),
        // }).then(res => res.json()).then(res => {
        //   if (res.success) {
        //     this.src = res.url;
        //   }
        // });
      }
      const cache = inject.IMG[src];
      if (!cache) {
        inject.measureImg(src, (res: any) => {
          // 可能会变更，所以加载完后对比下是不是当前最新的
          if (src === this._src) {
            if (res.success) {
              if (isFunction(props.onLoad)) {
                props.onLoad!();
              }
            } else {
              if (isFunction(props.onError)) {
                props.onError!();
              }
            }
          }
        });
      } else if (cache.state === inject.LOADED) {
        if (cache.success) {
          this.loader.source = cache.source;
          this.loader.width = cache.source.width;
          this.loader.height = cache.source.height;
        } else {
          this.loader.error = true;
        }
      }
    }
  }

  override lay(data: LayoutData) {
    super.lay(data);
    const src = this._src;
    const loader = this.loader;
    if (src) {
      const cache = inject.IMG[src];
      if (!cache || cache.state === inject.LOADING) {
        if (!loader.loading) {
          this.loadAndRefresh();
        }
      } else if (cache && cache.state === inject.LOADED) {
        loader.loading = false;
        if (cache.success) {
          this.loader.source = cache.source;
          this.loader.width = cache.width;
          this.loader.height = cache.height;
        } else {
          this.loader.error = true;
        }
      }
    }
  }

  private loadAndRefresh() {
    // 加载前先清空之前可能遗留的老数据
    const loader = this.loader;
    loader.source = undefined;
    loader.error = false;
    if (!this.isDestroyed) {
      // 先置空图片
      this.root!.addUpdate(
        this,
        [],
        RefreshLevel.REPAINT,
        false,
        false,
        undefined,
      );
      loader.loading = true;
      inject.measureImg(this._src, (data: any) => {
        // 还需判断url，防止重复加载时老的替换新的，失败走error绘制
        if (data.url === this._src) {
          loader.loading = false;
          if (data.success) {
            loader.error = false;
            loader.source = data.source;
            loader.width = data.width;
            loader.height = data.height;
            if (!this.isDestroyed) {
              this.root!.addUpdate(
                this,
                [],
                RefreshLevel.REPAINT,
                false,
                false,
                undefined,
              );
            }
          } else {
            loader.error = true;
          }
        }
      });
    }
  }

  override calContent(): boolean {
    const {
      fill,
      fillOpacity,
      fillEnable,
      stroke,
      strokeEnable,
      strokeWidth,
      innerShadow,
      innerShadowEnable,
    } = this.computedStyle;
    this.onlyImg = true;
    for (let i = 0, len = fill.length; i < len; i++) {
      if (!fillEnable[i] || !fillOpacity[i]) {
        continue;
      }
      this.onlyImg = false;
      break;
    }
    if (this.onlyImg) {
      for (let i = 0, len = stroke.length; i < len; i++) {
        if (!strokeEnable[i] || !strokeWidth[i]) {
          continue;
        }
        this.onlyImg = false;
        break;
      }
    }
    if (this.onlyImg) {
      for (let i = 0, len = innerShadow.length; i < len; i++) {
        if (!innerShadowEnable[i]) {
          continue;
        }
        this.onlyImg = false;
        break;
      }
    }
    return (this.hasContent = !!this.loader.source);
  }

  override renderCanvas(scale: number) {
    const { loader, computedStyle } = this;
    // 纯图片共用一个canvas的cache
    if (this.onlyImg) {
      this.canvasCache?.releaseImg(this._src);
      // 尺寸使用图片原始尺寸
      let w = loader.width,
        h = loader.height;
      if (w > config.MAX_TEXTURE_SIZE || h > config.MAX_TEXTURE_SIZE) {
        if (w > h) {
          w = config.MAX_TEXTURE_SIZE;
          h *= config.MAX_TEXTURE_SIZE / w;
        } else if (w < h) {
          h = config.MAX_TEXTURE_SIZE;
          w *= config.MAX_TEXTURE_SIZE / h;
        } else {
          w = h = config.MAX_TEXTURE_SIZE;
        }
      }
      const canvasCache = (this.canvasCache = CanvasCache.getImgInstance(
        w,
        h,
        this._src,
      ));
      canvasCache.available = true;
      const ctx = canvasCache.offscreen.ctx;
      // 第一张图像才绘制，图片解码到canvas上
      if (canvasCache.getCount(this._src) === 1) {
        ctx.drawImage(loader.source!, 0, 0);
      }
    }
    // 带fill/stroke/innerShadow的则不能共用一个canvas的cache
    else {
      super.renderCanvas(scale);
      const bbox = this._bbox || this.bbox;
      const x = bbox[0],
        y = bbox[1];
      let w = bbox[2] - x,
        h = bbox[3] - y;
      const rect = this._rect || this.rect;
      let iw = rect[2] - rect[0],
        ih = rect[3] - rect[1];
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
      w *= scale;
      h *= scale;
      iw *= scale;
      ih *= scale;
      const canvasCache = (this.canvasCache = CanvasCache.getInstance(w, h));
      canvasCache.available = true;
      const ctx = canvasCache.offscreen.ctx;
      ctx.drawImage(loader.source!, dx, dy, iw, ih);
      const {
        fill,
        fillOpacity,
        fillEnable,
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
        innerShadow,
        innerShadowEnable,
      } = computedStyle;
      if (scale !== 1) {
        ctx.setLineDash(strokeDasharray.map((i) => i * scale));
      } else {
        ctx.setLineDash(strokeDasharray);
      }
      const points = [
        [0, 0],
        [iw / scale, 0],
        [iw / scale, ih / scale],
        [0, ih / scale],
        [0, 0],
      ];
      ctx.beginPath();
      canvasPolygon(ctx, points, scale, dx, dy);
      ctx.closePath();
      /**
       * 图像的fill很特殊，填充和原始图片呈混合，类似mask的效果，这时用source-atop，
       * fill便能只显示和底层位图重合的地方；
       * 如果再算上fillMode，会同时出现2个混合，需借助离屏来完成，离屏先绘制fill，
       * 再用destination-atop画底层位图，主画布修改gco为fillMode即可
       */
      // 先下层的fill
      for (let i = 0, len = fill.length; i < len; i++) {
        if (!fillEnable[i] || !fillOpacity[i]) {
          continue;
        }
        // 椭圆的径向渐变无法直接完成，用mask来模拟，即原本用纯色填充，然后离屏绘制渐变并用matrix模拟椭圆，再合并
        let ellipse: OffScreen | undefined;
        let f = fill[i];
        // fill的blend需用特殊离屏，因为canvas的gco只能设置单一，位图的fill需同时和底层做混合
        let blend: OffScreen | undefined;
        const mode = fillMode[i];
        if (mode !== MIX_BLEND_MODE.NORMAL) {
          blend = inject.getOffscreenCanvas(w, h);
        }
        ctx.globalAlpha = fillOpacity[i];
        if (Array.isArray(f)) {
          if (!f[3]) {
            continue;
          }
          ctx.fillStyle = color2rgbaStr(f);
        }
        // 非纯色
        else {
          // 图像填充
          if ((f as ComputedPattern).url) {
            f = f as ComputedPattern;
            const url = f.url;
            const img = inject.IMG[url];
            if (img && img.source) {
              // 离屏绘出fill图片，然后先在离屏上应用混合原始图像mask，再主画布应用mode
              const os = blend || inject.getOffscreenCanvas(w, h);
              const ctx2 = os.ctx;
              if (f.type === PATTERN_FILL_TYPE.TILE) {
                const ratio = f.scale ?? 1;
                for (let i = 0, len = Math.ceil(iw / scale / ratio / loader.width); i < len; i++) {
                  for (let j = 0, len = Math.ceil(ih / scale / ratio / loader.height); j < len; j++) {
                    ctx2.drawImage(
                      img.source!,
                      dx + i * img.width * scale * ratio,
                      dy + j * img.height * scale * ratio,
                      img.width * scale * ratio,
                      img.height * scale * ratio,
                    );
                  }
                }
              } else if (f.type === PATTERN_FILL_TYPE.FILL) {
                const sx = iw / img.width;
                const sy = ih / img.height;
                const sc = Math.max(sx, sy);
                const x = (img.width * sc - iw) * -0.5;
                const y = (img.height * sc - ih) * -0.5;
                ctx2.drawImage(img.source!, 0, 0, img.width, img.height,
                  x + dx, y + dy, img.width * sc, img.height * sc);
              } else if (f.type === PATTERN_FILL_TYPE.STRETCH) {
                ctx2.drawImage(img.source!, dx, dy, iw, ih);
              } else if (f.type === PATTERN_FILL_TYPE.FIT) {
                const sx = iw / img.width;
                const sy = ih / img.height;
                const sc = Math.min(sx, sy);
                const x = (img.width * sc - iw) * -0.5;
                const y = (img.height * sc - ih) * -0.5;
                ctx2.drawImage(img.source!, 0, 0, img.width, img.height,
                  x + dx, y + dy, img.width * sc, img.height * sc);
              }
              // 离屏上以主画布作为mask保留相同部分
              ctx2.globalCompositeOperation = 'destination-atop';
              ctx2.drawImage(canvasCache.offscreen.canvas, 0, 0);
              // 记得还原
              if (mode !== MIX_BLEND_MODE.NORMAL) {
                ctx.globalCompositeOperation = getCanvasGCO(mode);
              }
              ctx.drawImage(os.canvas, 0, 0);
              if (mode !== MIX_BLEND_MODE.NORMAL) {
                ctx.globalCompositeOperation = 'source-atop';
              }
              os.release();
            }
            // 只需加载刷新
            else {
              inject.measureImg(url, (data: any) => {
                // 可能会变或者删除，判断一致
                if (url === (fill[i] as ComputedPattern)?.url) {
                  if (data.success && !this.isDestroyed) {
                    this.root!.addUpdate(
                      this,
                      [],
                      RefreshLevel.REPAINT,
                      false,
                      false,
                      undefined,
                    );
                  }
                }
              });
            }
            continue;
          }
          // 渐变
          else {
            f = f as ComputedGradient;
            if (f.t === GRADIENT.LINEAR) {
              const gd = getLinear(f.stops, f.d, dx, dy, w - dx * 2, h - dy * 2);
              const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
              gd.stop.forEach((item) => {
                lg.addColorStop(item.offset!, color2rgbaStr(item.color));
              });
              ctx.fillStyle = lg;
            } else if (f.t === GRADIENT.RADIAL) {
              const gd = getRadial(f.stops, f.d, dx, dy, w - dx * 2, h - dy * 2);
              const rg = ctx.createRadialGradient(
                gd.cx,
                gd.cy,
                0,
                gd.cx,
                gd.cy,
                gd.total,
              );
              gd.stop.forEach((item) => {
                rg.addColorStop(item.offset!, color2rgbaStr(item.color));
              });
              // 椭圆渐变，由于有缩放，用clip确定绘制范围，然后缩放长短轴绘制椭圆
              const m = gd.matrix;
              if (m) {
                ellipse = inject.getOffscreenCanvas(w, h);
                const ctx2 = ellipse.ctx;
                ctx2.beginPath();
                canvasPolygon(ctx2, points, scale, dx, dy);
                ctx2.closePath();
                ctx2.clip();
                ctx2.fillStyle = rg;
                ctx2.setTransform(m[0], m[1], m[4], m[5], m[12], m[13]);
                ctx2.fill();
              } else {
                ctx.fillStyle = rg;
              }
            } else if (f.t === GRADIENT.CONIC) {
              const gd = getConic(f.stops, f.d, dx, dy, w - dx * 2, h - dy * 2);
              const cg = ctx.createConicGradient(gd.angle, gd.cx, gd.cy);
              gd.stop.forEach((item) => {
                cg.addColorStop(item.offset!, color2rgbaStr(item.color));
              });
              ctx.fillStyle = cg;
            }
          }
        }
        if (ellipse) {
          if (blend) {
            const ctx2 = blend.ctx;
            ctx2.drawImage(ellipse.canvas, 0, 0);
            // 类似mask的混合保留和位图重合的地方
            ctx2.globalCompositeOperation = 'destination-atop';
            ctx2.drawImage(canvasCache.offscreen.canvas, 0, 0);
            // 主画布应用fillMode
            ctx.globalCompositeOperation = getCanvasGCO(mode);
            ctx.drawImage(blend.canvas, 0, 0);
            blend.release();
          } else {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.drawImage(ellipse.canvas, 0, 0);
          }
          ellipse.release();
        }
        // 矩形区域无需考虑fillRule
        else {
          if (blend) {
            const ctx2 = blend.ctx;
            ctx2.fillStyle = ctx.fillStyle;
            // 画出满屏fill
            ctx2.beginPath();
            canvasPolygon(ctx2, points, scale, dx, dy);
            ctx2.closePath();
            ctx2.fill();
            // 类似mask的混合保留和位图重合的地方
            ctx2.globalCompositeOperation = 'destination-atop';
            ctx2.drawImage(canvasCache.offscreen.canvas, 0, 0);
            // 主画布应用fillMode
            ctx.globalCompositeOperation = getCanvasGCO(mode);
            ctx.drawImage(blend.canvas, 0, 0);
            blend.release();
          } else {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fill();
          }
        }
      }
      // fill有opacity和mode，设置记得还原
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-atop';
      // 内阴影使用canvas的能力
      if (innerShadow && innerShadow.length) {
        // 计算取偏移+spread最大值后再加上blur半径，这个尺寸扩展用以生成shadow的必要宽度
        let n = 0;
        innerShadow.forEach((item, i) => {
          if (!innerShadowEnable[i]) {
            return;
          }
          const m = Math.max(Math.abs(item.x), Math.abs(item.y)) + item.spread;
          n = Math.max(n, m + item.blur);
        });
        ctx.save();
        ctx.beginPath();
        canvasPolygon(ctx, points, 1, 0, 0);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = '#FFF';
        // 在原本图形基础上，外围扩大n画个边框，这样奇偶使得填充在clip范围外不会显示出来，但shadow却在内可以显示
        ctx.beginPath();
        canvasPolygon(ctx, points, 1, 0, 0);
        canvasPolygon(
          ctx,
          [
            [-n, -n],
            [w + n, -n],
            [w + n, h + n],
            [-n, h + n],
            [-n, -n],
          ],
          1,
          0,
          0,
        );
        ctx.closePath();
        innerShadow.forEach((item, i) => {
          if (!innerShadowEnable[i]) {
            return;
          }
          ctx.shadowOffsetX = item.x;
          ctx.shadowOffsetY = item.y;
          ctx.shadowColor = color2rgbaStr(item.color);
          ctx.shadowBlur = item.blur;
          ctx.fill('evenodd');
        });
        ctx.restore();
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
        const p = strokePosition[i];
        ctx.globalCompositeOperation = getCanvasGCO(strokeMode[i]);
        // 颜色
        if (Array.isArray(s)) {
          ctx.strokeStyle = color2rgbaStr(s);
        }
        // 或者渐变
        else {
          if (s.t === GRADIENT.LINEAR) {
            const gd = getLinear(s.stops, s.d, dx, dy, w - dx * 2, h - dy * 2);
            const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
            gd.stop.forEach((item) => {
              lg.addColorStop(item.offset!, color2rgbaStr(item.color));
            });
            ctx.strokeStyle = lg;
          } else if (s.t === GRADIENT.RADIAL) {
            const gd = getRadial(s.stops, s.d, dx, dy, w - dx * 2, h - dy * 2);
            const rg = ctx.createRadialGradient(
              gd.cx,
              gd.cy,
              0,
              gd.cx,
              gd.cy,
              gd.total,
            );
            gd.stop.forEach((item) => {
              rg.addColorStop(item.offset!, color2rgbaStr(item.color));
            });
            // 椭圆渐变，由于有缩放，先离屏绘制白色stroke记a，再绘制变换的结果整屏fill记b，b混合到a上用source-in即可只显示重合的b
            const m = gd.matrix;
            if (m) {
              const ellipse = inject.getOffscreenCanvas(w, h);
              const ctx2 = ellipse.ctx;
              ctx2.setLineDash(ctx.getLineDash());
              ctx2.lineCap = ctx.lineCap;
              ctx2.lineJoin = ctx.lineJoin;
              ctx2.miterLimit = ctx.miterLimit * scale;
              ctx2.lineWidth = strokeWidth[i] * scale;
              ctx2.strokeStyle = '#FFF';
              ctx2.beginPath();
              canvasPolygon(ctx2, points, scale, dx, dy);
              ctx2.closePath();
              if (p === STROKE_POSITION.INSIDE) {
                ctx2.lineWidth = strokeWidth[i] * 2 * scale;
                ctx2.save();
                ctx2.clip();
                ctx2.stroke();
                ctx2.restore();
              } else if (p === STROKE_POSITION.OUTSIDE) {
                ctx2.lineWidth = strokeWidth[i] * 2 * scale;
                ctx2.stroke();
                ctx2.save();
                ctx2.clip();
                ctx2.globalCompositeOperation = 'destination-out';
                ctx2.strokeStyle = '#FFF';
                ctx2.stroke();
                ctx2.restore();
              } else {
                ctx2.stroke();
              }
              ctx2.fillStyle = rg;
              ctx2.globalCompositeOperation = 'source-in';
              ctx2.setTransform(m[0], m[1], m[4], m[5], m[12], m[13]);
              ctx2.fillRect(0, 0, w, h);
              ctx.drawImage(ellipse.canvas, 0, 0);
              ellipse.release();
              continue;
            } else {
              ctx.strokeStyle = rg;
            }
          } else if (s.t === GRADIENT.CONIC) {
            const gd = getConic(s.stops, s.d, dx, dy, w - dx * 2, h - dy * 2);
            const cg = ctx.createConicGradient(gd.angle, gd.cx, gd.cy);
            gd.stop.forEach((item) => {
              cg.addColorStop(item.offset!, color2rgbaStr(item.color));
            });
            ctx.strokeStyle = cg;
          }
        }
        // 注意canvas只有居中描边，内部需用clip模拟，外部比较复杂需离屏擦除
        let os: OffScreen | undefined, ctx2: CanvasRenderingContext2D | undefined;
        if (p === STROKE_POSITION.INSIDE) {
          ctx.lineWidth = strokeWidth[i] * 2 * scale;
        } else if (p === STROKE_POSITION.OUTSIDE) {
          os = inject.getOffscreenCanvas(w, h);
          ctx2 = os.ctx;
          ctx2.setLineDash(ctx.getLineDash());
          ctx2.lineCap = ctx.lineCap;
          ctx2.lineJoin = ctx.lineJoin;
          ctx2.miterLimit = ctx.miterLimit * scale;
          ctx2.strokeStyle = ctx.strokeStyle;
          ctx2.lineWidth = strokeWidth[i] * 2 * scale;
          ctx2.beginPath();
          canvasPolygon(ctx2, points, scale, dx, dy);
        } else {
          ctx.lineWidth = strokeWidth[i] * scale;
        }
        if (ctx2) {
          ctx2.closePath();
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
      // 还原
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  override genTexture(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    scale: number,
    scaleIndex: number,
  ) {
    if (!this.loader.source) {
      return;
    }
    if (this.onlyImg) {
      // 注意图片共享一个实例
      const target = this.textureCache[0];
      if (target && target.available) {
        this.textureCache[scaleIndex] = this.textureTarget[scaleIndex] = target;
        return;
      }
      this.renderCanvas(scale);
      const canvasCache = this.canvasCache;
      if (canvasCache?.available) {
        this.textureCache[scaleIndex] =
          this.textureTarget[scaleIndex] =
            this.textureCache[0] =
              TextureCache.getImgInstance(
                gl,
                canvasCache.offscreen.canvas,
                this._src,
                (this._rect || this.rect).slice(0),
              );
        canvasCache.releaseImg(this._src);
      }
    } else {
      super.genTexture(gl, scale, scaleIndex);
    }
  }

  override clearCache(includeSelf = false) {
    if (this.onlyImg) {
      if (includeSelf) {
        this.textureCache.forEach((item) => item?.releaseImg(this._src));
      }
      this.textureTarget.splice(0);
      // total是本身无需
      this.textureFilter.forEach((item) => item?.release());
      this.textureMask.forEach((item) => item?.release());
    } else {
      super.clearCache(includeSelf);
    }
  }

  override clone(override?: Record<string, Override>) {
    const props = clone(this.props);
    props.uuid = uuid.v4();
    props.src = this._src;
    const res = new Bitmap(props);
    res.style = clone(this.style);
    return res;
  }

  get src() {
    return this._src;
  }

  set src(v: string) {
    if (this._src === v) {
      return;
    }
    this._src = v;
    this.loadAndRefresh();
  }
}

export default Bitmap;
