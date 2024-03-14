import { calRectPoints } from '../math/matrix';
import { color2gl } from '../style/css';

export function initShaders(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  vshader: string,
  fshader: string,
) {
  let program = createProgram(gl, vshader, fshader);
  if (!program) {
    throw new Error('Failed to create program');
  }

  // 要开启透明度，用以绘制透明的图形
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  return program;
}

function createProgram(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  vshader: string,
  fshader: string,
) {
  // Create shader object
  let vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
  let fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
  if (!vertexShader || !fragmentShader) {
    return null;
  }

  // Create a program object
  let program = gl.createProgram();
  if (!program) {
    return null;
  }
  // @ts-ignore
  program.vertexShader = vertexShader;
  // @ts-ignore
  program.fragmentShader = fragmentShader;

  // Attach the shader objects
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  // Link the program object
  gl.linkProgram(program);

  // Check the result of linking
  let linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    let error = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);
    throw new Error('Failed to link program: ' + error);
  }
  return program;
}

/**
 * Create a shader object
 * @param gl GL context
 * @param type the type of the shader object to be created
 * @param source shader program (string)
 * @return created shader object, or null if the creation has failed.
 */
export function loadShader(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  type: number,
  source: string,
) {
  // Create shader object
  let shader = gl.createShader(type);
  if (shader === null) {
    throw new Error('unable to create shader');
  }

  // Set the shader program
  gl.shaderSource(shader, source);

  // Compile the shader
  gl.compileShader(shader);

  // Check the result of compilation
  let compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    let error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Failed to compile shader: ' + error);
  }

  return shader;
}

