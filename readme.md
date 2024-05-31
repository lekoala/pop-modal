# Pop Modal

[![NPM](https://nodei.co/npm/pop-modal-dialog.png?mini=true)](https://nodei.co/npm/pop-modal-dialog/)
[![Downloads](https://img.shields.io/npm/dt/pop-modal-dialog.svg)](https://www.npmjs.com/package/pop-modal-dialog)

> A modern custom element to create modals and dialogs

## Nice features

- Use native dialog when available, and load a polyfill automatically for safari < 15.4 and firefox < 98
- Compatible with any framework
- Fully standalone
- Fully accessible
- Binds button automatically with `data-dialog`
- Light dismiss
- No layout jumps due to scrollbars
- Nice animations
- Nested form support

## Why use dialogs ?

Modern dialogs have super powers that cannot be easily replicated with userland javascript.

- Inert background
- Trapping focus

## Why use a custom element

Because dialogs are not supported in safari < 15.4 and firefox < 98. Binding the polyfill is tricky.

Also, you might want to have your buttons bound without custom js (onclick="this.closest('dialog').close('cancel')" anyone?) or inline scripts.
And you might even enjoy some nice styling :-)

## How to use

Using simple html:

```html
<body>
  <!-- including using type module because it's an esm module -->
  <script type="module" src="/path/to/pop-modal.styled.min.js"></script>

  ...

  <pop-modal id="myModal"> Hi there! </pop-modal>

  <button data-dialog="myModal">Open it</button>
  <!-- no js was used :-) -->

  <!-- adding the dialog tag is optional but recommended if you want to avoid swapping nodes -->
  <pop-modal id="myModal"><dialog> Hi there! </dialog></pop-modal>

  ...
</body>
```

## More examples

Using a mega modal that goes to the bottom in mobile view:

```html
<pop-modal id="megaModal" mega> ... </pop-modal>
```

Disabling backdrop

```html
<pop-modal id="modalWithoutBackdrop" backdrop="false"> ... </pop-modal>
```

No light dismiss

```html
<pop-modal id="noLightDismissModal" dismissible="false"> ... </pop-modal>
```

Self opening (for example on load)

```html
<pop-modal id="autoModal" auto> ... </pop-modal>
```

Positioning

```html
<pop-modal id="autoModal" auto position="end"> ... </pop-modal>
```

Callback that gets the button that has been clicked

```html
<pop-modal id="returnModal" output="#someselector" outputfn="some.function"> ... </pop-modal>
```

Your own dialog tag

```html
<pop-modal id="dialogModal"><dialog id="somecustomid"> ... </dialog></pop-modal>
```


Nested forms

```html
<pop-modal id="returnModal"><nested-form action="/some/endpoint"> ... </nested-form></pop-modal>
```

## Config

Simply call the static `configure` method.

```js
customElements.whenDefined("pop-modal").then(() => {
  customElements.get("pop-modal").configure({});
});
```

| Name          | Type                | Description                   |
| ------------- | ------------------- | ----------------------------- |
| closeSelector | <code>String</code> | Selector to find close button |

## Demo

Check out demo.html or a simple code pen below

https://codepen.io/lekoalabe/pen/yLwYEQV

## Browser supports

Modern browsers (edge, chrome, firefox, safari... not IE11). [Add a warning if necessary](https://github.com/lekoala/nomodule-browser-warning.js/).
