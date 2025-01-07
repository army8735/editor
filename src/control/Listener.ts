import Node from '../node/Node';
import Container from '../node/Container';
import Root from '../node/Root';
import Page from '../node/Page';
import Text from '../node/Text';
import ArtBoard from '../node/ArtBoard';
import Group from '../node/Group';
import Slice from '../node/Slice';
import { ComputedStyle, Style, StyleUnit, VISIBILITY } from '../style/define';
import Event from '../util/Event';
import Select, { Rect } from './Select';
import Input from './Input';
import State from './State';
import { clone } from '../util/type';
import { ArtBoardProps, BreakMaskStyle, JStyle, MaskModeStyle } from '../format';
import { getFrameNodes, getNodeByPoint, getOverlayArtBoardByPoint } from '../tools/root';
import { intersectLineLine } from '../math/isec';
import { angleBySides, r2d } from '../math/geom';
import { crossProduct } from '../math/vector';
import picker from './picker';
import contextMenu from './contextMenu';
import History from '../history/History';
import AbstractCommand from '../history/AbstractCommand';
import MoveCommand, { MoveData } from '../history/MoveCommand';
import ResizeCommand, { CONTROL_TYPE, ResizeData } from '../history/ResizeCommand';
import RemoveCommand, { RemoveData } from '../history/RemoveCommand';
import RotateCommand from '../history/RotateCommand';
import RichCommand from '../history/RichCommand';
import OpacityCommand from '../history/OpacityCommand';
import VerticalAlignCommand from '../history/VerticalAlignCommand';
import ShadowCommand from '../history/ShadowCommand';
import BlurCommand from '../history/BlurCommand';
import ColorAdjustCommand from '../history/ColorAdjustCommand';
import TextCommand from '../history/TextCommand';
import FillCommand from '../history/FillCommand';
import StrokeCommand from '../history/StrokeCommand';
import MaskModeCommand from '../history/MaskModeCommand';
import BreakMaskCommand from '../history/BreakMaskCommand';
import GroupCommand from '../history/GroupCommand';
import UnGroupCommand from '../history/UnGroupCommand';
import RenameCommand from '../history/RenameCommand';
import LockCommand from '../history/LockCommand';
import VisibleCommand from '../history/VisibleCommand';
import { toPrecision } from '../math';
import Guides from './Guides';
import { appendWithPosAndSize } from '../tools/container';
import AddCommand, { AddData } from '../history/AddCommand';
import Gradient from './Gradient';
import Geometry from './Geometry';
import Polyline from '../node/geom/Polyline';
import { getFrameVertexes } from '../tools/polyline';
import PointCommand from '../history/PointCommand';

export type ListenerOptions = {
  enabled?: {
    selectWithMeta?: boolean; // 初始状态hover/select时强制按下meta
    resizeWithAlt?: boolean; // 拖拽尺寸时强制按下alt
  };
  disabled?: {
    select?: boolean; // 选择节点
    hover?: boolean; // hover节点
    remove?: boolean; // 删除节点
    move?: boolean; // 移动节点
    resize?: boolean; // 节点尺寸
    drag?: boolean; // 拖拽画布
    scale?: boolean; // 缩放画布
    editText?: boolean; // 进入编辑文字状态如双击
    inputText?: boolean; // 编辑输入文字
    contextMenu?: boolean; // 右键菜单
    guides?: boolean; // 参考线功能
    editGeom?: boolean; // 编辑矢量
  };
};

const isWin = typeof navigator !== 'undefined' && /win/i.test(navigator.platform);

export default class Listener extends Event {
  options: ListenerOptions;
  state: State;
  root: Root;
  dom: HTMLElement;
  history: History;
  metaKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  spaceKey: boolean;
  middleKey: boolean;
  isMouseDown: boolean;
  isMouseMove: boolean;
  button: number;
  isControl: boolean; // resize等操作控制
  isRotate: boolean; // 拖转旋转节点
  controlType: CONTROL_TYPE; // 拖动尺寸dom时节点的class，区分比如左拉还是右拉
  originX: number;
  originY: number;
  startX: number;
  startY: number;
  pageTx: number;
  pageTy: number;
  centerX: number; // 单个节点拖转旋转时节点的中心
  centerY: number;
  selectRect?: Rect; // 多个节点拉伸时最初的选框信息
  dx: number; // 每次拖拽的px，考虑缩放和dpi，即为sketch内的单位
  dy: number;
  isFrame: boolean; // 点下时是否选中节点，没有则是框选
  select: Select; // 展示的选框dom
  selected: Node[]; // 已选的节点们
  abcStyle: Partial<Style>[][]; // 点击按下时已选artBoard（非resizeContent）下直接children的样式clone记录，拖动过程中用转换的px单位计算，拖动结束时还原
  computedStyle: ComputedStyle[]; // 点击按下时已选节点的值样式状态记录初始状态，拖动过程中对比计算
  clientRect?: Rect[]; // 和selectAr一样记录每个节点最初的选框信息
  originStyle: Style[]; // 同上
  cssStyle: JStyle[]; // 同上
  input: Input; // 输入文字dom和文本光标
  gradient: Gradient; // 渐变编辑控制
  geometry: Geometry;
  mouseDownArtBoard?: ArtBoard;
  mouseDown2ArtBoard?: Node;
  isWin = isWin;
  guides: Guides;
  clones: { parent: Container, node: Node }[];

