const yo = require('yo-yo');
const MicroEvent = require('microevent');

class Dropzone {

    /**
     *
     * @param config {object}
     */
    constructor(config = {}) {

        this.state = {
            dragging: false,
            feedback: '',
            files: config.files || [],
            uploadLimit: config.uploadLimit || 4,
            // Placeholder for files in the dropzone element
            fileIcon: (typeof config.fileIcon === 'function') ? config.fileIcon : this.fileEmoji,
            // Substitute for the boring input element
            buttonElement: config.buttonElement || yo`<button>Add files</button>`,
            classes: {},
            fileNameLength: (config.fileNameLength === undefined) ? false : config.fileNameLength
        };

        // Default class styles
        config.classes = config.classes || {};
        this.state.classes.feedback = config.classes.feedback || '';
        this.state.classes.dropzone = config.classes.dropzone || '';
        this.state.classes.dragover = config.classes.dragover || '';
        this.state.classes.button = config.classes.button || '';

        // Default uploadLimitMessage references another state default
        this.state.uploadLimitMessage = config.uploadLimitMessage || `The maximum number of files you are able to upload is ${this.state.uploadLimit}.`;

        // This element controls the `buttonComponent` interaction
        this.input = yo`<input type="file" style="display: none" onchange=${this.onchange.bind(this)} name="files[]" multiple />`;

        // Attach click event to buttonElement
        this.state.buttonElement.onclick = () => this.input.click();


        // Original views for updating
        this.dropzoneElement = this.dropzoneComponent();
        this.feedbackElement = this.feedbackComponent();
        // This element doesn't really need updates
        this.buttonElement = this.buttonComponent();

    }

    /**
     * `yo-yo` (bel) escapes text so the emoji element is added after the fact.
     * @returns {Element}
     */
    fileEmoji() {
        let el = yo`<div style="font-size: 3rem;padding: 1rem;"></div>`;
        el.innerHTML = '&#128196;';
        return el;
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
        this.trigger('files', this.state.files);
    }

    /**
     *
     * @returns {Element}
     */
    renderInstructions() {
        return yo`<li>Drag and drop your files here</li>`;
    }

    /**
     * Render FileList as `<li>` elements
     * @returns {Array}
     */
    renderFiles() {
        return this.state.files.map((file, index) => {

            // Santize and shorten file name
            let fileName = file.name.replace(/[^a-zA-Z0-9.]/ig, '_');
            if (this.state.fileNameLength && fileName.length > this.state.fileNameLength) {
                let trimmedName = fileName.substring(0, this.state.fileNameLength);
                // remove extension if still in the trimmed name
                trimmedName = trimmedName.split('.');
                if (trimmedName.length > 1) {
                    trimmedName.splice(-1, 1);
                }
                trimmedName = trimmedName.join('');

                fileName = trimmedName + '...' + fileName.split('.').pop();
            }

            return yo`
            <li>
                <div style="cursor: pointer;" data-index="${index}" data-name="close" onclick=${this.removeAttachedFile.bind(this)}>x</div>
                ${this.state.fileIcon(file)}
                <div>${fileName}</div>
            </li>`;
        });
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

        if (this.state.files.length > this.state.uploadLimit ||
            this.state.files.length + fileList.length > this.state.uploadLimit) {
            this.state.feedback = this.state.uploadLimitMessage;
            this.trigger('feedback', this.state.uploadLimitMessage);
            this.state.files.slice(0, this.state.uploadLimit);
            return true;
        }

        this.state.feedback = '';
        return false;

    }

    /**
     * Function to clear the files array and update view.
     * This is fictitious because FileLists are read only.
     * @returns {boolean}
     */
    clear() {
        this.input = yo`<input type="file" style="display: none" onchange=${this.onchange.bind(this)} name="files[]" multiple />`;
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
            yo.update(this.feedbackElement, this.feedbackComponent());
            return false;
        }

        // `fileList` is read only so we have to accept whatever was given as all the files.
        // This converts fileList into a standard array so we can use `.map`.
        if (fileList) {
            this.state.files = this.state.files.concat(Object.keys(fileList).map(key => fileList[key]));
            this.trigger('files', this.state.files);
        }

        yo.update(this.feedbackElement, this.feedbackComponent());
        yo.update(this.dropzoneElement, this.dropzoneComponent());

        return true;
    }

    /**
     *
     * @returns {Element}
     */
    dropzoneComponent() {

        let classes;
        if (this.state.dragging) {
            classes = `${this.state.classes.dropzone} ${this.state.classes.dragover}`;
        } else {
            classes = this.state.classes.dropzone;
        }

        return yo`
        <div ondragover=${this.dragover.bind(this)} ondragleave=${this.dragleave.bind(this)} ondrop=${this.drop.bind(this)} class="${classes}">
            <ul>
                ${this.state.files.length ? this.renderFiles() : this.renderInstructions()}
            </ul>
        </div>`;
    }

    /**
     *
     * @returns {Element}
     */
    buttonComponent() {
        return yo`${this.state.buttonElement}`;
    }

    /**
     *
     * @returns {Element}
     */
    feedbackComponent() {
        return yo`<div onclick=${this.input.click} class="${this.state.classes.feedback}">${this.state.feedback}</div>`;
    }

}

// Allow for the observer pattern on the file list
MicroEvent.mixin(Dropzone);

module.exports = Dropzone;
