import { getRoots, pointSlope2General, twoPoint2General } from './equation';

/**
 * 二阶贝塞尔曲线范围框
 * @param x0
 * @param y0
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @returns {number[]}
 * https://www.iquilezles.org/www/articles/bezierbbox/bezierbbox.htm
 */
function bboxBezier2(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
  let minX = Math.min(x0, x2);
  let minY = Math.min(y0, y2);
  let maxX = Math.max(x0, x2);
  let maxY = Math.max(y0, y2);
  // 控制点位于边界内部时，边界就是范围框，否则计算导数获取极值
  if (x1 < minX || y1 < minY || x1 > maxX || y1 > maxY) {
    let tx = (x0 - x1) / (x0 - 2 * x1 + x2);
    if (isNaN(tx) || tx < 0) {
      tx = 0;
    }
    else if (tx > 1) {
      tx = 1;
    }
    let ty = (y0 - y1) / (y0 - 2 * y1 + y2);
    if (isNaN(ty) || ty < 0) {
      ty = 0;
    }
    else if (ty > 1) {
      ty = 1;
    }
    const sx = 1 - tx;
    const sy = 1 - ty;
    const qx = sx * sx * x0 + 2 * sx * tx * x1 + tx * tx * x2;
    const qy = sy * sy * y0 + 2 * sy * ty * y1 + ty * ty * y2;
    minX = Math.min(minX, qx);
    minY = Math.min(minY, qy);
    maxX = Math.max(maxX, qx);
    maxY = Math.max(maxY, qy);
  }
  return [minX, minY, maxX, maxY];
}

/**
 * 同上三阶的
 */
function bboxBezier3(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
  let minX = Math.min(x0, x3);
  let minY = Math.min(y0, y3);
  let maxX = Math.max(x0, x3);
  let maxY = Math.max(y0, y3);
  if (x1 < minX || y1 < minY || x1 > maxX || y1 > maxY || x2 < minX || y2 < minY || x2 > maxX || y2 > maxY) {
    const cx = -x0 + x1;
    const cy = -y0 + y1;
    const bx = x0 - 2 * x1 + x2;
    const by = y0 - 2 * y1 + y2;
    const ax = -x0 + 3 * x1 - 3 * x2 + x3;
    const ay = -y0 + 3 * y1 - 3 * y2 + y3;
    let hx = bx * bx - ax * cx;
    let hy = by * by - ay * cy;
    if (hx > 0) {
      hx = Math.sqrt(hx);
      let t = (-bx - hx) / ax;
      // 2次项系数为0注意降级为一元一次方程
      if (ax && t > 0 && t < 1) {
        const s = 1 - t;
        const q = s * s * s * x0 + 3 * s * s * t * x1 + 3 * s * t * t * x2 + t * t * t * x3;
        minX = Math.min(minX, q);
        maxX = Math.max(maxX, q);
      }
      t = ax ? ((-bx + hx) / ax) : (-cx * 0.5 / bx);
      if (t > 0 && t < 1) {
        const s = 1 - t;
        const q = s * s * s * x0 + 3 * s * s * t * x1 + 3 * s * t * t * x2 + t * t * t * x3;
        minX = Math.min(minX, q);
        maxX = Math.max(maxX, q);
      }
    }
    if (hy > 0) {
      hy = Math.sqrt(hy);
      let t = (-by - hy) / ay;
      if (ay && t > 0 && t < 1) {
        const s = 1 - t;
        const q = s * s * s * y0 + 3 * s * s * t * y1 + 3 * s * t * t * y2 + t * t * t * y3;
        minY = Math.min(minY, q);
        maxY = Math.max(maxY, q);
      }
      t = ay ? ((-by + hy) / ay) : (-cy * 0.5 / by);
      if (t > 0 && t < 1) {
        const s = 1 - t;
        const q = s * s * s * y0 + 3 * s * s * t * y1 + 3 * s * t * t * y2 + t * t * t * y3;
        minY = Math.min(minY, q);
        maxY = Math.max(maxY, q);
      }
    }
  }
  return [minX, minY, maxX, maxY];
}