  constructor(root: Root, dom: HTMLElement, options: ListenerOptions = {}) {
    super();
    this.options = options;
    this.state = State.NORMAL;
    this.root = root;
    this.dom = dom;
    this.history = new History();

    this.metaKey = false;
    this.shiftKey = false;
    this.ctrlKey = false;
    this.altKey = false;
    this.spaceKey = false;
    this.middleKey = false;

    this.isMouseDown = false;
    this.isMouseMove = false;
    this.button = 0;
    this.isControl = false;
    this.isRotate = false;
    this.controlType = CONTROL_TYPE.T;

    this.originX = 0;
    this.originY = 0;
    this.startX = 0;
    this.startY = 0;
    this.pageTx = 0;
    this.pageTy = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.dx = 0;
    this.dy = 0;
    this.isFrame = false;

    this.selected = [];
    this.abcStyle = [];
    this.computedStyle = [];
    this.originStyle = [];
    this.cssStyle = [];
    this.updateOrigin();

    this.select = new Select(root, dom);
    this.input = new Input(root, dom, this);
    this.guides = new Guides(root, dom, this);
    this.gradient = new Gradient(root, dom, this);
    this.geometry = new Geometry(root, dom, this);
    this.clones = [];

    dom.addEventListener('mousedown', this.onMouseDown.bind(this));
    dom.addEventListener('mousemove', this.onMouseMove.bind(this));
    dom.addEventListener('mouseup', this.onMouseUp.bind(this));
    dom.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    dom.addEventListener('touchstart', this.onTouchStart.bind(this));
    dom.addEventListener('touchmove', this.onTouchMove.bind(this));
    dom.addEventListener('touchend', this.onTouchEnd.bind(this));
    dom.addEventListener('click', this.onClick.bind(this));
    dom.addEventListener('dblclick', this.onDblClick.bind(this));
    dom.addEventListener('wheel', this.onWheel.bind(this));
    dom.addEventListener('contextmenu', this.onContextMenu.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  // 更新dom的位置做原点坐标，鼠标按下或touch按下时
  updateOrigin() {
    const o = this.dom.getBoundingClientRect();
    this.originX = o.left;
    this.originY = o.top;
  }

  active(nodes: Node[]) {
    this.selected.splice(0);
    this.selected.push(...nodes);
    this.updateActive();
    this.emit(Listener.SELECT_NODE, this.selected.slice(0));
  }

  updateActive() {
    this.computedStyle = this.selected.map((item) =>
      item.getComputedStyle(),
    );
    if (this.selected.length) {
      this.select.showSelect(this.selected);
    }
    else {
      this.select.hideSelect();
    }
  }

  // 调整前先锁住group，防止自适应，在mouseup整体结束后统一进行，text也要记住状态
  prepare() {
    const selected = this.selected;
    selected.forEach((node) => {
      this.toggleGroup(node, true);
    });
    this.computedStyle = selected.map((item) => item.getComputedStyle());
    this.originStyle = selected.map((item) => item.getStyle());
  }

  toggleGroup(node: Node, value = false) {
    const p = node.parent;
    if (p && p.isGroup && p instanceof Group) {
      p.fixedPosAndSize = value;
    }
  }

  // 封装getNodeByPoint，一般情况选择画板忽略
  getNode(x: number, y: number, isDbl = false) {
    let meta = this.metaKey || isWin && this.ctrlKey;
    if (this.options.enabled?.selectWithMeta) {
      meta = !meta;
    }
    let node = getNodeByPoint(
      this.root,
      x,
      y,
      meta,
      this.selected,
      isDbl,
    );
    if (node instanceof ArtBoard && node.children.length && !meta && !this.selected.includes(node)) {
      node = undefined;
    }
    return node;
  }

  beforeResize() {
    // 多个节点拉伸时，有一个保持宽高比，整体都需要，缩放是选框缩放，节点需保持相对框的位置，先记录初始信息
    if (this.selected.length > 1) {
      this.selectRect = this.select.getAspectRatio();
      this.clientRect = this.selected.map(item => {
        const r = item.getBoundingClientRect({
          excludeDpi: true,
        });
        return {
          x: r.left,
          y: r.top,
          w: r.width,
          h: r.height,
        };
      });
      // console.warn(this.selectRect, this.clientRect)
    }
    else {
      this.selectRect = undefined;
      this.clientRect = undefined;
    }
  }

  onDown(target: HTMLElement, e: MouseEvent | Touch) {
    const selected = this.selected;
    const isControl = this.select.isSelectControlDom(target);
    this.updateOrigin();
    const root = this.root;
    const dpi = root.dpi;
    // 操作开始清除
    this.originStyle.splice(0);
    this.cssStyle.splice(0);
    this.computedStyle.splice(0);
    this.dx = this.dy = 0;
    // 右键复用普通左键点击的部分逻辑，但要区分
    const isButtonRight = e instanceof MouseEvent && e.button === 2;
    // 点到控制html上
    if (isControl && !isButtonRight) {
      if (this.options.disabled?.resize) {
        return;
      }
      this.isControl = isControl;
      const controlType = this.controlType = {
        't': CONTROL_TYPE.T,
        'r': CONTROL_TYPE.R,
        'b': CONTROL_TYPE.B,
        'l': CONTROL_TYPE.L,
        'tl': CONTROL_TYPE.TL,
        'tr': CONTROL_TYPE.TR,
        'bl': CONTROL_TYPE.BL,
        'br': CONTROL_TYPE.BR,
      }[target.className]!;
      this.prepare();
      if (this.state === State.EDIT_TEXT) {
        this.cancelEditText();
      }
      // 旋转时记住中心坐标
      if (selected.length === 1 && (this.metaKey || isWin && this.ctrlKey)
        && !selected[0].isSlice && !(selected[0] instanceof Slice)
        && [CONTROL_TYPE.TL, CONTROL_TYPE.TR, CONTROL_TYPE.BL, CONTROL_TYPE.BR].indexOf(controlType) > -1) {
        const { points } = selected[0].getBoundingClientRect();
        const i = intersectLineLine(
          points[0].x, points[0].y, points[2].x, points[2].y,
          points[1].x, points[1].y, points[3].x, points[3].y,
        )!;
        this.centerX = i.x / dpi + this.originX;
        this.centerY = i.y / dpi + this.originY;
        this.isRotate = true;
      }
      else {
        this.abcStyle = selected.map((item) => {
          // resize画板children的定位尺寸临时变为固定px
          if (item.isArtBoard && item instanceof ArtBoard && !(item.props as ArtBoardProps).resizesContent) {
            return item.children.map((child) => {
              const { computedStyle, style } = child;
              const res = {
                left: clone(style.left),
                right: clone(style.right),
                top: clone(style.top),
                bottom: clone(style.bottom),
                width: clone(style.width),
                height: clone(style.height),
              };
              // 根据control的类型方向，决定将TRBL某个改为px固定值，对称方向改为auto
              if (controlType === CONTROL_TYPE.T || controlType === CONTROL_TYPE.TL || controlType === CONTROL_TYPE.TR) {
                if (style.bottom.u !== StyleUnit.PX) {
                  style.bottom.v = computedStyle.bottom;
                  style.bottom.u = StyleUnit.PX;
                }
                if (style.top.u !== StyleUnit.AUTO) {
                  style.top.u = StyleUnit.AUTO;
                }
              }
              else if (controlType === CONTROL_TYPE.B || controlType === CONTROL_TYPE.BL || controlType === CONTROL_TYPE.BR) {
                if (style.top.u !== StyleUnit.PX) {
                  style.top.v = computedStyle.top;
                  style.top.u = StyleUnit.PX;
                }
                if (style.bottom.u !== StyleUnit.AUTO) {
                  style.bottom.u = StyleUnit.AUTO;
                }
              }
              if (controlType === CONTROL_TYPE.L || controlType === CONTROL_TYPE.TL || controlType === CONTROL_TYPE.BL) {
                if (style.right.u !== StyleUnit.PX) {
                  style.right.v = computedStyle.right;
                  style.right.u = StyleUnit.PX;
                }
                if (style.left.u !== StyleUnit.AUTO) {
                  style.left.u = StyleUnit.AUTO;
                }
              }
              else if (controlType === CONTROL_TYPE.R || controlType === CONTROL_TYPE.TR || controlType === CONTROL_TYPE.BR) {
                if (style.left.u !== StyleUnit.PX) {
                  style.left.v = computedStyle.left;
                  style.left.u = StyleUnit.PX;
                }
                if (style.right.u !== StyleUnit.AUTO) {
                  style.right.u = StyleUnit.AUTO;
                }
              }
              // 尺寸一定会改固定
              if (style.width.u !== StyleUnit.PX) {
                style.width.v = computedStyle.width;
                style.width.u = StyleUnit.PX;
              }
              if (style.height.u !== StyleUnit.PX) {
                style.height.v = computedStyle.height;
                style.height.u = StyleUnit.PX;
              }
              return res;
            });
          }
          return [];
        });
        this.beforeResize();
      }
    }
    // 点到canvas上
    else {
      // 非按键多选情况下点击框内，视为移动，多选时选框一定是无旋转的
      if (selected.length > 1 && !(this.metaKey || isWin && this.ctrlKey) && !this.shiftKey) {
        const x = e.clientX;
        const y = e.clientY;
        const rect = this.select.select.getBoundingClientRect();
        if (x >= rect.left && y >= rect.top && x <= rect.right && y <= rect.bottom) {
          this.prepare();
          this.guides.initMove(this.select.select, selected);
          return;
        }
      }
      // 矢量编辑状态下空按下多选框选多个矢量顶点，非空按下为内移动顶点（geometry内部冒泡优先响应按下）
      if (this.state === State.EDIT_GEOM) {
        if (!this.geometry.idx.length) {
          this.isFrame = true;
        }
        return;
      }
      // 普通根据点击坐标获取节点逻辑
      const x = (e.clientX - this.originX) * dpi;
      const y = (e.clientY - this.originY) * dpi;
      let meta = this.metaKey || isWin && this.ctrlKey;
      if (this.options.enabled?.selectWithMeta) {
        meta = !meta;
      }
      let node = this.getNode(x, y);
      // 特殊的选择非空画板逻辑，mouseDown时不选择防止影响框选，mouseUp时才选择
      if (node instanceof ArtBoard && node.children.length && !selected.includes(node)) {
        if (meta) {
          // 如果已选的里面有此画板或者属于此画板，要忽略
          let ignore = false;
          for (let i = 0, len = selected.length; i < len; i++) {
            const item = selected[i];
            if (item === node || item.artBoard === node) {
              ignore = true;
              break;
            }
          }
          if (!ignore) {
            this.mouseDownArtBoard = node;
            node = undefined;
          }
        }
        else {
          node = undefined;
        }
      }
      // 看是否是overlay上的画板名
      else if (!node) {
        node = getOverlayArtBoardByPoint(root, x, y);
      }
      // 已选画板的情况，如果点下其内元素，暂时视为选择画板看后续移动，如果不移动，则onUp时选择此节点
      else if (node.artBoard && selected.includes(node.artBoard)) {
        this.mouseDown2ArtBoard = node;
        node = node.artBoard;
      }
      // 空选再拖拽则是框选行为，画一个长方形多选范围内的节点
      this.isFrame = !node;
      const oldSelected = selected.slice(0);
      if (node) {
        const i = selected.indexOf(node);
        // 点选已有节点，当编辑text且shift且点击当前text时，是选区
        if (i > -1) {
          if (this.shiftKey && (this.state !== State.EDIT_TEXT || selected[0] !== node)) {
            // 已选唯一相同节点，按shift不消失，是水平/垂直移动
            if (selected.length !== 1 || selected[0] !== node) {
              selected.splice(i, 1);
            }
          }
          else {
            // 持续编辑更新文本的编辑光标并提前退出
            if (this.state === State.EDIT_TEXT) {
              const text = selected[0] as Text;
              if (this.shiftKey) {
                text.setCursorEndByAbsCoords(x, y);
                text.inputStyle = undefined;
                this.input.hideCursor();
              }
              else {
                const { isMulti, start } = text.cursor;
                text.resetCursor();
                const p = text.setCursorStartByAbsCoords(x, y);
                this.input.updateCursor(p);
                this.input.showCursor();
                // 没有变化不触发事件
                if (text.cursor.isMulti === isMulti && text.cursor.start === start) {
                  return;
                }
              }
              this.emit(Listener.CURSOR_NODE, selected.slice(0));
              return;
            }
            // 唯一已选节点继续点击，不触发选择事件
            if (selected.length === 1 && selected[0] === node) {
              this.prepare();
              this.guides.initMove(this.select.select, selected);
              if (this.select.hoverNode) {
                this.select.hideHover();
                this.emit(Listener.UN_HOVER_NODE);
              }
              return;
            }
            selected.splice(0);
            selected.push(node);
          }
        }
        // 点选新节点
        else {
          if (!this.shiftKey) {
            selected.splice(0);
          }
          // 特殊的地方，即便按下shift，但如果已选画板内子元素去选画板将无视，已选画板去选其子元素将取消画板
          else {
            for (let i = selected.length - 1; i >= 0; i--) {
              const item = selected[i];
              if (node.isArtBoard && item.artBoard === node && node !== item) {
                return;
              }
              if (item.isArtBoard && node.artBoard === item && node !== item) {
                selected.splice(i, 1);
              }
            }
          }
          selected.push(node);
        }
      }
      else {
        // 没有选中节点，但当前在编辑某个文本节点时，变为非编辑选择状态，此时已选的就是唯一文本节点，不用清空
        if (this.state === State.EDIT_TEXT) {
          // 后面做
        }
        // 理论进不来因为gradient/geom的dom盖在上面点不到，点到也应该有节点
        else if ([State.EDIT_GRADIENT, State.EDIT_GEOM].includes(this.state)) {
          this.emit(Listener.SELECT_POINT, []);
        }
        else if (!this.shiftKey) {
          selected.splice(0);
        }
      }
      // 一定是退出文本的编辑状态，持续编辑文本在前面逻辑会提前跳出
      if (this.state === State.EDIT_TEXT) {
        this.cancelEditText(selected.length ? selected[0] : oldSelected[0]);
      }
      if (this.select.hoverNode) {
        this.select.hideHover();
        this.emit(Listener.UN_HOVER_NODE);
      }
      if (selected.length) {
        this.select.showSelect(selected);
      }
      else {
        this.select.hideSelect();
      }
      // 一直点选空白不选节点，防止重复触发
      if (oldSelected.length === 0 && selected.length === 0) {
        return;
      }
      // 旋转需记住节点中心坐标
      if ((this.metaKey || isWin && this.ctrlKey) && selected.length === 1) {
        this.select.metaKey(true);
      }
      this.prepare();
      this.guides.initMove(this.select.select, selected);
      this.emit(Listener.SELECT_NODE, selected.slice(0));
    }
  }

  onMouseDown(e: MouseEvent) {
    // e.preventDefault();
    // 只认第一个按下的键，防止重复冲突
    if (this.options.disabled?.select || this.isMouseDown) {
      return;
    }
    const root = this.root;
    const page = root.getCurPage();
    if (!page) {
      return;
    }
    this.button = e.button;
    // 右键菜单，忽略meta按下
    if (e.button === 2) {
      if ([State.EDIT_GRADIENT, State.EDIT_GEOM].includes(this.state)) {
        contextMenu.showOk(e.pageX, e.pageY, this);
        return;
      }
      if (this.metaKey || isWin && this.ctrlKey || this.state === State.EDIT_TEXT || this.options.disabled?.contextMenu) {
        return;
      }
      const target = e.target as HTMLElement;
      // 复用普通左键选择的部分逻辑
      this.onDown(target, e);
      contextMenu.showCanvas(e.pageX, e.pageY, this);
      return;
    }
    // 编辑gradient/geom按下无效（geom左键可以按下框选不无效），左键则取消编辑状态，但可以滚动
    if ([State.EDIT_GRADIENT, State.EDIT_GEOM].includes(this.state)) {
      if (e.button === 0 && !this.spaceKey) {
        if (this.state === State.EDIT_GRADIENT) {
          // 是否点在内部控制点上
          if (!this.gradient.keep) {
            this.cancelEditGradient();
          }
          return;
        }
      }
      // 拖拽设置keep防止窗口关闭
      else if (e.button === 1 || e.button === 0 && this.spaceKey) {
        if (this.state === State.EDIT_GRADIENT) {
          this.gradient.keep = true;
          picker.keep = true;
        }
        else {
          this.geometry.keep = true;
        }
      }
    }
    this.isMouseDown = true;
    this.isMouseMove = false;
    this.startX = e.clientX;
    this.startY = e.clientY;
    if (e.button === 1) {
      this.middleKey = true;
    }
    // 空格或中间移动画布
    if (e.button === 0 && this.spaceKey || this.middleKey) {
      const o = page.getComputedStyle();
      this.pageTx = o.translateX;
      this.pageTy = o.translateY;
      this.dom.style.cursor = 'grabbing';
    }
    // 普通按下是选择节点或者编辑文本
    else if (!this.spaceKey) {
      const target = e.target as HTMLElement;
      this.onDown(target, e);
    }
  }

  onMove(e: MouseEvent | Touch, isTouch: boolean) {
    const root = this.root;
    const page = root.getCurPage();
    if (!page) {
      return;
    }
    if ([State.EDIT_GRADIENT].includes(this.state)) {
      return;
    }
    const dpi = root.dpi;
    let dx = e.clientX - this.startX; // 外部页面单位
    let dy = e.clientY - this.startY;
    const zoom = page.getZoom();
    let dx2 = this.dx = Math.round(dx * dpi / zoom); // 画布内sketch单位
    let dy2 = this.dy = Math.round(dy * dpi / zoom);
    const selected = this.selected;
    // 操作控制尺寸的时候，已经mousedown了
    if (this.isControl) {
      // 特殊单个节点旋转操控，知道节点中心坐标，点击初始坐标，移动后坐标，3点确定三角形，余弦定理求夹角
      if (this.isRotate) {
        const cx = this.centerX - this.originX;
        const cy = this.centerY - this.originY;
        const ax = this.startX - this.originX;
        const ay = this.startY - this.originY;
        const bx = e.clientX - this.originX;
        const by = e.clientY - this.originY;
        const r = angleBySides(
          Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2)),
          Math.sqrt(Math.pow(cx - bx, 2) + Math.pow(cy - by, 2)),
          Math.sqrt(Math.pow(ax - cx, 2) + Math.pow(ay - cy, 2)),
        );
        let deg = r2d(r);
        // 知道角度后需确定顺逆时针方向
        const c = crossProduct(
          ax - cx, ay - cy,
          bx - cx, by - cy,
        );
        if (this.shiftKey) {
          for (let i = 0; i <= 180; i+= 15) {
            if (Math.abs(deg - i) <= 7.5) {
              deg = i;
              break;
            }
          }
        }
        const node = selected[0];
        const rotateZ = (this.computedStyle[0].rotateZ + deg * (c >= 0 ? 1 : -1)) % 360;
        node.updateStyle({
          rotateZ,
        });
        this.select.updateSelect(selected);
        this.emit(Listener.ROTATE_NODE, selected.slice(0));
      }
      // 普通的节点拉伸
      else {
        let shift = this.shiftKey;
        if (!shift) {
          // 有一个是固定宽高比的，整体都是
          for (let i = 0, len = selected.length; i < len; i++) {
            if (selected[i].props.constrainProportions) {
              shift = true;
              break;
            }
          }
        }
        let alt = this.altKey;
        if (this.options.enabled?.resizeWithAlt) {
          alt = !alt;
        }
        const controlType = this.controlType;
        selected.forEach((node, i) => {
          // 改变尺寸前置记录操作，注意更新computedStyle（startSizeChange变更了），影响计算
          if (!this.isMouseMove) {
            node.startSizeChange();
            this.computedStyle[i] = node.getComputedStyle();
            this.cssStyle[i] = node.getCssStyle();
          }
          const computedStyle = this.computedStyle[i];
          const cssStyle = this.cssStyle[i];
          // 多个节点拉伸时，按选框进行缩放和保持相对位置
          if (this.selectRect && this.clientRect && this.clientRect[i]) {
            ResizeCommand.updateStyleMultiAr(node, computedStyle, cssStyle, dx2, dy2, controlType, this.clientRect[i], this.selectRect, shift, alt);
          }
          // 普通拉伸
          else {
            ResizeCommand.updateStyle(node, computedStyle, cssStyle, dx2, dy2, controlType, shift, alt);
          }
        });
        this.isMouseMove = true;
        this.select.updateSelect(selected);
        this.emit(Listener.RESIZE_NODE, selected.slice(0));
      }
    }
    // 先看是否编辑文字决定选择一段文本，再看是否有选择节点决定是拖拽节点还是多选框
    else if (this.isMouseDown) {
      if (this.state === State.EDIT_TEXT) {
        const x = (e.clientX - this.originX) * dpi;
        const y = (e.clientY - this.originY) * dpi;
        const text = selected[0] as Text;
        const { isMulti, start, end } = text.cursor;
        text.setCursorEndByAbsCoords(x, y);
        this.input.hideCursor();
        const cursor = text.cursor;
        if (isMulti !== cursor.isMulti || start !== cursor.start || end !== cursor.end) {
          this.emit(Listener.CURSOR_NODE, selected.slice(0));
        }
      }
      else {
        if (this.options.disabled?.move) {
          return;
        }
        // 矢量编辑也特殊，框选发生在没按下矢量点并移动
        if (this.isFrame) {
          if (!this.isMouseMove) {
            this.select.showFrame(this.startX - this.originX, this.startY - this.originY, dx, dy);
          }
          else {
            this.select.updateFrame(dx, dy);
          }
          this.isMouseMove = true;
          const x = (this.startX - this.originX) * dpi;
          const y = (this.startY - this.originY) * dpi;
          let meta = this.metaKey || isWin && this.ctrlKey;
          if (this.options.enabled?.selectWithMeta) {
            meta = !meta;
          }
          // 矢量顶点框选，不关闭矢量面板
          if (this.state === State.EDIT_GEOM) {
            this.geometry.keep = true;
            const node = this.geometry.node;
            if (node instanceof Polyline) {
              const res = getFrameVertexes(node, x, y, x + dx * dpi, y + dy * dpi);
              const geometry = this.geometry;
              if (res.join(',') !== geometry.idx.join(',')) {
                geometry.idx.splice(0);
                geometry.clearCur();
                res.forEach(i => {
                  this.geometry.idx.push(i);
                  const div = geometry.panel.querySelector(`.vt[title="${i}"]`) as HTMLElement;
                  div.classList.add('cur');
                });
                this.emit(Listener.SELECT_POINT, res);
              }
            }
            return;
          }
          const res = getFrameNodes(root, x, y, x + dx * dpi, y + dy * dpi, meta);
          const old = selected.splice(0);
          selected.push(...res);
          // 已选择的没变优化
          let change = old.length !== selected.length;
          if (!change) {
            for (let i = 0, len = old.length; i < len; i++) {
              if (old[i] !== selected[i]) {
                change = true;
              }
            }
          }
          if (change) {
            if (res.length) {
              this.select.showSelect(selected);
            }
            else {
              this.select.hideSelect();
            }
            this.emit(Listener.SELECT_NODE, selected.slice(0));
          }
        }
        else {
          if (this.state === State.EDIT_GEOM) {
            return;
          }
          this.select.select.classList.add('move');
          // 水平/垂直
          if (this.shiftKey) {
            if (Math.abs(dx2) >= Math.abs(dy2)) {
              this.dy = dy = dy2 = 0;
            }
            else {
              this.dx = dx = dx2 = 0;
            }
          }
          // 吸附参考线功能
          if (!this.options.disabled?.guides) {
            const meta = this.metaKey || isWin && this.ctrlKey;
            if (!meta) {
              const snap = this.guides.snapMove(dx, dy, dpi / zoom);
              if (snap) {
                this.dx = dx2 += snap.x * dpi / zoom;
                this.dy = dy2 += snap.y * dpi / zoom;
              }
            }
            else {
              this.guides.hide();
            }
          }
          selected.forEach((node, i) => {
            const computedStyle = this.computedStyle[i];
            /**
             * 这里用computedStyle的translate差值做计算，得到当前的translate的px值updateStyle给node，
             * 在node的calMatrix那里是优化过的计算方式，只有translate变更的话也是只做差值计算，更快。
             * 需要注意目前matrix的整体计算是将布局信息TRLB换算为translate，因此style上的原始值和更新的这个px值并不一致，
             * 结束拖动调用endPosChange()将translate写回布局TRLB的style上满足定位要求。
             */
            const oldAb = node.artBoard;
            const ab = MoveCommand.update(node, computedStyle, dx2, dy2);
            if (oldAb !== ab) {
              this.emit(Listener.ART_BOARD_NODE, [node]);
            }
          });
          this.select.updateSelect(selected);
          this.emit(Listener.MOVE_NODE, selected.slice(0));
        }
      }
      this.isMouseMove = true;
    }
    // 普通的hover，仅mouseEvent有
    else if (!isTouch) {
      if (this.options.disabled?.hover) {
        return;
      }
      // 因为用到offsetXY，避免是其它DOM触发的（如select上的html），防止不正确
      const target = e.target as HTMLElement;
      if (target.tagName.toUpperCase() !== 'CANVAS' && target !== this.dom) {
        if (this.select.hoverNode) {
          this.select.hideHover();
          this.emit(Listener.UN_HOVER_NODE);
        }
        return;
      }
      // mousemove时可以用offsetXY直接获取坐标无需关心dom位置原点等
      this.startX = (e as MouseEvent).offsetX;
      this.startY = (e as MouseEvent).offsetY;
      const x = this.startX * dpi;
      const y = this.startY * dpi;
      this.hover(x, y);
    }
  }

