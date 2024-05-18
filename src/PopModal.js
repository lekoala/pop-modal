/* Constants */

import addDialogPolyfill from "./addDialogPolyfill.js";

const DOC = document;
const O = Object;
const NAME = "pop-modal";
const CE = customElements;

/**
 * @typedef Config
 * @property {String} closeSelector Selector to find close button
 */

/**
 * @type {Config}
 */
const options = {
  closeSelector: ".btn-close,.close,[data-close]",
};

function animationReduced() {
  return (
    window.matchMedia(`(prefers-reduced-motion: reduce)`) === true || window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true
  );
}

function supportsDialog() {
  return typeof HTMLDialogElement !== "undefined";
}

/**
 * @param {HTMLElement} el
 * @param {String} n
 * @param {String|null} v
 */
function attr(el, n, v) {
  if (v === null) {
    el.removeAttribute(n);
  } else {
    el.setAttribute(n, v);
  }
}

/**
 * Allow 1/0, true/false as strings
 * @param {any} value
 * @returns {Boolean}
 */
function parseBool(value) {
  return ["true", "false", "1", "0", true, false].includes(value) && !!JSON.parse(value);
}

function getScrollBarWidth() {
  let el = DOC.createElement("div");
  el.style.cssText = "overflow:scroll; visibility:hidden; position:absolute;";
  DOC.body.appendChild(el);
  let width = el.offsetWidth - el.clientWidth;
  el.remove();
  return width;
}

let dialogPolyfill = null;
if (!supportsDialog()) {
  dialogPolyfill = await addDialogPolyfill();
}

class PopModal extends HTMLElement {
  constructor() {
    super();

    // Make sure to also have pop-modal:not(:defined) as display:none
    // Otherwise content will show until proper initialization
    this.hidden = true;
    this.parentForm = null;
    this.childForm = null;

    // These can be set before element is initialized when using the polyfill
    this.closeHandler = this.closeHandler || null;
    this.openHandler = this.openHandler || null;
  }

  /**
   * @returns {HTMLDialogElement}
   */
  get dialog() {
    return this.firstElementChild;
  }

  connectedCallback() {
    // Make sure content is parsed, then wrap in a dialog
    setTimeout(() => {
      // We cannot nest forms
      this.parentForm = this.closest("form");
      this.childForm = this.querySelector("form");
      if (this.parentForm || this.childForm) {
        this.innerHTML = `<dialog>${this.innerHTML}</dialog>`;
      } else {
        // This can be useful to track return value
        // @link https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/returnValue
        this.innerHTML = `<dialog><form method="dialog">${this.innerHTML}</form></dialog>`;
      }
      this.hidden = false;

      if (dialogPolyfill) {
        dialogPolyfill.registerDialog(this.dialog);
      }

      this.dialog.addEventListener("close", this);

      if (!animationReduced()) {
        this.dialog.addEventListener("transitionstart", this);
        this.dialog.addEventListener("transitionend", this);
      }
    });

    this.addEventListener("keydown", this);
    this.addEventListener("click", this);
    this.bindControls();
  }

  bindControls() {
    DOC.querySelectorAll(`[data-dialog='${this.id}']`).forEach((btn) => {
      btn.addEventListener("click", this);
    });
  }

  disconnectedCallback() {
    // Cleanup event listeners
    this.removeEventListener("click", this);
    this.dialog.removeEventListener("close", this);
    DOC.querySelectorAll(`[data-dialog='${this.id}']`).forEach((btn) => {
      btn.removeEventListener("click", this);
    });
  }

  /**
   * @returns {NodeListOf}
   */
  _closeTriggers() {
    return this.querySelectorAll(options.closeSelector);
  }

  _setrm(n, v = "") {
    if (v) {
      attr(this, n, v);
    } else {
      attr(this, n, null);
    }
  }

  get dismissible() {
    return this.getAttribute("dismissible");
  }

  set dismissible(v) {
    this._setrm("dismissible", v);
  }

  get backdrop() {
    return this.getAttribute("backdrop");
  }

