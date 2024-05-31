/* Constants */

import addDialogPolyfill from "./addDialogPolyfill.js";

const DOC = document;
const O = Object;
const NAME = "pop-modal";
const CE = customElements;

/**
 * @typedef Config
 * @property {string} closeSelector Selector to find close button
 */

/**
 * @type {Config}
 */
const options = {
  closeSelector: ".btn-close,.close,[data-close]",
};

function animationEnabled() {
  return (
    window.matchMedia(`(prefers-reduced-motion: no-preference)`) === true ||
    window.matchMedia(`(prefers-reduced-motion: no-preference)`).matches === true
  );
}

function supportsDialog() {
  return typeof HTMLDialogElement !== "undefined";
}

/**
 * @param {HTMLElement} el
 * @param {string} n
 * @param {string|null} v
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
 * @param {*} value
 * @returns {boolean}
 */
function parseBool(value) {
  return ["true", "false", "1", "0", true, false].includes(value) && !!JSON.parse(value);
}

/**
 * @param {HTMLElement} el
 * @param {string} n
 * @param {boolean} defaults When the attribute is not present, what is the default behaviour
 * @returns {boolean}
 */
function boolAttr(el, n, defaults = false) {
  const v = el.getAttribute(n);
  if (v === null) {
    return defaults;
  }
  // An attribute without value is like = true
  if (v === "") {
    return true;
  }
  return parseBool(v);
}

/**
 * @param {HTMLElement} el
 * @param {string} n
 * @param {*} v
 */
function setrm(el, n, v = "") {
  if (v) {
    attr(el, n, v);
  } else {
    attr(el, n, null);
  }
}

/**
 * @returns {int}
 */
function getScrollBarWidth() {
  // There is no scrollbar, no need to compute it's size
  if (DOC.documentElement.scrollHeight <= DOC.documentElement.clientHeight) {
    return 0;
  }
  let el = DOC.createElement("div");
  el.style.cssText = "overflow:scroll; visibility:hidden; position:absolute;";
  DOC.body.appendChild(el);
  let width = el.offsetWidth - el.clientWidth;
  el.remove();
  return width;
}

/**
 * @param {string} fn
 * @returns {Function|null}
 */
function globalFn(fn) {
  return fn.split(".").reduce((r, p) => r[p], window);
}

let dialogPolyfill = null;
if (!supportsDialog()) {
  dialogPolyfill = await addDialogPolyfill();
}

// Init variable
DOC.documentElement.style.setProperty("--scrollbar-width", getScrollBarWidth() + "px");

class PopModal extends HTMLElement {
  constructor() {
    super();

    // Make sure to also have pop-modal:not(:defined) as display:none
    // Otherwise content will show until proper initialization
    this.hidden = true;

    /**
     * @var {HTMLElement}
     */
    this.opener = null;

    // Forms
    /**
     * @var {HTMLFormElement}
     */
    this.parentForm = null;
    /**
     * @var {HTMLFormElement}
     */
    this.form = null;
    /**
     * @var {HTMLDialogElement}
     */
    this.dialog = null;

    // These can be set before element is initialized when using the polyfill
    // so we need to check for their existence
    this.closeHandler = this.closeHandler || null;
    this.openHandler = this.openHandler || null;
  }

