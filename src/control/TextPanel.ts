import Node from '../node/Node';
import Root from '../node/Root';
import Text from '../node/Text';
import { toPrecision } from '../math';
import { clone, loadLocalFonts } from '../util/util';
import style from '../style';
import { TEXT_BEHAVIOUR, getData, updateBehaviour } from '../tools/text';
import { Style, TEXT_ALIGN } from '../style/define';
import Listener from './Listener';
import picker from './picker';
import { UpdateRich } from '../format';
import UpdateRichCommand from '../history/UpdateRichCommand';
import ResizeCommand from '../history/ResizeCommand';
import UpdateFormatStyleCommand from '../history/UpdateFormatStyleCommand';
import State from './State';
import Panel from './Panel';

const html = `
  <h4 class="panel-title">字符</h4>
  <div class="line ff">
    <select>
      <option value="arial">Arial</option>
    </select>
    <span class="multi">多种字体</span>
  </div>
  <div class="line wc">
    <div class="weight">
      <select></select>
      <span class="multi">多种字重</span>
    </div>
    <div class="color">
      <span class="picker"><b style="color:#666;text-align:center;line-height:18px;overflow:hidden;text-shadow:0 0 2px rgba(0, 0, 0, 0.2);">○○○</b></span>
    </div>
  </div>
  <div class="line num">
    <div class="fs">
      <input type="number" min="1" step="1"/>
      <span>字号</span>
    </div>
    <div class="ls">
      <input type="number" step="1"/>
      <span>字距</span>
    </div>
    <div class="lh">
      <input type="number" min="1" step="1"/>
      <span>行高</span>
    </div>
    <div class="ps">
      <input type="number" step="1"/>
      <span>段落</span>
    </div>
  </div>
  <div class="line wh">
    <div>
      <span class="auto" title="自动宽度"></span>
      <span class="fw" title="自动高度"></span>
      <span class="fwh" title="固定尺寸"></span>
    </div>
    <span class="txt"></span>
  </div>
  <div class="line al">
    <span class="left" title="左对齐"></span>
    <span class="center" title="居中对齐"></span>
    <span class="right" title="右对齐"></span>
    <span class="justify" title="两端对齐"></span>
  </div>  
`;

let local = false;
loadLocalFonts().then(res => {
  local = true;
  style.font.registerLocalFonts(res);
}).catch(() => {
  local = true;
});