export function createTexture(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  n: number,
  tex?: TexImageSource,
  width?: number,
  height?: number,
): WebGLTexture {
  const texture = gl.createTexture()!;
  bindTexture(gl, texture, n);
  // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  // 传入需要绑定的纹理
  if (tex) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
  }
  // 或者尺寸来绑定fbo
  else if (width && height) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
  } else {
    throw new Error('Missing texImageSource or w/h');
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

export function bindTexture(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  texture: WebGLTexture,
  n: number,
) {
  // @ts-ignore
  gl.activeTexture(gl['TEXTURE' + n]);
  gl.bindTexture(gl.TEXTURE_2D, texture);
}

export type DrawData = {
  opacity: number;
  matrix?: Float64Array;
  bbox: Float64Array;
  coords?: { // 手动传入提前计算好的坐标，tile时复用数据
    t1: { x: number, y: number },
    t2: { x: number, y: number },
    t3: { x: number, y: number },
    t4: { x: number, y: number },
  };
  tc?: { x1: number, y1: number, x3: number, y3: number };
  texture: WebGLTexture;
};

let lastVtPoint: Float32Array,
  lastVtTex: Float32Array,
  lastVtOpacity: Float32Array; // 缓存

export function drawTextureCache(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  cx: number,
  cy: number,
  program: WebGLProgram,
  list: DrawData[],
  dx = 0,
  dy = 0,
  flipY = true,
  x1 = -1,
  y1 = -1,
  x2 = 1,
  y2 = 1,
) {
  const length = list.length;
  if (!length) {
    return;
  }
  // 单个矩形绘制可优化，2个三角形共享一条边
  const isSingle = length === 1;
  const num1 = isSingle ? 8 : length * 12; // xy数
  const num2 = isSingle ? 4 : length * 6; // 顶点数
  // 是否使用缓存TypeArray，避免垃圾回收
  let vtPoint: Float32Array, vtTex: Float32Array, vtOpacity: Float32Array;
  if (lastVtPoint && lastVtPoint.length === num1) {
    vtPoint = lastVtPoint;
  } else {
    vtPoint = lastVtPoint = new Float32Array(num1);
  }
  if (lastVtTex && lastVtTex.length === num1) {
    vtTex = lastVtTex;
  } else {
    vtTex = lastVtTex = new Float32Array(num1);
  }
  if (lastVtOpacity && lastVtOpacity.length === num2) {
    vtOpacity = lastVtOpacity;
  } else {
    vtOpacity = lastVtOpacity = new Float32Array(num2);
  }
  for (let i = 0, len = list.length; i < len; i++) {
    const {
      opacity,
      matrix,
      bbox,
      coords,
      tc,
      texture,
    } = list[i];
    bindTexture(gl, texture, 0);
    const { t1, t2, t3, t4 } =
      coords ? offsetCoords(coords, dx, dy) : bbox2Coords(bbox, cx, cy, dx, dy, flipY, matrix);
    let k = i * 12;
    vtPoint[k] = t1.x;
    vtPoint[k + 1] = t1.y;
    vtPoint[k + 2] = t4.x;
    vtPoint[k + 3] = t4.y;
    vtPoint[k + 4] = t2.x;
    vtPoint[k + 5] = t2.y;
    if (isSingle) {
      vtPoint[k + 6] = t3.x;
      vtPoint[k + 7] = t3.y;
    } else {
      vtPoint[k + 6] = t4.x;
      vtPoint[k + 7] = t4.y;
      vtPoint[k + 8] = t2.x;
      vtPoint[k + 9] = t2.y;
      vtPoint[k + 10] = t3.x;
      vtPoint[k + 11] = t3.y;
    }
    // 纹理坐标默认0,1，除非传入tc指定范围
    if (tc) {
      vtTex[k] = tc.x1;
      vtTex[k + 1] = tc.y1;
      vtTex[k + 2] = tc.x1;
      vtTex[k + 3] = tc.y3;
      vtTex[k + 4] = tc.x3;
      vtTex[k + 5] = tc.y1;
      if (isSingle) {
        vtTex[k + 6] = tc.x3;
        vtTex[k + 7] = tc.y3;
      } else {
        vtTex[k + 6] = tc.x1;
        vtTex[k + 7] = tc.y3;
        vtTex[k + 8] = tc.x3;
        vtTex[k + 9] = tc.y1;
        vtTex[k + 10] = tc.x3;
        vtTex[k + 11] = tc.y3;
      }
    } else {
      vtTex[k] = 0;
      vtTex[k + 1] = 0;
      vtTex[k + 2] = 0;
      vtTex[k + 3] = 1;
      vtTex[k + 4] = 1;
      vtTex[k + 5] = 0;
      if (isSingle) {
        vtTex[k + 6] = 1;
        vtTex[k + 7] = 1;
      } else {
        vtTex[k + 6] = 0;
        vtTex[k + 7] = 1;
        vtTex[k + 8] = 1;
        vtTex[k + 9] = 0;
        vtTex[k + 10] = 1;
        vtTex[k + 11] = 1;
      }
    }
    k = i * 6;
    vtOpacity[k] = opacity;
    vtOpacity[k + 1] = opacity;
    vtOpacity[k + 2] = opacity;
    vtOpacity[k + 3] = opacity;
    if (!isSingle) {
      vtOpacity[k + 4] = opacity;
      vtOpacity[k + 5] = opacity;
    }
  }
  // 顶点buffer
  const pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
  const a_position = gl.getAttribLocation(program, 'a_position');
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_position);
  // 纹理buffer
  const texBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtTex, gl.STATIC_DRAW);
  const a_texCoords = gl.getAttribLocation(program, 'a_texCoords');
  gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_texCoords);
  // opacity buffer
  const opacityBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, opacityBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtOpacity, gl.STATIC_DRAW);
  const a_opacity = gl.getAttribLocation(program, 'a_opacity');
  gl.vertexAttribPointer(a_opacity, 1, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_opacity);
  // 纹理单元
  const u_texture = gl.getUniformLocation(program, 'u_texture');
  gl.uniform1i(u_texture, 0);
  // clip范围
  const u_x1 = gl.getUniformLocation(program, 'x1');
  gl.uniform1f(u_x1, x1);
  const u_y1 = gl.getUniformLocation(program, 'y1');
  gl.uniform1f(u_y1, y1);
  const u_x2 = gl.getUniformLocation(program, 'x2');
  gl.uniform1f(u_x2, x2);
  const u_y2 = gl.getUniformLocation(program, 'y2');
  gl.uniform1f(u_y2, y2);
  // 渲染并销毁
  gl.drawArrays(isSingle ? gl.TRIANGLE_STRIP : gl.TRIANGLES, 0, num2);
  gl.deleteBuffer(pointBuffer);
  gl.deleteBuffer(texBuffer);
  gl.deleteBuffer(opacityBuffer);
  gl.disableVertexAttribArray(a_position);
  gl.disableVertexAttribArray(a_texCoords);
  gl.disableVertexAttribArray(a_opacity);
}

export function getSingleCoords() {
  const vtPoint = new Float32Array(8),
    vtTex = new Float32Array(8);
  vtPoint[0] = -1;
  vtPoint[1] = -1;
  vtPoint[2] = -1;
  vtPoint[3] = 1;
  vtPoint[4] = 1;
  vtPoint[5] = -1;
  vtPoint[6] = 1;
  vtPoint[7] = 1;
  vtTex[0] = 0;
  vtTex[1] = 0;
  vtTex[2] = 0;
  vtTex[3] = 1;
  vtTex[4] = 1;
  vtTex[5] = 0;
  vtTex[6] = 1;
  vtTex[7] = 1;
  return { vtPoint, vtTex };
}