  onMouseMove(e: MouseEvent) {
    const root = this.root;
    const dpi = root.dpi;
    const selected = this.selected;
    // 空格或中键拖拽画布
    if (this.spaceKey || this.middleKey) {
      if (this.isMouseDown) {
        if (this.options.disabled?.drag) {
          return;
        }
        this.select.hideHover();
        this.isMouseMove = true;
        const page = root.getCurPage();
        if (page) {
          const dx = e.clientX - this.startX;
          const dy = e.clientY - this.startY;
          page.updateStyle({
            translateX: this.pageTx + dx,
            translateY: this.pageTy + dy,
          });
          if (selected.length) {
            this.select.updateSelect(selected);
          }
          if (this.state === State.EDIT_GRADIENT) {
            this.gradient.updatePos();
          }
          else if (this.state === State.EDIT_GEOM) {
            this.geometry.updatePos();
          }
        }
      }
      else {
        if (this.options.disabled?.hover) {
          return;
        }
        // 因为用到offsetXY，避免是其它DOM触发的（如select上的html），防止不正确
        const target = e.target as HTMLElement;
        if (target.tagName.toUpperCase() !== 'CANVAS') {
          return;
        }
        // mousemove时可以用offsetXY直接获取坐标无需关心dom位置原点等
        let node = this.getNode(
          e.offsetX * dpi,
          e.offsetY * dpi,
        );
        if (node) {
          if (selected.indexOf(node) === -1) {
            this.select.showHover(node);
          }
          this.emit(Listener.HOVER_NODE, node);
        }
        else if (this.select.hoverNode) {
          this.select.hideHover();
          this.emit(Listener.UN_HOVER_NODE);
        }
      }
    }
    // 其它看情况点选
    else {
      this.onMove(e, false);
    }
  }