  set backdrop(v) {
    this._setrm("backdrop", v);
  }

  get output() {
    return this.getAttribute("output");
  }

  set output(v) {
    this._setrm("output", v);
  }

  /**
   * @returns {HTMLElement}
   */
  outputElement() {
    if (this.output) {
      return DOC.querySelector(this.output);
    }
  }

  /**
   * When it has a backdrop and no dismissible = false
   * @returns {Boolean}
   */
  isDismissible() {
    const a = this.dismissible;
    if (!a || parseBool(a) == true) {
      return true;
    }
    return false;
  }

  isMega() {
    return this.hasAttribute("mega");
  }

  /**
   * @returns {Boolean}
   */
  hasBackdrop() {
    const a = this.backdrop;
    if (!a || parseBool(a) == true) {
      return true;
    }
    return false;
  }

  handleEvent = (ev) => {
    this[`$${ev.type}`](ev);
  };

  $close(ev) {
    this.dialog.classList.add("is-closing");

    // This is only available when there is a form method="dialog" tag
    const ret = this.dialog.returnValue;

    // Capture output to text or form element
    const outputEl = this.outputElement();
    if (outputEl) {
      if (outputEl.hasOwnProperty("value")) {
        outputEl.value = ret;
      } else {
        outputEl.textContent = ret;
      }
    }

    if (this.closeHandler) {
      this.closeHandler(ret, ev, this);
    }

    if (animationReduced() || !supportsDialog()) {
      this.dialog.classList.remove("is-closing");
      DOC.documentElement.classList.remove("pop-modal-open");
    }
  }

  /**
   * @param {TransitionEvent} ev
   */
  $transitionstart(ev) {
    if (ev.propertyName == "opacity") {
      const t = ev.target;
      if (t.open) {
        t.classList.add("is-opening");
      } else {
        t.classList.add("is-closing");
      }
    }
  }

  /**
   * @param {TransitionEvent} ev
   */
  $transitionend(ev) {
    if (ev.propertyName == "opacity") {
      const t = ev.target;
      t.classList.remove("is-opening");
      t.classList.remove("is-closing");
      if (!t.open) {
        DOC.documentElement.classList.remove("pop-modal-open");
      }
    }
  }

  $keydown(ev) {
    // No parent form, behave as usual
    if (!this.parentForm) {
      return;
    }
    // We don't want to submit the form when using enter in the dialog
    if (ev.keyIdentifier == "U+000A" || ev.keyIdentifier == "Enter" || ev.keyCode == 13) {
      if (ev.target.nodeName == "INPUT") {
        ev.preventDefault();
        this.dialog.close("enter");
      }
    }
  }

  $click(ev) {
    const t = ev.target;

    // We clicked on the background (= dialog that takes the whole screen)
    if (this.isDismissible()) {
      if (t.nodeName == "DIALOG") {
        this.dialog.close("dismiss");
      }
    }

    // We clicked on a control
    const ctrl = t.closest("[data-dialog]");
    if (ctrl) {
      const d = this.dialog;
      if (d.open) {
        this.dialog.close("close");
      } else {
        this.open(ctrl.value || "", ev);
      }
    }

    // We clicked on close
    this._closeTriggers().forEach((closeTrigger) => {
      if (closeTrigger && ev.composedPath().includes(closeTrigger)) {
        this.dialog.close("close");
        ev.preventDefault();
      }
    });
  }

  open(openValue = null, ev = null) {
    if (this.isMega()) {
      // Avoid content reflow
      DOC.documentElement.style.setProperty("--scrollbar-width", getScrollBarWidth() + "px");
      DOC.documentElement.classList.add("pop-modal-open");
    }

    if (this.openHandler) {
      this.openHandler(openValue, ev, this);
    }
    if (this.hasBackdrop()) {
      this.dialog.showModal();
    } else {
      this.dialog.show();
    }
  }

  static configure(opts) {
    O.assign(options, opts);
  }
}

if (!CE.get(NAME)) {
  CE.define(NAME, PopModal);
}

export default PopModal;
