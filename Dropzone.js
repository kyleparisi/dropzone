const MicroEvent = require("microevent");

class Dropzone {
  /**
   *
   * @param config {object}
   */
  constructor(config = {}) {
    this.state = {
      dragging: false,
      feedback: "",
      files: config.files || [],
      uploadLimit: config.uploadLimit || 4,
      // Substitute for the boring input element
      element: config.element || new Error("`element` required in configuration."),
      // If your database has a field limit
      fileNameLength: config.fileNameLength || false
    };

    // Default uploadLimitMessage references another state default
    this.state.uploadLimitMessage =
      config.uploadLimitMessage ||
      `The maximum number of files you are able to upload is ${
        this.state.uploadLimit
      }.`;

    // This element controls the `buttonComponent` interaction
    this.input = this.createInput();

    // Attach click event to element
    this.state.element.onclick = () => this.input.click();
    this.state.element.ondragover = this.dragover.bind(this);
    this.state.element.ondragleave = this.dragleave.bind(this);
    this.state.element.ondrop = this.drop.bind(this);

  }

  createInput() {
    const input = document.createElement('input');
    input.setAttribute("type", "file");
    input.setAttribute("name", "files[]");
    input.setAttribute("multiple", "");
    input.addEventListener("change", this);
    return input;
  }

  /**
   * This is ficitious UX.  `FileList`s are read only so the backend will have to be told separately
   * what files are actually attached.
   * @param e {Event}
   */
  removeAttachedFile(e) {
    // Splice is a side affect function
    this.state.files.splice(e.target.dataset.index, 1);
    this.updateState();
    this.trigger("files", this.state.files);
  }

  /**
   * When the input changes values, update state.
   * @param e {Event}
   */
  onchange(e) {
    this.updateState(e.target.files || e.dataTransfer.files);
  }

  /**
   *
   * @param e {Event}
   */
  dragover(e) {
    e.stopPropagation();
    e.preventDefault();

    if (!this.state.dragging) {
      this.state.dragging = true;
      this.trigger("dragover", this);
      this.updateState();
    }
  }

  /**
   *
   * @param e {Event}
   */
  dragleave(e) {
    e.stopPropagation();
    e.preventDefault();

    if (this.state.dragging) {
      this.state.dragging = false;
      this.trigger("dragleave", this);
      this.updateState();
    }
  }

  /**
   *
   * @param e {Event}
   */
  drop(e) {
    e.stopPropagation();
    e.preventDefault();

    this.state.dragging = false;
    this.updateState(e.target.files || e.dataTransfer.files);
  }

  /**
   * Avoid uploading excessive amounts of files.
   * @returns {boolean}
   */
  isOverFileCountLimit(fileList = []) {
    // Just in case state has been corrupted
    if (!this.state.files) {
      this.state.files = [];
    }

    if (
      this.state.files.length > this.state.uploadLimit ||
      this.state.files.length + fileList.length > this.state.uploadLimit
    ) {
      this.state.feedback = this.state.uploadLimitMessage;
      this.trigger("feedback", this.state.uploadLimitMessage);
      this.state.files.slice(0, this.state.uploadLimit);
      return true;
    }

    this.state.feedback = "";
    return false;
  }

  /**
   * Function to clear the files array and update view.
   * This is fictitious because FileLists are read only.
   * @returns {boolean}
   */
  clear() {
    this.input = this.createInput();
    this.state.files = [];
    this.updateState();
    return true;
  }

  /**
   * Update base elements based on the current state object.
   * @param fileList
   * @returns {boolean}
   */
  updateState(fileList) {
    // Number of files allowed to be uploaded is limited.  Only update feedback view.
    if (this.isOverFileCountLimit(fileList)) {
      return false;
    }

    // `fileList` is read only so we have to accept whatever was given as all the files.
    // This converts fileList into a standard array so we can use `.map`.
    if (fileList) {
      this.state.files = this.state.files.concat(
        Object.keys(fileList).map(key => fileList[key])
      );
      this.trigger("files", this.state.files);
    }

    return true;
  }
}

// Allow for the observer pattern on the file list
MicroEvent.mixin(Dropzone);

module.exports = Dropzone;