export function bboxBezier(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number,
                           x3?: number, y3?: number) {
  const len = arguments.length;
  if (len === 4) {
    const a = Math.min(x0, x1);
    const b = Math.min(y0, y1);
    const c = Math.max(x0, x1);
    const d = Math.max(y0, y1);
    return [a, b, c, d];
  }
  if (len === 6) {
    return bboxBezier2(x0, y0, x1, y1, x2, y2);
  }
  if (len === 8) {
    return bboxBezier3(x0, y0, x1, y1, x2, y2, x3!, y3!);
  }
  throw new Error('Unsupported order');
}

/**
 * 范数 or 模
 */
export function norm(v: Array<number>) {
  const order = v.length;
  const sum = v.reduce((a, b) => Math.pow(a, order) + Math.pow(b, order));
  return Math.pow(sum, 1 / order);
}

// https://zhuanlan.zhihu.com/p/130247362
function simpson38(derivativeFunc: (n: number) => number, l: number, r: number) {
  const f = derivativeFunc;
  const middleL = (2 * l + r) / 3;
  const middleR = (l + 2 * r) / 3;
  return (f(l) + 3 * f(middleL) + 3 * f(middleR) + f(r)) * (r - l) / 8;
}

/**
 * bezier 曲线的长度
 * @param derivativeFunc 微分函数
 * @param l 左点
 * @param r 右点
 * @param eps 精度
 * @return {*} number
 */
function adaptiveSimpson38(derivativeFunc: (n: number) => number, l: number, r: number, eps = 0.001): number {
  const f = derivativeFunc;
  const mid = (l + r) / 2;
  const st = simpson38(f, l, r);
  const sl = simpson38(f, l, mid);
  const sr = simpson38(f, mid, r);
  const ans = sl + sr - st;
  if (Math.abs(ans) <= 15 * eps) {
    return sl + sr + ans / 15;
  }
  return adaptiveSimpson38(f, l, mid, eps / 2) + adaptiveSimpson38(f, mid, r, eps / 2);
}

/**
 * bezier 曲线的长度
 * @param points 曲线的起止点 和 控制点
 * @param startT 计算长度的起点，满足 0 <= startT <= endT <= 1
 * @param endT 计算长度的终点
 * @return {*} number
 */
export function bezierLength(points: Array<{ x: number, y: number }>, startT = 0, endT = 1) {
  if (points.length === 2) {
    const { x: x0, y: y0 } = points[0];
    const { x: x1, y: y1 } = points[1];
    return Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
  }
  if (points.length > 4) {
    throw new Error('Unsupported order');
  }
  const derivativeFunc = (t: number) => {
    const r = bezierAt(t, points);
    return norm([r.x, r.y]);
  };
  return adaptiveSimpson38(derivativeFunc, startT, endT);
}

/**
 * 3 阶 bezier 曲线的 order 阶导数在 t 位置时候的 (x, y) 的值
 */
function bezierAt3(t: number, points: Array<{ x: number, y: number }>, order = 1) {
  const { x: x0, y: y0 } = points[0];
  const { x: x1, y: y1 } = points[1];
  const { x: x2, y: y2 } = points[2];
  const { x: x3, y: y3 } = points[3];
  let x = 0;
  let y = 0;
  // 3阶导数就是常数了，大于3阶的都是0
  if (order === 0) {
    x = Math.pow((1 - t), 3) * x0 + 3 * t * Math.pow((1 - t), 2) * x1 + 3 * (1 - t) * Math.pow(t, 2) * x2 + Math.pow(t, 3) * x3;
    y = Math.pow((1 - t), 3) * y0 + 3 * t * Math.pow((1 - t), 2) * y1 + 3 * (1 - t) * Math.pow(t, 2) * y2 + Math.pow(t, 3) * y3;
  }
  else if (order === 1) {
    x = 3 * ((1 - t) * (1 - t) * (x1 - x0) + 2 * (1 - t) * t * (x2 - x1) + t * t * (x3 - x2));
    y = 3 * ((1 - t) * (1 - t) * (y1 - y0) + 2 * (1 - t) * t * (y2 - y1) + t * t * (y3 - y2));
  }
  else if (order === 2) {
    x = 6 * (x2 - 2 * x1 + x0) * (1 - t) + 6 * (x3 - 2 * x2 + x1) * t;
    y = 6 * (y2 - 2 * y1 + y0) * (1 - t) + 6 * (y3 - 2 * y2 + y1) * t;
  }
  else if (order === 3) {
    x = 6 * (x3 - 3 * x2 + 3 * x1 - x0);
    y = 6 * (y3 - 3 * y2 + 3 * y1 - y0);
  }
  return { x, y };
}

