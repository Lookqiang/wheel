//鼠标移动事件的绑定
function bindOnmouseEvent({ el, downAfterEventCallBack, upAfterEventCallBack, moveAfterEventCallBack }) {
  el.onmousedown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.pageX;
    const startY = e.pageY;
    downAfterEventCallBack && downAfterEventCallBack();
    const _dragHandler = (ev) => {
      let moueseOffsetLeft = ev.pageX - startX;
      let moueseOffsetTop = ev.pageY - startY;
      //回调事件：参数为 鼠标移动偏移量
      moveAfterEventCallBack && moveAfterEventCallBack({ moueseOffsetLeft, moueseOffsetTop });
    };
    document.addEventListener("mousemove", _dragHandler);
    document.onmouseup = (e) => {
      upAfterEventCallBack && upAfterEventCallBack(e);
      document.removeEventListener("mousemove", _dragHandler);

      document.onmouseup = null;
    };
  };
}
function createElement(option) {
  //option = { element:'div',style:{},attr:{} }
  let { element, style, attr, innerText, eventObj, color } = option;
  if (element && element != "") {
    let el = document.createElement(element);
    if (innerText !== undefined) {
      el.innerText = innerText;
    }
    for (let x in style || {}) {
      el.style[x] = style[x];
    }
    for (let x in attr || {}) {
      el.setAttribute(x, attr[x]);
    }
    for (let x in eventObj || {}) {
      el[x] = eventObj[x];
    }
    if (color) {
      el.style.border = `1px solid ${color}`;
    }
    return el;
  }
}
function rafThrottle(fn) {
  //解决拖动卡顿
  let locked = false;
  return function (...args) {
    if (locked) return;
    locked = true;
    window.requestAnimationFrame(() => {
      fn.apply(this, args);
      locked = false;
    });
  };
}
class Positon {
  constructor({ el, src, created, getData }) {
    this.rootEl = null;
    //数据结构
    this.relationData = {};
    this.currentRect = {};
    this.seale = 1; //等比缩放大小
    this.init(el);
    this.initImg(src);
    this.created = created; //初始完成的回调
    this.getData = getData; //更新数据的回调
    this.uid = 0;
  }
  init(el) {
    //图片展示区
    this.drawEl = document.getElementById(el);

    this.rootEl = createElement({
      element: "div",
      style: { position: "relative", boxSizing: "border-box", width: "100%", height: "calc(100% - 40px)", overflow: "hidden" },
    });
    const actionEl = this.setActionBar();
    this.drawEl.append(this.rootEl, actionEl);
  }
  getScale() {
    return this.scale;
  }
  initWarp(image) {
    //创建dom
    let { width, height } = image;
    let warpObj = new Rect({
      element: "div",
      color: "red",
      style: {
        width: `${width}px`,
        height: `${height}px`,
        position: "absolute",
        left: 0,
        top: 0,
        boxSizing: "border-box",
      },
      getScale: this.getScale,
    })
      .mounted({
        el: this.rootEl,
      })
      .move();
    //处理dom的关联数据

    //设置当前选中的根rect

    this.relationData = warpObj;

    //图片添加到初始化的rect
    warpObj.el.append(image);
    this.created && this.created.call(this);
    this.getData && this.getData();
  }
  initImg(src) {
    let image = document.createElement("img");
    image.style.maxWidth = "100%";
    image.style.maxHeight = "100%";
    image.onload = () => {
      let originalWidth = image.width;
      //按等比缩放在特定宽高的div中
      this.rootEl.append(image);

      let curWidth = image.width;
      this.seale = originalWidth / curWidth;
      //根据等比缩放后图片的宽高来创建warp-rect-dom
      this.initWarp(image);
    };
    image.src = src;
  }

