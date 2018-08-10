(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Dropzone = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MicroEvent = require("microevent");

var Dropzone = function () {
  /**
   *
   * @param config {object}
   */
  function Dropzone() {
    var _this = this;

    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Dropzone);

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
    this.state.uploadLimitMessage = config.uploadLimitMessage || "The maximum number of files you are able to upload is " + this.state.uploadLimit + ".";

    // This element controls the `buttonComponent` interaction
    this.input = this.createInput();

    // Attach click event to element
    this.state.element.onclick = function () {
      return _this.input.click();
    };
    this.state.element.ondragover = this.dragover.bind(this);
    this.state.element.ondragleave = this.dragleave.bind(this);
    this.state.element.ondrop = this.drop.bind(this);
  }

  _createClass(Dropzone, [{
    key: "createInput",
    value: function createInput() {
      var input = document.createElement('input');
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

  }, {
    key: "removeAttachedFile",
    value: function removeAttachedFile(e) {
      // Splice is a side affect function
      this.state.files.splice(e.target.dataset.index, 1);
      this.updateState();
      this.trigger("files", this.state.files);
    }

    /**
     * When the input changes values, update state.
     * @param e {Event}
     */

  }, {
    key: "onchange",
    value: function onchange(e) {
      this.updateState(e.target.files || e.dataTransfer.files);
    }

    /**
     *
     * @param e {Event}
     */

  }, {
    key: "dragover",
    value: function dragover(e) {
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

  }, {
    key: "dragleave",
    value: function dragleave(e) {
      e.stopPropagation();
      e.preventDefault();

      if (this.state.dragging) {
        this.state.dragging = false;
        this.trigger("dragleave");
        this.updateState();
      }
    }

    /**
     *
     * @param e {Event}
     */

  }, {
    key: "drop",
    value: function drop(e) {
      e.stopPropagation();
      e.preventDefault();

      this.state.dragging = false;
      this.updateState(e.target.files || e.dataTransfer.files);
    }

    /**
     * Avoid uploading excessive amounts of files.
     * @returns {boolean}
     */

  }, {
    key: "isOverFileCountLimit",
    value: function isOverFileCountLimit() {
      var fileList = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      // Just in case state has been corrupted
      if (!this.state.files) {
        this.state.files = [];
      }

      if (this.state.files.length > this.state.uploadLimit || this.state.files.length + fileList.length > this.state.uploadLimit) {
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

  }, {
    key: "clear",
    value: function clear() {
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

  }, {
    key: "updateState",
    value: function updateState(fileList) {
      // Number of files allowed to be uploaded is limited.  Only update feedback view.
      if (this.isOverFileCountLimit(fileList)) {
        return false;
      }

      // `fileList` is read only so we have to accept whatever was given as all the files.
      // This converts fileList into a standard array so we can use `.map`.
      if (fileList) {
        this.state.files = this.state.files.concat(Object.keys(fileList).map(function (key) {
          return fileList[key];
        }));
        this.trigger("files", this.state.files);
      }

      return true;
    }
  }]);

  return Dropzone;
}();

// Allow for the observer pattern on the file list


MicroEvent.mixin(Dropzone);

module.exports = Dropzone;

},{"microevent":2}],2:[function(require,module,exports){
/**
 * MicroEvent - to make any js object an event emitter (server or browser)
 * 
 * - pure javascript - server compatible, browser compatible
 * - dont rely on the browser doms
 * - super simple - you get it immediatly, no mistery, no magic involved
 *
 * - create a MicroEventDebug with goodies to debug
 *   - make it safer to use
*/

var MicroEvent	= function(){}
MicroEvent.prototype	= {
	bind	: function(event, fct){
		this._events = this._events || {};
		this._events[event] = this._events[event]	|| [];
		this._events[event].push(fct);
	},
	unbind	: function(event, fct){
		this._events = this._events || {};
		if( event in this._events === false  )	return;
		this._events[event].splice(this._events[event].indexOf(fct), 1);
	},
	trigger	: function(event /* , args... */){
		this._events = this._events || {};
		if( event in this._events === false  )	return;
		for(var i = 0; i < this._events[event].length; i++){
			this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1))
		}
	}
};

/**
 * mixin will delegate all MicroEvent.js function in the destination object
 *
 * - require('MicroEvent').mixin(Foobar) will make Foobar able to use MicroEvent
 *
 * @param {Object} the object which will support MicroEvent
*/
MicroEvent.mixin	= function(destObject){
	var props	= ['bind', 'unbind', 'trigger'];
	for(var i = 0; i < props.length; i ++){
		destObject.prototype[props[i]]	= MicroEvent.prototype[props[i]];
	}
}

// export in common js
if( typeof module !== "undefined" && ('exports' in module)){
	module.exports	= MicroEvent
}

},{}]},{},[1])(1)
});
