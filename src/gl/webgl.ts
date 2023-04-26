import { calRectPoint } from '../math/matrix';
import TextureCache from '../refresh/TextureCache';

export function createTexture(gl: WebGL2RenderingContext | WebGLRenderingContext, n: number,
                              tex?: TexImageSource, width?: number, height?: number): WebGLTexture {
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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  }
  else {
    throw new Error('Missing texImageSource or w/h');
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

export function bindTexture(gl: WebGL2RenderingContext | WebGLRenderingContext,
                            texture: WebGLTexture, n: number) {
  // @ts-ignore
  gl.activeTexture(gl['TEXTURE' + n]);
  gl.bindTexture(gl.TEXTURE_2D, texture);
}

export type DrawData = {
  opacity: number,
  matrix: Float64Array,
  cache: TextureCache,
};

let lastVtPoint: Float32Array, lastVtTex: Float32Array, lastVtOpacity: Float32Array; // 缓存

export function drawTextureCache(gl: WebGL2RenderingContext | WebGLRenderingContext, width: number, height: number,
                                 cx: number, cy: number, program: any, list: Array<DrawData>,
                                 dx = 0, dy = 0, flipY = true) {
  const length = list.length;
  if (!length) {
    return;
  }
  // 单个矩形绘制可优化，2个三角形共享一条边
  const isSingle = length === 1;
  const num1 = isSingle ? 8 : (length * 12); // xy数
  const num2 = isSingle ? 4 : (length * 6); // 顶点数
  // 是否使用缓存TypeArray，避免垃圾回收
  let vtPoint: Float32Array, vtTex: Float32Array, vtOpacity: Float32Array;
  if (lastVtPoint && lastVtPoint.length === num1) {
    vtPoint = lastVtPoint;
  }
  else {
    vtPoint = lastVtPoint = new Float32Array(num1);
  }
  if (lastVtTex && lastVtTex.length === num1) {
    vtTex = lastVtTex;
  }
  else {
    vtTex = lastVtTex = new Float32Array(num1);
  }
  if (lastVtOpacity && lastVtOpacity.length === num2) {
    vtOpacity = lastVtOpacity;
  }
  else {
    vtOpacity = lastVtOpacity = new Float32Array(num2);
  }
  for (let i = 0, len = list.length; i < len; i++) {
    const { opacity, matrix, cache } = list[i];
    const { bbox, texture } = cache;
    bindTexture(gl, texture, 0);
    const t = calRectPoint(bbox[0] + dx, bbox[1] + dy, bbox[2] + dx, bbox[3] + dy, matrix)
    const { x1, y1, x2, y2, x3, y3, x4, y4 } = t;
    const t1 = convertCoords2Gl(x1, y1, cx, cy, flipY);
    const t2 = convertCoords2Gl(x2, y2, cx, cy, flipY);
    const t3 = convertCoords2Gl(x3, y3, cx, cy, flipY);
    const t4 = convertCoords2Gl(x4, y4, cx, cy, flipY);
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
    }
    else {
      vtPoint[k + 6] = t4.x;
      vtPoint[k + 7] = t4.y;
      vtPoint[k + 8] = t2.x;
      vtPoint[k + 9] = t2.y;
      vtPoint[k + 10] = t3.x;
      vtPoint[k + 11] = t3.y;
    }
    vtTex[k] = 0;
    vtTex[k + 1] = 0;
    vtTex[k + 2] = 0;
    vtTex[k + 3] = 1;
    vtTex[k + 4] = 1;
    vtTex[k + 5] = 0;
    if (isSingle) {
      vtTex[k + 6] = 1;
      vtTex[k + 7] = 1;
    }
    else {
      vtTex[k + 6] = 0;
      vtTex[k + 7] = 1;
      vtTex[k + 8] = 1;
      vtTex[k + 9] = 0;
      vtTex[k + 10] = 1;
      vtTex[k + 11] = 1;
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
  let a_texCoords = gl.getAttribLocation(program, 'a_texCoords');
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
  // 渲染并销毁
  gl.drawArrays(isSingle ? gl.TRIANGLE_STRIP : gl.TRIANGLES, 0, num2);
  gl.deleteBuffer(pointBuffer);
  gl.deleteBuffer(texBuffer);
  gl.deleteBuffer(opacityBuffer);
  gl.disableVertexAttribArray(a_position);
  gl.disableVertexAttribArray(a_texCoords);
  gl.disableVertexAttribArray(a_opacity);

}

export function drawMask(gl: WebGL2RenderingContext | WebGLRenderingContext, width: number, height: number,
                         program: any, mask: WebGLTexture, summary: WebGLTexture) {
  const vtPoint = new Float32Array(8), vtTex = new Float32Array(8);
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
  let a_texCoords = gl.getAttribLocation(program, 'a_texCoords');
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

export function convertCoords2Gl(x: number, y: number, cx: number, cy: number, flipY = true) {
  if (x === cx) {
    x = 0;
  }
  else {
    x = (x - cx) / cx;
  }
  if (y === cy) {
    y = 0;
  }
  else {
    if (flipY) {
      y = (cy - y) / cy;
    }
    else {
      y = (y - cy) / cy;
    }
  }
  return { x, y };
}
