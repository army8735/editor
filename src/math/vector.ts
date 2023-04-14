// 向量点乘积
export function dotProduct(x1: number, y1: number, x2: number, y2: number) {
  return x1 * x2 + y1 * y2;
}


export function dotProduct3(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
  return x1 * x2 + y1 * y2 + z1 * z2;
}

// 向量叉乘积
export function crossProduct(x1: number, y1: number, x2: number, y2: number) {
  return x1 * y2 - x2 * y1;
}

export function crossProduct3(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
  return {
    x: y1 * z2 - y2 * z1,
    y: z1 * x2 - z2 * x1,
    z: x1 * y2 - x2 * y1,
  };
}

// 向量长度
export function length(x: number, y: number) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

export function length3(x: number, y: number, z: number) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
}

// 归一化
export function unitize(x: number, y: number) {
  let n = length(x, y);
  return {
    x: x / n,
    y: y / n,
  };
}

export function unitize3(x: number, y: number, z: number) {
  let n = length3(x, y, z);
  return {
    x: x / n,
    y: y / n,
    z: z / n,
  };
}

// 是否平行
export function isParallel(x1: number, y1: number, x2: number, y2: number) {
  if (isZero(x1, y1, x2, y2)) {
    return true;
  }
  let ag = angle(x1, y1, x2, y2);
  if (Math.abs(ag) < 1e-9) {
    return true;
  }
  if (Math.PI - Math.abs(ag) < 1e-9) {
    return true;
  }
  return false;
}

export function isParallel3(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
  if (isZero3(x1, y1, z1, x2, y2, z2)) {
    return true;
  }
  let ag = angle3(x1, y1, z1, x2, y2, z2);
  if (Math.abs(ag) < 1e-9) {
    return true;
  }
  if (Math.PI - Math.abs(ag) < 1e-9) {
    return true;
  }
  return false;
}

// 是否是零，考虑误差
export function isZero(x1: number, y1: number, x2: number, y2: number) {
  return Math.abs(x1) < 1e-9 && Math.abs(y1) < 1e-9
    && Math.abs(x2) < 1e-9 && Math.abs(y2) < 1e-9;
}

export function isZero3(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
  return Math.abs(x1) < 1e-9 && Math.abs(y1) < 1e-9 && Math.abs(z1) < 1e-9
    && Math.abs(x2) < 1e-9 && Math.abs(y2) < 1e-9 && Math.abs(z2) < 1e-9;
}

// 向量夹角
export function angle(x1: number, y1: number, x2: number, y2: number) {
  let cos = dotProduct(x1, y1, x2, y2) / (length(x1, y1) * length(x2, y2));
  if (cos < -1) {
    cos = -1;
  }
  else if (cos > 1) {
    cos = 1;
  }
  return Math.acos(cos);
}

export function angle3(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
  let cos = dotProduct3(x1, y1, z1, x2, y2, z2) / (length3(x1, y1, z1) * length3(x2, y2, z2));
  if (cos < -1) {
    cos = -1;
  }
  else if (cos > 1) {
    cos = 1;
  }
  return Math.acos(cos);
}

export default {
  dotProduct,
  dotProduct3,
  crossProduct,
  crossProduct3,
  length,
  length3,
  unitize,
  unitize3,
  angle,
  angle3,
  isParallel,
  isParallel3,
  isZero,
  isZero3,
};