/**
 * 2 阶 bezier 曲线的 order 阶导数在 t 位置时候的 (x, y) 的值
 */
function bezierAt2(t: number, points: Array<{ x: number, y: number }>, order = 1) {
  const { x: x0, y: y0 } = points[0];
  const { x: x1, y: y1 } = points[1];
  const { x: x2, y: y2 } = points[2];
  let x = 0;
  let y = 0;
  if (order === 0) {
    x = Math.pow((1 - t), 2) * x0 + 2 * t * (1 - t) * x1 + Math.pow(t, 2) * x2;
    y = Math.pow((1 - t), 2) * y0 + 2 * t * (1 - t) * y1 + Math.pow(t, 2) * y2;
  }
  else if (order === 1) {
    x = 2 * (1 - t) * (x1 - x0) + 2 * t * (x2 - x1);
    y = 2 * (1 - t) * (y1 - y0) + 2 * t * (y2 - y1);
  }
  else if (order === 2) {
    x = 2 * (x2 - 2 * x1 + x0);
    y = 2 * (y2 - 2 * y1 + y0);
  }
  return { x, y };
}

export function bezierAt(t: number, points: Array<{ x: number, y: number }>, derivativeOrder = 1) {
  if (points.length === 4) {
    return bezierAt3(t, points, derivativeOrder);
  }
  else if (points.length === 3) {
    return bezierAt2(t, points, derivativeOrder);
  }
  else {
    throw new Error('Unsupported order')
  }
}

export function sliceBezier(points: Array<{ x: number, y: number }>, t: number) {
  if (!Array.isArray(points) || points.length < 3) {
    return points;
  }
  const { x: x1, y: y1 } = points[0];
  const { x: x2, y: y2 } = points[1];
  const { x: x3, y: y3 } = points[2];
  const x12 = (x2 - x1) * t + x1;
  const y12 = (y2 - y1) * t + y1;
  const x23 = (x3 - x2) * t + x2;
  const y23 = (y3 - y2) * t + y2;
  const x123 = (x23 - x12) * t + x12;
  const y123 = (y23 - y12) * t + y12;
  if (points.length === 4) {
    const { x: x4, y: y4 } = points[3];
    const x34 = (x4 - x3) * t + x3;
    const y34 = (y4 - y3) * t + y3;
    const x234 = (x34 - x23) * t + x23;
    const y234 = (y34 - y23) * t + y23;
    const x1234 = (x234 - x123) * t + x123;
    const y1234 = (y234 - y123) * t + y123;
    return [
      { x: x1, y: y1 },
      { x: x12, y: y12 },
      { x: x123, y: y123 },
      { x: x1234, y: y1234 },
    ];
  }
  else if (points.length === 3) {
    return [
      { x: x1, y: y1 },
      { x: x12, y: y12 },
      { x: x123, y: y123 },
    ];
  }
  else {
    throw new Error('Unsupported order');
  }
}