export function drawMask(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  program: WebGLProgram,
  mask: WebGLTexture,
  summary: WebGLTexture,
) {
  const { vtPoint, vtTex } = getSingleCoords();
  // 顶点buffer
  const pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
  const a_position = gl.getAttribLocation(program, 'a_position');
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_position);
  // 纹理buffer
  const texBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtTex, gl.STATIC_DRAW);
  const a_texCoords = gl.getAttribLocation(program, 'a_texCoords');
  gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_texCoords);
  // 纹理单元
  bindTexture(gl, mask, 0);
  bindTexture(gl, summary, 1);
  const u_texture1 = gl.getUniformLocation(program, 'u_texture1');
  gl.uniform1i(u_texture1, 0);
  const u_texture2 = gl.getUniformLocation(program, 'u_texture2');
  gl.uniform1i(u_texture2, 1);
  // 渲染并销毁
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.deleteBuffer(pointBuffer);
  gl.deleteBuffer(texBuffer);
  gl.disableVertexAttribArray(a_position);
  gl.disableVertexAttribArray(a_texCoords);
}

/**
 * https://www.w3.org/TR/2018/WD-filter-effects-1-20181218/#feGaussianBlurElement
 * 按照css规范的优化方法执行3次，避免卷积核扩大3倍性能慢
 * x/y方向分开执行，加速性能，计算次数由d*d变为d+d，d为卷积核大小
 * spread由d和sigma计算得出，d由sigma计算得出，sigma即css的blur()参数
 * 规范的优化方法对d的值分奇偶优化，这里再次简化，d一定是奇数，即卷积核大小
 * 3次执行（x/y合起来算1次）需互换单元，来回执行源和结果
 */
export function drawGauss(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  program: WebGLProgram,
  texture: WebGLTexture,
  width: number,
  height: number,
) {
  const { vtPoint, vtTex } = getSingleCoords();
  // 顶点buffer
  const pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
  const a_position = gl.getAttribLocation(program, 'a_position');
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_position);
  // 纹理buffer
  const texBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtTex, gl.STATIC_DRAW);
  const a_texCoords = gl.getAttribLocation(program, 'a_texCoords');
  gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_texCoords);
  /**
   * 注意max和ratio的设置，当是100尺寸的正方形时，传给direction的始终为1
   * 当正方形<100时，direction相应地要扩大相对于100的倍数，反之则缩小，如此为了取相邻点坐标时是+-1
   * 当非正方形时，长轴一端为基准值不变，短的要二次扩大比例倍数
   * tex1和tex2来回3次，最后是到tex1
   */
  const u_texture = gl.getUniformLocation(program, 'u_texture');
  const u_direction = gl.getUniformLocation(program, 'u_direction');
  const recycle: WebGLTexture[] = []; // 3次过程中新生成的中间纹理需要回收
  const max = 100 / Math.max(width, height);
  const ratio = width / height;
  let tex1 = texture;
  for (let i = 0; i < 3; i++) {
    // tex1到tex2
    let tex2 = createTexture(gl, 1, undefined, width, height);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex2,
      0,
    );
    bindTexture(gl, tex1, 0);
    if (width >= height) {
      gl.uniform2f(u_direction, max, 0);
    } else {
      gl.uniform2f(u_direction, max / ratio, 0);
    }
    gl.uniform1i(u_texture, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // tex2到tex1
    let tex3 = createTexture(gl, 0, undefined, width, height);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex3,
      0,
    );
    bindTexture(gl, tex2, 1);
    if (width >= height) {
      gl.uniform2f(u_direction, 0, max * ratio);
    } else {
      gl.uniform2f(u_direction, 0, max);
    }
    gl.uniform1i(u_texture, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    recycle.push(tex1);
    recycle.push(tex2);
    tex1 = tex3;
  }
  // 回收
  gl.deleteBuffer(pointBuffer);
  gl.deleteBuffer(texBuffer);
  gl.disableVertexAttribArray(a_position);
  gl.disableVertexAttribArray(a_texCoords);
  recycle.forEach((item) => {
    // 传入的原始不回收，交由外部控制
    if (item !== texture) {
      gl.deleteTexture(item);
    }
  });
  return tex1;
}

