import "./src/PopModal.js";
import styles from "./pop-modal.min.css";

if (!document.head.querySelector(`#pop-modal-style`)) {
  const style = document.createElement("style");
  style.id = `pop-modal-style`;
  style.innerText = styles;
  document.head.append(style);
}