  connectedCallback() {
    // Make sure content is parsed, then wrap in a dialog
    setTimeout(() => {
      // We cannot nest forms
      this.parentForm = this.closest("form");
      this.form = this.querySelector("form");
      this.dialog = this.querySelector("dialog");
      const nestedForm = this.querySelector("nested-form");

      if (!this.dialog) {
        this.dialog = DOC.createElement("dialog");
        if (this.parentForm || this.form || nestedForm) {
          this.dialog.append(...this.childNodes);
        } else {
          // This can be useful to track return value
          // @link https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/returnValue
          this.form = DOC.createElement("form");
          this.form.setAttribute("method", "dialog");
          this.dialog.append(this.form);
          this.form.append(...this.childNodes);
        }
        this.appendChild(this.dialog);
      }

      if (nestedForm) {
        if (this.parentForm) {
          // Actual html forms cannot be nested, so we move the modal to the body
          document.body.append(this);
        }
        // Convert to a real form
        this.form = DOC.createElement("form");
        nestedForm.getAttributeNames().forEach((attr) => {
          this.form.setAttribute(attr, nestedForm.getAttribute(attr));
        });
        this.form.append(...nestedForm.childNodes);
        this.dialog.append(this.form);
        nestedForm.remove();
      }

      this.hidden = false;

      // Animations are not playing with this but it doesn't really matter
      if (dialogPolyfill) {
        dialogPolyfill.registerDialog(this.dialog);
      }

      this.dialog.addEventListener("close", this);
      if (animationEnabled()) {
        this.dialog.addEventListener("transitionend", this);
      }

      // Auto open
      if (this.auto) {
        this.open();
      }
    });

    this.addEventListener("keydown", this);
    this.addEventListener("click", this);
    this.bindControls();
  }

  /**
   * Bind all buttons that toggles this modal
   */
  bindControls() {
    DOC.querySelectorAll(`[data-dialog='${this.id}']`).forEach((btn) => {
      btn.addEventListener("click", this);
    });
  }

  disconnectedCallback() {
    // Cleanup event listeners
    this.removeEventListener("click", this);
    if (this.dialog) {
      this.dialog.removeEventListener("close", this);
    }
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

  get dismissible() {
    return boolAttr(this, "dismissible", true);
  }

  set dismissible(v) {
    setrm(this, "dismissible", !!v);
  }

  get backdrop() {
    return boolAttr(this, "backdrop", true);
  }

  set backdrop(v) {
    setrm(this, "backdrop", !!v);
  }

  get auto() {
    return boolAttr(this, "auto");
  }

  get output() {
    return this.getAttribute("output");
  }

  set output(v) {
    setrm(this, "output", v);
  }

  get outputfn() {
    return this.getAttribute("outputfn");
  }

  set outputfn(v) {
    setrm(this, "outputfn", v);
  }

  /**
   * @returns {HTMLElement|null}
   */
  outputElement() {
    if (this.output) {
      return DOC.querySelector(this.output);
    }
  }

  /**
   * @returns {Function|null}
   */
  outputFunction() {
    if (this.outputfn) {
      return globalFn(this.outputfn);
    }
  }

  handleEvent = (ev) => {
    this[`$${ev.type}`](ev);
  };

  $close(ev) {
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

    const outputFn = this.outputFunction();
    if (outputFn) {
      outputFn(ret);
    }

    if (this.closeHandler) {
      this.closeHandler(ret, ev, this);
    }

    // Transition end will not play
    if (!animationEnabled()) {
      this._afterClose();
    }

    // With polyfill, focus is not going back
    if (!supportsDialog()) {
      if (this.opener) {
        this.opener.focus();
      }
    }
  }

  /**
   * @param {TransitionEvent} ev
   */
  $transitionend(ev) {
    // When fully transparent
    if (ev.propertyName == "opacity") {
      this._afterClose();
    }
  }

  /**
   * This is called directly after $close or after $transitionend
   */
  _afterClose() {
    if (!this.dialog.open) {
      DOC.documentElement.classList.remove("pop-modal-open");
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
    if (this.dismissible) {
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
    if (ev && ev.target) {
      this.opener = ev.target;
    }

    if (this.openHandler) {
      this.openHandler(openValue, ev, this);
    }
    // When there is a backdrop, there are no scrollbars
    if (this.backdrop) {
      // Avoid content reflow
      DOC.documentElement.style.setProperty("--scrollbar-width", getScrollBarWidth() + "px");
      DOC.documentElement.classList.add("pop-modal-open");
      this.dialog.showModal();
    } else {
      // Scrollbars are allowed
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