export function drawMotion(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  program: WebGLProgram,
  texture: WebGLTexture,
  kernel: number,
  radian: number,
  w: number,
  h: number,
) {
  const { vtPoint, vtTex } = getSingleCoords();
  // 顶点buffer
  const pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
  const a_position = gl.getAttribLocation(program, 'a_position');
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_position);
  // 纹理buffer
  const texBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtTex, gl.STATIC_DRAW);
  const a_texCoords = gl.getAttribLocation(program, 'a_texCoords');
  gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_texCoords);
  // 参数
  const u_kernel = gl.getUniformLocation(program, 'u_kernel');
  gl.uniform1i(u_kernel, kernel);
  const sin = Math.sin(radian) * kernel / h;
  const cos = Math.cos(radian) * kernel / w;
  const u_velocity = gl.getUniformLocation(program, 'u_velocity');
  gl.uniform2f(u_velocity, cos, sin);
  // 类似高斯模糊，但不拆分xy，直接一起固定执行
  let res = texture;
  const recycle: WebGLTexture[] = []; // 3次过程中新生成的中间纹理需要回收
  for (let i = 0; i < 3; i++) {
    const t = createTexture(gl, 0, undefined, w, h);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      t,
      0,
    );
    bindTexture(gl, res, 0);
    const u_texture = gl.getUniformLocation(program, 'u_texture');
    gl.uniform1i(u_texture, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    recycle.push(res);
    res = t;
  }
  // 销毁
  gl.deleteBuffer(pointBuffer);
  gl.deleteBuffer(texBuffer);
  gl.disableVertexAttribArray(a_position);
  gl.disableVertexAttribArray(a_texCoords);
  recycle.forEach((item) => {
    // 传入的原始不回收，交由外部控制
    if (item !== texture) {
      gl.deleteTexture(item);
    }
  });
  return res;
}

export function drawRadial(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  program: WebGLProgram,
  texture: WebGLTexture,
  ratio: number,
  kernel: number,
  center: [number, number],
  w: number,
  h: number,
) {
  const { vtPoint, vtTex } = getSingleCoords();
  // 顶点buffer
  const pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
  const a_position = gl.getAttribLocation(program, 'a_position');
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_position);
  // 纹理buffer
  const texBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtTex, gl.STATIC_DRAW);
  const a_texCoords = gl.getAttribLocation(program, 'a_texCoords');
  gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_texCoords);
  // 参数
  const u_kernel = gl.getUniformLocation(program, 'u_kernel');
  gl.uniform1i(u_kernel, kernel);
  const u_center = gl.getUniformLocation(program, 'u_center');
  gl.uniform2f(u_center, center[0], center[1]);
  const u_ratio = gl.getUniformLocation(program, 'u_ratio');
  gl.uniform1f(u_ratio, ratio);
  // 类似高斯模糊，但不拆分xy，直接一起固定执行
  let res = texture;
  const recycle: WebGLTexture[] = []; // 3次过程中新生成的中间纹理需要回收，先1次
  for (let i = 0; i < 1; i++) {
    const t = createTexture(gl, 0, undefined, w, h);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      t,
      0,
    );
    bindTexture(gl, res, 0);
    const u_texture = gl.getUniformLocation(program, 'u_texture');
    gl.uniform1i(u_texture, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    recycle.push(res);
    res = t;
  }
  // 销毁
  gl.deleteBuffer(pointBuffer);
  gl.deleteBuffer(texBuffer);
  gl.disableVertexAttribArray(a_position);
  gl.disableVertexAttribArray(a_texCoords);
  recycle.forEach((item) => {
    // 传入的原始不回收，交由外部控制
    if (item !== texture) {
      gl.deleteTexture(item);
    }
  });
  return res;
}

export function drawShadow(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  program: WebGLProgram,
  texture: WebGLTexture,
  color: number[],
  w: number,
  h: number,
) {
  const { vtPoint, vtTex } = getSingleCoords();
  // 顶点buffer
  const pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
  const a_position = gl.getAttribLocation(program, 'a_position');
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_position);
  // 纹理buffer
  const texBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtTex, gl.STATIC_DRAW);
  const a_texCoords = gl.getAttribLocation(program, 'a_texCoords');
  gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_texCoords);
  // 纹理单元
  bindTexture(gl, texture, 0);
  const u_texture = gl.getUniformLocation(program, 'u_texture');
  gl.uniform1i(u_texture, 0);
  // shadow颜色
  const u_color = gl.getUniformLocation(program, 'u_color');
  const a = color[3];
  gl.uniform4f(u_color, color[0] * a, color[1] * a, color[2] * a, a);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