class TextPanel extends Panel {
  panel: HTMLElement;
  local = false;
  nodes: Text[];

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);
    this.nodes = [];

    const panel = this.panel = document.createElement('div');
    panel.className = 'text-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    this.dom.appendChild(panel);

    let nodes: Text[] = [];
    let prevs: UpdateRich[][] = [];
    let nexts: UpdateRich[][] = [];

    // 选择颜色会刷新但不产生步骤，关闭颜色面板后才callback产生
    const callback = () => {
      // 只有变更才会有next
      if (nexts && nexts.length) {
        listener.history.addCommand(new UpdateRichCommand(nodes.slice(0), prevs, nexts));
        listener.emit(Listener.TEXT_NODE, nodes.slice(0));
      }
      nodes = [];
      prevs = [];
      nexts = [];
    };

    panel.addEventListener('click', (e) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'B') {
        // picker侦听了document全局click隐藏窗口，这里停止向上冒泡
        e.stopPropagation();
        if (picker.isShowFrom('textPanel')) {
          picker.hide();
          callback();
          return;
        }
        const p = picker.show(el, 'textPanel', callback, true);
        // 最开始记录nodes/prevs
        nodes = this.nodes.slice(0);
        prevs = [];
        nodes.forEach(node => {
          const prev: UpdateRich[] = [];
          node.rich.forEach(item => {
            prev.push({
              location: item.location,
              length: item.length,
              color: item.color,
            });
          });
          prevs.push(prev);
        });
        // 每次变更记录更新nexts
        p.onChange = (color: any) => {
          nexts = [];
          nodes.forEach(node => {
            const next: UpdateRich[] = [];
            const o = {
              location: 0,
              length: node._content.length,
              color: color.rgba.slice(0),
            };
            next.push(o);
            nexts.push(next);
            node.updateRichStyle(o);
          });
        };
        p.onDone = () => {
          picker.hide();
          callback();
        };
      }
      // 尺寸固定模式
      else if ((el.classList.contains('auto') || el.classList.contains('fw') || el.classList.contains('fwh'))
        && !el.classList.contains('cur')) {
        callback();
        nodes = this.nodes.slice(0);
        let behaviour = TEXT_BEHAVIOUR.AUTO;
        if (el.classList.contains('fw')) {
          behaviour = TEXT_BEHAVIOUR.FIXED_W;
        }
        else if (el.classList.contains('fwh')) {
          behaviour = TEXT_BEHAVIOUR.FIXED_W_H;
        }
        const styles = nodes.map(item => updateBehaviour(item, behaviour));
        listener.history.addCommand(new ResizeCommand(nodes.slice(0), styles));
        listener.select.updateSelect(nodes);
        listener.emit(Listener.RESIZE_NODE, nodes.slice(0));
      }
      // 左右对齐
      else if ((el.classList.contains('left') || el.classList.contains('right') || el.classList.contains('center') || el.classList.contains('justify'))
        && !el.classList.contains('cur')) {
        callback();
        const nodes = this.nodes.slice(0);
        const prevs: UpdateRich[][] = [];
        const nexts: UpdateRich[][] = [];
        let value = TEXT_ALIGN.LEFT;
        if (el.classList.contains('right')) {
          value = TEXT_ALIGN.RIGHT;
        }
        else if (el.classList.contains('center')) {
          value = TEXT_ALIGN.CENTER;
        }
        else if (el.classList.contains('justify')) {
          value = TEXT_ALIGN.JUSTIFY;
        }
        // 编辑状态下特殊处理
        if (nodes.length === 1 && listener.state === State.EDIT_TEXT) {
        }
        else {
          nodes.forEach(node => {
            const prev: UpdateRich[] = [];
            node.rich.forEach(item => {
              prev.push({
                location: item.location,
                length: item.length,
                textAlign: item.textAlign,
              });
            });
            prevs.push(prev);
            const next: UpdateRich[] = [];
            const o = {
              location: 0,
              length: node._content.length,
              textAlign: value,
            };
            next.push(o);
            nexts.push(next);
            node.updateRichStyle(o);
            listener.history.addCommand(new UpdateRichCommand(nodes, prevs, nexts));
            listener.emit(Listener.TEXT_ALIGN_NODE, nodes);
          });
        }
        dom.querySelector('.al .cur')?.classList.remove('cur');
        el.classList.add('cur');
      }
    });

    // 字体和字重都是Select都会触发，字号等Input也会触发
    panel.addEventListener('change', (e) => {
      const el = e.target as HTMLElement;
      const tagName = el.tagName.toUpperCase();
      if (tagName === 'SELECT') {
        callback();
        const value = (el as HTMLSelectElement).value;
        const nodes = this.nodes.slice(0);
        const prevs: UpdateRich[][] = [];
        const nexts: UpdateRich[][] = [];
        nodes.forEach(node => {
          const prev: UpdateRich[] = [];
          node.rich.forEach(item => {
            prev.push({
              location: item.location,
              length: item.length,
              fontFamily: item.fontFamily,
            });
          });
          prevs.push(prev);
          const next: UpdateRich[] = [];
          const o = {
            location: 0,
            length: node._content.length,
            fontFamily: value,
          };
          next.push(o);
          nexts.push(next);
          node.updateRichStyle(o);
        });
        listener.history.addCommand(new UpdateRichCommand(nodes, prevs, nexts));
        listener.select.updateSelect(nodes);
        listener.emit(Listener.TEXT_NODE, nodes);
      }
      else if (tagName === 'INPUT') {}
    });

    panel.addEventListener('input', (e) => {
      this.silence = true;
      // 连续多次只有首次记录节点和prev值，但每次都更新next值
      const isFirst = !nodes.length;
      if (isFirst) {
        prevs = [];
      }
      nexts = [];
      const input = e.target as HTMLInputElement;
      const parent = input.parentElement!;
      let value = parseFloat(input.value);
      let key: 'fontSize' | 'letterSpacing' | 'lineHeight' | 'paragraphSpacing' | undefined;
      if (parent.classList.contains('fs')) {
        key = 'fontSize';
      }
      else if (parent.classList.contains('ls')) {
        key = 'letterSpacing';
      }
      else if (parent.classList.contains('lh')) {
        key = 'lineHeight';
      }
      else if (parent.classList.contains('paragraphSpacing')) {
        key = 'paragraphSpacing';
      }
      if (!key) {
        return;
      }
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      // const nodes = this.nodes.slice(0);
      // const prevs: UpdateRich[][] = [];
      // const nexts: UpdateRich[][] = [];
      this.nodes.forEach(node => {
        const prev: UpdateRich[] = [];
        node.rich.forEach(item => {
          prev.push({
            location: item.location,
            length: item.length,
            [key]: item[key],
          });
        });
        prevs.push(prev);
        const next: UpdateRich[] = [];
        const o = {
          location: 0,
          length: node._content.length,
          [key]: value,
        };
        next.push(o);
        nexts.push(next);
        node.updateRichStyle(o);
      });
      listener.history.addCommand(new UpdateRichCommand(nodes, prevs, nexts));
      listener.select.updateSelect(nodes);
      listener.emit(Listener.TEXT_NODE, nodes);
    });

    listener.on([Listener.SELECT_NODE, Listener.RESIZE_NODE, Listener.TEXT_NODE], (nodes: Node[]) => {
      // 输入的时候，防止重复触发；选择/undo/redo的时候则更新显示
      if (this.silence) {
        return;
      }
      this.show(nodes);
    });
  }

  initLocal() {
    if (this.local || !local) {
      return;
    }
    this.local = true;
    const { info } = style.font;
    let s = '';
    for (let i in info) {
      if (info.hasOwnProperty(i)) {
        const item = info[i];
        const list = item.list || [];
        if (list.length) {
          s += `<option value="${i}">${item.name || i}</option>`;
        }
      }
    }
    const select = this.panel.querySelector('select') as HTMLSelectElement;
    select.innerHTML = s;
  }

  show(nodes: Node[]) {
    const panel = this.panel;
    let willShow = false;
    for (let i = 0, len = nodes.length; i < len; i++) {
      const item = nodes[i];
      if (item instanceof Text) {
        willShow = true;
        break;
      }
    }
    if (!willShow) {
      panel.style.display = 'none';
      return;
    }
    this.initLocal();
    panel.style.display = 'block';
    panel.querySelectorAll('input').forEach(item => {
      item.disabled = false;
      item.placeholder = '';
    });
    const texts = nodes.filter(item => item instanceof Text) as Text[];
    this.nodes = texts;
    const o = getData(texts);
    {
      const select = panel.querySelector('.ff select') as HTMLSelectElement;
      // 移除上次可能遗留的无效字体展示
      const invalid = select.querySelector(':disabled') as HTMLOptionElement;
      if (invalid) {
        invalid.remove();
      }
      const multi = panel.querySelector('.ff .multi') as HTMLElement;
      const list = select.querySelectorAll('option');
      if (o.fontFamily.length > 1) {
        multi.style.display = 'block';
        for (let i = 0, len = list.length; i < len; i++) {
          const option = list[i];
          if (option.selected) {
            option.selected = false;
            break;
          }
        }
        const option = `<option value="" selected="selected" disabled>多种字体</option>`;
        select.innerHTML += option;
      }
      else {
        multi.style.display = 'none';
        const { data } = style.font;
        let has = false;
        const ff = o.fontFamily[0];
        for (let i = 0, len = list.length; i < len; i++) {
          const option = list[i];
          const o = data[ff];
          if (o && o.family.toLowerCase() === option.value) {
            has = true;
            option.selected = true;
            break;
          }
        }
        if (!has) {
          const option = `<option value="${ff}" selected="selected" disabled>${ff}</option>`;
          select.innerHTML += option;
          select.classList.add('invalid');
        }
      }
    }
    {
      const select = panel.querySelector('.wc select') as HTMLSelectElement;
      let s = '';
      o.fontWeightList.forEach(item => {
        s += `<option value="${item.value}">${item.label}</option>`;
      });
      select.innerHTML = s;
      const multi = panel.querySelector('.wc .multi') as HTMLElement;
      if (o.fontWeight.length > 1) {
        multi.style.display = 'block';
        select.disabled = true;
      }
      else {
        multi.style.display = 'none';
        select.disabled = false;
        const list = select.querySelectorAll('option');
        for (let i = 0, len = list.length; i < len; i++) {
          const option = list[i];
          if (option.innerHTML === o.fontWeight[0]) {
            option.selected = true;
            break;
          }
        }
      }
    }
    {
      const color = panel.querySelector('.color b') as HTMLElement;
      if (o.color.length > 1) {
        color.style.background = '#FFF';
        color.style.textIndent = '0px';
      }
      else {
        color.style.background = o.color[0];
        color.style.textIndent = '9999px';
      }
    }
    {
      const input = panel.querySelector('.fs input') as HTMLInputElement;
      if (o.fontSize.length > 1) {
        input.placeholder = '多个';
      }
      else {
        input.value = toPrecision(o.fontSize[0], 0).toString();
      }
    }
    {
      const input = panel.querySelector('.ls input') as HTMLInputElement;
      if (o.letterSpacing.length > 1) {
        input.placeholder = '多个';
      }
      else {
        input.value = toPrecision(o.letterSpacing[0], 0).toString();
      }
    }
    {
      const input = panel.querySelector('.lh input') as HTMLInputElement;
      if (o.lineHeight.length > 1) {
        input.placeholder = '多个';
      }
      else {
        if (o.autoLineHeight[0]) {
          input.placeholder = toPrecision(o.lineHeight[0], 0).toString();
        }
        else {
          input.value = toPrecision(o.lineHeight[0], 0).toString();
        }
      }
    }
    {
      const input = panel.querySelector('.ps input') as HTMLInputElement;
      if (o.paragraphSpacing.length > 1) {
        input.placeholder = '多个';
      }
      else {
        input.value = o.paragraphSpacing[0].toString();
      }
    }
    {
      const span = panel.querySelector('.wh .cur') as HTMLElement;
      if (span) {
        span.classList.remove('cur');
      }
      const txt = panel.querySelector('.wh .txt') as HTMLSpanElement;
      if (o.textBehaviour.length === 1) {
        const tb = o.textBehaviour[0];
        if (tb === TEXT_BEHAVIOUR.AUTO) {
          panel.querySelector('.wh .auto')!.classList.add('cur');
          txt.innerHTML = '自动宽度';
        }
        else if (tb === TEXT_BEHAVIOUR.FIXED_W) {
          panel.querySelector('.wh .fw')!.classList.add('cur');
          txt.innerHTML = '自动高度';
        }
        else if (tb === TEXT_BEHAVIOUR.FIXED_W_H) {
          panel.querySelector('.wh .fwh')!.classList.add('cur');
          txt.innerHTML = '固定尺寸';
        }
      }
      else {
        txt.innerHTML = '多种';
      }
    }
    {
      const span = panel.querySelector('.al .cur') as HTMLElement;
      if (span) {
        span.classList.remove('cur');
      }
      if (o.textAlign.length === 1) {
        const ta = o.textAlign[0];
        if (ta === TEXT_ALIGN.LEFT) {
          panel.querySelector('.al .left')!.classList.add('cur');
        }
        else if (ta === TEXT_ALIGN.CENTER) {
          panel.querySelector('.al .center')!.classList.add('cur');
        }
        else if (ta === TEXT_ALIGN.RIGHT) {
          panel.querySelector('.al .right')!.classList.add('cur');
        }
        else if (ta === TEXT_ALIGN.JUSTIFY) {
          panel.querySelector('.al .justify')!.classList.add('cur');
        }
      }
    }
  }
}

export default TextPanel;