  onMouseUp(e?: MouseEvent) {
    // 限制了只能按下一个鼠标键防止冲突
    if (e && e.button !== this.button) {
      return;
    }
    const selected = this.selected;
    // 调整之前锁住的group，结束后统一进行解锁
    selected.forEach(node => {
      this.toggleGroup(node, false);
    });
    if (this.isControl) {
      this.isControl = false;
      if (this.isRotate) {
        this.isRotate = false;
        const node = selected[0];
        this.history.addCommand(new RotateCommand([node], [{
          prev: {
            rotateZ: this.computedStyle[0].rotateZ,
          },
          next: {
            rotateZ: node.computedStyle.rotateZ,
          },
        }]), true);
        if (!(this.metaKey || isWin && this.ctrlKey)) {
          this.select.metaKey(false);
        }
      }
      else {
        const { dx, dy } = this;
        // 还原artBoard的children为初始值，只有操作画板时才有，普通节点是空[]
        this.abcStyle.forEach((item, i) => {
          if (item.length) {
            const node = selected[i] as ArtBoard;
            const children = node.children;
            item.forEach((abcStyle, i) => {
              const style = children[i].style;
              ['left', 'right', 'top', 'bottom', 'width', 'height'].forEach((k) => {
                const o = abcStyle[k as keyof Style];
                // @ts-ignore
                style[k].v = o.v;
                // @ts-ignore
                style[k].u = o.u;
              });
            });
          }
        });
        if (this.isMouseMove) {
          let shift = this.shiftKey;
          if (!shift) {
            // 有一个是固定宽高比的，整体都是
            for (let i = 0, len = selected.length; i < len; i++) {
              if (selected[i].props.constrainProportions) {
                shift = true;
                break;
              }
            }
          }
          let alt = this.altKey;
          if (this.options.enabled?.resizeWithAlt) {
            alt = !alt;
          }
          const controlType = this.controlType;
          const data: ResizeData[] = [];
          selected.forEach((node, i) => {
            // 还原最初的translate/TRBL值，就算没移动也要还原，因为可能是移动后恢复原位，或者translate单位改变
            node.endSizeChange(this.originStyle[i]);
            if (dx || dy) {
              node.checkPosSizeUpward();
              const rd: ResizeData = { dx, dy, controlType, aspectRatio: shift, clientRect: this.clientRect && this.clientRect[i], selectRect: this.selectRect, fromCenter: alt };
              const originStyle = this.originStyle[i];
              if (originStyle.width.u === StyleUnit.AUTO) {
                rd.widthFromAuto = true;
              }
              if (originStyle.height.u === StyleUnit.AUTO) {
                rd.heightFromAuto = true;
              }
              if (this.computedStyle[i].scaleX !== node.computedStyle.scaleX) {
                rd.flipX = true;
              }
              if (this.computedStyle[i].scaleY !== node.computedStyle.scaleY) {
                rd.flipY = true;
              }
              data.push(rd);
            }
          });
          if (data.length) {
            this.history.addCommand(new ResizeCommand(selected.slice(0), data));
          }
        }
      }
    }
    else if (this.isMouseMove) {
      // 编辑文字检查是否选择了一段文本，普通则是移动选择节点
      if (this.state === State.EDIT_TEXT) {
        if (this.options.disabled?.inputText) {
          return;
        }
        const text = selected[0] as Text;
        const multi = text.checkCursorMulti();
        // 可能框选的文字为空不是多选，需取消
        if (!multi) {
          this.input.updateCursor();
          this.input.showCursor();
        }
        else {
          this.input.hideCursor();
        }
        this.input.focus();
      }
      else if ([State.EDIT_GRADIENT].includes(this.state)) {
        // 啥也不做
      }
      else if (this.isFrame) {
        this.select.hideFrame();
      }
      else {
        this.guides.hide();
        this.select.select.classList.remove('move');
        const { dx, dy } = this;
        const data: MoveData[] = [];
        selected.forEach((node, i) => {
          // 还原最初的translate/TRBL值，就算没移动也要还原，因为可能是移动后恢复原位，或者translate单位改变
          node.endPosChange(this.originStyle[i], dx, dy);
          if (dx || dy) {
            node.checkPosSizeUpward();
            data.push({ dx, dy });
          }
        });
        if (data.length) {
          this.history.addCommand(new MoveCommand(selected.slice(0), data), true);
        }
      }
    }
    // 特殊的选择画板逻辑，mouseDown时不选择防止影响框选，mouseUp时才选择，shift校验在down时做
    else if (this.mouseDownArtBoard) {
      if (!this.shiftKey) {
        selected.splice(0);
      }
      selected.push(this.mouseDownArtBoard);
      this.select.hideHover();
      this.select.showSelect(selected);
      this.prepare();
      this.emit(Listener.SELECT_NODE, selected.slice(0));
    }
    // 同上，不过shift时无法选择，因为其位于所选画板内部
    else if (this.mouseDown2ArtBoard && !this.shiftKey) {
      selected.splice(0);
      selected.push(this.mouseDown2ArtBoard);
      this.select.hideHover();
      this.select.showSelect(selected);
      this.prepare();
      this.emit(Listener.SELECT_NODE, selected.slice(0));
    }
    this.isMouseDown = false;
    this.isMouseMove = false;
    this.mouseDownArtBoard = undefined;
    this.mouseDown2ArtBoard = undefined;
    this.isFrame = false;
    this.middleKey = false;
    if (this.spaceKey || this.middleKey) {
      if (this.options.disabled?.drag) {
        return;
      }
      this.dom.style.cursor = 'grab';
    }
    else {
      this.dom.style.cursor = 'auto';
    }
  }

