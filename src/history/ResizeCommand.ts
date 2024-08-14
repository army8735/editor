import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';
import { ComputedStyle } from '../style/define';import {
  resizeBottomAspectRatioOperate,
  resizeBottomLeftAspectRatioOperate,
  resizeBottomOperate,
  resizeBottomRightAspectRatioOperate,
  resizeLeftAspectRatioOperate,
  resizeLeftOperate,
  resizeRightAspectRatioOperate,
  resizeRightOperate,
  resizeTopAspectRatioOperate,
  resizeTopLeftAspectRatioOperate,
  resizeTopOperate,
  resizeTopRightAspectRatioOperate,
} from '../tools/node';
import { JStyle, ResizeStyle } from '../format';

export type ResizeData = {
  dx: number;
  dy: number;
  controlType: CONTROL_TYPE;
  aspectRatio: boolean;
  fromCenter: boolean;
  widthFromAuto?: boolean; // Text的尺寸可能初始是auto，拉伸后变数值；也可能TextBehaviour改变
  heightFromAuto?: boolean;
  widthToAuto?: boolean; // TextBehaviour可能改变成auto
  heightToAuto?: boolean;
};

export enum CONTROL_TYPE {
  T,
  R,
  B,
  L,
  TL,
  TR,
  BL,
  BR,
}

class ResizeCommand extends AbstractCommand {
  data: ResizeData[];

  constructor(nodes: Node[], data: ResizeData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      const { dx, dy, controlType, aspectRatio, fromCenter, widthToAuto, heightToAuto } = data[i];
      const originStyle = node.getStyle();
      node.startSizeChange();
      const computedStyle = node.getComputedStyle();
      const cssStyle = node.getCssStyle();
      ResizeCommand.updateStyle(node, computedStyle, cssStyle, dx, dy, controlType, aspectRatio, fromCenter, widthToAuto, heightToAuto);
      node.endSizeChange(originStyle);
      node.checkPosSizeUpward();
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      const { dx, dy, controlType, aspectRatio, fromCenter, widthFromAuto, heightFromAuto } = data[i];
      const originStyle = node.getStyle();
      node.startSizeChange();
      const computedStyle = node.getComputedStyle();
      const cssStyle = node.getCssStyle();
      ResizeCommand.updateStyle(node, computedStyle, cssStyle, -dx, -dy, controlType, aspectRatio, fromCenter, widthFromAuto, heightFromAuto);
      node.endSizeChange(originStyle);
      node.checkPosSizeUpward();
    });
  }

  static updateStyle(node: Node, computedStyle: ComputedStyle, cssStyle: JStyle, dx: number, dy: number, controlType: CONTROL_TYPE, aspectRatio: boolean, fromCenter: boolean, widthAuto = false, heightAuto = false) {
    const next: ResizeStyle = {};
    // 保持宽高比的拉伸，4个方向和4个角需要单独特殊处理
    if (aspectRatio) {
      if (controlType === CONTROL_TYPE.T) {
        Object.assign(next, resizeTopAspectRatioOperate(node, computedStyle, dy, fromCenter));
      }
      else if (controlType === CONTROL_TYPE.R) {
        Object.assign(next, resizeRightAspectRatioOperate(node, computedStyle, dx, fromCenter));
      }
      else if (controlType === CONTROL_TYPE.B) {
        Object.assign(next, resizeBottomAspectRatioOperate(node, computedStyle, dy, fromCenter));
      }
      else if (controlType === CONTROL_TYPE.L) {
        Object.assign(next, resizeLeftAspectRatioOperate(node, computedStyle, dx, fromCenter));
      }
      else if (controlType === CONTROL_TYPE.TL) {
        Object.assign(next, resizeTopLeftAspectRatioOperate(node, computedStyle, dx, dy, fromCenter));
      }
      else if (controlType === CONTROL_TYPE.TR) {
        Object.assign(next, resizeTopRightAspectRatioOperate(node, computedStyle, dx, dy, fromCenter));
      }
      else if (controlType === CONTROL_TYPE.BL) {
        Object.assign(next, resizeBottomLeftAspectRatioOperate(node, computedStyle, dx, dy, fromCenter));
      }
      else if (controlType === CONTROL_TYPE.BR) {
        Object.assign(next, resizeBottomRightAspectRatioOperate(node, computedStyle, dx, dy, fromCenter));
      }
    }
    // 普通的分4个方向上看，4个角则是2个方向的合集，因为相邻方向不干扰，相对方向互斥
    else {
      /**
       * 由于保持宽高比/中心点调整的存在，可能在调整过程中切换shift/alt键，
       * 按下无需关心，因为不保持是保持的子集，普通是中心点的子集，
       * 如果从保持换到不保持，四条边在保持时会更改相邻两侧的定位尺寸，不保持需改回来，
       * 如果从中心换到非中心，四条边会更改对面的定位尺寸，非中心需改回来。
       */
      if (computedStyle.height !== node.computedStyle.height) {
        next.top = cssStyle.top;
        next.bottom = cssStyle.bottom;
        next.height = cssStyle.height;
        next.scaleY = cssStyle.scaleY;
      }
      if (computedStyle.width !== node.computedStyle.width) {
        next.left = cssStyle.left;
        next.right = cssStyle.right;
        next.width = cssStyle.width;
        next.scaleX = cssStyle.scaleX;
      }
      if (controlType === CONTROL_TYPE.T || controlType === CONTROL_TYPE.TL || controlType === CONTROL_TYPE.TR) {
        Object.assign(next, resizeTopOperate(node, computedStyle, dy, fromCenter));
      }
      else if (controlType === CONTROL_TYPE.B || controlType === CONTROL_TYPE.BL || controlType === CONTROL_TYPE.BR) {
        Object.assign(next, resizeBottomOperate(node, computedStyle, dy, fromCenter));
      }
      if (controlType === CONTROL_TYPE.L || controlType === CONTROL_TYPE.TL || controlType === CONTROL_TYPE.BL) {
        Object.assign(next, resizeLeftOperate(node, computedStyle, dx, fromCenter));
      }
      else if (controlType === CONTROL_TYPE.R || controlType === CONTROL_TYPE.TR || controlType === CONTROL_TYPE.BR) {
        Object.assign(next, resizeRightOperate(node, computedStyle, dx, fromCenter));
      }
    }
    if (widthAuto) {
      next.width = 'auto';
    }
    if (heightAuto) {
      next.height = 'auto';
    }
    node.updateStyle(next);
  }
}

export default ResizeCommand;
