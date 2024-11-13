import { color2rgbaStr, getCssFillStroke } from '../style/css';
import { ComputedGradient, ComputedPattern, GRADIENT } from '../style/define';
import { convert2Css } from '../style/gradient';

let div: HTMLElement;
const html = `
<span class="arrow">
  <b></b>
</span>
<ul class="type">
  <li class="color"></li>
  <li class="linear"></li>
  <li class="radial"></li>
  <li class="conic"></li>
</ul>
<div class="line">
  <div class="bg"></div>
  <div class="con"></div>
</div>
`;

let picker: any;
let openFrom: string | undefined;
let callback: (() => void) | undefined; // 多个panel共用一个picker，新的点开老的还没关闭需要自动执行save，留个hook

let tempColor: number[] | undefined; // 编辑切换类别时，保存下可以切回去不丢失
let tempGradient: ComputedGradient | undefined;

export default {
  show(el: HTMLElement, data: number[] | ComputedGradient | ComputedPattern, from: string,
       onChange: (data: number[] | ComputedGradient | ComputedPattern) => void, cb: () => void) {
    // 强制渐变stops顺序排列初始化
    // if (!Array.isArray(data) && (data as ComputedGradient).stops) {
    //   (data as ComputedGradient).stops.sort((a, b) => a.offset - b.offset);
    // }
    openFrom = from;
    // 已经显示了，之前遗留的回调直接先执行
    if (callback) {
      callback();
      callback = undefined;
    }
    callback = cb;
    // 可能发生切换，记录切换前的
    if (Array.isArray(data)) {
      tempColor = data;
    }
    else if ((data as ComputedGradient).stops) {
      tempGradient = data as ComputedGradient;
    }
    const rect = el.getBoundingClientRect();
    // 初次初始化dom
    const isInit = !div;
    if (isInit) {
      div = document.createElement('div');
      div.innerHTML = html;
      document.body.appendChild(div);
      // 点击外部自动关闭
      document.addEventListener('click', (e) => {
        let p = e.target as (HTMLElement | null);
        while (p) {
          if (p === div) {
            return;
          }
          p = p.parentElement;
        }
        this.hide();
      });
    }
    const type = div.querySelector('.type') as HTMLElement;
    type.querySelector('.cur')?.classList.remove('cur');
    const line = div.querySelector('.line') as HTMLElement;
    // 防止切换的inline最高优先级变不了
    line.removeAttribute('style');
    const bg = line.querySelector('.bg') as HTMLElement;
    const con = line.querySelector('.con') as HTMLElement;
    let index = 0;
    // 事件侦听
    if (isInit) {
      type.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName.toUpperCase() !== 'LI') {
          return;
        }
        const classList = target.classList;
        if (classList.contains('cur')) {
          return;
        }
        type.querySelector('.cur')!.classList.remove('cur');
        classList.add('cur');
        if (classList.contains('color')) {
          line.style.display = 'none';
          let c = [0, 0, 0, 1];
          if (tempColor) {
            c = tempColor.slice(0);
          }
          else if ((data as ComputedGradient).stops) {
            c = (data as ComputedGradient).stops[0].color;
            onChange(c);
          }
          else {
            onChange(c);
          }
          picker.setColor(c, true);
        }
        else {
          line.style.display = 'block';
          if (classList.contains('linear')) {
            if (tempGradient) {
              // 取中心点映射对角线
              if (tempGradient.t === GRADIENT.RADIAL || tempGradient.t === GRADIENT.CONIC) {
                const dx = tempGradient.d[2] - tempGradient.d[0];
                const dy = tempGradient.d[3] - tempGradient.d[1];
                tempGradient.d[0] -= dx;
                tempGradient.d[1] -= dy;
              }
              tempGradient.t = GRADIENT.LINEAR;
            }
            else {
              tempGradient = {
                t: GRADIENT.LINEAR,
                d: [0, 0.5, 1, 0.5],
                stops: [
                  {
                    color: tempColor ? tempColor.slice(0) : [0, 0, 0, 1],
                    offset: 0,
                  },
                  {
                    color: tempColor ? tempColor.slice(0) : [255, 255, 255, 1],
                    offset: 1,
                  },
                ],
              };
            }
          }
          else if (classList.contains('radial')) {
            if (tempGradient) {
              // 取中心点
              if (tempGradient.t === GRADIENT.LINEAR) {
                const dx = tempGradient.d[2] - tempGradient.d[0];
                const dy = tempGradient.d[3] - tempGradient.d[1];
                tempGradient.d[0] += dx * 0.5;
                tempGradient.d[1] += dy * 0.5;
              }
              else if (tempGradient.t === GRADIENT.CONIC) {
                if (!tempGradient.d.length) {
                  tempGradient.d.push(0.5, 0.5, 1, 1);
                }
              }
              tempGradient.t = GRADIENT.RADIAL;
            }
            else {
              tempGradient = {
                t: GRADIENT.RADIAL,
                d: [0.5, 0.5, 1, 1],
                stops: [
                  {
                    color: tempColor ? tempColor.slice(0) : [0, 0, 0, 1],
                    offset: 0,
                  },
                  {
                    color: tempColor ? tempColor.slice(0) : [255, 255, 255, 1],
                    offset: 1,
                  },
                ],
              };
            }
          }
          else if (classList.contains('conic')) {
            if (tempGradient) {
              // 取中心点
              if (tempGradient.t === GRADIENT.LINEAR) {
                const dx = tempGradient.d[2] - tempGradient.d[0];
                const dy = tempGradient.d[3] - tempGradient.d[1];
                tempGradient.d[0] += dx * 0.5;
                tempGradient.d[1] += dy * 0.5;
              }
              tempGradient.t = GRADIENT.CONIC;
            }
            else {
              tempGradient = {
                t: GRADIENT.CONIC,
                d: [],
                stops: [
                  {
                    color: tempColor ? tempColor.slice(0) : [0, 0, 0, 1],
                    offset: 0,
                  },
                  {
                    color: tempColor ? tempColor.slice(0) : [255, 255, 255, 1],
                    offset: 1,
                  },
                ],
              };
            }
          }
          // 肯定有
          if (tempGradient) {
            onChange(tempGradient);
          }
        }
      });
      // 拖拽渐变
      let w = bg.clientWidth;
      let isDrag = false;
      let startX = 0;
      let initX = 0;
      let cur = con.querySelector('.cur') as HTMLElement;
      con.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const target = e.target as HTMLElement;
        const tagName = target.tagName.toUpperCase();
        w = bg.clientWidth;
        // 已有的stop的offset
        if (tagName === 'SPAN') {
          con.querySelector('.cur')!.classList.remove('cur');
          cur = target;
          cur.classList.add('cur');
          index = parseInt(cur.title);
          isDrag = true;
          startX = e.pageX;
          initX = parseFloat(cur.style.left) * 0.01;
          picker.setColor((data as ComputedGradient).stops[index].color, true);
        }
        // 新增一个
        else if (tagName === 'DIV') {
          con.querySelector('.cur')!.classList.remove('cur');
          const p = e.offsetX / w;
          const span = document.createElement('span');
          span.style.left = p * 100 + '%';
          const list = con.querySelectorAll('.con span');
          // index最后更新style会自动排序直接追加即可
          index = list.length;
          span.title = index.toString();
          con.appendChild(span);
          const o = {
            color: [0, 0, 0, 0],
            offset: p,
          };
          for (let i = 0, len = list.length; i < len; i++) {
            const exist = list[i] as HTMLElement;
            const x = parseFloat(exist.style.left) * 0.01;
            if (x >= p) {
              if (!i) {
                o.color = (data as ComputedGradient).stops[i].color.slice(0);
              }
              else {
                const prev = (data as ComputedGradient).stops[i - 1].color;
                const next = (data as ComputedGradient).stops[i].color;
                const l = parseFloat((list[i - 1] as HTMLElement).style.left) * 0.01;
                const d = x - l;
                const p2 = (p - l) / d;
                o.color = [
                  prev[0] + (next[0] - prev[0]) * p2,
                  prev[1] + (next[1] - prev[1]) * p2,
                  prev[2] + (next[2] - prev[2]) * p2,
                  (prev[3] ?? 1) + ((next[3] ?? 1) - (prev[3] ?? 1)) * p2,
                ];
              }
              break;
            }
            else if (i === len - 1) {
              o.color = (data as ComputedGradient).stops[i].color.slice(0);
            }
          }
          (data as ComputedGradient).stops[index] = o;
          cur = span;
          cur.classList.add('cur');
          isDrag = true;
          startX = e.pageX;
          initX = parseFloat(cur.style.left) * 0.01;
          picker.setColor(o.color, true);
        }
      });
      document.addEventListener('mousemove', (e) => {
        if (isDrag) {
          const diff = e.pageX - startX;
          const p = Math.min(1, Math.max(0, initX + diff / w));
          (data as ComputedGradient).stops[index].offset = p;
          cur.style.left = p * 100 + '%';
          bg.style.background = getCssFillStroke(data, bg.clientWidth, bg.clientHeight, true).replace(/\([^,]*,/, '(to right,');
          onChange(data);
        }
      });
      document.addEventListener('mouseup', () => {
        isDrag = false;
      });
    }
    div.className = 'sketch-editor-picker';
    div.classList.add(from);
    div.style.left = rect.left + (rect.right - rect.left) * 0.5 + 'px';
    div.style.top = rect.bottom + 10 + 'px';
    div.style.display = 'block';
    if (!picker) {
      // @ts-ignore
      picker = new window.Picker({
        parent: div,
        popup: false,
      });
      picker.onDone = () => {
        this.hide();
      };
      picker.onChange = (color: any) => {
        const cur = type.querySelector('.cur') as HTMLElement;
        const classList = cur.classList;
        if (classList.contains('color')) {
          onChange(color.rgba);
        }
        else {
          (data as ComputedGradient).stops[index].color = color.rgba;
          bg.style.background = getCssFillStroke(data, bg.clientWidth, bg.clientHeight, true).replace(/\([^,]*,/, '(to right,');
          onChange(data);
        }
      };
    }
    if (Array.isArray(data)) {
      const c = color2rgbaStr(data);
      picker.setColor(c, true);
      type.querySelector('.color')?.classList.add('cur');
      line.style.display = 'none';
    }
    else {
      if ((data as ComputedPattern).url !== undefined) {
        data = data as ComputedPattern;
        line.style.display = 'none';
      }
      else {
        data = data as ComputedGradient;
        picker.setColor(color2rgbaStr(data.stops[0].color), true);
        // bg条恒定linear-gradient且向右
        const t = Object.assign({}, data);
        t.t = GRADIENT.LINEAR;
        bg.style.background = convert2Css(t, bg.clientWidth, bg.clientHeight, true).replace(/\([^,]*,/, '(to right,');
        line.style.display = 'block';
        if (data.t === GRADIENT.LINEAR) {
          type.querySelector('.linear')?.classList.add('cur');
          initLinear(data, line);
          picker.setColor(color2rgbaStr(data.stops[0].color), true);
        }
        else if (data.t === GRADIENT.RADIAL) {
          type.querySelector('.radial')?.classList.add('cur');
        }
        else if (data.t === GRADIENT.CONIC) {
          type.querySelector('.conic')?.classList.add('cur');
        }
      }
    }
    picker.show();
    return picker;
  },
  hide() {
    if (div && div.style.display === 'block') {
      div.style.display = 'none';
      if (callback) {
        callback();
        callback = undefined;
      }
    }
  },
  isShow() {
    if (div) {
      return div.style.display === 'block';
    }
    return false;
  },
  isShowFrom(from: string) {
    return this.isShow() && openFrom === from;
  },
};

function initLinear(data: ComputedGradient, line: HTMLElement) {
  const con = line.querySelector('.con') as HTMLElement;
  con.innerHTML = '';
  const fragment = document.createDocumentFragment();
  data.stops.forEach((item, i) => {
    const span = document.createElement('span');
    if (!i) {
      span.classList.add('cur');
    }
    span.style.left = item.offset * 100 + '%';
    span.title = i.toString();
    fragment.appendChild(span);
  });
  con.appendChild(fragment);
}