  onMouseLeave() {
    if (this.select.hoverNode) {
      this.select.hideHover();
      this.emit(Listener.UN_HOVER_NODE);
    }
    // 离屏需终止当前操作
    if (this.isMouseDown || this.isControl) {
      this.onMouseUp();
    }
  }

  onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) {
      return;
    }
    const touch = e.touches[0];
    this.isMouseDown = true;
    this.isMouseMove = false;
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    const target = e.target as HTMLElement;
    this.onDown(target, touch);
  }

  onTouchMove(e: TouchEvent) {
    if (e.touches.length !== 1) {
      return;
    }
    this.onMove(e.touches[0], true);
  }

  onTouchEnd() {
    this.onMouseUp();
  }

  onClick(e: MouseEvent) {
  }

  onDblClick(e: MouseEvent) {
    const root = this.root;
    const page = root.getCurPage();
    if (!page) {
      return;
    }
    const dpi = root.dpi;
    let node = this.getNode(
      (e.clientX - this.originX) * dpi,
      (e.clientY - this.originY) * dpi,
      true,
    );
    // 忽略画板
    if (node && !(node instanceof ArtBoard)) {
      if (this.selected.length !== 1 || node !== this.selected[0]) {
        if (this.options.disabled?.select) {
          return;
        }
        this.selected.splice(0);
        this.selected.push(node);
        this.select.showSelect(this.selected);
      }
      if (node instanceof Text) {
        if (this.options.disabled?.editText) {
          return;
        }
        this.input.show(
          node,
          e.clientX - this.originX,
          e.clientY - this.originY,
        );
        node.beforeEdit();
        this.state = State.EDIT_TEXT;
        this.emit(Listener.STATE_CHANGE, State.NORMAL, this.state);
      }
      else if (node instanceof Polyline) {
        if (this.options.disabled?.editGeom) {
          return;
        }
        this.select.hideSelect();
        this.geometry.show(node);
        this.state = State.EDIT_GEOM;
        this.emit(Listener.STATE_CHANGE, State.NORMAL, this.state);
      }
      this.emit(Listener.SELECT_NODE, this.selected.slice(0));
    }
  }

  onWheel(e: WheelEvent) {
    e.preventDefault();
    const root = this.root;
    const { dpi, width, height } = root;
    const page = root.getCurPage();
    if (!page) {
      return;
    }
    this.select.hideHover();
    // 按下时缩放
    if (e.ctrlKey || e.metaKey) {
      if (this.options.disabled?.scale) {
        return;
      }
      let deltaY = e.deltaY;
      // 来源于手势，数值和滚轮比会很小
      if (e.ctrlKey && !e.metaKey) {
        deltaY *= 50;
      }
      let sc = 0;
      if (deltaY < 0) {
        if (deltaY < -300) {
          sc = 0.2;
        }
        else if (deltaY < -200) {
          sc = 0.1;
        }
        else if (deltaY < -100) {
          sc = 0.05;
        }
        else if (deltaY < -50) {
          sc = 0.02;
        }
        else {
          sc = 0.01;
        }
      }
      else if (deltaY > 0) {
        if (deltaY > 300) {
          sc = -0.2;
        }
        else if (deltaY > 200) {
          sc = -0.1;
        }
        else if (deltaY > 100) {
          sc = -0.05;
        }
        else if (deltaY > 50) {
          sc = -0.02;
        }
        else {
          sc = -0.01;
        }
      }
      const x = (e.clientX - this.originX) * dpi / width;
      const y = (e.clientY - this.originY) * dpi / height;
      let scale = page.getZoom(true);
      // 最后缩小时防止太快
      if (scale < 1) {
        sc *= scale;
      }
      // 最小值兜底防止不动了
      if (sc < 0 && sc > -0.01) {
        sc = -0.01;
      }
      else if (sc > 0 && sc < 0.01) {
        sc = 0.01;
      }
      scale += sc;
      if (scale > 32) {
        scale = 32;
      }
      else if (scale < 0.01) {
        scale = 0.01;
      }
      scale = toPrecision(scale);
      root.zoomTo(scale, x, y);
      this.emit(Listener.ZOOM_PAGE, scale);
    }
    else {
      if (this.options.disabled?.drag) {
        return;
      }
      const { translateX, translateY } = page.getComputedStyle();
      page.updateStyle({
        translateX: translateX - e.deltaX,
        translateY: translateY - e.deltaY,
      });
    }
    this.updateSelected();
    this.updateInput();
    this.updateGradient();
    this.updateGeom();
  }

  zoom(factor: number) {
    const root = this.root;
    const page = root.getCurPage();
    if (!page) {
      return;
    }
    let scale = page.getZoom(true);
    scale *= factor;
    if (scale > 32) {
      scale = 32;
    }
    else if (scale < 0.01) {
      scale = 0.01;
    }
    scale = toPrecision(scale);
    root.zoomTo(scale, 0.5, 0.5);
    this.updateSelected();
    this.updateInput();
    this.updateGradient();
    this.updateGeom();
    this.emit(Listener.ZOOM_PAGE, scale);
  }

  zoomTo(scale: number, cx = 0.5, cy = 0.5) {
    const root = this.root;
    const page = root.getCurPage();
    if (!page) {
      return;
    }
    page.zoomTo(scale, cx, cy);
    this.updateSelected();
    this.updateInput();
    this.updateGradient();
    this.updateGeom();
    this.emit(Listener.ZOOM_PAGE, scale);
  }

  zoomActual() {
    if (this.root.zoomActual()) {
      this.emit(Listener.ZOOM_PAGE, this.root.getCurPageZoom());
    }
  }

  zoomFit() {
    if (this.root.zoomFit()) {
      this.emit(Listener.ZOOM_PAGE, this.root.getCurPageZoom());
    }
  }

  selectAll() {
    const root = this.root;
    const page = root.getCurPage();
    if (!page) {
      return;
    }
    let meta = this.metaKey || isWin && this.ctrlKey;
    if (this.options.enabled?.selectWithMeta) {
      meta = !meta;
    }
    const res = getFrameNodes(root, 0, 0, root.width, root.height, meta);
    this.active(res);
    this.emit(Listener.SELECT_NODE, res.slice(0));
  }

  group(nodes = this.selected) {
    if (nodes.length) {
      const { data, group } = GroupCommand.operate(nodes);
      if (group) {
        const nodes = this.selected.slice(0);
        this.selected.splice(0);
        this.selected.push(group);
        this.select.updateSelect(this.selected);
        this.history.addCommand(new GroupCommand(nodes, data, group));
        this.emit(Listener.GROUP_NODE, [group], [nodes.slice(0)]);
      }
    }
  }

  unGroup(nodes = this.selected) {
    const groups = nodes.filter(item => item instanceof Group);
    if (groups.length) {
      const res = UnGroupCommand.operate(groups);
      this.selected.splice(0);
      res.forEach(item => {
        this.selected.push(...item.children);
      });
      this.select.updateSelect(this.selected);
      this.history.addCommand(new UnGroupCommand(groups.slice(0), res.map(item => {
        return {
          parent: item.parent,
          children: item.children,
        }
      })));
      this.emit(Listener.UN_GROUP_NODE, res.map(item => item.children.slice(0)), groups);
    }
  }

  mask(value: 'none' | 'outline' | 'alpha' | 'gray' | 'alpha-with' | 'gray-with', nodes = this.selected) {
    if (nodes.length) {
      const prevs: MaskModeStyle[] = [];
      nodes.forEach(item => {
        const prev = ['none', 'outline', 'alpha', 'gray', 'alpha-with', 'gray-with']
          [item.computedStyle.maskMode] as 'none' | 'outline' | 'alpha' | 'gray' | 'alpha-with' | 'gray-with';
        prevs.push({
          maskMode: prev,
        });
        item.updateStyle({
          maskMode: value,
        });
      });
      this.history.addCommand(new MaskModeCommand(nodes.slice(0), prevs.map(prev => {
        return {
          prev,
          next: {
            maskMode: value,
          },
        };
      })));
      this.emit(Listener.MASK_NODE, nodes.slice(0));
    }
  }

  breakMask(value: boolean, nodes = this.selected) {
    if (nodes.length) {
      const prevs: BreakMaskStyle[] = [];
      nodes.forEach(item => {
        prevs.push({
          breakMask: item.computedStyle.breakMask,
        });
        item.updateStyle({
          breakMask: value,
        });
      });
      this.history.addCommand(new BreakMaskCommand(nodes.slice(0), prevs.map(prev => {
        return {
          prev,
          next: {
            breakMask: value,
          },
        };
      })));
      this.emit(Listener.BREAK_MASK_NODE, nodes.slice(0));
    }
  }

  lock(value: boolean, nodes = this.selected) {
    if (nodes.length) {
      const prevs: boolean[] = [];
      nodes.forEach((item, i) => {
        prevs.push(!!item.props.isLocked);
        item.props.isLocked = value;
      });
      this.history.addCommand(new LockCommand(nodes.slice(0), prevs.map((item) => {
        return {
          prev: item,
          next: value,
        };
      })));
      this.emit(Listener.LOCK_NODE, nodes.slice(0));
    }
  }

  visible(value: 'visible' | 'hidden', nodes = this.selected) {
    if (nodes.length) {
      const prevs: ('visible' | 'hidden')[] = [];
      nodes.forEach(item => {
        prevs.push(item.computedStyle.visibility === VISIBILITY.VISIBLE ? 'visible' : 'hidden');
        item.updateStyle({
          visibility: value,
        });
      });
      this.history.addCommand(new VisibleCommand(nodes.slice(0), prevs.map((item) => {
        return {
          prev: {
            visibility: item,
          },
          next: {
            visibility: value,
          },
        };
      })));
      this.updateActive();
      this.emit(Listener.VISIBLE_NODE, nodes.slice(0));
    }
  }

  rename(nodes = this.selected, names: string[]) {
    this.history.addCommand(new RenameCommand(nodes.slice(0), nodes.map((item, i) => {
      const prev = item.props.name || '';
      const next = names[i];
      item.props.name = next;
      return {
        prev,
        next,
      };
    })));
    this.emit(Listener.RENAME_NODE, nodes.slice(0));
  }

  remove(nodes = this.selected) {
    if (nodes.length) {
      const sel = nodes.slice(0);
      const nodes2 = nodes.splice(0).map(item => {
        let p = item;
        while (p) {
          if (p.parent && p.parent.isGroup && p.parent instanceof Group && p.parent.children.length === 1) {
            p = p.parent;
          }
          else {
            break;
          }
        }
        return p;
      });
      const data: RemoveData[] = [];
      nodes2.forEach((item, i) => {
        const o = RemoveCommand.operate(item);
        if (item !== sel[i]) {
          data.push({
            ...o,
            selected: sel[i],
          });
        }
        else {
          data.push(o);
        }
      });
      this.select.hideSelect();
      this.history.addCommand(new RemoveCommand(nodes2, data));
      this.emit(Listener.REMOVE_NODE, nodes2.slice(0));
    }
  }

  clone(nodes = this.selected) {
    if (nodes.length) {
      this.clones = nodes.map(item => ({
        parent: item.parent!,
        node: item.clone(),
      }));
    }
  }

  paste(nodes = this.clones) {
    if (nodes.length) {
      const nodes2: Node[] = [];
      const data: AddData[] = [];
      nodes.forEach(item => {
        // 因为和原节点index相同，所以会被添加到其后面，并重设索引
        const o = {
          x: item.node.computedStyle.left,
          y: item.node.computedStyle.top,
          parent: item.parent,
        };
        appendWithPosAndSize(item.node, o, true);
        nodes2.push(item.node);
        data.push(o);
      });
      if (nodes2.length) {
        this.history.addCommand(new AddCommand(nodes2, data));
        this.selected = nodes2.slice(0);
        this.updateActive();
        this.emit(Listener.ADD_NODE, nodes2.slice(0));
      }
    }
  }

  hover(x: number, y: number) {
    let node = this.getNode(x, y);
    if (!node) {
      node = getOverlayArtBoardByPoint(this.root, x, y);
    }
    if (node) {
      if (this.selected.indexOf(node) === -1 && this.select.hoverNode !== node) {
        this.select.showHover(node);
        this.emit(Listener.HOVER_NODE, node);
      }
      else if (this.selected.indexOf(node) > -1 && this.select.hoverNode) {
        this.select.hideHover();
        this.emit(Listener.UN_HOVER_NODE);
      }
    }
    else if (this.select.hoverNode) {
      this.select.hideHover();
      this.emit(Listener.UN_HOVER_NODE);
    }
  }

  onKeyDown(e: KeyboardEvent) {
    const meta = this.metaKey;
    const ctrl = this.ctrlKey;
    this.metaKey = e.metaKey;
    this.altKey = e.altKey;
    this.ctrlKey = e.ctrlKey;
    this.shiftKey = e.shiftKey;
    const page = this.root.getCurPage();
    if (!page) {
      return;
    }
    const metaKey = (this.metaKey || isWin && this.ctrlKey);
    if (metaKey && this.selected.length === 1
      && !this.selected[0].isSlice && !(this.selected[0] instanceof Slice)) {
      this.select.metaKey(true);
    }
    if ((meta !== this.metaKey || isWin && ctrl !== this.ctrlKey) && !this.isMouseDown) {
      const dpi = this.root.dpi;
      const x = this.startX * dpi;
      const y = this.startY * dpi;
      this.hover(x, y);
    }
    const { keyCode, code } = e;
    // console.log(keyCode, code);
    const target = e.target as HTMLElement; // 忽略输入时
    const isInput = ['INPUT', 'TEXTAREA'].includes(target.tagName.toUpperCase());
    // backspace/delete
    if (keyCode === 8 || keyCode === 46 || code === 'Backspace' || code === 'Delete') {
      // 忽略输入时
      if (!isInput && !this.options.disabled?.remove) {
        this.remove();
      }
    }
    // space
    else if (keyCode === 32 || code === 'Space') {
      this.spaceKey = true;
      if (!this.isMouseDown && !this.options.disabled?.drag) {
        // 拖拽矢量点特殊icon不变手
        if (this.state !== State.EDIT_GEOM || !this.geometry.idx.length) {
          this.dom.style.cursor = 'grab';
        }
      }
    }
    // option+esc
    else if ((keyCode === 27 || code === 'Escape') && this.altKey) {
      if (this.selected.length) {
        let node = this.selected[0];
        if (node instanceof Page || node instanceof Root || node instanceof ArtBoard) {
          return;
        }
        node = node.parent!;
        this.selected.splice(0);
        this.selected.push(node);
        this.select.updateSelect(this.selected);
        this.emit(Listener.SELECT_NODE, this.selected.slice(0));
      }
    }
    // esc，优先隐藏颜色picker，再编辑文字回到普通，普通取消选择
    else if (keyCode === 27 || code === 'Escape') {
      contextMenu.hide();
      if (picker.isShow()) {
        picker.hide();
        if (this.state === State.EDIT_GRADIENT) {
          this.select.showSelectNotUpdate();
          this.state = State.NORMAL;
          this.emit(Listener.STATE_CHANGE, State.EDIT_GRADIENT, this.state);
        }
        else if (this.state === State.EDIT_GEOM) {
          this.select.showSelect(this.selected);
          this.state = State.NORMAL;
          this.emit(Listener.STATE_CHANGE, State.EDIT_GEOM, this.state);
        }
        else if (this.state === State.EDIT_TEXT) {
          this.input.focus();
        }
      }
      else if (this.state === State.EDIT_TEXT) {
        this.cancelEditText();
      }
      else {
        this.selected.splice(0);
        this.select.hideSelect();
        this.select.hideHover();
        this.emit(Listener.SELECT_NODE, this.selected.slice(0));
      }
    }
    // 移动
    else if (keyCode >= 37 && keyCode <= 40 || ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(code)) {
      const target = e.target as HTMLElement;
      if (target && !['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName.toUpperCase())) {
        e.preventDefault();
        const nodes = this.selected.slice(0);
        const data: MoveData[] = [];
        const changeAb: Node[] = [];
        nodes.forEach((node) => {
          const originStyle = node.getStyle();
          const oldAb = node.artBoard;
          let ab;
          let x = 0;
          let y = 0;
          if (keyCode === 37) {
            x = this.shiftKey ? -10 : -1;
          }
          else if (keyCode === 38) {
            y = this.shiftKey ? -10 : -1;
          }
          else if (keyCode === 39) {
            x = this.shiftKey ? 10 : 1;
          }
          else if (keyCode === 40) {
            y = this.shiftKey ? 10 : 1;
          }
          ab = MoveCommand.update(node, node.computedStyle, x, y);
          if (oldAb !== ab) {
            changeAb.push(node);
          }
          node.endPosChange(originStyle, x, y);
          data.push({ dx: x, dy: y });
          node.checkPosSizeUpward();
        });
        if (changeAb.length) {
          this.emit(Listener.ART_BOARD_NODE, changeAb);
        }
        if (nodes.length) {
          this.select.updateSelect(nodes);
          this.emit(Listener.MOVE_NODE, nodes.slice(0));
          this.history.addCommand(new MoveCommand(nodes, data));
        }
      }
    }
    // a全选
    else if ((keyCode === 65 || code === 'KeyA') && metaKey) {
      const target = e.target as HTMLElement;
      // 编辑文字状态特殊处理
      if (this.state === State.EDIT_TEXT && target === this.input.inputEl) {
        e.preventDefault();
        this.input.node!.selectAll();
        this.input.hideCursor();
      }
      else if (target && !isInput) {
        e.preventDefault();
        this.selectAll();
      }
    }
    // c复制/x剪切
    else if ((keyCode === 67 || code === 'KeyC' || keyCode === 88 || code === 'KeyX') && metaKey) {
      if (!isInput) {
        this.clone();
        if ((keyCode === 88 || code === 'KeyX') && !this.options.disabled?.remove) {
          this.remove();
        }
      }
    }
    // v粘帖
    else if ((keyCode === 86 || code === 'KeyV') && metaKey) {
      if (!isInput && this.clones.length) {
        this.paste();
      }
    }
    // +
    else if ((keyCode === 187 || code === 'Equal') && metaKey) {
      e.preventDefault();
      this.zoom(2);
    }
    // -
    else if ((keyCode === 189 || code === 'Minus') && metaKey) {
      e.preventDefault();
      this.zoom(0.5);
    }
    // z，undo/redo
    else if ((keyCode === 90 || code === 'KeyZ') && metaKey) {
      const target = e.target as HTMLElement;
      if (target && isInput) {
        e.preventDefault();
      }
      let c: AbstractCommand | undefined;
      if (this.shiftKey) {
        c = this.history.redo();
      }
      else {
        c = this.history.undo();
      }
      if (c) {
        const nodes = c.nodes.slice(0);
        // 移除和编组特殊自己判断，矢量编辑不需要，其它自动更新selected
        if (!(c instanceof RemoveCommand) && !(c instanceof GroupCommand) && !(c instanceof PointCommand)) {
          const olds = this.selected.slice(0);
          this.selected.splice(0);
          this.selected.push(...nodes);
          if (!(c instanceof FillCommand) && this.state !== State.EDIT_GRADIENT) {
            this.updateActive();
          }
          // 不发送事件可能导致有的panel不显示，比如没选择节点然后undo更改了fill，opacity就不显示
          if (!(c instanceof AddCommand)) {
            if (nodes.length !== olds.length) {
              this.emit(Listener.SELECT_NODE, nodes);
            }
            else {
              for (let i = 0, len = nodes.length; i < len; i++) {
                if (nodes[i] !== olds[i]) {
                  this.emit(Listener.SELECT_NODE, nodes);
                  break;
                }
              }
            }
          }
        }
        // 触发更新的还是目前已选的而不是undo里的数据
        if (c instanceof MoveCommand) {
          this.emit(Listener.MOVE_NODE, nodes);
        }
        else if (c instanceof ResizeCommand) {
          this.emit(Listener.RESIZE_NODE, nodes);
        }
        else if (c instanceof RemoveCommand) {
          if (this.shiftKey) {
            this.selected.splice(0);
            this.select.hideSelect();
            this.emit(Listener.REMOVE_NODE, nodes);
          }
          else {
            this.selected = nodes.map((item, i) => {
              return c.data[i].selected || item;
            });
            this.updateActive();
            this.emit(Listener.ADD_NODE, nodes, this.selected.slice(0));
          }
        }
        else if (c instanceof AddCommand) {
          if (this.shiftKey) {
            this.selected = nodes.slice(0);
            this.updateActive();
            this.emit(Listener.ADD_NODE, nodes);
          }
          else {
            this.selected.splice(0);
            this.select.hideSelect();
            this.emit(Listener.REMOVE_NODE, nodes);
          }
        }
        else if (c instanceof RotateCommand) {
          this.emit(Listener.ROTATE_NODE, nodes);
        }
        else if (c instanceof OpacityCommand) {
          this.emit(Listener.OPACITY_NODE, nodes);
        }
        else if (c instanceof ShadowCommand) {
          this.emit(Listener.SHADOW_NODE, nodes);
        }
        else if (c instanceof BlurCommand) {
          this.emit(Listener.BLUR_NODE, nodes);
        }
        else if (c instanceof ColorAdjustCommand) {
          this.emit(Listener.COLOR_ADJUST_NODE, nodes);
        }
        else if (c instanceof VerticalAlignCommand) {
          this.emit(Listener.TEXT_VERTICAL_ALIGN_NODE, nodes);
        }
        else if (c instanceof FillCommand) {
          this.emit(Listener.FILL_NODE, nodes, c.data);
        }
        else if (c instanceof StrokeCommand) {
          this.emit(Listener.STROKE_NODE, nodes);
        }
        // 编组之类强制更新并选择节点
        else if (c instanceof GroupCommand) {
          if (this.shiftKey) {
            this.selected.splice(0);
            this.selected.push(c.group);
            this.updateActive();
            this.emit(Listener.GROUP_NODE, [c.group], [nodes]);
          }
          else {
            this.selected.splice(0);
            this.selected.push(...nodes);
            this.updateActive();
            this.emit(Listener.UN_GROUP_NODE, [nodes], [c.group]);
          }
        }
        else if (c instanceof UnGroupCommand) {
          if (this.shiftKey) {
            this.selected.splice(0);
            nodes.forEach((item, i) => {
              this.selected.push(...c.data[i].children);
            });
            this.updateActive();
            this.emit(Listener.UN_GROUP_NODE, nodes.map((item, i) => c.data[i].children.slice(0)), c.nodes.slice(0));
          }
          else {
            this.selected.splice(0);
            this.selected.push(...nodes);
            this.updateActive();
            this.emit(Listener.GROUP_NODE, nodes, c.data.map(item => item.children.slice(0)));
          }
        }
        else if (c instanceof MaskModeCommand) {
          const maskMode = ['none', 'outline', 'alpha', 'gray', 'alpha-with', 'gray-with']
            [nodes[0].computedStyle.maskMode] as 'none' | 'outline' | 'alpha' | 'alpha-with' | 'gray-with';
          this.emit(Listener.MASK_NODE, nodes, maskMode);
        }
        else if (c instanceof BreakMaskCommand) {
          const breakMask = nodes[0].computedStyle.breakMask;
          this.emit(Listener.BREAK_MASK_NODE, nodes, breakMask);
        }
        else if (c instanceof RichCommand) {
          if (c.type === RichCommand.TEXT_ALIGN) {
            this.emit(Listener.TEXT_ALIGN_NODE, nodes);
          }
          else if (c.type === RichCommand.COLOR) {
            this.emit(Listener.COLOR_NODE, nodes);
          }
          else if (c.type === RichCommand.FONT_FAMILY) {
            this.emit(Listener.FONT_FAMILY_NODE, nodes);
          }
          else if (c.type === RichCommand.FONT_SIZE) {
            this.emit(Listener.FONT_SIZE_NODE, nodes);
          }
          else if (c.type === RichCommand.LINE_HEIGHT) {
            this.emit(Listener.LINE_HEIGHT_NODE, nodes);
          }
          else if (c.type === RichCommand.PARAGRAPH_SPACING) {
            this.emit(Listener.PARAGRAPH_SPACING_NODE, nodes);
          }
          else if (c.type === RichCommand.LETTER_SPACING) {
            this.emit(Listener.LETTER_SPACING_NODE, nodes);
          }
          // 更新光标
          if (this.state === State.EDIT_TEXT) {
            const node = nodes[0] as Text;
            const { isMulti, start } = node.getSortedCursor();
            if (!isMulti) {
              const p = node.updateCursorByIndex(start);
              this.input.updateCursor(p);
              this.input.showCursor();
            }
            this.input.focus();
          }
        }
        else if (c instanceof TextCommand) {
          if (this.state === State.EDIT_TEXT) {
            const node = nodes[0] as Text;
            const { isMulti, start } = node.getSortedCursor();
            if (!isMulti) {
              const p = node.updateCursorByIndex(start);
              this.input.updateCursor(p);
              this.input.showCursor();
            }
            this.input.focus();
          }
        }
        else if (c instanceof PointCommand) {
          const node = nodes[0];
          if (this.state === State.EDIT_GEOM) {
            if (node instanceof Polyline) {
              this.geometry.update();
              this.emit(Listener.SELECT_POINT, this.geometry.idx.slice(0));
            }
          }
          else {
            if (node instanceof Polyline) {
              node.refresh();
              node.checkPointsChange();
            }
            this.selected.splice(0);
            this.selected.push(node);
            this.updateActive();
          }
        }
        else if (c instanceof RenameCommand) {
          this.emit(Listener.RENAME_NODE, nodes);
        }
        else if (c instanceof LockCommand) {
          this.emit(Listener.LOCK_NODE, nodes);
        }
        else if (c instanceof VisibleCommand) {
          this.emit(Listener.VISIBLE_NODE, nodes);
        }
      }
    }
  }

  onKeyUp(e: KeyboardEvent) {
    const meta = this.metaKey;
    const ctrl = this.ctrlKey;
    this.metaKey = e.metaKey;
    this.altKey = e.altKey;
    this.ctrlKey = e.ctrlKey;
    this.shiftKey = e.shiftKey;
    if (!(this.metaKey || isWin && this.ctrlKey) && !this.isRotate) {
      this.select.metaKey(false);
    }
    if ((meta !== this.metaKey || isWin && ctrl !== this.ctrlKey) && !this.isMouseDown) {
      const dpi = this.root.dpi;
      const x = this.startX * dpi;
      const y = this.startY * dpi;
      this.hover(x, y);
    }
    // space
    if (e.keyCode === 32) {
      this.spaceKey = false;
      this.dom.style.cursor = 'auto';
    }
  }

  updateSelected() {
    if (this.selected.length) {
      this.select.updateSelect(this.selected);
    }
  }

  updateInput() {
    if (this.state === State.EDIT_TEXT) {
      this.input.updateCursor();
    }
  }

  updateGradient() {
    if (this.state === State.EDIT_GRADIENT) {
      this.gradient.updatePos();
    }
  }

  updateGeom() {
    if (this.state === State.EDIT_GEOM) {
      this.geometry.update();
    }
  }

  cancelEditText(node?: Node) {
    if (this.state === State.EDIT_TEXT) {
      const text = (node || this.selected[0]) as Text;
      if (text) {
        text.resetCursor();
        text.afterEdit();
        text.inputStyle = undefined;
      }
      this.input.hide();
      this.state = State.NORMAL;
      this.emit(Listener.STATE_CHANGE, State.EDIT_TEXT, this.state);
    }
  }

  cancelEditGradient() {
    if (this.state === State.EDIT_GRADIENT) {
      this.select.showSelectNotUpdate();
      this.state = State.NORMAL;
      this.emit(Listener.STATE_CHANGE, State.EDIT_GRADIENT, this.state);
    }
  }

  cancelEditGeom() {
    if (this.state === State.EDIT_GEOM) {
      const node = this.geometry.node;
      if (node instanceof Polyline) {
        node.checkPointsChange();
      }
      this.select.showSelect(this.selected);
      this.state = State.NORMAL;
      // this.emit(Listener.SELECT_POINT, []);
      this.emit(Listener.STATE_CHANGE, State.EDIT_GEOM, this.state);
    }
  }

  onContextMenu(e: MouseEvent) {
    e.preventDefault();
    // this.emit(Listener.CONTEXT_MENU, e);
  }

  destroy() {
    this.dom.removeEventListener('mousedown', this.onMouseDown);
    this.dom.removeEventListener('mousemove', this.onMouseMove);
    this.dom.removeEventListener('mouseup', this.onMouseUp);
    this.dom.removeEventListener('mouseleave', this.onMouseLeave);
    this.dom.removeEventListener('click', this.onClick);
    this.dom.removeEventListener('dblclick', this.onDblClick);
    this.dom.removeEventListener('wheel', this.onWheel);
    this.dom.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);

    this.selected.splice(0);
    this.abcStyle.splice(0);
    this.computedStyle.splice(0);
    this.originStyle.splice(0);
    this.cssStyle.splice(0);
    this.select.destroy();
  }

  static HOVER_NODE = 'HOVER_NODE';
  static UN_HOVER_NODE = 'UN_HOVER_NODE';
  static SELECT_NODE = 'SELECT_NODE';
  static RESIZE_NODE = 'RESIZE_NODE';
  static MOVE_NODE = 'MOVE_NODE';
  static ROTATE_NODE = 'ROTATE_NODE';
  static OPACITY_NODE = 'OPACITY_NODE';
  static FLIP_H_NODE = 'FLIP_H_NODE';
  static FLIP_V_NODE = 'FLIP_V_NODE';
  static FILL_NODE = 'FILL_NODE';
  static STROKE_NODE = 'STROKE_NODE';
  static FONT_FAMILY_NODE = 'FONT_FAMILY_NODE';
  static FONT_SIZE_NODE = 'FONT_SIZE_NODE';
  static LINE_HEIGHT_NODE = 'LINE_HEIGHT_NODE';
  static LETTER_SPACING_NODE = 'LETTER_SPACING_NODE';
  static PARAGRAPH_SPACING_NODE = 'PARAGRAPH_SPACING_NODE';
  static COLOR_NODE = 'COLOR_NODE';
  static TEXT_ALIGN_NODE = 'TEXT_ALIGN_NODE';
  static TEXT_VERTICAL_ALIGN_NODE = 'TEXT_VERTICAL_ALIGN_NODE';
  static TEXT_CONTENT_NODE = 'TEXT_CONTENT_NODE';
  static CURSOR_NODE = 'CURSOR_NODE';
  static SHADOW_NODE = 'SHADOW_NODE';
  static BLUR_NODE = 'BLUR_NODE';
  static COLOR_ADJUST_NODE = 'COLOR_ADJUST_NODE';
  static REMOVE_NODE = 'REMOVE_NODE';
  static ADD_NODE = 'ADD_NODE';
  static GROUP_NODE = 'GROUP_NODE';
  static UN_GROUP_NODE = 'UN_GROUP_NODE';
  static MASK_NODE = 'MASK_NODE';
  static BREAK_MASK_NODE = 'BREAK_MASK_NODE';
  static RENAME_NODE = 'RENAME_NODE';
  static LOCK_NODE = 'LOCK_NODE';
  static VISIBLE_NODE = 'VISIBLE_NODE';
  static ART_BOARD_NODE = 'ART_BOARD_NODE';
  static CONSTRAIN_PROPORTION_NODE = 'CONSTRAIN_PROPORTION_NODE';
  static POINT_NODE = 'POINT_NODE';
  static SELECT_POINT = 'SELECT_POINT';
  static ZOOM_PAGE = 'ZOOM_PAGE';
  static CONTEXT_MENU = 'CONTEXT_MENU';
  static STATE_CHANGE = 'STATE_CHANGE';
}