export function sliceBezier2Both(points: Array<{ x: number, y: number }>, start = 0, end = 1) {
  if (!Array.isArray(points) || points.length < 3) {
    return points;
  }
  start = Math.max(start, 0);
  end = Math.min(end, 1);
  if (start === 0 && end === 1) {
    return points;
  }
  if (end < 1) {
    points = sliceBezier(points, end);
  }
  if (start > 0) {
    if (end < 1) {
      start = start / end;
    }
    points = sliceBezier(points.slice(0).reverse(), (1 - start)).reverse();
  }
  return points;
}

export function getPointByT(points: Array<{ x: number, y: number }>, t = 0) {
  if (t === 0) {
    return points[0];
  }
  if (t === 1) {
    return points[points.length - 1];
  }
  if (points.length === 4) {
    return pointByT3(points, t);
  }
  else if (points.length === 3) {
    return pointByT2(points, t);
  }
  else {
    throw new Error('Unsupported order');
  }
}

function pointByT2(points: Array<{ x: number, y: number }>, t: number) {
  const x = points[0].x * (1 - t) * (1 - t)
    + 2 * points[1].x * t * (1 - t)
    + points[2].x * t * t;
  const y = points[0].y * (1 - t) * (1 - t)
    + 2 * points[1].y * t * (1 - t)
    + points[2].y * t * t;
  return { x, y };
}

function pointByT3(points: Array<{ x: number, y: number }>, t: number) {
  const x = points[0].x * (1 - t) * (1 - t) * (1 - t)
    + 3 * points[1].x * t * (1 - t) * (1 - t)
    + 3 * points[2].x * t * t * (1 - t)
    + points[3].x * t * t * t;
  const y = points[0].y * (1 - t) * (1 - t) * (1 - t)
    + 3 * points[1].y * t * (1 - t) * (1 - t)
    + 3 * points[2].y * t * t * (1 - t)
    + points[3].y * t * t * t;
  return { x, y };
}


// 已知曲线和上面一点获得t
export function getPointT(points: Array<{ x: number, y: number }>, x: number, y: number) {
  if (points.length === 4) {
    return getPointT3(points, x, y);
  }
  else if (points.length === 3) {
    return getPointT2(points, x, y);
  }
  else {
    throw new Error('Unsupported order');
  }
}

function getPointT2(points: Array<{ x: number, y: number }>, x: number, y: number) {
  // x/y都需要求，以免其中一个无解，过滤掉[0, 1]之外的
  const tx = getRoots([
    points[0].x - x,
    2 * (points[1].x - points[0].x),
    points[2].x + points[0].x - 2 * points[1].x,
  ]).filter(i => i >= 0 && i <= 1);
  const ty = getRoots([
    points[0].y - y,
    2 * (points[1].y - points[0].y),
    points[2].y + points[0].y - 2 * points[1].y,
  ]).filter(i => i >= 0 && i <= 1);
  // 可能有多个解，x和y要匹配上，这里最多x和y各2个总共4个解
  let t = [];
  for (let i = 0, len = tx.length; i < len; i++) {
    const x = tx[i];
    for (let j = 0, len = ty.length; j < len; j++) {
      const y = ty[j];
      const diff = Math.abs(x - y);
      // 必须小于一定误差
      if (diff <= 1e-2) {
        t.push({
          x,
          y,
          diff,
        });
      }
    }
  }
  t.sort(function (a, b) {
    return a.diff - b.diff;
  });
  if (t.length > 2) {
    t.splice(2);
  }
  // 取均数
  t = t.map(item => (item.x + item.y) * 0.5);
  const res: Array<number> = [];
  t.forEach(t => {
    const xt = points[0].x * Math.pow(1 - t, 2)
      + 2 * points[1].x * t * (1 - t)
      + points[2].x * t * t;
    const yt = points[0].y * Math.pow(1 - t, 2)
      + 2 * points[1].y * t * (1 - t)
      + points[2].y * t * t;
    // 计算误差忽略
    if (Math.abs(xt - x) <= 1e-2 && Math.abs(yt - y) <= 1e-2) {
      res.push(t);
    }
  });
  return res;
}

