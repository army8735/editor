import Node from '../node/Node';
import Root from '../node/Root';
import ArtBoard from '../node/ArtBoard';
import { RefreshLevel } from './level';
import { bindTexture, createTexture, drawTextureCache } from '../gl/webgl';
import { assignMatrix, multiply, toE } from '../math/matrix';
import inject from '../util/inject';
import { MASK } from '../style/define';
import TextureCache from './TextureCache';
import textureCache from './TextureCache';

export type Struct = {
  node: Node;
  num: number;
  total: number;
  lv: number;
};

type Merge = {
  i: number,
  lv: number,
  total: number,
  node: Node,
};

export function renderWebgl(gl: WebGL2RenderingContext | WebGLRenderingContext,
                            root: Root, rl: RefreshLevel) {
  const { structs, width: W, height: H } = root;
  const cx = W * 0.5, cy = H * 0.5;
  const mergeList: Array<Merge> = [];
  // 第一次或者每次有重新生产的内容或布局触发内容更新，要先绘制，再寻找合并节点重新合并缓存
  if (rl >= RefreshLevel.REPAINT) {
    for (let i = 0, len = structs.length; i < len; i++) {
      const { node, lv, total } = structs[i];
      const { refreshLevel, computedStyle } = node;
      node.refreshLevel = RefreshLevel.NONE;
      // 无任何变化即refreshLevel为NONE（0）忽略
      if (refreshLevel) {
        // filter之类的变更
        if (refreshLevel < RefreshLevel.REPAINT) {
        }
        else {
          const hasContent = node.calContent();
          // 有内容才渲染生成纹理
          if (hasContent) {
            node.renderCanvas();
            node.genTexture(gl);
          }
        }
      }
      const { maskMode, opacity } = computedStyle;
      // 非单节点透明需汇总子树，有mask的也需要
      if (maskMode || opacity > 0 && opacity < 1 && total) {
        mergeList.push({
          i,
          lv,
          total,
          node,
        });
      }
    }
  }
  // 根据收集的需要合并局部根的索引，尝试合并，按照层级从大到小，索引从小到大的顺序，即从叶子节点开始
  if(mergeList.length) {
    mergeList.sort(function (a, b) {
      if (a.lv === b.lv) {
        return a.i - b.i;
      }
      return b.lv - a.lv;
    });
    for (let j = 0, len = mergeList.length; j < len; j++) {
      const {
        i,
        lv,
        total,
        node,
      } = mergeList[j];
      // 先尝试生成此节点汇总纹理，无论是什么效果，都是对汇总后的起效，单个节点的绘制等于本身纹理缓存
      let target = node.textureTotal = node.textureTarget
        = genTotal(gl, root, node, structs, i, lv, total, W, H);
      // 生成mask
      const computedStyle = node.computedStyle;
      const { maskMode } = computedStyle;
      if (maskMode && target) {
        genMask(gl, root, node, maskMode, target, structs, i, lv, W, H);
      }
    }
  }
  const programs = root.programs;
  // 先渲染artBoard的背景色
  const page = root.lastPage;
  if (page) {
    const children = page.children, len = children.length;
    // 背景色分开来
    for (let i = 0; i < len; i++) {
      const artBoard = children[i];
      if (artBoard instanceof ArtBoard) {
        artBoard.renderBgc(gl, cx, cy);
      }
    }
  }
  // 一般都存在，除非root改逻辑在只有自己的时候进行渲染，overlay更新实际上是下一帧了
  const overlay = root.overlay;
  const program = programs.program;
  gl.useProgram(programs.program);
  // 世界opacity和matrix不一定需要重算，这里记录个list，按深度lv，如果出现了无缓存，则之后的深度lv都需要重算
  const cacheOpList: Array<boolean> = [];
  const cacheMwList: Array<boolean> = [];
  let lastLv = 0, hasCacheOpLv = false, hasCacheMwLv = false;
  // 循环收集数据，同一个纹理内的一次性给出，只1次DrawCall
  for (let i = 0, len = structs.length; i < len; i++) {
    const { node, lv, total } = structs[i];
    // 特殊的工具覆盖层，如画板名称，同步更新translate直接跟着画板位置刷新
    if (overlay && overlay === node) {
      overlay.update();
    }
    const computedStyle = node.computedStyle;
    if (!computedStyle.visible || computedStyle.opacity <= 0) {
      i += total;
      continue;
    }
    // 第一个是Root层级0
    if (!i) {
      hasCacheOpLv = node.hasCacheOpLv;
      hasCacheMwLv = node.hasCacheMwLv;
      cacheOpList.push(hasCacheOpLv);
      cacheMwList.push(hasCacheMwLv);
    }
    // lv变大说明是子节点，如果仍有缓存，要判断子节点是否更新，已经没缓存就不用了
    else if (lv > lastLv) {
      if (hasCacheOpLv) {
        hasCacheOpLv = node.hasCacheOpLv;
      }
      cacheOpList.push(hasCacheOpLv);
      if (hasCacheMwLv) {
        hasCacheMwLv = node.hasCacheMwLv;
      }
      cacheMwList.push(hasCacheMwLv);
    }
    // lv变小说明是上层节点，不一定是直接父节点，因为可能跨层，出栈对应数量来到对应lv的数据
    else if (lv < lastLv) {
      const diff = lastLv - lv;
      cacheOpList.splice(-diff);
      hasCacheOpLv = cacheOpList[lv - 1];
      cacheMwList.splice(-diff);
      hasCacheMwLv = cacheMwList[lv - 1];
    }
    // 不变是同级兄弟，无需特殊处理 else {}
    lastLv = lv;
    // 继承父的opacity和matrix，仍然要注意root没有parent
    const parent = node.parent;
    if (!hasCacheOpLv) {
      node._opacity = parent ? parent._opacity * node.computedStyle.opacity : node.computedStyle.opacity;
      node.hasCacheOpLv = true;
    }
    if (!hasCacheMwLv) {
      assignMatrix(node._matrixWorld, parent ? multiply(parent._matrixWorld, node.matrix) : node.matrix);
      node.hasCacheMwLv = true;
    }
    const opacity = node._opacity;
    const matrix = node._matrixWorld;
    // 一般只有一个纹理
    const target = node.textureTarget;
    if (target && target.available) {
      drawTextureCache(gl, W, H, cx, cy, program, [{
        bbox: node._bbox || node.bbox,
        opacity,
        matrix,
        cache: target,
      }], true);
    }
    // 有局部子树缓存可以跳过其所有子孙节点
    if (target && target !== node.textureCache) {
      i += total;
    }
    // 特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
    else if (node.isShapeGroup) {
      i += total;
    }
  }
  // 再覆盖渲染artBoard的阴影和标题
  if (page) {
    const children = page.children, len = children.length;
    // boxShadow用统一纹理
    if (ArtBoard.BOX_SHADOW_TEXTURE) {
      let count = 0;
      for (let i = 0; i < len; i++) {
        const artBoard = children[i];
        if (artBoard instanceof ArtBoard) {
          count++;
        }
      }
      const bsPoint = new Float32Array(count * 96);
      const bsTex = new Float32Array(count * 96);
      let count2 = 0;
      for (let i = 0; i < len; i++) {
        const artBoard = children[i];
        if (artBoard instanceof ArtBoard) {
          artBoard.collectBsData(count2++, bsPoint, bsTex, cx, cy);
        }
      }
      const simpleProgram = programs.simpleProgram;
      gl.useProgram(simpleProgram);
      // 顶点buffer
      const pointBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, bsPoint, gl.STATIC_DRAW);
      const a_position = gl.getAttribLocation(simpleProgram, 'a_position');
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_position);
      // 纹理buffer
      const texBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, bsTex, gl.STATIC_DRAW);
      let a_texCoords = gl.getAttribLocation(simpleProgram, 'a_texCoords');
      gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_texCoords);
      // 纹理单元
      let u_texture = gl.getUniformLocation(simpleProgram, 'u_texture');
      gl.uniform1i(u_texture, 0);
      bindTexture(gl, ArtBoard.BOX_SHADOW_TEXTURE, 0);
      // 渲染并销毁
      gl.drawArrays(gl.TRIANGLES, 0, count * 48);
      gl.deleteBuffer(pointBuffer);
      gl.deleteBuffer(texBuffer);
      gl.disableVertexAttribArray(a_position);
      gl.disableVertexAttribArray(a_texCoords);
    }
    else {
      const img = inject.IMG[ArtBoard.BOX_SHADOW];
      // 一般首次不可能有缓存，太特殊的base64了
      if (img && img.source) {
        ArtBoard.BOX_SHADOW_TEXTURE = createTexture(gl, 0, img.source);
        root.addUpdate(root, [], RefreshLevel.CACHE, false, false, undefined)
      }
      else {
        inject.measureImg(ArtBoard.BOX_SHADOW, (res: any) => {
          ArtBoard.BOX_SHADOW_TEXTURE = createTexture(gl, 0, res.source);
          root.addUpdate(root, [], RefreshLevel.CACHE, false, false, undefined)
        });
      }
    }
  }
}