  isDom() {
    return typeof HTMLElement === "object"
      ? function (dom) {
          return dom instanceof HTMLElement;
        }
      : function (dom) {
          return dom && typeof dom === "object" && dom.nodeType === 1 && typeof dom.nodeName === "string";
        };
  }
  setActionBar() {
    let actionBarDom = createElement({
      element: "div",
      style: {
        width: "100%",
        height: "40px",
      },
    });
    const handleScale = (el, scale = 1) => {
      //el 缩放对象,scale大小
      if (this.isDom(el)) {
        // el.style.transtant
        el.style.transform = ` scale(${scale})`;
      }
      console.log(this);
    };
    this.scale = 1;

    const getPrevChildPositon = (rectObj) => {
      let height = rectObj.height / 2,
        left = 4,
        width = rectObj.width - 2 * left,
        top = 4;
      let childLength = rectObj.children.length;
      if (childLength) {
        let prevObj = rectObj.children[childLength - 1];
        let { offsetLeft, offsetTop, offsetWidth } = prevObj.el;
        width = prevObj.width;
        height = prevObj.height;
        if (offsetLeft + offsetWidth + width > rectObj.width) {
          left = 4;
          top = offsetTop + height;
        } else {
          left = offsetWidth + offsetLeft;
          top = offsetTop;
        }
      }
      return { width, height, left, top };
    };

    actionBarDom.append(
      this.setBtn("原图大小", {
        onclick: () => {
          this.scale = this.scale == this.seale ? 1 : this.seale;
          handleScale(this.relationData.el, this.scale);
        },
      }),
      this.setBtn("放大", {
        onclick: () => {
          this.scale = this.scale + 0.2;
          handleScale(this.relationData.el, this.scale);
        },
      }),
      this.setBtn("缩小", {
        onclick: () => {
          if (this.scale > 1) {
            this.scale = this.scale - 0.2;
            handleScale(this.relationData.el, this.scale);
          }
        },
      }),
      this.setBtn("添加大题", {
        onclick: () => {
          let { width, height, left, top } = getPrevChildPositon(this.relationData);
          let rectObj = new Rect({
            element: "div",
            color: "blue",
            style: {
              width: `${width}px`,
              height: `${height}px`,
              position: "absolute",
              left: `${left}px`,
              top: `${top}px`,
              boxSizing: "border-box",
            },
            index: this.relationData.children.length,
            getScale: this.getScale,
            bindClick: (e, _this) => {
              //_this 实例的this
              if (this.currentRect.el) {
                this.currentRect.el.style.boxShadow = "none";
                this.currentRect.el.style.zIndex = "0";
              }
              _this.el.style.boxShadow = "#007dfff2 0px 2px 12px 0px";
              _this.el.style.zIndex = "1";

              this.currentRect = _this;
            },
          })
            .mounted(this.relationData)
            .move()
            .resize();
          rectObj.type = 1;
          this.relationData.children.push(rectObj);
          this.getData && this.getData();
          // this.addRectData(this.initRectDom({}), this.relationData);
        },
      }),
      this.setBtn("添加小题", {
        onclick: () => {
          if (!this.currentRect.el) {
            alert("请选择先大题");
            return;
          }
          let { width, height, left, top } = getPrevChildPositon(this.currentRect);
          let rectObj = new Rect({
            element: "div",
            color: "green",
            style: {
              position: "absolute",
              width: width + "px",
              height: height + "px",
              left: left + "px",
              top: top + "px",
              boxSizing: "border-box",
            },
            index: this.currentRect.children.length,
            innerText: this.currentRect.children.length + 1,
            getScale: this.getScale,
            bindClick: (e, _this) => {
              //_this 实例的this
              if (this.currentRect.el) {
                this.currentRect.el.style.boxShadow = "none";
              }
              _this.el.style.boxShadow = "#007dfff2 0px 2px 12px 0px";
              this.currentRect = _this;
            },
          })
            .mounted(this.currentRect)
            .move()
            .resize();
          rectObj.type = 2;
          this.currentRect.children.push(rectObj);
          this.getData && this.getData();
        },
      }),
      this.setBtn("删除", {
        onclick: () => {
          this.removeRect(this.currentRect);
        },
      })
    );
    return actionBarDom;
  }
  setBtn(innerText, eventObj) {
    //缩放按钮
    return createElement({
      element: "button",
      innerText,
      eventObj,
    });
  }
  findRectObjByEl(id) {
    let result = [];
    let findFn = (obj) => {
      console.log(obj);

      if (obj.id == id) {
        result = [obj];
      } else {
        if (obj.children && obj.children.length) {
          for (let x = 0; x < obj.children.length; x++) {
            findFn(obj.children[x]);
          }
        }
      }
    };
    findFn(this.relationData);
    console.log(result);
    return result[0] || {};
  }
  removeRect(rectObj) {
    const removeRelationData = (rectObj) => {
      let parentObj = this.findRectObjByEl(rectObj.parentId);
      let index = parentObj.children.findIndex((item) => item.id == rectObj.id);
      console.log(parentObj.children, index);
      rectObj.parentEl.removeChild(rectObj.el);
      parentObj.children.splice(index, 1);

      parentObj.children.map((item, index) => {
        item.index = index;
        item.update(rectObj.parentId > 1 ? index + 1 : undefined);
      });
    };
    if (!rectObj.parentId) {
      alert("不能删除");
      return;
    }
    if (rectObj.children.length) {
      if (confirm("存在子题，是否删除")) {
        removeRelationData(rectObj);
      }
      return;
    } else {
      removeRelationData(rectObj);
    }
    this.getData && this.getData();
  }
}
let uid = 0;
class Rect {
  static _textEl = null;
  constructor({ element, style, attr, color, innerText, index, getScale = () => 1, bindClick = () => {} }) {
    let obj = {
      el: null,
      children: [],
      parentEl: null,
      parentId: undefined,
      top: undefined, //相对原来位置的偏移量
      left: undefined, //相对原来位置的偏移量
      width: undefined,
      height: undefined,
      index: index,
      id: uid++,
      type: 1,
      style,
      attr,
      color,
      scale: 1,
      innerText,
      getScale,
      bindClick,
    };
    for (let x in obj) {
      this[x] = obj[x];
    }
    this.init({ element });
  }
  init({ element }) {
    //初始化一个rect
    this.el = createElement({ element, style: this.style, attr: this.attr, color: this.color });
    this.initTextEl();
  }
  initTextEl() {
    this._textEl = createElement({ element: "div", innerText: this.innerText });
    this.el.append(this._textEl);
  }
  update(innerText) {
    //更新rect
    innerText && (this._textEl.innerText = innerText);
    // this.resize();
  }
  setScale(scale) {
    this.scale = scale;
  }
  mounted(rectObj, callback) {
    //把当前rect dom 挂载到 rectObj dom对象
    this.parentEl = rectObj.el;
    this.parentId = rectObj.id;
    this.parentEl.append(this.el);
    this.left = this.el.offsetLeft;
    this.top = this.el.offsetTop;
    this.width = this.el.offsetWidth;
    this.height = this.el.offsetHeight;
    this.el.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.bindClick && this.bindClick(e, this);
    };
    callback && callback();
    return this;
  }
  move() {
    let { el } = this;
    el.onmousedown = (e) => {
      e.stopPropagation();
      e.preventDefault();
      const startX = e.pageX;
      const startY = e.pageY;
      let { offsetLeft, offsetTop } = el;
      const _dragHandler = rafThrottle((ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        let moueseOffsetLeft = ev.pageX - startX;
        let moueseOffsetTop = ev.pageY - startY;
        let offsetX = offsetLeft + moueseOffsetLeft / this.getScale();
        let offsetY = offsetTop + moueseOffsetTop / this.getScale();
        this.el.style.left = `${offsetX}px`;
        this.el.style.top = `${offsetY}px`;
        this.left = offsetX;
        this.top = offsetY;
      });
      document.addEventListener("mousemove", _dragHandler);
      document.onmouseup = (e) => {
        e.stopPropagation();
        e.preventDefault();

        document.removeEventListener("mousemove", _dragHandler);
        document.onmouseup = null;
      };
    };
    return this;
  }
  resize() {
    this.createRectResizeDom();
    return this;
  }
  createRectResizeDom() {
    let { el } = this;
    let { offsetWidth, offsetHeight } = el;
    let borderWidth = 1;
    let borderStyle = `${borderWidth}px solid ${this.color}`;
    let dotWidth = 8;

    let topDiv = createElement({
      element: "div",
      style: {
        position: "absolute",
        width: `${offsetWidth - borderWidth - 2}px`,
        height: `0`,
        border: borderStyle,
        left: `0px`,
        top: `-${borderWidth + 1}px`,
      },
      attr: {
        css: "top-border",
      },
    });
    let leftDiv = createElement({
      element: "div",
      style: {
        position: "absolute",
        width: `0px`,
        height: `${offsetHeight - borderWidth}px`,
        border: borderStyle,
        left: `-${borderWidth + 1}px`,
        top: `-${borderWidth + 1}px`,
      },
      attr: {
        css: "left-border",
      },
    });

    let rightDiv = createElement({
      element: "div",
      style: {
        position: "absolute",
        width: `0px`,
        height: `${offsetHeight - borderWidth}px`,
        border: borderStyle,
        right: `-${borderWidth + 1}px`,
        top: `-${borderWidth + 1}px`,
      },
      attr: {
        css: "left-border",
      },
    });
    let bottomDiv = createElement({
      element: "div",
      style: {
        position: "absolute",
        width: `${offsetWidth - borderWidth - 2}px`,
        height: `0`,
        border: borderStyle,
        left: `0px`,
        bottom: `-${borderWidth + 1}px`,
      },
      attr: {
        css: "bottom-border",
      },
    });
    let dotStyle = {
      width: `${dotWidth}px`,
      height: `${dotWidth}px`,
      border: borderStyle,
      background: this.color,
      position: "absolute",
    };
    let leftTopDotDiv = createElement({
      element: "div",
      style: {
        ...dotStyle,
        left: `-${dotWidth / 2}px`,
        top: `-${dotWidth / 2}px`,
        cursor: `nw-resize`,
      },
      attr: {
        css: "left-top-dot",
      },
    });
    let rightTopDotDiv = createElement({
      element: "div",
      style: {
        ...dotStyle,
        right: `-${dotWidth / 2}px`,
        top: `-${dotWidth / 2}px`,
        cursor: `ne-resize`,
      },
      attr: {
        css: "right-top-dot",
      },
    });

    let leftBottomDotDiv = createElement({
      element: "div",
      style: {
        ...dotStyle,
        left: `-${dotWidth / 2}px`,
        bottom: `-${dotWidth / 2}px`,
        cursor: `sw-resize`,
      },
      attr: {
        css: "right-top-dot",
      },
    });
    let rightBottomDotDiv = createElement({
      element: "div",
      style: {
        ...dotStyle,
        right: `-${dotWidth / 2}px`,
        bottom: `-${dotWidth / 2}px`,
        cursor: `se-resize`,
      },
      attr: {
        css: "right-bottom-dot",
      },
    });

    el.append(leftDiv);
    el.append(topDiv);
    el.append(rightDiv);
    el.append(bottomDiv);

    let _setBorderWidth = () => {
      let { offsetWidth, offsetHeight } = el;
      leftDiv.style.height = `${offsetHeight - borderWidth}px`;
      topDiv.style.width = `${offsetWidth - borderWidth - 2}px`;
      rightDiv.style.height = `${offsetHeight - borderWidth}px`;
      bottomDiv.style.width = `${offsetWidth - borderWidth - 2}px`;
      this.width = this.el.offsetWidth;
      this.height = this.el.offsetHeight;
    };
    let elOffsetHeight = 0,
      elOffsetWidth = 0,
      elOffsetLeft = 0,
      elOffsetTop = 0;
    bindOnmouseEvent({
      el: rightTopDotDiv,
      downAfterEventCallBack() {
        console.log("downAfterEventCallBack");
        elOffsetHeight = el.offsetHeight;
        elOffsetWidth = el.offsetWidth;
        elOffsetTop = el.offsetTop;
        elOffsetLeft = el.offsetLeft;
      },
      moveAfterEventCallBack: ({ moueseOffsetLeft, moueseOffsetTop }) => {
        console.log("moveAfterEventCallBack");

        el.style.width = elOffsetWidth + moueseOffsetLeft / this.getScale() + "px";
        el.style.height = elOffsetHeight - moueseOffsetTop / this.getScale() + "px";
        el.style.top = `${elOffsetTop + moueseOffsetTop / this.getScale()}px`;
        _setBorderWidth();
      },
      upAfterEventCallBack() {
        _setBorderWidth();
      },
    });

    bindOnmouseEvent({
      el: leftTopDotDiv,
      downAfterEventCallBack() {
        elOffsetHeight = el.offsetHeight;
        elOffsetWidth = el.offsetWidth;
        elOffsetTop = el.offsetTop;
        elOffsetLeft = el.offsetLeft;
      },
      moveAfterEventCallBack: ({ moueseOffsetLeft, moueseOffsetTop }) => {
        el.style.width = elOffsetWidth - moueseOffsetLeft / this.getScale() + "px";
        el.style.height = elOffsetHeight - moueseOffsetTop / this.getScale() + "px";
        el.style.left = `${elOffsetLeft + moueseOffsetLeft / this.getScale()}px`;
        el.style.top = `${elOffsetTop + moueseOffsetTop / this.getScale()}px`;
        _setBorderWidth();
      },
      upAfterEventCallBack() {
        _setBorderWidth();
      },
    });

    bindOnmouseEvent({
      el: leftBottomDotDiv,
      downAfterEventCallBack() {
        elOffsetHeight = el.offsetHeight;
        elOffsetWidth = el.offsetWidth;
        elOffsetTop = el.offsetTop;
        elOffsetLeft = el.offsetLeft;
      },
      moveAfterEventCallBack: ({ moueseOffsetLeft, moueseOffsetTop }) => {
        el.style.width = elOffsetWidth - moueseOffsetLeft / this.getScale() + "px";
        el.style.height = elOffsetHeight + moueseOffsetTop / this.getScale() + "px";
        el.style.left = `${elOffsetLeft + moueseOffsetLeft / this.getScale()}px`;
        _setBorderWidth();
      },
      upAfterEventCallBack() {
        _setBorderWidth();
      },
    });

    bindOnmouseEvent({
      el: rightBottomDotDiv,
      downAfterEventCallBack() {
        elOffsetHeight = el.offsetHeight;
        elOffsetWidth = el.offsetWidth;
        elOffsetTop = el.offsetTop;
        elOffsetLeft = el.offsetLeft;
      },
      moveAfterEventCallBack: ({ moueseOffsetLeft, moueseOffsetTop }) => {
        el.style.width = elOffsetWidth + moueseOffsetLeft / this.getScale() + "px";
        el.style.height = elOffsetHeight + moueseOffsetTop / this.getScale() + "px";
        _setBorderWidth();
      },
      upAfterEventCallBack() {
        _setBorderWidth();
      },
    });

    el.append(leftTopDotDiv);
    el.append(rightTopDotDiv);
    el.append(leftBottomDotDiv);
    el.append(rightBottomDotDiv);
  }
}

export default Positon;