function getPointT3(points: Array<{ x: number, y: number }>, x: number, y: number) {
  const tx = getRoots([
    points[0].x - x,
    3 * (points[1].x - points[0].x),
    3 * (points[2].x + points[0].x - 2 * points[1].x),
    points[3].x - points[0].x + 3 * points[1].x - 3 * points[2].x,
  ]).filter(i => i >= 0 && i <= 1);
  const ty = getRoots([
    points[0].y - y,
    3 * (points[1].y - points[0].y),
    3 * (points[2].y + points[0].y - 2 * points[1].y),
    points[3].y - points[0].y + 3 * points[1].y - 3 * points[2].y,
  ]).filter(i => i >= 0 && i <= 1);
  // 可能有多个解，x和y要匹配上，这里最多x和y各3个总共9个解
  let t = [];
  for (let i = 0, len = tx.length; i < len; i++) {
    const x = tx[i];
    for (let j = 0, len = ty.length; j < len; j++) {
      const y = ty[j];
      const diff = Math.abs(x - y);
      // 必须小于一定误差
      if (diff <= 1e-2) {
        t.push({
          x,
          y,
          diff,
        });
      }
    }
  }
  t.sort(function (a, b) {
    return a.diff - b.diff;
  });
  if (t.length > 3) {
    t.splice(3);
  }
  // 取均数
  t = t.map(item => (item.x + item.y) * 0.5);
  const res: Array<number> = [];
  t.forEach(t => {
    const xt = points[0].x * Math.pow(1 - t, 3)
      + 3 * points[1].x * t * Math.pow(1 - t, 2)
      + 3 * points[2].x * t * t * (1 - t)
      + points[3].x * Math.pow(t, 3);
    const yt = points[0].y * Math.pow(1 - t, 3)
      + 3 * points[1].y * t * Math.pow(1 - t, 2)
      + 3 * points[2].y * t * t * (1 - t)
      + points[3].y * Math.pow(t, 3);
    // 计算误差忽略
    if (Math.abs(xt - x) <= 1e-2 && Math.abs(yt - y) <= 1e-2) {
      res.push(t);
    }
  });
  return res;
}


export function bezierSlope(points: Array<{ x: number, y: number }>, t = 0) {
  if (points.length === 2) {
    const { x: x1, y: y1 } = points[0];
    const { x: x2, y: y2 } = points[1];
    if (x1 === x2) {
      return Infinity;
    }
    return (y2 - y1) / (x2 - x1);
  }
  if (points.length === 3) {
    return bezier2Slope(points, t);
  }
  if (points.length === 4) {
    return bezier3Slope(points, t);
  }
  throw new Error('Unsupported order');
}

function bezier2Slope(points: Array<{ x: number, y: number }>, t = 0) {
  const { x: x0, y: y0 } = points[0];
  const { x: x1, y: y1 } = points[1];
  const { x: x2, y: y2 } = points[2];
  const x = 2 * (x0 - 2 * x1 + x2) * t + 2 * x1 - 2 * x0;
  if (x === 0) {
    return Infinity;
  }
  return (2 * (y0 - 2 * y1 + y2) * t + 2 * y1 - 2 * y0) / x;
}

function bezier3Slope(points: Array<{ x: number, y: number }>, t: number) {
  const { x: x0, y: y0 } = points[0];
  const { x: x1, y: y1 } = points[1];
  const { x: x2, y: y2 } = points[2];
  const { x: x3, y: y3 } = points[3];
  const x = 3 * (-x0 + 3 * x1 - 3 * x2 + x3) * t * t
    + 2 * (3 * x0 - 6 * x1 + 3 * x2) * t
    + 3 * x1 - 3 * x0;
  if (x === 0) {
    return Infinity;
  }
  return (3 * (-y0 + 3 * y1 - 3 * y2 + y3) * t * t
    + 2 * (3 * y0 - 6 * y1 + 3 * y2) * t
    + 3 * y1 - 3 * y0) / x;
}