function genTotal(gl: WebGL2RenderingContext | WebGLRenderingContext, root: Root, node: Node, structs: Array<Struct>,
                  index: number, lv: number, total: number, W: number, H: number) {
  // 缓存仍然还在直接返回，无需重新生成
  if (node.textureTotal && node.textureTotal.available) {
    return node.textureTotal!;
  }
  // 单个叶子节点也不需要，就是本身节点的内容
  if (!total) {
    return node.textureCache!;
  }
  const programs = root.programs;
  const program = programs.program;
  // 创建一个空白纹理来绘制，尺寸由于bbox已包含整棵子树内容可以直接使用
  const { bbox } = node;
  const w = bbox[2] - bbox[0], h = bbox[3] - bbox[1];
  const cx = w * 0.5, cy = h * 0.5;
  const target = textureCache.getEmptyInstance(gl, w, h);
  const frameBuffer = genFrameBufferWithTexture(gl, target.texture, w, h);
  // 和主循环很类似的，但是以此节点为根视作opacity=1和matrix=E
  for (let i = index, len = index + total + 1; i < len; i++) {
    const { node, total } = structs[i];
    const computedStyle = node.computedStyle;
    if (!computedStyle.visible || computedStyle.opacity <= 0) {
      i += total;
      continue;
    }
    let opacity, matrix;
    // 首个节点即局部根节点
    if (i === index) {
      opacity = node.tempOpacity = 1;
      matrix = toE(node.tempMatrix);
    }
    else {
      const parent = node.parent!;
      opacity = computedStyle.opacity * parent.tempOpacity;
      node.tempOpacity = opacity;
      matrix = multiply(parent.tempMatrix, node.matrix);
      assignMatrix(node.tempMatrix, matrix);
    }
    const target = node.textureTarget;
    if (target && target.available) {
      drawTextureCache(gl, W, H, cx, cy, program, [{
        bbox: node._bbox || node.bbox,
        opacity,
        matrix,
        cache: target,
      }], false);
    }
    // 有局部子树缓存可以跳过其所有子孙节点
    if (target && target !== node.textureCache) {
      i += total;
    }
    // 特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
    else if (node.isShapeGroup) {
      i += total;
    }
  }
  // 删除fbo恢复
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(frameBuffer);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.viewport(0, 0, W, H);
  return target;
}

function genMask(gl: WebGL2RenderingContext | WebGLRenderingContext, root: Root, node: Node, maskMode: MASK,
                 target: TextureCache, structs: Array<Struct>, index: number, lv: number, W: number, H: number) {
}

function genFrameBufferWithTexture(gl: WebGL2RenderingContext | WebGLRenderingContext, texture: WebGLTexture,
                                   width: number, height: number) {
  const frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, width, height);
  return frameBuffer;
}