export const drawMbm = drawMask;

export function drawTint(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  program: WebGLProgram,
  texture: WebGLTexture,
  tint: number[],
  opacity: number,
) {
  const { vtPoint, vtTex } = getSingleCoords();
  // 顶点buffer
  const pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
  const a_position = gl.getAttribLocation(program, 'a_position');
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_position);
  // 纹理buffer
  const texBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtTex, gl.STATIC_DRAW);
  const a_texCoords = gl.getAttribLocation(program, 'a_texCoords');
  gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_texCoords);
  // 纹理单元
  bindTexture(gl, texture, 0);
  const u_texture = gl.getUniformLocation(program, 'u_texture');
  gl.uniform1i(u_texture, 0);
  const u_tint = gl.getUniformLocation(program, 'u_tint');
  const color = color2gl(tint);
  color[3] *= opacity;
  gl.uniform4f(u_tint, color[0] * color[3], color[1] * color[3], color[2] * color[3], color[3]);
  // 渲染并销毁
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.deleteBuffer(pointBuffer);
  gl.deleteBuffer(texBuffer);
  gl.disableVertexAttribArray(a_position);
  gl.disableVertexAttribArray(a_texCoords);
}

export function drawColorMatrix(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  program: WebGLProgram,
  texture: WebGLTexture,
  m: number[],
) {
  const { vtPoint, vtTex } = getSingleCoords();
  // 顶点buffer
  const pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
  const a_position = gl.getAttribLocation(program, 'a_position');
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_position);
  // 纹理buffer
  const texBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtTex, gl.STATIC_DRAW);
  const a_texCoords = gl.getAttribLocation(program, 'a_texCoords');
  gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_texCoords);
  // 纹理单元
  bindTexture(gl, texture, 0);
  const u_texture = gl.getUniformLocation(program, 'u_texture');
  gl.uniform1i(u_texture, 0);
  // matrix
  let u_m = gl.getUniformLocation(program, 'u_m');
  gl.uniform1fv(u_m, new Float32Array(m));
  // 渲染并销毁
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.deleteBuffer(pointBuffer);
  gl.deleteBuffer(texBuffer);
  gl.disableVertexAttribArray(a_position);
  gl.disableVertexAttribArray(a_texCoords);
}

export function convertCoords2Gl(
  x: number,
  y: number,
  cx: number,
  cy: number,
  flipY = false,
) {
  if (x === cx) {
    x = 0;
  } else {
    x = (x - cx) / cx;
  }
  if (y === cy) {
    y = 0;
  } else {
    if (flipY) {
      y = (cy - y) / cy;
    } else {
      y = (y - cy) / cy;
    }
  }
  return { x, y };
}

/**
 * 这里的换算非常绕，bbox是节点本身不包含缩放画布的scale的，参与和bbox的偏移计算，
 * matrix是最终世界matrix，包含了画布缩放的scale（PageContainer上），因此坐标是bbox乘matrix，
 * dx/dy不参与matrix计算
 */
export function bbox2Coords(
  bbox: Float64Array,
  cx: number,
  cy: number,
  dx = 0,
  dy = 0,
  flipY = true,
  matrix?: Float64Array,
) {
  const t = calRectPoints(
    bbox[0],
    bbox[1],
    bbox[2],
    bbox[3],
    matrix,
  );
  const { x1, y1, x2, y2, x3, y3, x4, y4 } = t;
  const t1 = convertCoords2Gl(x1 + dx, y1 + dy, cx, cy, flipY);
  const t2 = convertCoords2Gl(x2 + dx, y2 + dy, cx, cy, flipY);
  const t3 = convertCoords2Gl(x3 + dx, y3 + dy, cx, cy, flipY);
  const t4 = convertCoords2Gl(x4 + dx, y4 + dy, cx, cy, flipY);
  return { t1, t2, t3, t4 };
}

export function offsetCoords(
  coords: {
    t1: { x: number, y: number },
    t2: { x: number, y: number },
    t3: { x: number, y: number },
    t4: { x: number, y: number },
  },
  dx = 0,
  dy = 0,
) {
  if (dx || dy) {
    const { t1, t2, t3, t4 } = coords;
    return {
      t1: { x: t1.x + dx, y: t1.y + dy },
      t2: { x: t2.x + dx, y: t2.y + dy },
      t3: { x: t3.x + dx, y: t3.y + dy },
      t4: { x: t4.x + dx, y: t4.y + dy },
    };
  }
  return coords;
}