function bezierExtremeT2(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
  let tx = (x0 - x1) / (x0 - 2 * x1 + x2);
  if (isNaN(tx) || tx < 0) {
    tx = 0;
  }
  else if (tx > 1) {
    tx = 1;
  }
  let ty = (y0 - y1) / (y0 - 2 * y1 + y2);
  if (isNaN(ty) || ty < 0) {
    ty = 0;
  }
  else if (ty > 1) {
    ty = 1;
  }
  const res = [tx];
  if (ty !== tx) {
    res.push(ty);
  }
  res.sort((a, b) => a - b);
  if (res[0] > 0) {
    res.unshift(0);
  }
  if (res[res.length - 1] < 1) {
    res.push(1);
  }
  return res;
}

function bezierExtremeT3(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
  const cx = -x0 + x1;
  const cy = -y0 + y1;
  const bx = x0 - 2 * x1 + x2;
  const by = y0 - 2 * y1 + y2;
  const ax = -x0 + 3 * x1 - 3 * x2 + x3;
  const ay = -y0 + 3 * y1 - 3 * y2 + y3;
  let hx = bx * bx - ax * cx;
  let hy = by * by - ay * cy;
  const res: number[] = [];
  if (hx > 0) {
    hx = Math.sqrt(hx);
    let t = (-bx - hx) / ax;
    // 2次项系数为0注意降级为一元一次方程
    if (ax && t > 0 && t < 1) {
      res.push(t);
    }
    t = ax ? ((-bx + hx) / ax) : (-cx * 0.5 / bx);
    if (t > 0 && t < 1) {
      res.push(t);
    }
  }
  if (hy > 0) {
    hy = Math.sqrt(hy);
    let t = (-by - hy) / ay;
    if (ay && t > 0 && t < 1) {
      res.push(t);
    }
    t = ay ? ((-by + hy) / ay) : (-cy * 0.5 / by);
    if (t > 0 && t < 1) {
      res.push(t);
    }
  }
  res.sort((a, b) => a - b);
  for (let i = res.length - 1; i > 0; i--) {
    if (res[i] === res[i - 1]) {
      res.splice(i, 1);
    }
  }
  if (res[0] > 0) {
    res.unshift(0);
  }
  if (res[res.length - 1] < 1) {
    res.push(1);
  }
  return res;
}

// 贝塞尔曲线的极值点的t，包含默认的0和1，直线则默认就是[0, 1]
export function bezierExtremeT(x0: number, y0: number, x1: number, y1: number,
                               x2?: number, y2?: number, x3?: number, y3?: number) {
  const len = arguments.length;
  if (len === 4) {
    return [0, 1];
  }
  if (len === 6) {
    return bezierExtremeT2(x0, y0, x1, y1, x2!, y2!);
  }
  if (len === 8) {
    return bezierExtremeT3(x0, y0, x1, y1, x2!, y2!, x3!, y3!);
  }
  throw new Error('Unsupported order');
}

// 在t处的切线方程，返回一般式，直线就是本身
export function bezierTangent(points: Array<{ x: number, y: number }>, t = 0) {
  if (points.length === 2) {
    return twoPoint2General(points[0].x, points[0].y, points[1].x, points[1].y);
  }
  if (points.length === 3) {
    return bezierTangent2(points, t);
  }
  if (points.length === 4) {
    return bezierTangent3(points, t);
  }
  throw new Error('Unsupported order');
}

function bezierTangent2(points: Array<{ x: number, y: number }>, t = 0) {
  const k = bezier2Slope(points, t);
  const p = pointByT2(points, t);
  return pointSlope2General(p.x, p.y, k);
}

function bezierTangent3(points: Array<{ x: number, y: number }>, t = 0) {
  const k = bezier3Slope(points, t);
  const p = pointByT3(points, t);
  return pointSlope2General(p.x, p.y, k);
}

export default {
  bboxBezier,
  bezierLength,
  bezierAt,
  sliceBezier,
  sliceBezier2Both,
  getPointByT,
  getPointT,
  bezierSlope,
  bezierExtremeT,
};
