/**
 * fileuploader
 * Copyright (c) 2020 Innostudio.de
 * Website: https://innostudio.de/fileuploader/
 * Version: 2.2 (12-Mar-2020)
 * License: https://innostudio.de/fileuploader/documentation/#license
 */
(function (factory) {
  "use strict";
  if (typeof define === "function" && define.amd) {
    define(["jquery"], factory);
  } else if (typeof exports !== "undefined") {
    module.exports = factory(require("jquery"));
  } else {
    factory(jQuery);
  }
})(function ($) {
  "use strict";

  $.fn.fileuploader = function (q) {
    return this.each(function (t, r) {
      var s = $(r), // input element
        p = null, // parent element
        o = null, // new input element
        l = null, // list element
        sl = [], // input elements !important for addMore option
        n = $.extend(true, {}, $.fn.fileuploader.defaults, q), // options
        f = {
          /**
           * init
           * initialize the plugin
           *
           * @void
           */
          init: function () {
            // create and set the parent element
            if (!s.closest(".fileuploader").length)
              s.wrap('<div class="fileuploader"></div>');
            p = s.closest(".fileuploader");

            // extend captions object
            f.set("language");

            // add, merge and apply input attributes with the options
            // also define the defaults for some options
            f.set("attrOpts");

            // check if the plugin is supported in current browser
            if (!f.isSupported()) {
              n.onSupportError && $.isFunction(n.onSupportError)
                ? n.onSupportError(p, s)
                : null;
              return false;
            }

            // before render callback
            if (
              n.beforeRender &&
              $.isFunction(n.beforeRender) &&
              n.beforeRender(p, s) === false
            )
              return false;

            // redesign the new input
            f.redesign();

            // append files from options
            if (n.files) f.files.append(n.files);

            // after render callback
            f.rendered = true;
            n.afterRender && $.isFunction(n.afterRender)
              ? n.afterRender(l, p, o, s)
              : null;

            // bind events
            if (!f.disabled) f.bindUnbindEvents(true);
            s.closest("form").on("reset", f.reset);

            if (!f._itFl.length) f.reset();
          },

          /**
           * bindUnbindEvents
           * bind or unbind events for input and new elements
           *
           * @param {bool} bind - bind the events?
           * @void
           */
          bindUnbindEvents: function (bind) {
            // unbind events
            if (bind) f.bindUnbindEvents(false);

            // bind all input events
            s[bind ? "on" : "off"]("focus blur change", f.onEvent);

            // bind click event for the new input
            if (n.changeInput && o !== s)
              o[bind ? "on" : "off"]("click", f.clickHandler);

            // bind drag&drop events
            if (n.dragDrop && n.dragDrop.container.length) {
              n.dragDrop.container[bind ? "on" : "off"](
                "drag dragstart dragend dragover dragenter dragleave drop",
                function (e) {
                  e.preventDefault();
                }
              );
              n.dragDrop.container[bind ? "on" : "off"](
                "drop",
                f.dragDrop.onDrop
              );
              n.dragDrop.container[bind ? "on" : "off"](
                "dragover",
                f.dragDrop.onDragEnter
              );
              n.dragDrop.container[bind ? "on" : "off"](
                "dragleave",
                f.dragDrop.onDragLeave
              );
            }

            // bind the paste from clipboard event
            if (f.isUploadMode() && n.clipboardPaste)
              $(window)[bind ? "on" : "off"]("paste", f.clipboard.paste);

            // bind sorter events
            if (n.sorter && n.thumbnails && n.thumbnails._selectors.sorter)
              f.sorter[bind ? "init" : "destroy"]();
          },

          /**
           * redesign
           * create the new input and hide the standard one
           *
           * @void
           */
          redesign: function () {
            // set as default
            o = s;

            // add a class name with theme
            if (n.theme) p.addClass("fileuploader-theme-" + n.theme);

            // set new input html
            if (n.changeInput) {
              switch ((typeof n.changeInput + "").toLowerCase()) {
                case "boolean":
                  o = $(
                    '<div class="fileuploader-input">' +
                      '<div class="fileuploader-input-caption"><span>' +
                      f._assets.textParse(n.captions.feedback) +
                      "</span></div>" +
                      '<button type="button" class="fileuploader-input-button"><span>' +
                      f._assets.textParse(n.captions.button) +
                      "</span></button>" +
                      "</div>"
                  );
                  break;
                case "string":
                  if (n.changeInput != " ")
                    o = $(f._assets.textParse(n.changeInput, n));
                  break;
                case "object":
                  o = $(n.changeInput);
                  break;
                case "function":
                  o = $(n.changeInput(s, p, n, f._assets.textParse));
                  break;
              }

              // add the new input after standard input
              s.after(o);

              // hide the standard input
              s.css({
                position: "absolute",
                "z-index": "-9999",
                height: "0",
                width: "0",
                padding: "0",
                margin: "0",
                "line-height": "0",
                outline: "0",
                border: "0",
                opacity: "0",
              });
            }

            // create thumbnails list
            if (n.thumbnails) f.thumbnails.create();

            // set drag&drop container
            if (n.dragDrop) {
              n.dragDrop =
                typeof n.dragDrop != "object"
                  ? { container: null }
                  : n.dragDrop;
              n.dragDrop.container = n.dragDrop.container
                ? $(n.dragDrop.container)
                : o;
            }
          },

          /**
           * clickHandler
           * click event for new input
           *
           * @param {Event} e - jQuery event
           * @void
           */
          clickHandler: function (e) {
            e.preventDefault();

            // clear clipboard pending
            if (f.clipboard._timer) {
              f.clipboard.clean();
              return;
            }

            // trigger input click
            s.click();
          },

          /**
           * onEvent
           * callbacks for each input event
           *
           * @param {Event} e - jQuery event
           * @void
           */
          onEvent: function (e) {
            switch (e.type) {
              case "focus":
                p ? p.addClass("fileuploader-focused") : null;
                break;
              case "blur":
                p ? p.removeClass("fileuploader-focused") : null;
                break;
              case "change":
                f.onChange.call(this);
                break;
            }

            // listeners callback
            n.listeners && $.isFunction(n.listeners[e.type])
              ? n.listeners[e.type].call(s, p)
              : null;
          },

          /**
           * set
           * set properties
           *
           * @param {String} type - property type
           * @param {null|String} value - property value
           * @void
           */
          set: function (type, value) {
            switch (type) {
              case "attrOpts":
                var d = [
                  "limit",
                  "maxSize",
                  "fileMaxSize",
                  "extensions",
                  "changeInput",
                  "theme",
                  "addMore",
                  "listInput",
                  "files",
                ];
                for (var k = 0; k < d.length; k++) {
                  var j = "data-fileuploader-" + d[k];
                  if (f._assets.hasAttr(j)) {
                    switch (d[k]) {
                      case "changeInput":
                      case "addMore":
                      case "listInput":
                        n[d[k]] =
                          ["true", "false"].indexOf(s.attr(j)) > -1
                            ? s.attr(j) == "true"
                            : s.attr(j);
                        break;
                      case "extensions":
                        n[d[k]] = s.attr(j).replace(/ /g, "").split(",");
                        break;
                      case "files":
                        n[d[k]] = JSON.parse(s.attr(j));
                        break;
                      default:
                        n[d[k]] = s.attr(j);
                    }
                  }
                  s.removeAttr(j);
                }

                // set the plugin on disabled if the input has disabled attribute or limit is 0
                if (
                  s.attr("disabled") != null ||
                  s.attr("readonly") != null ||
                  n.limit === 0
                )
                  f.disabled = true;

                // set multiple attribute to the input
                if (!n.limit || (n.limit && n.limit >= 2)) {
                  s.attr("multiple", "multiple");
                  // set brackets at the end of input name
                  n.inputNameBrackets && s.attr("name").slice(-2) != "[]"
                    ? s.attr("name", s.attr("name") + "[]")
                    : null;
                }

                // set list input element
                if (n.listInput === true) {
                  n.listInput = $(
                    '<input type="hidden" name="fileuploader-list-' +
                      s
                        .attr("name")
                        .replace("[]", "")
                        .split("[")
                        .pop()
                        .replace("]", "") +
                      '">'
                  ).insertBefore(s);
                }
                if (
                  typeof n.listInput == "string" &&
                  $(n.listInput).length == 0
                ) {
                  n.listInput = $(
                    '<input type="hidden" name="' + n.listInput + '">'
                  ).insertBefore(s);
                }

                // apply some defined options to plugin
                f.set("disabled", f.disabled);
                if (!n.fileMaxSize && n.maxSize) n.fileMaxSize = n.maxSize;
                break;
              // extend captions object
              case "language":
                var languages = $.fn.fileuploader.languages;

                if (typeof n.captions == "string") {
                  if (n.captions in languages)
                    n.captions = languages[n.captions];
                  else
                    n.captions = $.extend(
                      true,
                      {},
                      $.fn.fileuploader.defaults.captions
                    );
                }
                break;
              // set and apply disable option to plugin
              case "disabled":
                f.disabled = value;
                p[f.disabled ? "addClass" : "removeClass"](
                  "fileuploader-disabled"
                );
                s[f.disabled ? "attr" : "removeAttr"]("disabled", "disabled");

                if (f.rendered) f.bindUnbindEvents(!value);
                break;
              // set new input feedback html
              case "feedback":
                if (!value)
                  value = f._assets.textParse(
                    f._itFl.length > 0
                      ? n.captions.feedback2
                      : n.captions.feedback,
                    { length: f._itFl.length }
                  );

                $(!o.is(":file"))
                  ? o.find(".fileuploader-input-caption span").html(value)
                  : null;
                break;
              // set file input value to empty
              case "input":
                var el = f._assets.copyAllAttributes(
                  $('<input type="file">'),
                  s,
                  true
                );

                f.bindUnbindEvents(false);
                s.after((s = el)).remove();
                f.bindUnbindEvents(true);
                break;
              // set previous input; only for addMore option
              case "prevInput":
                if (sl.length > 0) {
                  f.bindUnbindEvents(false);
                  sl[value].remove();
                  sl.splice(value, 1);
                  s = sl[sl.length - 1];
                  f.bindUnbindEvents(true);
                }
                break;
              // set next input; only for addMore option
              case "nextInput":
                var el = f._assets.copyAllAttributes(
                  $('<input type="file">'),
                  s
                );

                f.bindUnbindEvents(false);
                if (
                  sl.length > 0 &&
                  sl[sl.length - 1].get(0).files.length == 0
                ) {
                  s = sl[sl.length - 1];
                } else {
                  sl.indexOf(s) == -1 ? sl.push(s) : null;
                  sl.push(el);
                  s.after((s = el));
                }
                f.bindUnbindEvents(true);
                break;
              // set list input with list of the files
              case "listInput":
                if (n.listInput)
                  n.listInput.val(f.files.list(true, null, false, value));
                break;
            }
          },

          /**
           * onChange
           * on input change event
           *
           * @param {Event} e - jQuery event
           * @param {Array} fileList - FileList array, used only by drag&drop and clipboard paste
           * @void
           */
          onChange: function (e, fileList) {
            var files = s.get(0).files;

            // drag&drop or clipboard paste
            if (fileList) {
              if (fileList.length) {
                files = fileList;
              } else {
                f.set("input", "");
                f.files.clear();
                return false;
              }
            }

            // clean clipboard timer
            // made only for safety
            if (f.clipboard._timer) f.clipboard.clean();

            // reset the input if default mode
            if (f.isDefaultMode()) {
              f.reset();

              if (files.length == 0) return;
            }

            // beforeSelect callback
            if (
              n.beforeSelect &&
              $.isFunction(n.beforeSelect) &&
              n.beforeSelect(files, l, p, o, s) == false
            ) {
              return false;
            }

            // files
            var t = 0; // total processed files
            for (var i = 0; i < files.length; i++) {
              var file = files[i], // file
                item = f._itFl[f.files.add(file, "choosed")], // item
                status = f.files.check(item, files, i == 0); // ["type", "message", "do not show the warning message", "do not check the next files"]

              // process the warnings
              if (status !== true) {
                f.files.remove(item, true);

                if (!status[2]) {
                  if (f.isDefaultMode()) {
                    f.set("input", "");
                    f.reset();
                    status[3] = true;
                  }

                  status[1]
                    ? f._assets.dialogs.alert(status[1], item, l, p, o, s)
                    : null;
                }

                if (status[3]) {
                  break;
                }

                continue;
              }
              // file is valid
              // create item html
              if (n.thumbnails) f.thumbnails.item(item);

              // create item ajax request
              if (f.isUploadMode()) f.upload.prepare(item);

              // onSelect callback
              n.onSelect && $.isFunction(n.onSelect)
                ? n.onSelect(item, l, p, o, s)
                : null;

              t++;
            }

            // clear the input in uploadMode
            if (f.isUploadMode() && t > 0) f.set("input", "");

            // set feedback caption
            f.set("feedback", null);

            // set nextInput for addMore option
            if (f.isAddMoreMode() && t > 0) {
              f.set("nextInput");
            }

            // set listInput value
            f.set("listInput", null);

            // afterSelect callback
            n.afterSelect && $.isFunction(n.afterSelect)
              ? n.afterSelect(l, p, o, s)
              : null;
          },

          /**
           * @namespace thumbnails
           */
          thumbnails: {
            /**
             * create
             * create the thumbnails list
             *
             * @namespace thumbnails
             * @void
             */
            create: function () {
              // thumbnails.beforeShow callback
              n.thumbnails.beforeShow != null &&
              $.isFunction(n.thumbnails.beforeShow)
                ? n.thumbnails.beforeShow(p, o, s)
                : null;

              // create item's list element
              var box = $(f._assets.textParse(n.thumbnails.box)).appendTo(
                n.thumbnails.boxAppendTo ? n.thumbnails.boxAppendTo : p
              );
              l = !box.is(n.thumbnails._selectors.list)
                ? box.find(n.thumbnails._selectors.list)
                : box;

              // bind item popup method to the selector
              if (n.thumbnails._selectors.popup_open) {
                l.on("click", n.thumbnails._selectors.popup_open, function (e) {
                  e.preventDefault();

                  var m = $(this).closest(n.thumbnails._selectors.item),
                    item = f.files.find(m);

                  if (
                    item &&
                    item.popup &&
                    item.html.hasClass("file-has-popup")
                  )
                    f.thumbnails.popup(item);
                });
              }
              // bind item upload start method to the selector
              if (f.isUploadMode() && n.thumbnails._selectors.start) {
                l.on("click", n.thumbnails._selectors.start, function (e) {
                  e.preventDefault();

                  if (f.locked) return false;

                  var m = $(this).closest(n.thumbnails._selectors.item),
                    item = f.files.find(m);

                  if (item) f.upload.send(item, true);
                });
              }
              // bind item upload retry method to the selector
              if (f.isUploadMode() && n.thumbnails._selectors.retry) {
                l.on("click", n.thumbnails._selectors.retry, function (e) {
                  e.preventDefault();

                  if (f.locked) return false;

                  var m = $(this).closest(n.thumbnails._selectors.item),
                    item = f.files.find(m);

                  if (item) f.upload.retry(item);
                });
              }
              // bind item editor rotate method to the selector
              if (n.thumbnails._selectors.rotate) {
                l.on("click", n.thumbnails._selectors.rotate, function (e) {
                  e.preventDefault();

                  if (f.locked) return false;

                  var m = $(this).closest(n.thumbnails._selectors.item),
                    item = f.files.find(m);

                  if (item && item.editor) {
                    item.editor.rotate();
                    item.editor.save();
                  }
                });
              }
              // bind item remove / upload.cancel method to the selector
              if (n.thumbnails._selectors.remove) {
                l.on("click", n.thumbnails._selectors.remove, function (e) {
                  e.preventDefault();

                  if (f.locked) return false;

                  var m = $(this).closest(n.thumbnails._selectors.item),
                    item = f.files.find(m),
                    c = function (a) {
                      f.files.remove(item);
                    };

                  if (item) {
                    if (item.upload && item.upload.status != "successful") {
                      f.upload.cancel(item);
                    } else {
                      // if (n.thumbnails.removeConfirmation && !item.choosed) {
                      if (n.thumbnails.removeConfirmation) {
                        f._assets.dialogs.confirm(
                          f._assets.textParse(
                            n.captions.removeConfirmation,
                            item
                          ),
                          c
                        );
                      } else {
                        c();
                      }
                    }
                  }
                });
              }
            },
            /**
             * clear
             * set the HTML content from items list to empty
             *
             * @namespace thumbnails
             * @void
             */
            clear: function () {
              if (l) l.html("");
            },
            /**
             * item
             * create the item.html and append it to the list
             *
             * @namespace thumbnails
             * @param {Object} item
             * @param {HTML} replaceHtml
             * @void
             */
            item: function (item, replaceHtml) {
              item.icon = f.thumbnails.generateFileIcon(
                item.format,
                item.extension
              );
              item.image = '<div class="fileuploader-item-image"></div>';
              item.progressBar = f.isUploadMode()
                ? '<div class="fileuploader-progressbar"><div class="bar"></div></div>'
                : "";

              item.html = $(
                f._assets.textParse(
                  item.appended && n.thumbnails.item2
                    ? n.thumbnails.item2
                    : n.thumbnails.item,
                  item
                )
              );
              item.progressBar = item.html.find(".fileuploader-progressbar");

              // add class with file extension and file format to item html
              item.html.addClass(
                "file-type-" +
                  (item.format ? item.format : "no") +
                  " file-ext-" +
                  (item.extension ? item.extension : "no") +
                  ""
              );

              // add item html to list element
              if (replaceHtml) replaceHtml.replaceWith(item.html);
              else
                item.html[n.thumbnails.itemPrepend ? "prependTo" : "appendTo"](
                  l
                );

              // add popup option
              if (n.thumbnails.popup && item.data.popup !== false) {
                item.html.addClass("file-has-popup");
                item.popup = {
                  open: function () {
                    f.thumbnails.popup(item);
                  },
                };
              }

              // render the image thumbnail
              f.thumbnails.renderThumbnail(item);
              item.renderThumbnail = function (src) {
                if (src && item.popup && item.popup.close) {
                  item.popup.close();
                  item.popup = { open: item.popup.open };
                }
                f.thumbnails.renderThumbnail(item, true, src);
              };

              // thumbnails.onItemShow callback
              n.thumbnails.onItemShow != null &&
              $.isFunction(n.thumbnails.onItemShow)
                ? n.thumbnails.onItemShow(item, l, p, o, s)
                : null;
            },
            /**
             * generateFileIcon
             * generate a file icon with custom background color
             *
             * @namespace thumbnails
             * @param {String} form - file format
             * @param {String} extension - file extension
             * @return {String} html element
             */
            generateFileIcon: function (format, extension) {
              // extension = extension.toLowerCase();
              // var nameIcon = "";
              // var Extension = {
              //     Image: ['jpg', 'jpeg', 'png', 'gif'],
              //     Video: ['mov', 'wmv', 'avi', 'mp4'],
              //     PDF: ['pdf'],
              //     Document: ['doc', 'docx', 'xls', 'xlsx', 'txt'],
              //     Word: ["doc", "docx"],
              //     Excel: ["xls", "xlsx"],
              //     Powpoint: ["pptx", "pdf", "ppt"],
              //     txt: ["txt"],
              //     Email: ["msg"],
              //     Other: ['rar', 'zip'],
              //     GetAll: function () {
              //         var arrExt = [];
              //         for (var key in this) {
              //             arrExt = arrExt.concat(this[key]);
              //         }
              //         return arrExt;
              //     }
              // }
              // if ($.inArray(extension, Extension.Image) > -1) {
              //     nameIcon = "imageImage";
              // }
              // else if ($.inArray(extension, Extension.Video) > -1) {
              //     nameIcon = "videoImage";
              // }
              // else if ($.inArray(extension, Extension.PDF) > -1) {
              //     nameIcon = "pdfImage";
              // }
              // else if ($.inArray(extension, Extension.Word) > -1) {
              //     nameIcon = "wordImage";
              // }
              // else if ($.inArray(extension, Extension.Excel) > -1) {
              //     nameIcon = "excelImage";
              // }
              // else if ($.inArray(extension, Extension.Powpoint) > -1) {
              //     nameIcon = "powerpointImage";
              // }
              // else if ($.inArray(extension, Extension.txt) > -1) {
              //     nameIcon = "txtImage";
              // }
              // else if ($.inArray(extension, Extension.Email) > -1) {
              //     nameIcon = "EmailImage";
              // } else if ($.inArray(extension, Extension.Other) > -1) {
              //     nameIcon = "zipImage";
              // }
              // else {
              //     nameIcon = "linkImage";
              // }
              // var el = '<div class="fileuploader-item-icon" style="background-color:transparent !important;"><img src="/Images/IconSystem/' + nameIcon + '.png"></div>';
              // return el;
              var el =
                '<div style="${style}" class="fileuploader-item-icon' +
                '${class}"><i>' +
                (extension ? extension : "") +
                "</i></div>";

              // set generated color to icon background
              var bgColor = f._assets.textToColor(extension);
              if (bgColor) {
                var isBgColorBright = f._assets.isBrightColor(bgColor);
                if (isBgColorBright)
                  el = el.replace("${class}", " is-bright-color");
                el = el.replace("${style}", "background-color: " + bgColor);
              }

              return el.replace("${style}", "").replace("${class}", "");
            },
            /**
             * renderThumbnail
             * render image thumbnail and append to .fileuploader-item-image element
             * it appends the generated icon if the file is not an image or not a valid image
             *
             * @namespace thumbnails
             * @param {Object} item
             * @param {bool} forceRender - skip the synchron functions and force the rendering
             * @param {string} src - custom image source
             * @void
             */
            renderThumbnail: function (item, forceRender, src) {
              var m = item.html.find(".fileuploader-item-image"),
                readerSkip =
                  item.data &&
                  (item.data.readerSkip || item.data.thumbnail === false),
                setImageThumb = function (img) {
                  var $img = $(img);

                  // add $img to html
                  m.removeClass(
                    "fileuploader-no-thumbnail fileuploader-loading"
                  ).html($img);
                  if (item.html.hasClass("file-will-popup"))
                    item.html
                      .removeClass("file-will-popup")
                      .addClass("file-has-popup");

                  // add onImageLoaded callback
                  if ($img.is("img"))
                    $img
                      .attr("draggable", "false")
                      .on("load error", function (e) {
                        if (e.type == "error") setIconThumb();
                      });

                  n.thumbnails.onImageLoaded != null &&
                  $.isFunction(n.thumbnails.onImageLoaded)
                    ? n.thumbnails.onImageLoaded(item, l, p, o, s)
                    : null;
                },
                setIconThumb = function () {
                  m.addClass("fileuploader-no-thumbnail");
                  m.removeClass("fileuploader-loading").html(item.icon);
                  if (item.html.hasClass("file-will-popup"))
                    item.html
                      .removeClass("file-will-popup")
                      .addClass("file-has-popup");

                  n.thumbnails.onImageLoaded != null &&
                  $.isFunction(n.thumbnails.onImageLoaded)
                    ? n.thumbnails.onImageLoaded(item, l, p, o, s)
                    : null;
                },
                renderNextItem = function () {
                  var i = 0;

                  if (item && f._pfrL.indexOf(item) > -1) {
                    f._pfrL.splice(f._pfrL.indexOf(item), 1);
                    while (i < f._pfrL.length) {
                      if (f._itFl.indexOf(f._pfrL[i]) > -1) {
                        setTimeout(
                          function () {
                            f.thumbnails.renderThumbnail(f._pfrL[i], true);
                          },
                          item.format == "image" && item.size / 1000000 > 1.8
                            ? 200
                            : 0
                        );
                        break;
                      } else {
                        f._pfrL.splice(i, 1);
                      }
                      i++;
                    }
                  }
                };

              // skip this function if there is no place for image
              if (!m.length) {
                renderNextItem();
                return;
              }

              // set item.image to jQuery element
              item.image = m.html("").addClass("fileuploader-loading");

              // create an image thumbnail only if file is an image and if FileReader is supported
              if (
                (["image", "video", "audio", "astext"].indexOf(item.format) >
                  -1 ||
                  item.data.thumbnail) &&
                f.isFileReaderSupported() &&
                !readerSkip &&
                (item.appended ||
                  n.thumbnails.startImageRenderer ||
                  forceRender)
              ) {
                // prevent popup before loading
                if (item.html.hasClass("file-has-popup"))
                  item.html
                    .removeClass("file-has-popup")
                    .addClass("file-will-popup");

                // check pending list
                if (n.thumbnails.synchronImages) {
                  f._pfrL.indexOf(item) == -1 && !forceRender
                    ? f._pfrL.push(item)
                    : null;
                  if (f._pfrL.length > 1 && !forceRender) {
                    return;
                  }
                }

                // create thumbnail
                var process = function (data, fromReader) {
                  var isIMG =
                      data &&
                      data.nodeName &&
                      data.nodeName.toLowerCase() == "img",
                    src = !isIMG ? data : data.src,
                    img = null,
                    onload = function () {
                      if (n.thumbnails.canvasImage) {
                        var canvas = document.createElement("canvas");

                        // resize canvas
                        f.editor.resize(
                          this,
                          canvas,
                          n.thumbnails.canvasImage.width
                            ? n.thumbnails.canvasImage.width
                            : m.width(),
                          n.thumbnails.canvasImage.height
                            ? n.thumbnails.canvasImage.height
                            : m.height(),
                          false,
                          true
                        );

                        // check if canvas is not blank
                        if (!f._assets.isBlankCanvas(canvas)) {
                          setImageThumb(canvas);
                        } else {
                          setIconThumb();
                        }
                      } else {
                        setImageThumb(this);
                      }

                      // render the next pending item
                      renderNextItem();
                    },
                    onerror = function () {
                      img = null;
                      setIconThumb();
                      renderNextItem();
                    };

                  // do not create an empty image element
                  if (!data) return onerror();

                  // do not create another image element
                  if (fromReader && item.format == "image" && item.reader.node)
                    return onload.call(item.reader.node);

                  // if image node
                  if (isIMG) return onload.call(data);

                  // create image element
                  img = new Image();
                  img.onload = onload;
                  img.onerror = onerror;
                  if (item.data && item.data.readerCrossOrigin)
                    img.setAttribute(
                      "crossOrigin",
                      item.data.readerCrossOrigin
                    );
                  img.src = src;
                };

                // choose thumbnail source
                if (typeof src == "string" || typeof src == "object")
                  return process(src);
                else
                  return f.files.read(
                    item,
                    function () {
                      process(
                        item.reader.frame ||
                          (item.reader.node &&
                          item.reader.node.nodeName.toLowerCase() == "img"
                            ? item.reader.src
                            : null),
                        true
                      );
                    },
                    null,
                    src,
                    true
                  );
              }

              setIconThumb();
            },
            /**
             * popup
             * create and show a popup for an item
             * appends the popup to parent element
             * reset values for the editor
             *
             * @namespace thumbnails
             * @param {Object} item
             * @param {Boolean} isByAction - popup is called by prev/next buttons
             * @void
             */
            popup: function (item, isByActions) {
              if (
                f.locked ||
                !n.thumbnails.popup ||
                !n.thumbnails._selectors.popup
              )
                return;

              var container = $(n.thumbnails.popup.container),
                box = container.find(".fileuploader-popup"),
                hasArrowsClass = "fileuploader-popup-has-arrows",
                renderPopup = function () {
                  var template =
                      item.popup.html ||
                      $(f._assets.textParse(n.thumbnails.popup.template, item)),
                    popupIsNew = item.popup.html !== template,
                    windowKeyEvent = function (e) {
                      var key = e.which || e.keyCode;

                      if (key == 27 && item.popup && item.popup.close)
                        item.popup.close();

                      if ((key == 37 || key == 39) && n.thumbnails.popup.arrows)
                        item.popup.move(key == 37 ? "prev" : "next");
                    };

                  box.removeClass("loading");

                  // remove all created popups
                  if (box.children(n.thumbnails._selectors.popup).length) {
                    $.each(f._itFl, function (i, a) {
                      if (a != item && a.popup && a.popup.close) {
                        a.popup.close(isByActions);
                      }
                    });
                    box.find(n.thumbnails._selectors.popup).remove();
                  }

                  template.show().appendTo(box);
                  item.popup.html = template;
                  item.popup.isOpened = true;
                  item.popup.move = function (to) {
                    var itemIndex = f._itFl.indexOf(item),
                      nextItem = null,
                      itL = false;

                    to = n.thumbnails.itemPrepend
                      ? to == "prev"
                        ? "next"
                        : "prev"
                      : to;

                    if (to == "prev") {
                      for (var i = itemIndex; i >= 0; i--) {
                        var a = f._itFl[i];

                        if (
                          a != item &&
                          a.popup &&
                          a.html.hasClass("file-has-popup")
                        ) {
                          nextItem = a;
                          break;
                        }

                        if (
                          i == 0 &&
                          !nextItem &&
                          !itL &&
                          n.thumbnails.popup.loop
                        ) {
                          i = f._itFl.length;
                          itL = true;
                        }
                      }
                    } else {
                      for (var i = itemIndex; i < f._itFl.length; i++) {
                        var a = f._itFl[i];

                        if (
                          a != item &&
                          a.popup &&
                          a.html.hasClass("file-has-popup")
                        ) {
                          nextItem = a;
                          break;
                        }

                        if (
                          i + 1 == f._itFl.length &&
                          !nextItem &&
                          !itL &&
                          n.thumbnails.popup.loop
                        ) {
                          i = -1;
                          itL = true;
                        }
                      }
                    }

                    if (nextItem) f.thumbnails.popup(nextItem, true);
                  };
                  item.popup.close = function (isByActions) {
                    if (item.popup.node) {
                      item.popup.node.pause ? item.popup.node.pause() : null;
                    }

                    $(window).off("keyup", windowKeyEvent);
                    container.css({
                      overflow: "",
                      width: "",
                    });

                    // hide the cropper
                    if (item.popup.editor && item.popup.editor.cropper)
                      item.popup.editor.cropper.hide();

                    // hide the zoomer
                    if (item.popup.zoomer) item.popup.zoomer.hide();

                    // isOpened
                    item.popup.isOpened = false;

                    // thumbnails.popup.onHide callback
                    item.popup.html &&
                    n.thumbnails.popup.onHide &&
                    $.isFunction(n.thumbnails.popup.onHide)
                      ? n.thumbnails.popup.onHide(item, l, p, o, s)
                      : item.popup.html
                      ? item.popup.html.remove()
                      : null;

                    if (!isByActions)
                      box.fadeOut(400, function () {
                        box.remove();
                      });

                    delete item.popup.close;
                  };

                  // append item.reader.node to popup
                  // play video/audio
                  if (item.popup.node) {
                    if (popupIsNew)
                      template
                        .html(
                          template
                            .html()
                            .replace(
                              /\$\{reader\.node\}/,
                              '<div class="reader-node"></div>'
                            )
                        )
                        .find(".reader-node")
                        .html(item.popup.node);
                    item.popup.node.controls = true;
                    item.popup.node.currentTime = 0;
                    item.popup.node.play ? item.popup.node.play() : null;
                  } else {
                    if (popupIsNew)
                      template
                        .find(".fileuploader-popup-node")
                        .html(
                          '<div class="reader-node"><div class="fileuploader-popup-file-icon file-type-' +
                            item.format +
                            " file-ext-" +
                            item.extension +
                            '">' +
                            item.icon +
                            "</div></div>"
                        );
                  }

                  // bind Window functions
                  $(window).on("keyup", windowKeyEvent);

                  // freeze the container
                  container.css({
                    overflow: "hidden",
                    width: container.innerWidth(),
                  });

                  // popup arrows
                  item.popup.html
                    .find('[data-action="prev"], [data-action="next"]')
                    .removeAttr("style");
                  item.popup.html[
                    f._itFl.length == 1 || !n.thumbnails.popup.arrows
                      ? "removeClass"
                      : "addClass"
                  ](hasArrowsClass);

                  if (!n.thumbnails.popup.loop) {
                    if (f._itFl.indexOf(item) == 0)
                      item.popup.html.find('[data-action="prev"]').hide();
                    if (f._itFl.indexOf(item) == f._itFl.length - 1)
                      item.popup.html.find('[data-action="next"]').hide();
                  }

                  // popup zoomer
                  if (popupIsNew && item.popup.zoomer) item.popup.zoomer = null;
                  f.editor.zoomer(item);

                  // popup editor
                  if (item.editor) {
                    if (!item.popup.editor) item.popup.editor = {};

                    // set saved rotation
                    f.editor.rotate(item, item.editor.rotation || 0, true);

                    // set saved crop
                    if (item.popup.editor && item.popup.editor.cropper) {
                      item.popup.editor.cropper.hide(true);
                      setTimeout(function () {
                        f.editor.crop(
                          item,
                          item.editor.crop
                            ? $.extend({}, item.editor.crop)
                            : item.popup.editor.cropper.setDefaultData()
                        );
                      }, 100);
                    }
                  }

                  // bind actions
                  item.popup.html
                    .on("click", '[data-action="prev"]', function (e) {
                      item.popup.move("prev");
                    })
                    .on("click", '[data-action="next"]', function (e) {
                      item.popup.move("next");
                    })
                    .on("click", '[data-action="crop"]', function (e) {
                      if (item.editor) item.editor.cropper();
                    })
                    .on("click", '[data-action="rotate-cw"]', function (e) {
                      if (item.editor) item.editor.rotate();
                    })
                    .on("click", '[data-action="zoom-in"]', function (e) {
                      if (item.popup.zoomer) item.popup.zoomer.zoomIn();
                    })
                    .on("click", '[data-action="zoom-out"]', function (e) {
                      if (item.popup.zoomer) item.popup.zoomer.zoomOut();
                    });

                  // thumbnails.popup.onShow callback
                  n.thumbnails.popup.onShow &&
                  $.isFunction(n.thumbnails.popup.onShow)
                    ? n.thumbnails.popup.onShow(item, l, p, o, s)
                    : null;
                };

              if (box.length == 0)
                box = $('<div class="fileuploader-popup"></div>').appendTo(
                  container
                );

              box
                .fadeIn(400)
                .addClass("loading")
                .find(n.thumbnails._selectors.popup)
                .fadeOut(150);

              if (
                (["image", "video", "audio", "astext"].indexOf(item.format) >
                  -1 ||
                  ["application/pdf"].indexOf(item.type) > -1) &&
                !item.popup.html
              ) {
                f.files.read(item, function () {
                  if (item.reader.node) item.popup.node = item.reader.node;

                  if (item.format == "image" && item.reader.node) {
                    item.popup.node = item.reader.node.cloneNode();

                    if (item.popup.node.complete) {
                      renderPopup();
                    } else {
                      item.popup.node.src = "";
                      item.popup.node.onload = item.popup.node.onerror = renderPopup;
                      item.popup.node.src = item.reader.node.src;
                    }
                  } else {
                    renderPopup();
                  }
                });
              } else {
                renderPopup();
              }
            },
          },

          /**
           * @namespace editor
           */
          editor: {
            /**
             * rotate
             * rotate image action
             * animate rotation in popup, only when popup is enabled
             *
             * @namespace editor
             * @param {Object} item
             * @param {Number} degrees - rotation degrees
             * @param {Boolean} force - force rotation without animation to degrees
             * @void
             */
            rotate: function (item, degrees, force) {
              var inPopup =
                item.popup &&
                item.popup.html &&
                $("html").find(item.popup.html).length;

              if (!inPopup) {
                var rotation = item.editor.rotation || 0,
                  deg = degrees ? degrees : rotation + 90;

                if (deg >= 360) deg = 0;

                if (item.popup.editor) item.popup.editor.rotation = deg;

                return (item.editor.rotation = deg);
              } else if (item.popup.node) {
                // prevent animation issues
                if (item.popup.editor.isAnimating) return;
                item.popup.editor.isAnimating = true;

                var $popup = item.popup.html,
                  $node = $popup.find(".fileuploader-popup-node"),
                  $readerNode = $node.find(".reader-node"),
                  $imageEl = $readerNode.find("> img"),
                  rotation = item.popup.editor.rotation || 0,
                  scale = item.popup.editor.scale || 1,
                  animationObj = {
                    rotation: rotation,
                    scale: scale,
                  };

                // hide cropper
                if (item.popup.editor.cropper)
                  item.popup.editor.cropper.$template.hide();

                // change values
                item.popup.editor.rotation = force ? degrees : rotation + 90;
                item.popup.editor.scale = (
                  $readerNode.height() /
                  $imageEl[
                    [90, 270].indexOf(item.popup.editor.rotation) > -1
                      ? "width"
                      : "height"
                  ]()
                ).toFixed(3);
                if (
                  $imageEl.height() * item.popup.editor.scale >
                    $readerNode.width() &&
                  [90, 270].indexOf(item.popup.editor.rotation) > -1
                )
                  item.popup.editor.scale =
                    $readerNode.height() / $imageEl.width();
                if (item.popup.editor.scale > 1) item.popup.editor.scale = 1;

                // animate
                $(animationObj)
                  .stop()
                  .animate(
                    {
                      rotation: item.popup.editor.rotation,
                      scale: item.popup.editor.scale,
                    },
                    {
                      duration: force ? 2 : 300,
                      easing: "swing",
                      step: function (now, fx) {
                        var matrix =
                            $imageEl.css("-webkit-transform") ||
                            $imageEl.css("-moz-transform") ||
                            $imageEl.css("transform") ||
                            "none",
                          rotation = 0,
                          scale = 1,
                          prop = fx.prop;

                        // get css matrix
                        if (matrix !== "none") {
                          var values = matrix
                              .split("(")[1]
                              .split(")")[0]
                              .split(","),
                            a = values[0],
                            b = values[1];

                          rotation =
                            prop == "rotation"
                              ? now
                              : Math.round(Math.atan2(b, a) * (180 / Math.PI));
                          scale =
                            prop == "scale"
                              ? now
                              : Math.round(Math.sqrt(a * a + b * b) * 10) / 10;
                        }

                        // set $imageEl css
                        $imageEl.css({
                          "-webkit-transform":
                            "rotate(" + rotation + "deg) scale(" + scale + ")",
                          "-moz-transform":
                            "rotate(" + rotation + "deg) scale(" + scale + ")",
                          transform:
                            "rotate(" + rotation + "deg) scale(" + scale + ")",
                        });
                      },
                      always: function () {
                        delete item.popup.editor.isAnimating;

                        // re-draw the cropper if exists
                        if (item.popup.editor.cropper && !force) {
                          item.popup.editor.cropper.setDefaultData();
                          item.popup.editor.cropper.init("rotation");
                        }
                      },
                    }
                  );

                // check if rotation no greater than 360 degrees
                if (item.popup.editor.rotation >= 360)
                  item.popup.editor.rotation = 0;

                // register as change
                if (item.popup.editor.rotation != item.editor.rotation)
                  item.popup.editor.hasChanges = true;
              }
            },

            /**
             * crop
             * crop image action
             * show cropping tools, only when popup is enabled
             *
             * @namespace editor
             * @param {Object} item
             * @param {Object} data - cropping data
             * @void
             */
            crop: function (item, data) {
              var inPopup =
                item.popup &&
                item.popup.html &&
                $("html").find(item.popup.html).length;

              if (!inPopup) {
                return (item.editor.crop = data || item.editor.crop);
              } else if (item.popup.node) {
                if (!item.popup.editor.cropper) {
                  var template =
                      '<div class="fileuploader-cropper">' +
                      '<div class="fileuploader-cropper-area">' +
                      '<div class="point point-a"></div>' +
                      '<div class="point point-b"></div>' +
                      '<div class="point point-c"></div>' +
                      '<div class="point point-d"></div>' +
                      '<div class="point point-e"></div>' +
                      '<div class="point point-f"></div>' +
                      '<div class="point point-g"></div>' +
                      '<div class="point point-h"></div>' +
                      '<div class="area-move"></div>' +
                      '<div class="area-image"></div>' +
                      '<div class="area-info"></div>' +
                      "</div>" +
                      "</div>",
                    $popup = item.popup.html,
                    $imageEl = $popup.find(
                      ".fileuploader-popup-node .reader-node > img"
                    ),
                    $template = $(template),
                    $editor = $template.find(".fileuploader-cropper-area");

                  // define popup cropper tool
                  item.popup.editor.cropper = {
                    $imageEl: $imageEl,
                    $template: $template,
                    $editor: $editor,
                    isCropping: false,
                    crop: data || null,
                    init: function (data) {
                      var cropper = item.popup.editor.cropper,
                        position = cropper.$imageEl.position(),
                        width = cropper.$imageEl[0].getBoundingClientRect()
                          .width,
                        height = cropper.$imageEl[0].getBoundingClientRect()
                          .height,
                        isInverted =
                          item.popup.editor.rotation &&
                          [90, 270].indexOf(item.popup.editor.rotation) > -1,
                        scale = isInverted ? item.popup.editor.scale : 1;

                      // unbind all events
                      cropper.hide();

                      // set default data
                      if (!cropper.crop) cropper.setDefaultData();

                      // hide if image not visible
                      if (width == 0 || height == 0) return cropper.hide(true);

                      // prevent duplicates
                      if (!cropper.isCropping) {
                        cropper.$imageEl
                          .clone()
                          .appendTo(cropper.$template.find(".area-image"));
                        cropper.$imageEl.parent().append($template);
                      }

                      // animate cropping tool
                      cropper.$template
                        .hide()
                        .css({
                          left: position.left,
                          top: position.top,
                          width: width,
                          height: height,
                        })
                        .fadeIn(150);
                      cropper.$editor.hide();
                      clearTimeout(cropper._editorAnimationTimeout);
                      cropper._editorAnimationTimeout = setTimeout(function () {
                        delete cropper._editorAnimationTimeout;

                        cropper.$editor.fadeIn(250);

                        // update data with cf and scale
                        if (item.editor.crop && $.isPlainObject(data)) {
                          cropper.resize();
                          cropper.crop.left =
                            cropper.crop.left * cropper.crop.cfWidth * scale;
                          cropper.crop.width =
                            cropper.crop.width * cropper.crop.cfWidth * scale;
                          cropper.crop.top =
                            cropper.crop.top * cropper.crop.cfHeight * scale;
                          cropper.crop.height =
                            cropper.crop.height * cropper.crop.cfHeight * scale;
                        }

                        // maxWidth on open
                        if (
                          n.editor.cropper &&
                          (n.editor.cropper.maxWidth ||
                            n.editor.cropper.maxHeight)
                        ) {
                          if (n.editor.cropper.maxWidth)
                            cropper.crop.width = Math.min(
                              n.editor.cropper.maxWidth * cropper.crop.cfWidth,
                              cropper.crop.width
                            );
                          if (n.editor.cropper.maxHeight)
                            cropper.crop.height = Math.min(
                              n.editor.cropper.maxHeight *
                                cropper.crop.cfHeight,
                              cropper.crop.height
                            );

                          if (
                            (!item.editor.crop || data == "rotation") &&
                            data != "resize"
                          ) {
                            cropper.crop.left =
                              (cropper.$template.width() - cropper.crop.width) /
                              2;
                            cropper.crop.top =
                              (cropper.$template.height() -
                                cropper.crop.height) /
                              2;
                          }
                        }

                        // ratio on open
                        if (
                          (!item.editor.crop || data == "rotation") &&
                          n.editor.cropper &&
                          n.editor.cropper.ratio &&
                          data != "resize"
                        ) {
                          var ratio = n.editor.cropper.ratio,
                            ratioPx = f._assets.ratioToPx(
                              cropper.crop.width,
                              cropper.crop.height,
                              ratio
                            );

                          if (ratioPx) {
                            cropper.crop.width = Math.min(
                              cropper.crop.width,
                              ratioPx[0]
                            );
                            cropper.crop.left =
                              (cropper.$template.width() - cropper.crop.width) /
                              2;
                            cropper.crop.height = Math.min(
                              cropper.crop.height,
                              ratioPx[1]
                            );
                            cropper.crop.top =
                              (cropper.$template.height() -
                                cropper.crop.height) /
                              2;
                          }
                        }

                        // draw editor
                        cropper.drawPlaceHolder(cropper.crop);
                      }, 400);

                      // start and bind events
                      if (n.editor.cropper && n.editor.cropper.showGrid)
                        cropper.$editor.addClass("has-grid");
                      cropper.$imageEl.attr("draggable", "false");
                      cropper.$template.on(
                        "mousedown touchstart",
                        cropper.mousedown
                      );
                      $(window).on("resize", cropper.resize);

                      // register as changed
                      cropper.isCropping = true;
                      item.popup.editor.hasChanges = true;
                    },
                    setDefaultData: function () {
                      var cropper = item.popup.editor.cropper,
                        $imageEl = cropper.$imageEl,
                        width = $imageEl.width(),
                        height = $imageEl.height(),
                        isInverted =
                          item.popup.editor.rotation &&
                          [90, 270].indexOf(item.popup.editor.rotation) > -1,
                        scale = item.popup.editor.scale || 1;

                      // set default data
                      cropper.crop = {
                        left: 0,
                        top: 0,
                        width: isInverted ? height * scale : width,
                        height: isInverted ? width * scale : height,
                        cfWidth: width / item.reader.width,
                        cfHeight: height / item.reader.height,
                      };

                      return null;
                    },
                    hide: function (force) {
                      var cropper = item.popup.editor.cropper;

                      // hide editor on force
                      if (force) {
                        cropper.$template.hide();
                        cropper.$editor.hide();
                      }

                      // stop and unbind events
                      cropper.$imageEl.attr("draggable", "");
                      cropper.$template.off(
                        "mousedown touchstart",
                        cropper.mousedown
                      );
                      $(window).off("resize", cropper.resize);
                    },
                    resize: function (e) {
                      var cropper = item.popup.editor.cropper,
                        $imageEl = cropper.$imageEl;

                      // only when image is visible
                      if ($imageEl.width() > 0) {
                        if (!e) {
                          // re-write cf
                          cropper.crop.cfWidth =
                            $imageEl.width() / item.reader.width;
                          cropper.crop.cfHeight =
                            $imageEl.height() / item.reader.height;
                        } else {
                          // resize $editor
                          cropper.$template.hide();
                          clearTimeout(cropper._resizeTimeout);
                          cropper._resizeTimeout = setTimeout(function () {
                            delete cropper._resizeTimeout;
                            var cfWidth = $imageEl.width() / item.reader.width,
                              cfHeight = $imageEl.height() / item.reader.height;

                            cropper.crop.left =
                              (cropper.crop.left / cropper.crop.cfWidth) *
                              cfWidth;
                            cropper.crop.width =
                              (cropper.crop.width / cropper.crop.cfWidth) *
                              cfWidth;
                            cropper.crop.top =
                              (cropper.crop.top / cropper.crop.cfHeight) *
                              cfHeight;
                            cropper.crop.height =
                              (cropper.crop.height / cropper.crop.cfHeight) *
                              cfHeight;
                            cropper.crop.cfWidth = cfWidth;
                            cropper.crop.cfHeight = cfHeight;

                            cropper.init("resize");
                          }, 500);
                        }
                      }
                    },
                    drawPlaceHolder: function (css) {
                      var cropper = item.popup.editor.cropper,
                        rotation = item.popup.editor.rotation || 0,
                        scale = item.popup.editor.scale || 1,
                        translate = [0, 0];

                      if (!css) return;

                      // create new object
                      css = $.extend({}, css);

                      // edit width, height and translate values by rotation
                      if (rotation)
                        translate = [
                          rotation == 180 || rotation == 270 ? -100 : 0,
                          rotation == 90 || rotation == 180 ? -100 : 0,
                        ];

                      // draw cropping-area
                      cropper.$editor.css(css);
                      cropper.setAreaInfo();
                      cropper.$editor
                        .find(".area-image img")
                        .removeAttr("style")
                        .css({
                          width: cropper.$imageEl.width(),
                          height: cropper.$imageEl.height(),
                          left: cropper.$editor.position().left * -1,
                          top: cropper.$editor.position().top * -1,

                          "-webkit-transform":
                            "rotate(" +
                            rotation +
                            "deg) scale(" +
                            scale +
                            ") translateX(" +
                            translate[0] +
                            "%) translateY(" +
                            translate[1] +
                            "%)",
                          "-moz-transform":
                            "rotate(" +
                            rotation +
                            "deg) scale(" +
                            scale +
                            ") translateX(" +
                            translate[0] +
                            "%) translateY(" +
                            translate[1] +
                            "%)",
                          transform:
                            "rotate(" +
                            rotation +
                            "deg) scale(" +
                            scale +
                            ") translateX(" +
                            translate[0] +
                            "%) translateY(" +
                            translate[1] +
                            "%)",
                        });
                    },
                    setAreaInfo: function (type) {
                      var cropper = item.popup.editor.cropper,
                        scale = item.popup.editor.scale || 1;

                      cropper.$editor
                        .find(".area-info")
                        .html(
                          (cropper.isResizing || type == "size"
                            ? [
                                "W: " +
                                  Math.round(
                                    cropper.crop.width /
                                      cropper.crop.cfWidth /
                                      scale
                                  ) +
                                  "px",
                                " ",
                                "H: " +
                                  Math.round(
                                    cropper.crop.height /
                                      cropper.crop.cfHeight /
                                      scale
                                  ) +
                                  "px",
                              ]
                            : [
                                "X: " +
                                  Math.round(
                                    cropper.crop.left /
                                      cropper.crop.cfWidth /
                                      scale
                                  ) +
                                  "px",
                                " ",
                                "Y: " +
                                  Math.round(
                                    cropper.crop.top /
                                      cropper.crop.cfHeight /
                                      scale
                                  ) +
                                  "px",
                              ]
                          ).join("")
                        );
                    },
                    mousedown: function (e) {
                      var eventType =
                          e.originalEvent.touches && e.originalEvent.touches[0]
                            ? "touchstart"
                            : "mousedown",
                        $target = $(e.target),
                        cropper = item.popup.editor.cropper,
                        points = {
                          x:
                            (eventType == "mousedown"
                              ? e.pageX
                              : e.originalEvent.touches[0].pageX) -
                            cropper.$template.offset().left,
                          y:
                            (eventType == "mousedown"
                              ? e.pageY
                              : e.originalEvent.touches[0].pageY) -
                            cropper.$template.offset().top,
                        },
                        callback = function () {
                          // set current state
                          cropper.pointData = {
                            el: $target,
                            x: points.x,
                            y: points.y,
                            xEditor: points.x - cropper.crop.left,
                            yEditor: points.y - cropper.crop.top,
                            left: cropper.crop.left,
                            top: cropper.crop.top,
                            width: cropper.crop.width,
                            height: cropper.crop.height,
                          };

                          // start cropping event
                          if (cropper.isMoving || cropper.isResizing) {
                            cropper.setAreaInfo("size");
                            cropper.$editor.addClass("moving show-info");
                            $("body").css({
                              "-webkit-user-select": "none",
                              "-moz-user-select": "none",
                              "-ms-user-select": "none",
                              "user-select": "none",
                            });

                            // bind window mousemove event
                            $(document).on(
                              "mousemove touchmove",
                              cropper.mousemove
                            );
                          }
                        };

                      // prevent if right click
                      if (e.which == 3) return true;

                      if (
                        item.popup.zoomer &&
                        item.popup.zoomer.hasSpacePressed
                      )
                        return;

                      // determinate cropping type
                      cropper.isMoving = $target.is(".area-move");
                      cropper.isResizing = $target.is(".point");

                      // mousedown event
                      if (eventType == "mousedown") {
                        // bind cropping start event
                        callback();
                      }

                      // touchstart event
                      if (
                        eventType == "touchstart" &&
                        e.originalEvent.touches.length == 1
                      ) {
                        if (cropper.isMoving || cropper.isResizing)
                          e.preventDefault();
                        cropper.isTouchLongPress = true;

                        // check if long press
                        setTimeout(
                          function () {
                            if (!cropper.isTouchLongPress) return;
                            delete cropper.isTouchLongPress;
                            callback();
                          },
                          n.thumbnails.touchDelay ? n.thumbnails.touchDelay : 0
                        );
                      }

                      // bind window mouseup event
                      $(document).on("mouseup touchend", cropper.mouseup);
                    },
                    mousemove: function (e) {
                      var eventType =
                          e.originalEvent.touches && e.originalEvent.touches[0]
                            ? "touchstart"
                            : "mousedown",
                        $target = $(e.target),
                        cropper = item.popup.editor.cropper,
                        points = {
                          x:
                            (eventType == "mousedown"
                              ? e.pageX
                              : e.originalEvent.touches[0].pageX) -
                            cropper.$template.offset().left,
                          y:
                            (eventType == "mousedown"
                              ? e.pageY
                              : e.originalEvent.touches[0].pageY) -
                            cropper.$template.offset().top,
                        };

                      if (
                        e.originalEvent.touches &&
                        e.originalEvent.touches.length != 1
                      )
                        return cropper.mouseup(e);

                      // move
                      if (cropper.isMoving) {
                        var left = points.x - cropper.pointData.xEditor,
                          top = points.y - cropper.pointData.yEditor;

                        // position
                        if (
                          left + cropper.crop.width >
                          cropper.$template.width()
                        )
                          left = cropper.$template.width() - cropper.crop.width;
                        if (left < 0) left = 0;
                        if (
                          top + cropper.crop.height >
                          cropper.$template.height()
                        )
                          top =
                            cropper.$template.height() - cropper.crop.height;
                        if (top < 0) top = 0;

                        // set position
                        cropper.crop.left = left;
                        cropper.crop.top = top;
                      }

                      // resize
                      if (cropper.isResizing) {
                        var point = cropper.pointData.el
                            .attr("class")
                            .substr("point point-".length),
                          lastWidth = cropper.crop.left + cropper.crop.width,
                          lastHeight = cropper.crop.top + cropper.crop.height,
                          minWidth =
                            ((n.editor.cropper && n.editor.cropper.minWidth) ||
                              0) * cropper.crop.cfWidth,
                          minHeight =
                            ((n.editor.cropper && n.editor.cropper.minHeight) ||
                              0) * cropper.crop.cfHeight,
                          maxWidth =
                            (n.editor.cropper && n.editor.cropper.maxWidth) *
                            cropper.crop.cfWidth,
                          maxHeight =
                            (n.editor.cropper && n.editor.cropper.maxHeight) *
                            cropper.crop.cfHeight,
                          ratio = n.editor.cropper
                            ? n.editor.cropper.ratio
                            : null,
                          ratioPx;

                        // set minWidth if greater than image
                        if (minWidth > cropper.$template.width())
                          minWidth = cropper.$template.width();
                        if (minHeight > cropper.$template.height())
                          minHeight = cropper.$template.height();

                        // set maxWidth if greater than image
                        if (maxWidth > cropper.$template.width())
                          maxWidth = cropper.$template.width();
                        if (maxHeight > cropper.$template.height())
                          maxHeight = cropper.$template.height();

                        // points
                        if (
                          (point == "a" || point == "b" || point == "c") &&
                          !ratioPx
                        ) {
                          cropper.crop.top = points.y;
                          if (cropper.crop.top < 0) cropper.crop.top = 0;

                          cropper.crop.height = lastHeight - cropper.crop.top;
                          if (
                            cropper.crop.top >
                            cropper.crop.top + cropper.crop.height
                          ) {
                            cropper.crop.top = lastHeight;
                            cropper.crop.height = 0;
                          }

                          // minHeight
                          if (cropper.crop.height < minHeight) {
                            cropper.crop.top = lastHeight - minHeight;
                            cropper.crop.height = minHeight;
                          }
                          // maxHeight
                          if (cropper.crop.height > maxHeight) {
                            cropper.crop.top = lastHeight - maxHeight;
                            cropper.crop.height = maxHeight;
                          }

                          // ratio
                          ratioPx = ratio
                            ? f._assets.ratioToPx(
                                cropper.crop.width,
                                cropper.crop.height,
                                ratio
                              )
                            : null;
                          if (ratioPx) {
                            cropper.crop.width = ratioPx[0];

                            if (point == "a" || point == "b")
                              cropper.crop.left = Math.max(
                                0,
                                cropper.pointData.left +
                                  (cropper.pointData.width -
                                    cropper.crop.width) /
                                    (point == "b" ? 2 : 1)
                              );

                            // check
                            if (
                              cropper.crop.left + cropper.crop.width >
                              cropper.$template.width()
                            ) {
                              var newWidth =
                                cropper.$template.width() - cropper.crop.left;

                              cropper.crop.width = newWidth;
                              cropper.crop.height =
                                (newWidth / ratioPx[2]) * ratioPx[3];
                              cropper.crop.top =
                                lastHeight - cropper.crop.height;
                            }
                          }
                        }
                        if (
                          (point == "e" || point == "f" || point == "g") &&
                          !ratioPx
                        ) {
                          cropper.crop.height = points.y - cropper.crop.top;
                          if (
                            cropper.crop.height + cropper.crop.top >
                            cropper.$template.height()
                          )
                            cropper.crop.height =
                              cropper.$template.height() - cropper.crop.top;

                          // minHeight
                          if (cropper.crop.height < minHeight)
                            cropper.crop.height = minHeight;
                          // maxHeight
                          if (cropper.crop.height > maxHeight)
                            cropper.crop.height = maxHeight;

                          // ratio
                          ratioPx = ratio
                            ? f._assets.ratioToPx(
                                cropper.crop.width,
                                cropper.crop.height,
                                ratio
                              )
                            : null;
                          if (ratioPx) {
                            cropper.crop.width = ratioPx[0];

                            if (point == "f" || point == "g")
                              cropper.crop.left = Math.max(
                                0,
                                cropper.pointData.left +
                                  (cropper.pointData.width -
                                    cropper.crop.width) /
                                    (point == "f" ? 2 : 1)
                              );

                            // check
                            if (
                              cropper.crop.left + cropper.crop.width >
                              cropper.$template.width()
                            ) {
                              var newWidth =
                                cropper.$template.width() - cropper.crop.left;

                              cropper.crop.width = newWidth;
                              cropper.crop.height =
                                (newWidth / ratioPx[2]) * ratioPx[3];
                            }
                          }
                        }
                        if (
                          (point == "c" || point == "d" || point == "e") &&
                          !ratioPx
                        ) {
                          cropper.crop.width = points.x - cropper.crop.left;
                          if (
                            cropper.crop.width + cropper.crop.left >
                            cropper.$template.width()
                          )
                            cropper.crop.width =
                              cropper.$template.width() - cropper.crop.left;

                          // minWidth
                          if (cropper.crop.width < minWidth)
                            cropper.crop.width = minWidth;
                          // maxWidth
                          if (cropper.crop.width > maxWidth)
                            cropper.crop.width = maxWidth;

                          // ratio
                          ratioPx = ratio
                            ? f._assets.ratioToPx(
                                cropper.crop.width,
                                cropper.crop.height,
                                ratio
                              )
                            : null;
                          if (ratioPx) {
                            cropper.crop.height = ratioPx[1];

                            if (point == "c" || point == "d")
                              cropper.crop.top = Math.max(
                                0,
                                cropper.pointData.top +
                                  (cropper.pointData.height -
                                    cropper.crop.height) /
                                    (point == "d" ? 2 : 1)
                              );

                            // check
                            if (
                              cropper.crop.top + cropper.crop.height >
                              cropper.$template.height()
                            ) {
                              var newHeight =
                                cropper.$template.height() - cropper.crop.top;

                              cropper.crop.height = newHeight;
                              cropper.crop.width =
                                (newHeight / ratioPx[3]) * ratioPx[2];
                            }
                          }
                        }
                        if (
                          (point == "a" || point == "g" || point == "h") &&
                          !ratioPx
                        ) {
                          cropper.crop.left = points.x;
                          if (cropper.crop.left > cropper.$template.width())
                            cropper.crop.left = cropper.$template.width();
                          if (cropper.crop.left < 0) cropper.crop.left = 0;

                          cropper.crop.width = lastWidth - cropper.crop.left;
                          if (
                            cropper.crop.left >
                            cropper.crop.left + cropper.crop.width
                          ) {
                            cropper.crop.left = lastWidth;
                            cropper.crop.width = 0;
                          }

                          // minWidth
                          if (cropper.crop.width < minWidth) {
                            cropper.crop.left = lastWidth - minWidth;
                            cropper.crop.width = minWidth;
                          }
                          // maxWidth
                          if (cropper.crop.width > maxWidth) {
                            cropper.crop.left = lastWidth - maxWidth;
                            cropper.crop.width = maxWidth;
                          }

                          // ratio
                          ratioPx = ratio
                            ? f._assets.ratioToPx(
                                cropper.crop.width,
                                cropper.crop.height,
                                ratio
                              )
                            : null;
                          if (ratioPx) {
                            cropper.crop.height = ratioPx[1];

                            if (point == "a" || point == "h")
                              cropper.crop.top = Math.max(
                                0,
                                cropper.pointData.top +
                                  (cropper.pointData.height -
                                    cropper.crop.height) /
                                    (point == "h" ? 2 : 1)
                              );

                            // check
                            if (
                              cropper.crop.top + cropper.crop.height >
                              cropper.$template.height()
                            ) {
                              var newHeight =
                                cropper.$template.height() - cropper.crop.top;

                              cropper.crop.height = newHeight;
                              cropper.crop.width =
                                (newHeight / ratioPx[3]) * ratioPx[2];
                              cropper.crop.left =
                                lastWidth - cropper.crop.width;
                            }
                          }
                        }
                      }

                      // draw cropping-area
                      cropper.drawPlaceHolder(cropper.crop);
                    },
                    mouseup: function (e) {
                      var cropper = item.popup.editor.cropper;

                      // check if empty area
                      if (
                        cropper.$editor.width() == 0 ||
                        cropper.$editor.height() == 0
                      )
                        cropper.init(cropper.setDefaultData());

                      // clear
                      delete cropper.isTouchLongPress;
                      delete cropper.isMoving;
                      delete cropper.isResizing;
                      cropper.$editor.removeClass("moving show-info");
                      $("body").css({
                        "-webkit-user-select": "",
                        "-moz-user-select": "",
                        "-ms-user-select": "",
                        "user-select": "",
                      });

                      // unbind window events
                      $(document).off("mousemove touchmove", cropper.mousemove);
                      $(document).off("mouseup touchend", cropper.mouseup);
                    },
                  };

                  // init cropper tool
                  item.popup.editor.cropper.init();
                } else {
                  if (data) item.popup.editor.cropper.crop = data;
                  item.popup.editor.cropper.init(data);
                }
              }
            },

            /**
             * resize
             * resize a canvas image
             *
             * @namespace editor
             * @param {HTML} img
             * @param {HTML} canvas
             * @param {Number} width - new width
             * @param {Number} height - new height
             * @param {Boolean} alpha - enable transparency on resize (!not available on smooth resize)
             * @param {Boolean} fixedSize - fixed canvas size
             * @void
             */
            resize: function (img, canvas, width, height, alpha, fixedSize) {
              var context = canvas.getContext("2d"),
                width =
                  !width && height ? (height * img.width) / img.height : width,
                height =
                  !height && width ? (width * img.height) / img.width : height,
                ratio = img.width / img.height,
                optimalWidth = ratio >= 1 ? width : height * ratio,
                optimalHeight = ratio < 1 ? height : width / ratio;

              if (fixedSize && optimalWidth < width) {
                optimalHeight = optimalHeight * (width / optimalWidth);
                optimalWidth = width;
              }
              if (fixedSize && optimalHeight < height) {
                optimalWidth = optimalWidth * (height / optimalHeight);
                optimalHeight = height;
              }

              var steps = Math.min(
                Math.ceil(Math.log(img.width / optimalWidth) / Math.log(2)),
                12
              );
              canvas.width = optimalWidth;
              canvas.height = optimalHeight;

              // if image is smaller than canvas or there are no resizing steps
              if (
                img.width < canvas.width ||
                img.height < canvas.height ||
                steps < 2
              ) {
                // set canvas size as image size if size is not fixed
                if (!fixedSize) {
                  canvas.width = Math.min(img.width, canvas.width);
                  canvas.height = Math.min(img.height, canvas.height);
                }

                // alight image to center
                var x =
                    img.width < canvas.width
                      ? (canvas.width - img.width) / 2
                      : 0,
                  y =
                    img.height < canvas.height
                      ? (canvas.height - img.height) / 2
                      : 0;

                // draw image
                if (!alpha) {
                  context.fillStyle = "#fff";
                  context.fillRect(0, 0, canvas.width, canvas.height);
                }

                context.drawImage(
                  img,
                  x,
                  y,
                  Math.min(img.width, canvas.width),
                  Math.min(img.height, canvas.height)
                );
              } else {
                var oc = document.createElement("canvas"),
                  octx = oc.getContext("2d"),
                  factor = 2;

                // smooth resize
                oc.width = img.width / factor;
                oc.height = img.height / factor;
                octx.fillStyle = "#fff";
                octx.fillRect(0, 0, oc.width, oc.height);
                octx.imageSmoothingEnabled = false;
                octx.imageSmoothingQuality = "high";
                octx.drawImage(img, 0, 0, oc.width, oc.height);
                while (steps > 2) {
                  var factor2 = factor + 2,
                    widthFactor = img.width / factor,
                    heightFactor = img.height / factor;

                  if (widthFactor > oc.width) widthFactor = oc.width;
                  if (heightFactor > oc.height) heightFactor = oc.height;

                  octx.imageSmoothingEnabled = true;
                  octx.drawImage(
                    oc,
                    0,
                    0,
                    widthFactor,
                    heightFactor,
                    0,
                    0,
                    img.width / factor2,
                    img.height / factor2
                  );
                  factor = factor2;
                  steps--;
                }

                // draw image
                var widthFactor = img.width / factor,
                  heightFactor = img.height / factor;

                if (widthFactor > oc.width) widthFactor = oc.width;
                if (heightFactor > oc.height) heightFactor = oc.height;

                context.drawImage(
                  oc,
                  0,
                  0,
                  widthFactor,
                  heightFactor,
                  0,
                  0,
                  optimalWidth,
                  optimalHeight
                );
                oc = octx = null;
              }

              context = null;
            },

            zoomer: function (item) {
              var inPopup =
                item.popup &&
                item.popup.html &&
                $("html").find(item.popup.html).length;

              if (!inPopup) return;

              if (!item.popup.zoomer) {
                var $popup = item.popup.html,
                  $node = $popup.find(".fileuploader-popup-node"),
                  $readerNode = $node.find(".reader-node"),
                  $imageEl = $readerNode
                    .find("> img")
                    .attr("draggable", "false")
                    .attr("ondragstart", "return false;");

                item.popup.zoomer = {
                  html: $popup.find(".fileuploader-popup-zoomer"),
                  isActive:
                    item.format == "image" &&
                    item.popup.node &&
                    n.thumbnails.popup.zoomer,
                  scale: 100,
                  zoom: 100,

                  init: function () {
                    var zoomer = this;

                    // disable plugin no images and IE
                    if (
                      !zoomer.isActive ||
                      f._assets.isIE() ||
                      f._assets.isMobile()
                    )
                      return (
                        zoomer.html.hide() &&
                        $node.addClass("has-node-centered")
                      );

                    // init
                    zoomer.hide();
                    zoomer.resize();

                    $(window).on("resize", zoomer.resize);
                    $(window).on("keyup keydown", zoomer.keyPress);
                    zoomer.html.find("input").on("input change", zoomer.range);
                    $readerNode.on("mousedown touchstart", zoomer.mousedown);
                    $node.on("mousewheel DOMMouseScroll", zoomer.scroll);
                  },
                  hide: function () {
                    var zoomer = this;

                    $(window).off("resize", zoomer.resize);
                    $(window).off("keyup keydown", zoomer.keyPress);
                    zoomer.html.find("input").off("input change", zoomer.range);
                    $readerNode.off("mousedown", zoomer.mousedown);
                    $node.off("mousewheel DOMMouseScroll", zoomer.scroll);
                  },
                  center: function (prevDimensions) {
                    var zoomer = this,
                      left = 0,
                      top = 0;

                    if (!prevDimensions) {
                      left = Math.round(
                        ($node.width() - $readerNode.width()) / 2
                      );
                      top = Math.round(
                        ($node.height() - $readerNode.height()) / 2
                      );
                    } else {
                      left = zoomer.left;
                      top = zoomer.top;

                      left -=
                        ($node.width() / 2 - zoomer.left) *
                        ($readerNode.width() / prevDimensions[0] - 1);
                      top -=
                        ($node.height() / 2 - zoomer.top) *
                        ($readerNode.height() / prevDimensions[1] - 1);

                      if ($readerNode.width() <= $node.width())
                        left = Math.round(
                          ($node.width() - $readerNode.width()) / 2
                        );
                      if ($readerNode.height() <= $node.height())
                        top = Math.round(
                          ($node.height() - $readerNode.height()) / 2
                        );

                      if ($readerNode.width() > $node.width()) {
                        if (left > 0) left = 0;
                        else if (left + $readerNode.width() < $node.width())
                          left = $node.width() - $readerNode.width();
                      }
                      if ($readerNode.height() > $node.height()) {
                        if (top > 0) top = 0;
                        else if (top + $readerNode.height() < $node.height())
                          top = $node.height() - $readerNode.height();
                      }

                      top = Math.min(top, 0);
                    }

                    // set styles
                    $readerNode.css({
                      left: (zoomer.left = left) + "px",
                      top: (zoomer.top = top) + "px",
                      width: $readerNode.width(),
                      height: $readerNode.height(),
                    });
                  },
                  resize: function () {
                    var zoomer = item.popup.zoomer;

                    $node.removeClass("is-zoomed");
                    $readerNode.removeAttr("style");
                    zoomer.scale = zoomer.getImageScale();
                    zoomer.updateView();
                  },
                  range: function (e) {
                    var zoomer = item.popup.zoomer,
                      $input = $(this),
                      val = parseFloat($input.val());

                    if (zoomer.scale >= 100) {
                      e.preventDefault();
                      $input.val(zoomer.scale);
                      return;
                    }

                    if (val < zoomer.scale) {
                      e.preventDefault();
                      val = zoomer.scale;
                      $input.val(val);
                    }

                    zoomer.updateView(val, true);
                  },
                  scroll: function (e) {
                    var zoomer = item.popup.zoomer,
                      delta = -100;

                    if (e.originalEvent) {
                      if (e.originalEvent.wheelDelta)
                        delta = e.originalEvent.wheelDelta / -40;
                      if (e.originalEvent.deltaY)
                        delta = e.originalEvent.deltaY;
                      if (e.originalEvent.detail)
                        delta = e.originalEvent.detail;
                    }

                    zoomer[delta < 0 ? "zoomIn" : "zoomOut"](3);
                  },
                  keyPress: function (e) {
                    var zoomer = item.popup.zoomer,
                      type = e.type,
                      key = e.keyCode || e.which;

                    if (key != 32) return;

                    zoomer.hasSpacePressed = type == "keydown";

                    if (zoomer.hasSpacePressed && zoomer.isZoomed())
                      $readerNode.addClass("is-amoving");
                    else $readerNode.removeClass("is-amoving");
                  },
                  mousedown: function (e) {
                    var zoomer = item.popup.zoomer,
                      $target = $(e.target),
                      eventType =
                        e.originalEvent.touches && e.originalEvent.touches[0]
                          ? "touchstart"
                          : "mousedown",
                      points = {
                        x:
                          eventType == "mousedown"
                            ? e.pageX
                            : e.originalEvent.touches[0].pageX,
                        y:
                          eventType == "mousedown"
                            ? e.pageY
                            : e.originalEvent.touches[0].pageY,
                      },
                      callback = function () {
                        // set current state
                        zoomer.pointData = {
                          x: points.x,
                          y: points.y,
                          xTarget: points.x - zoomer.left,
                          yTarget: points.y - zoomer.top,
                        };

                        $("body").css({
                          "-webkit-user-select": "none",
                          "-moz-user-select": "none",
                          "-ms-user-select": "none",
                          "user-select": "none",
                        });

                        $readerNode.addClass("is-moving");

                        // bind window mousemove event
                        $(document).on("mousemove", zoomer.mousemove);
                      };

                    if (e.which != 1) return;

                    if (zoomer.scale == 100 || zoomer.zoom == zoomer.scale)
                      return;

                    // check e.target
                    if (
                      !zoomer.hasSpacePressed &&
                      $target[0] != $imageEl[0] &&
                      !$target.is(".fileuploader-cropper")
                    )
                      return;

                    // mousedown event
                    if (eventType == "mousedown") {
                      callback();
                    }

                    // touchstart event
                    if (eventType == "touchstart") {
                      zoomer.isTouchLongPress = true;

                      // check if long press
                      setTimeout(
                        function () {
                          if (!zoomer.isTouchLongPress) return;
                          delete zoomer.isTouchLongPress;
                          callback();
                        },
                        n.thumbnails.touchDelay ? n.thumbnails.touchDelay : 0
                      );
                    }

                    // bind window mouseup event
                    $(document).on("mouseup touchend", zoomer.mouseup);
                  },
                  mousemove: function (e) {
                    var zoomer = item.popup.zoomer,
                      eventType =
                        e.originalEvent.touches && e.originalEvent.touches[0]
                          ? "touchstart"
                          : "mousedown",
                      points = {
                        x:
                          eventType == "mousedown"
                            ? e.pageX
                            : e.originalEvent.touches[0].pageX,
                        y:
                          eventType == "mousedown"
                            ? e.pageY
                            : e.originalEvent.touches[0].pageY,
                      },
                      left = points.x - zoomer.pointData.xTarget,
                      top = points.y - zoomer.pointData.yTarget;

                    // fix the positon
                    if (top > 0) top = 0;
                    if (top < $node.height() - $readerNode.height())
                      top = $node.height() - $readerNode.height();
                    if ($readerNode.height() < $node.height()) {
                      top = $node.height() / 2 - $readerNode.height() / 2;
                    }
                    if ($readerNode.width() > $node.width()) {
                      if (left > 0) left = 0;
                      if (left < $node.width() - $readerNode.width())
                        left = $node.width() - $readerNode.width();
                    } else {
                      left = $node.width() / 2 - $readerNode.width() / 2;
                    }

                    // set styles
                    $readerNode.css({
                      left: (zoomer.left = left) + "px",
                      top: (zoomer.top = top) + "px",
                    });
                  },
                  mouseup: function (e) {
                    var zoomer = item.popup.zoomer;

                    delete zoomer.pointData;
                    $("body").css({
                      "-webkit-user-select": "",
                      "-moz-user-select": "",
                      "-ms-user-select": "",
                      "user-select": "",
                    });

                    $readerNode.removeClass("is-moving");

                    $(document).off("mousemove", zoomer.mousemove);
                    $(document).off("mouseup", zoomer.mouseup);
                  },
                  zoomIn: function (val) {
                    var zoomer = item.popup.zoomer,
                      step = val || 20;

                    if (zoomer.zoom >= 100) return;

                    zoomer.zoom = Math.min(100, zoomer.zoom + step);
                    zoomer.updateView(zoomer.zoom);
                  },
                  zoomOut: function (val) {
                    var zoomer = item.popup.zoomer,
                      step = val || 20;

                    if (zoomer.zoom <= zoomer.scale) return;

                    zoomer.zoom = Math.max(zoomer.scale, zoomer.zoom - step);
                    zoomer.updateView(zoomer.zoom);
                  },
                  updateView: function (val, input) {
                    var zoomer = this,
                      width = (zoomer.getImageSize().width / 100) * val,
                      height = (zoomer.getImageSize().height / 100) * val,
                      curWidth = $readerNode.width(),
                      curHeight = $readerNode.height(),
                      valueChanged = val && val != zoomer.scale;

                    if (!zoomer.isActive) return zoomer.center();

                    if (valueChanged) {
                      $node.addClass("is-zoomed");
                      $readerNode.addClass("is-movable").css({
                        width: width + "px",
                        height: height + "px",
                        maxWidth: "none",
                        maxHeight: "none",
                      });
                    } else {
                      $node.removeClass("is-zoomed");
                      $readerNode
                        .removeClass("is-movable is-amoving")
                        .removeAttr("style");
                    }

                    zoomer.zoom = val || zoomer.scale;
                    zoomer.center(
                      valueChanged
                        ? [curWidth, curHeight, zoomer.left, zoomer.top]
                        : null
                    );

                    zoomer.html.find("span").html(zoomer.zoom + "%");

                    if (!input) zoomer.html.find("input").val(zoomer.zoom);

                    if (val && item.popup.editor && item.popup.editor.cropper)
                      item.popup.editor.cropper.resize(true);
                  },
                  isZoomed: function () {
                    var zoomer = this;

                    return zoomer.zoom > zoomer.scale;
                  },
                  getImageSize: function () {
                    var zoomer = this;

                    return {
                      width: $imageEl.prop("naturalWidth"),
                      height: $imageEl.prop("naturalHeight"),
                    };
                  },
                  getImageScale: function () {
                    var zoomer = this;

                    return Math.round(
                      100 / ($imageEl.prop("naturalWidth") / $imageEl.width())
                    );
                  },
                };
              }

              item.popup.zoomer.init();
            },

            /**
             * save
             * save edited image
             * show cropping tools, only when popup is enabled
             *
             * @namespace editor
             * @param {Object} item
             * @void
             */
            save: function (
              item,
              toBlob,
              mimeType,
              callback,
              preventThumbnailRender
            ) {
              var inPopup =
                  item.popup &&
                  item.popup.html &&
                  $("html").find(item.popup.html).length,
                image = new Image(),
                onload = function () {
                  if (!item.reader.node) return;

                  // save
                  var canvas = document.createElement("canvas"),
                    ctx = canvas.getContext("2d"),
                    image = this,
                    rotationCf = [0, 180],
                    type = mimeType || item.type || "image/jpeg",
                    quality = n.editor.quality || 90,
                    nextStep = function (exportDataURI, img) {
                      var data = exportDataURI;

                      if (toBlob) {
                        if (data) data = f._assets.dataURItoBlob(data, type);
                        else
                          console.error(
                            "Error: Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported."
                          );
                      }

                      !preventThumbnailRender && data
                        ? f.thumbnails.renderThumbnail(
                            item,
                            true,
                            img || exportDataURI
                          )
                        : null;
                      callback ? callback(data, item, l, p, o, s) : null;
                      n.editor.onSave != null &&
                      typeof n.editor.onSave == "function"
                        ? n.editor.onSave(data, item, l, p, o, s)
                        : null;
                      f.set("listInput", null);
                    };

                  try {
                    // set canvas size and image
                    canvas.width = item.reader.width;
                    canvas.height = item.reader.height;
                    ctx.drawImage(
                      image,
                      0,
                      0,
                      item.reader.width,
                      item.reader.height
                    );

                    // rotate image
                    if (typeof item.editor.rotation != "undefined") {
                      item.editor.rotation = item.editor.rotation || 0;

                      canvas.width =
                        rotationCf.indexOf(item.editor.rotation) > -1
                          ? item.reader.width
                          : item.reader.height;
                      canvas.height =
                        rotationCf.indexOf(item.editor.rotation) > -1
                          ? item.reader.height
                          : item.reader.width;

                      var angle = (item.editor.rotation * Math.PI) / 180,
                        cw = canvas.width * 0.5,
                        ch = canvas.height * 0.5;

                      // clear context
                      ctx.clearRect(0, 0, canvas.width, canvas.height);

                      // rotate context
                      ctx.translate(cw, ch);
                      ctx.rotate(angle);
                      ctx.translate(
                        -item.reader.width * 0.5,
                        -item.reader.height * 0.5
                      );

                      // draw image and reset transform
                      ctx.drawImage(image, 0, 0);
                      ctx.setTransform(1, 0, 0, 1, 0, 0);
                    }

                    // crop image
                    if (item.editor.crop) {
                      var cut = ctx.getImageData(
                        item.editor.crop.left,
                        item.editor.crop.top,
                        item.editor.crop.width,
                        item.editor.crop.height
                      );

                      canvas.width = item.editor.crop.width;
                      canvas.height = item.editor.crop.height;

                      // put image
                      ctx.putImageData(cut, 0, 0);
                    }

                    var exportDataURI = canvas.toDataURL(type, quality / 100);

                    // resize image if maxWidth
                    if (n.editor.maxWidth || n.editor.maxHeight) {
                      var img = new Image();

                      img.src = exportDataURI;
                      img.onload = function () {
                        var canvas2 = document.createElement("canvas");

                        // resize canvas
                        f.editor.resize(
                          img,
                          canvas2,
                          n.editor.maxWidth,
                          n.editor.maxHeight,
                          true,
                          false
                        );

                        exportDataURI = canvas2.toDataURL(type, quality / 100);
                        canvas = ctx = canvas2 = null;
                        nextStep(exportDataURI, img);
                      };
                    } else {
                      canvas = ctx = null;
                      nextStep(exportDataURI);
                    }
                  } catch (e) {
                    item.popup.editor = null;
                    canvas = ctx = null;
                    nextStep(null);
                  }
                };

              if (inPopup) {
                if (!item.popup.editor.hasChanges) return;

                var scale = item.popup.editor.scale || 1;

                item.editor.rotation = item.popup.editor.rotation || 0;
                if (item.popup.editor.cropper) {
                  item.editor.crop = item.popup.editor.cropper.crop;

                  item.editor.crop.width =
                    item.editor.crop.width /
                    item.popup.editor.cropper.crop.cfWidth /
                    scale;
                  item.editor.crop.left =
                    item.editor.crop.left /
                    item.popup.editor.cropper.crop.cfWidth /
                    scale;
                  item.editor.crop.height =
                    item.editor.crop.height /
                    item.popup.editor.cropper.crop.cfHeight /
                    scale;
                  item.editor.crop.top =
                    item.editor.crop.top /
                    item.popup.editor.cropper.crop.cfHeight /
                    scale;
                }
              }

              if (f._assets.isMobile()) {
                image.onload = onload;
                image.src = item.reader.src;
              } else if (item.popup.node) {
                onload.call(item.popup.node);
              } else if (item.reader.node) {
                onload.call(item.reader.node);
              } else {
                item.reader.read(item, function () {
                  onload.call(item.reader.node);
                });
              }
            },
          },

          /**
           * @namespace sorter
           */
          sorter: {
            init: function () {
              p.on(
                "mousedown touchstart",
                n.thumbnails._selectors.sorter,
                f.sorter.mousedown
              );
            },
            destroy: function () {
              p.off(
                "mousedown touchstart",
                n.thumbnails._selectors.sorter,
                f.sorter.mousedown
              );
            },
            findItemAtPos: function (points) {
              var sort = f.sorter.sort,
                $list = sort.items.not(sort.item.html),
                $item = null;

              $list.each(function (i, el) {
                var $el = $(el);

                if (
                  points.x > $el.offset().left &&
                  points.x < $el.offset().left + $el.outerWidth() &&
                  points.y > $el.offset().top &&
                  points.y < $el.offset().top + $el.outerHeight()
                ) {
                  $item = $el;
                  return false;
                }
              });

              return $item;
            },
            mousedown: function (e) {
              var eventType =
                  e.originalEvent.touches && e.originalEvent.touches[0]
                    ? "touchstart"
                    : "mousedown",
                $target = $(e.target),
                $item = $target.closest(n.thumbnails._selectors.item),
                item = f.files.find($item),
                points = {
                  x:
                    eventType == "mousedown" || !$item.length
                      ? e.pageX
                      : e.originalEvent.touches[0].pageX,
                  y:
                    eventType == "mousedown" || !$item.length
                      ? e.pageY
                      : e.originalEvent.touches[0].pageY,
                },
                callback = function () {
                  // set current state
                  f.sorter.sort = {
                    el: $target,
                    item: item,
                    items: l.find(n.thumbnails._selectors.item),
                    x: points.x,
                    y: points.y,
                    xItem: points.x - $item.offset().left,
                    yItem: points.y - $item.offset().top,
                    left: $item.position().left,
                    top: $item.position().top,
                    width: $item.outerWidth(),
                    height: $item.outerHeight(),
                    placeholder: n.sorter.placeholder
                      ? $(n.sorter.placeholder)
                      : $(item.html.get(0).cloneNode()).addClass(
                          "fileuploader-sorter-placeholder"
                        ),
                  };

                  // disable user-select
                  $("body").css({
                    "-webkit-user-select": "none",
                    "-moz-user-select": "none",
                    "-ms-user-select": "none",
                    "user-select": "none",
                  });

                  // bind window mousemove event
                  $(document).on("mousemove touchmove", f.sorter.mousemove);
                };

              // off
              if (f.sorter.sort) f.sorter.mouseup();

              // prevent if right click
              if (e.which == 3) return true;

              // prevent if there is no item
              if (!item) return true;

              // prevent if target is selectorExclude
              if (
                n.sorter.selectorExclude &&
                ($target.is(n.sorter.selectorExclude) ||
                  $target.closest(n.sorter.selectorExclude).length)
              )
                return true;

              // preventDefault
              e.preventDefault();

              // mousedown event
              if (eventType == "mousedown") {
                // bind cropping start event
                callback();
              }

              // touchstart event
              if (eventType == "touchstart") {
                f.sorter.isTouchLongPress = true;

                // check if long press
                setTimeout(
                  function () {
                    if (!f.sorter.isTouchLongPress) return;

                    delete f.sorter.isTouchLongPress;
                    callback();
                  },
                  n.thumbnails.touchDelay ? n.thumbnails.touchDelay : 0
                );
              }

              // bind window mouseup event
              $(document).on("mouseup touchend", f.sorter.mouseup);
            },
            mousemove: function (e) {
              var eventType =
                  e.originalEvent.touches && e.originalEvent.touches[0]
                    ? "touchstart"
                    : "mousedown",
                sort = f.sorter.sort,
                item = sort.item,
                $list = l.find(n.thumbnails._selectors.item),
                $container = $(n.sorter.scrollContainer || window),
                scroll = {
                  left: $(document).scrollLeft(),
                  top: $(document).scrollTop(),
                  containerLeft: $container.scrollLeft(),
                  containerTop: $container.scrollTop(),
                },
                points = {
                  x:
                    eventType == "mousedown"
                      ? e.clientX
                      : e.originalEvent.touches[0].clientX,
                  y:
                    eventType == "mousedown"
                      ? e.clientY
                      : e.originalEvent.touches[0].clientY,
                };

              e.preventDefault();

              // drag
              var left = points.x - sort.xItem,
                top = points.y - sort.yItem,
                leftContainer = points.x - ($container.prop("offsetLeft") || 0),
                topContainer = points.y - ($container.prop("offsetTop") || 0);

              // fix position
              if (left + sort.xItem > $container.width())
                left = $container.width() - sort.xItem;
              if (left + sort.xItem < 0) left = 0 - sort.xItem;
              if (top + sort.yItem > $container.height())
                top = $container.height() - sort.yItem;
              if (top + sort.yItem < 0) top = 0 - sort.yItem;

              // scroll
              if (topContainer <= 0)
                $container.scrollTop(scroll.containerTop - 10);
              if (topContainer > $container.height())
                $container.scrollTop(scroll.containerTop + 10);
              if (leftContainer < 0)
                $container.scrollLeft(scroll.containerLeft - 10);
              if (leftContainer > $container.width())
                $container.scrollLeft(scroll.containerLeft + 10);

              // set style
              item.html.addClass("sorting").css({
                position: "fixed",
                left: left,
                top: top,
                width: f.sorter.sort.width,
                height: f.sorter.sort.height,
              });

              // position placeholder
              if (!l.find(sort.placeholder).length)
                item.html.after(sort.placeholder);
              sort.placeholder.css({
                width: f.sorter.sort.width,
                height: f.sorter.sort.height,
              });

              // set new position
              var $hoverEl = f.sorter.findItemAtPos({
                x: left + sort.xItem + scroll.left,
                y: top + sort.yItem + scroll.top,
              });
              if ($hoverEl) {
                // prevent drag issue
                var directionX =
                    sort.placeholder.offset().left != $hoverEl.offset().left,
                  directionY =
                    sort.placeholder.offset().top != $hoverEl.offset().top;
                if (f.sorter.sort.lastHover) {
                  if (f.sorter.sort.lastHover.el == $hoverEl[0]) {
                    if (
                      directionY &&
                      f.sorter.sort.lastHover.direction == "before" &&
                      points.y < f.sorter.sort.lastHover.y
                    )
                      return;
                    if (
                      directionY &&
                      f.sorter.sort.lastHover.direction == "after" &&
                      points.y > f.sorter.sort.lastHover.y
                    )
                      return;

                    if (
                      directionX &&
                      f.sorter.sort.lastHover.direction == "before" &&
                      points.x < f.sorter.sort.lastHover.x
                    )
                      return;
                    if (
                      directionX &&
                      f.sorter.sort.lastHover.direction == "after" &&
                      points.x > f.sorter.sort.lastHover.x
                    )
                      return;
                  }
                }

                // insert element before/after in HTML
                var index = $list.index(item.html),
                  hoverIndex = $list.index($hoverEl),
                  direction = index > hoverIndex ? "before" : "after";

                $hoverEl[direction](sort.placeholder);
                $hoverEl[direction](item.html);

                // save last hover data
                f.sorter.sort.lastHover = {
                  el: $hoverEl[0],
                  x: points.x,
                  y: points.y,
                  direction: direction,
                };
              }
            },
            mouseup: function () {
              var sort = f.sorter.sort,
                item = sort.item;

              // clear
              $("body").css({
                "-webkit-user-select": "",
                "-moz-user-select": "",
                "-ms-user-select": "",
                "user-select": "",
              });

              item.html.removeClass("sorting").css({
                position: "",
                left: "",
                top: "",
                width: "",
                height: "",
              });

              $(document).off("mousemove touchmove", f.sorter.mousemove);
              $(document).off("mouseup touchend", f.sorter.mouseup);

              sort.placeholder.remove();
              delete f.sorter.sort;
              f.sorter.save();
            },
            save: function (isFromList) {
              var index = 0,
                list = [],
                cachedList = [],
                items = isFromList
                  ? f._itFl
                  : n.thumbnails.itemPrepend
                  ? l.children().get().reverse()
                  : l.children(),
                hasChanges;

              // set index for all files
              $.each(items, function (i, el) {
                var item = el.file ? el : f.files.find($(el));

                if (item) {
                  // continue if not uploaded
                  if (item.upload && !item.uploaded) return;

                  // check for changes
                  if (
                    f.rendered &&
                    item.index != index &&
                    ((f._itSl && f._itSl.indexOf(item.id) != index) || true)
                  )
                    hasChanges = true;

                  item.index = index;
                  list.push(item);
                  cachedList.push(item.id);
                  index++;
                }
              });

              // check for changes
              if (f._itSl && f._itSl.length != cachedList.length)
                hasChanges = true;
              f._itSl = cachedList;

              // replace list
              if (hasChanges && list.length == f._itFl.length) f._itFl = list;

              // update listInput
              if (!isFromList) f.set("listInput", "ignoreSorter");

              // onSort callback
              hasChanges &&
              n.sorter.onSort != null &&
              typeof n.sorter.onSort == "function"
                ? n.sorter.onSort(list, l, p, o, s)
                : null;
            },
          },

          /**
           * @namespace upload
           */
          upload: {
            /**
             * prepare
             * prepare item ajax data and also item ajax methods
             *
             * @namespace upload
             * @param {Object} item
             * @param {bool} force_send - force ajax sending after prepare
             * @void
             */
            prepare: function (item, force_send) {
              // create item upload object
              item.upload = {
                url: n.upload.url,
                data: $.extend({}, n.upload.data),
                formData: new FormData(),
                type: n.upload.type || "POST",
                enctype: n.upload.enctype || "multipart/form-data",
                cache: false,
                contentType: false,
                processData: false,
                chunk: item.upload ? item.upload.chunk : null,

                status: null,
                send: function () {
                  f.upload.send(item, true);
                },
                cancel: function (isFromRemove) {
                  f.upload.cancel(item, isFromRemove);
                },
              };

              // add file to formData
              item.upload.formData.append(
                s.attr("name"),
                item.file,
                item.name ? item.name : false
              );

              if (n.upload.start || force_send) f.upload.send(item, force_send);
            },
            /**
             * send
             * send item ajax
             *
             * @namespace upload
             * @param {Object} item
             * @param {bool} force_send - skip the synchron functions and force ajax sending
             * @void
             */
            send: function (item, force_send) {
              // skip if upload settings were not prepared
              // only made for safety
              if (!item.upload) return;
              var setItemUploadStatus = function (status) {
                  if (item.html)
                    item.html
                      .removeClass(
                        "upload-pending upload-loading upload-cancelled upload-failed upload-successful"
                      )
                      .addClass("upload-" + (status || item.upload.status));
                },
                loadNextItem = function () {
                  var i = 0;

                  if (f._pfuL.length > 0) {
                    f._pfuL.indexOf(item) > -1
                      ? f._pfuL.splice(f._pfuL.indexOf(item), 1)
                      : null;
                    while (i < f._pfuL.length) {
                      if (
                        f._itFl.indexOf(f._pfuL[i]) > -1 &&
                        f._pfuL[i].upload &&
                        !f._pfuL[i].upload.$ajax
                      ) {
                        f.upload.send(f._pfuL[i], true);
                        break;
                      } else {
                        f._pfuL.splice(i, 1);
                      }
                      i++;
                    }
                  }
                };

              // synchron upload
              if (n.upload.synchron && !item.upload.chunk) {
                // add pending status to item
                item.upload.status = "pending";
                if (item.html) setItemUploadStatus();

                // check pending list
                if (force_send) {
                  f._pfuL.indexOf(item) > -1
                    ? f._pfuL.splice(f._pfuL.indexOf(item), 1)
                    : null;
                } else {
                  f._pfuL.indexOf(item) == -1 ? f._pfuL.push(item) : null;
                  if (f._pfuL.length > 1) {
                    return;
                  }
                }
              }

              // chunk upload
              if (n.upload.chunk && item.file.slice) {
                var chunkSize = f._assets.toBytes(n.upload.chunk),
                  chunks = Math.ceil(item.size / chunkSize, chunkSize);

                if (chunks > 1 && !item.upload.chunk)
                  item.upload.chunk = {
                    name: item.name,
                    size: item.file.size,
                    type: item.file.type,
                    chunkSize: chunkSize,
                    temp_name: item.name,

                    loaded: 0,
                    total: chunks,
                    i: -1,
                  };

                if (item.upload.chunk) {
                  item.upload.chunk.i++;
                  delete item.upload.chunk.isFirst;
                  delete item.upload.chunk.isLast;
                  if (item.upload.chunk.i == 0)
                    item.upload.chunk.isFirst = true;
                  if (item.upload.chunk.i == item.upload.chunk.total - 1)
                    item.upload.chunk.isLast = true;

                  if (item.upload.chunk.i <= item.upload.chunk.total - 1) {
                    var offset =
                        item.upload.chunk.i * item.upload.chunk.chunkSize,
                      filePart = item.file.slice(
                        offset,
                        offset + item.upload.chunk.chunkSize
                      );

                    item.upload.formData = new FormData();
                    item.upload.formData.append(s.attr("name"), filePart);
                    item.upload.data._chunkedd = JSON.stringify(
                      item.upload.chunk
                    );
                  } else {
                    delete item.upload.chunk;
                  }
                }
              }

              // upload.beforeSend callback
              if (
                n.upload.beforeSend &&
                $.isFunction(n.upload.beforeSend) &&
                n.upload.beforeSend(item, l, p, o, s) === false
              ) {
                delete item.upload.chunk;
                setItemUploadStatus();
                loadNextItem();
                return;
              }

              // add uploading class to parent element
              p.addClass("fileuploader-is-uploading");

              // add loading status to item
              if (item.upload.$ajax) item.upload.$ajax.abort();
              delete item.upload.$ajax;
              delete item.upload.send;
              item.upload.status = "loading";
              if (item.html) {
                if (n.thumbnails._selectors.start)
                  item.html.find(n.thumbnails._selectors.start).remove();
                setItemUploadStatus();
              }

              // add upload data to formData
              if (item.upload.data) {
                for (var k in item.upload.data) {
                  if (!item.upload.data.hasOwnProperty(k)) continue;
                  item.upload.formData.append(k, item.upload.data[k]);
                }
              }

              item.upload.data = item.upload.formData;
              item.upload.xhrStartedAt =
                item.upload.chunk && item.upload.chunk.xhrStartedAt
                  ? item.upload.chunk.xhrStartedAt
                  : new Date();
              item.upload.xhr = function () {
                var xhr = $.ajaxSettings.xhr();

                if (xhr.upload) {
                  xhr.upload.addEventListener(
                    "progress",
                    function (e) {
                      if (item.upload.$ajax) {
                        item.upload.$ajax.total = item.upload.chunk
                          ? item.upload.chunk.size
                          : e.total;
                      }
                      f.upload.progressHandling(
                        e,
                        item,
                        item.upload.xhrStartedAt
                      );
                    },
                    false
                  );
                }
                return xhr;
              };
              item.upload.complete = function (jqXHR, textStatus) {
                if (
                  item.upload.chunk &&
                  !item.upload.chunk.isLast &&
                  textStatus == "success"
                )
                  return f.upload.prepare(item, true);
                loadNextItem();

                delete item.upload.xhrStartedAt;

                var g = true;
                $.each(f._itFl, function (i, a) {
                  if (a.upload && a.upload.$ajax) g = false;
                });
                if (g) {
                  p.removeClass("fileuploader-is-uploading");
                  n.upload.onComplete != null &&
                  typeof n.upload.onComplete == "function"
                    ? n.upload.onComplete(l, p, o, s, jqXHR, textStatus)
                    : null;
                }
              };
              item.upload.success = function (data, textStatus, jqXHR) {
                if (item.upload.chunk && !item.upload.chunk.isLast) {
                  try {
                    var json = JSON.parse(data);

                    item.upload.chunk.temp_name = json.fileuploader.temp_name;
                  } catch (e) {}
                  return;
                }
                delete item.upload.chunk;
                f.upload.progressHandling(
                  null,
                  item,
                  item.upload.xhrStartedAt,
                  true
                );
                item.uploaded = true;
                delete item.upload;
                item.upload = {
                  status: "successful",
                  resend: function () {
                    f.upload.retry(item);
                  },
                };

                if (item.html) setItemUploadStatus();

                n.upload.onSuccess != null && $.isFunction(n.upload.onSuccess)
                  ? n.upload.onSuccess(
                      data,
                      item,
                      l,
                      p,
                      o,
                      s,
                      textStatus,
                      jqXHR
                    )
                  : null;
                item.html.find("a").attr("href", item.url);
                f.set("listInput", null);
              };
              item.upload.error = function (jqXHR, textStatus, errorThrown) {
                if (item.upload.chunk)
                  item.upload.chunk.i = Math.max(-1, item.upload.chunk.i - 1);
                item.uploaded = false;
                item.upload.status =
                  item.upload.status == "cancelled"
                    ? item.upload.status
                    : "failed";
                item.upload.retry = function () {
                  f.upload.retry(item);
                };
                delete item.upload.$ajax;

                if (item.html) setItemUploadStatus();

                n.upload.onError != null && $.isFunction(n.upload.onError)
                  ? n.upload.onError(
                      item,
                      l,
                      p,
                      o,
                      s,
                      jqXHR,
                      textStatus,
                      errorThrown
                    )
                  : null;
              };

              // send
              item.upload.$ajax = $.ajax(item.upload);
            },
            /**
             * cancel
             * cancel item ajax request
             *
             * @namespace upload
             * @param {Object} item
             * @void
             */
            cancel: function (item, isFromRemove) {
              if (item && item.upload) {
                item.upload.status = "cancelled";
                delete item.upload.chunk;
                item.upload.$ajax ? item.upload.$ajax.abort() : null;
                delete item.upload.$ajax;
                !isFromRemove ? f.files.remove(item) : null;
              }
            },
            /**
             * retry
             * retry item ajax upload
             *
             * @namespace upload
             * @param {Object} item
             * @void
             */
            retry: function (item) {
              if (item && item.upload) {
                if (item.html && n.thumbnails._selectors.retry)
                  item.html.find(n.thumbnails._selectors.retry).remove();

                f.upload.prepare(item, true);
              }
            },
            /**
             * progressHandling
             * item ajax progress function
             *
             * @namespace upload
             * @param {Event} e - xhr event
             * @param {Object} item
             * @param {Date} xhrStartedAt - request started Date()
             * @param {Boolean} isManual - check if function was manually called
             * @void
             */
            progressHandling: function (e, item, xhrStartedAt, isManual) {
              if (!e && isManual && item.upload.$ajax)
                e = {
                  total: item.upload.$ajax.total || item.size,
                  loaded: item.upload.$ajax.total || item.size,
                  lengthComputable: true,
                };

              if (e.lengthComputable) {
                var date = new Date(),
                  loaded =
                    e.loaded +
                    (item.upload.chunk ? item.upload.chunk.loaded : 0),
                  total = item.upload.chunk ? item.upload.chunk.size : e.total,
                  percentage = Math.round((loaded * 100) / total),
                  timeStarted =
                    item.upload.chunk && item.upload.chunk.xhrStartedAt
                      ? item.upload.chunk.xhrStartedAt
                      : xhrStartedAt,
                  secondsElapsed =
                    (date.getTime() - timeStarted.getTime()) / 1000,
                  bytesPerSecond = secondsElapsed ? loaded / secondsElapsed : 0,
                  remainingBytes = Math.max(0, total - loaded),
                  secondsRemaining = Math.max(
                    0,
                    secondsElapsed ? remainingBytes / bytesPerSecond : 0
                  ),
                  data = {
                    loaded: loaded,
                    loadedInFormat: f._assets.bytesToText(loaded),
                    total: total,
                    totalInFormat: f._assets.bytesToText(total),
                    percentage: percentage,
                    secondsElapsed: secondsElapsed,
                    secondsElapsedInFormat: f._assets.secondsToText(
                      secondsElapsed,
                      true
                    ),
                    bytesPerSecond: bytesPerSecond,
                    bytesPerSecondInFormat:
                      f._assets.bytesToText(bytesPerSecond) + "/s",
                    remainingBytes: remainingBytes,
                    remainingBytesInFormat: f._assets.bytesToText(
                      remainingBytes
                    ),
                    secondsRemaining: secondsRemaining,
                    secondsRemainingInFormat: f._assets.secondsToText(
                      secondsRemaining,
                      true
                    ),
                  };

                if (item.upload.chunk) {
                  if (item.upload.chunk.isFirst)
                    item.upload.chunk.xhrStartedAt = xhrStartedAt;
                  if (e.loaded == e.total && !item.upload.chunk.isLast)
                    item.upload.chunk.loaded += Math.max(
                      e.total,
                      item.upload.chunk.total / item.upload.chunk.chunkSize
                    );
                }

                if (data.percentage > 99 && !isManual) data.percentage = 99;

                // upload.onProgress callback
                n.upload.onProgress && $.isFunction(n.upload.onProgress)
                  ? n.upload.onProgress(data, item, l, p, o, s)
                  : null;
              }
            },
          },
          /**
           * @namespace dragDrop
           */
          dragDrop: {
            /**
             * onDragEnter
             * on dragging file on the drag container
             *
             * @namespace dragDrop
             * @param {Event} e - jQuery event
             * @void
             */
            onDragEnter: function (e) {
              clearTimeout(f.dragDrop._timer);

              // add dragging class to parent element
              n.dragDrop.container.addClass("fileuploader-dragging");

              // set feedback caption
              f.set("feedback", f._assets.textParse(n.captions.drop));

              // dragDrop.onDragEnter callback
              n.dragDrop.onDragEnter != null &&
              $.isFunction(n.dragDrop.onDragEnter)
                ? n.dragDrop.onDragEnter(e, l, p, o, s)
                : null;
            },
            /**
             * onDragLeave
             * on dragging leave from the drag container
             *
             * @namespace dragDrop
             * @param {Event} e - jQuery event
             * @void
             */
            onDragLeave: function (e) {
              clearTimeout(f.dragDrop._timer);

              f.dragDrop._timer = setTimeout(
                function (e) {
                  // check if not the childNodes from dragging container are hovered
                  if (!f.dragDrop._dragLeaveCheck(e)) {
                    return false;
                  }

                  // remove dragging class from parent element
                  n.dragDrop.container.removeClass("fileuploader-dragging");

                  // set feedback caption
                  f.set("feedback", null);

                  // dragDrop.onDragLeave callback
                  n.dragDrop.onDragLeave != null &&
                  $.isFunction(n.dragDrop.onDragLeave)
                    ? n.dragDrop.onDragLeave(e, l, p, o, s)
                    : null;
                },
                100,
                e
              );
            },
            /**
             * onDrop
             * on drop files
             *
             * @namespace dragDrop
             * @param {Event} e - jQuery event
             * @void
             */
            onDrop: function (e) {
              clearTimeout(f.dragDrop._timer);

              // remove dragging class from parent element
              n.dragDrop.container.removeClass("fileuploader-dragging");

              // set feedback caption
              f.set("feedback", null);

              // check if event has dropped files and use them
              if (
                e &&
                e.originalEvent &&
                e.originalEvent.dataTransfer &&
                e.originalEvent.dataTransfer.files &&
                e.originalEvent.dataTransfer.files.length
              ) {
                if (f.isUploadMode()) {
                  f.onChange(e, e.originalEvent.dataTransfer.files);
                } else {
                  s.prop("files", e.originalEvent.dataTransfer.files).trigger(
                    "change"
                  );
                }
              }

              // dragDrop.onDrop callback
              n.dragDrop.onDrop != null && $.isFunction(n.dragDrop.onDrop)
                ? n.dragDrop.onDrop(e, l, p, o, s)
                : null;
            },
            /**
             * _dragLeaveCheck
             * check by the living from drag container if not the childNodes are hovered
             *
             * @namespace dragDrop
             * @param {Event} e - jQuery event
             * @return {bool} return the leaving statement
             */
            _dragLeaveCheck: function (e) {
              var related = $(e.currentTarget),
                insideEls;

              if (!related.is(n.dragDrop.container)) {
                insideEls = n.dragDrop.container.find(related);

                if (insideEls.length) {
                  return false;
                }
              }

              return true;
            },
          },

          /**
           * @namespace clipboard
           */
          clipboard: {
            /**
             * paste
             * on pasting a file from clipboard on page
             *
             * @namespace clipboard
             * @param {Event} e - jQuery event
             * @void
             */
            paste: function (e) {
              // check if the input is into view and if clipboard is supported and if there are files in the clipboard
              if (
                !f._assets.isIntoView(o) ||
                !e.originalEvent.clipboardData ||
                !e.originalEvent.clipboardData.items ||
                !e.originalEvent.clipboardData.items.length
              )
                return;

              var items = e.originalEvent.clipboardData.items;

              // extra clean
              f.clipboard.clean();

              for (var i = 0; i < items.length; i++) {
                if (
                  items[i].type.indexOf("image") !== -1 ||
                  items[i].type.indexOf("text/uri-list") !== -1
                ) {
                  var blob = items[i].getAsFile(),
                    ms = n.clipboardPaste > 1 ? n.clipboardPaste : 2000;

                  if (blob) {
                    // create clipboard file name
                    blob._name = f._assets.generateFileName(
                      blob.type.indexOf("/") != -1
                        ? blob.type.split("/")[1].toString().toLowerCase()
                        : "png",
                      "Clipboard "
                    );

                    // set clipboard timer
                    f.set(
                      "feedback",
                      f._assets.textParse(n.captions.paste, { ms: ms / 1000 })
                    );
                    f.clipboard._timer = setTimeout(function () {
                      f.set("feedback", null);
                      f.onChange(e, [blob]);
                    }, ms - 2);
                  }
                }
              }
            },
            /**
             * clean
             * clean the clipboard timer
             *
             * @namespace clipboard
             * @void
             */
            clean: function () {
              if (f.clipboard._timer) {
                clearTimeout(f.clipboard._timer);
                delete f.clipboard._timer;

                // set feedback caption
                f.set("feedback", null);
              }
            },
          },

          /**
           * @namespace files
           */
          files: {
            /**
             * add
             * add a file to memory
             *
             * @namespace files
             * @param {Object} file
             * @param {String} prop - type of adding a file to memory
             * @return {Number} index - index of the item in memory array
             */
            add: function (file, prop) {
              var name = file._name || file.name,
                size = file.size,
                size2 = f._assets.bytesToText(size),
                type = file.type,
                format = type
                  ? type.split("/", 1).toString().toLowerCase()
                  : "",
                extension =
                  name.indexOf(".") != -1
                    ? name.split(".").pop().toLowerCase()
                    : "",
                title = name.substr(
                  0,
                  name.length -
                    (name.indexOf(".") != -1
                      ? extension.length + 1
                      : extension.length)
                ),
                data = file.data || {},
                src = file.file || file,
                id = prop == "updated" ? file.id : Date.now(),
                index,
                item,
                IsCompleted = file.IsCompleted,
                IsDelete = file.IsDelete,
                IsNewFile = file.IsNewFile,
                nID = file.nID,
                sFileName = file.sFileName,
                sFileType = file.sFileType,
                sMsg = file.sMsg,
                sSaveToFileName = file.sSaveToFileName,
                sSaveToPath = file.sSaveToPath,
                sSize = file.sSize,
                sUrl = file.sUrl,
                data = {
                  name: name,
                  title: title,
                  size: size,
                  size2: size2,
                  type: type,
                  format: format,
                  extension: extension,
                  data: data,
                  file: src,
                  IsCompleted: IsCompleted,
                  IsDelete: IsDelete,
                  IsNewFile: IsNewFile,
                  nID: nID,
                  sFileName: sFileName,
                  sFileType: sFileType,
                  sMsg: sMsg,
                  sSaveToFileName: sSaveToFileName,
                  sSaveToPath: sSaveToPath,
                  sSize: sSize,
                  sUrl: sUrl,
                  reader: {
                    read: function (callback, type, force) {
                      return f.files.read(item, callback, type, force);
                    },
                  },
                  id: id,

                  input: prop == "choosed" ? s : null,
                  html: null,
                  choosed: prop == "choosed",
                  appended: prop == "appended" || prop == "updated",
                  uploaded: prop == "uploaded",
                };

              if (!data.data.listProps) data.data.listProps = {};
              if (!data.data.url && data.appended) data.data.url = data.file;

              if (prop != "updated") {
                f._itFl.push(data);
                index = f._itFl.length - 1;
                item = f._itFl[index];
              } else {
                index = f._itFl.indexOf(file);
                f._itFl[index] = item = data;
              }

              item.remove = function () {
                f.files.remove(item);
              };

              if (n.editor && format == "image")
                item.editor = {
                  rotate:
                    n.editor.rotation !== false
                      ? function (deg) {
                          f.editor.rotate(item, deg);
                        }
                      : null,
                  cropper:
                    n.editor.cropper !== false
                      ? function (data) {
                          f.editor.crop(item, data);
                        }
                      : null,
                  save: function (
                    callback,
                    toBlob,
                    mimeType,
                    preventThumbnailRender
                  ) {
                    f.editor.save(
                      item,
                      toBlob,
                      mimeType,
                      callback,
                      preventThumbnailRender
                    );
                  },
                };

              if (file.local) item.local = file.local;

              return index;
            },
            /**
             * read
             * read choosed file and sends the information to callback
             *
             * @namespace files
             * @param {Object} item
             * @param {Function} callback
             * @param {String} type - FileReader readAs type
             * @param {Boolean} force - force a new file read and ignore the existing
             * @param {Boolean} isThumb - is thumbnail
             * @return {null}
             */
            read: function (item, callback, type, force, isThumb) {
              if (f.isFileReaderSupported() && !item.data.readerSkip) {
                var reader = new FileReader(),
                  URL = window.URL || window.webkitURL,
                  hasThumb = isThumb && item.data.thumbnail,
                  useFile = typeof item.file != "string",
                  execute_callbacks = function () {
                    var _callbacks = item.reader._callbacks || [];

                    if (item.reader._timer) {
                      clearTimeout(item.reader._timer);
                      delete item.reader._timer;
                    }

                    delete item.reader._callbacks;
                    delete item.reader._FileReader;

                    for (var i = 0; i < _callbacks.length; i++) {
                      $.isFunction(_callbacks[i])
                        ? _callbacks[i](item, l, p, o, s)
                        : null;
                    }

                    n.onFileRead && $.isFunction(n.onFileRead)
                      ? n.onFileRead(item, l, p, o, s)
                      : null;
                  };

                if ((!item.reader.src && !item.reader._FileReader) || force)
                  item.reader = {
                    _FileReader: reader,
                    _callbacks: [],
                    read: item.reader.read,
                  };

                if (item.reader.src && !force)
                  return callback && $.isFunction(callback)
                    ? callback(item, l, p, o, s)
                    : null;

                if (callback && item.reader._callbacks) {
                  item.reader._callbacks.push(callback);

                  if (item.reader._callbacks.length > 1) return;
                }

                if (item.format == "astext") {
                  reader.onload = function (e) {
                    var node = document.createElement("div");

                    item.reader.node = node;
                    item.reader.src = e.target.result;
                    item.reader.length = e.target.result.length;

                    node.innerHTML = item.reader.src
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;");

                    execute_callbacks();
                  };
                  reader.onerror = function () {
                    execute_callbacks();
                    item.reader = { read: item.reader.read };
                  };
                  if (useFile) reader.readAsText(item.file);
                  else
                    $.ajax({
                      url: item.file,
                      success: function (result) {
                        reader.onload({ target: { result: result } });
                      },
                      error: function () {
                        reader.onerror();
                      },
                    });
                } else if (item.format == "image" || hasThumb) {
                  var src;

                  reader.onload = function (e) {
                    var node = new Image(),
                      loadNode = function () {
                        if (item.data && item.data.readerCrossOrigin)
                          node.setAttribute(
                            "crossOrigin",
                            item.data.readerCrossOrigin
                          );
                        node.src =
                          e.target.result +
                          ((item.data.readerForce || force) &&
                          !useFile &&
                          !hasThumb &&
                          e.target.result.indexOf("data:image") == -1
                            ? (e.target.result.indexOf("?") == -1 ? "?" : "&") +
                              "d=" +
                              Date.now()
                            : "");
                        node.onload = function () {
                          // exif rotate image
                          if (item.reader.exifOrientation) {
                            var canvas = document.createElement("canvas"),
                              ctx = canvas.getContext("2d"),
                              image = node,
                              rotation = Math.abs(item.reader.exifOrientation),
                              flip =
                                item.reader.exifOrientation < 0
                                  ? item.reader.exifOrientation
                                  : 0,
                              rotationCf = [0, 180];

                            // remove the rotaiton for flip -1
                            if (rotation == 1) rotation = 0;

                            // set canvas size and image
                            canvas.width = image.naturalWidth;
                            canvas.height = image.naturalHeight;
                            ctx.drawImage(image, 0, 0);

                            // rotate image
                            canvas.width =
                              rotationCf.indexOf(rotation) > -1
                                ? image.naturalWidth
                                : image.naturalHeight;
                            canvas.height =
                              rotationCf.indexOf(rotation) > -1
                                ? image.naturalHeight
                                : image.naturalWidth;

                            var angle = (rotation * Math.PI) / 180,
                              cw = canvas.width * 0.5,
                              ch = canvas.height * 0.5;

                            // clear context
                            ctx.clearRect(0, 0, canvas.width, canvas.height);

                            // rotate context
                            ctx.translate(cw, ch);
                            ctx.rotate(angle);
                            ctx.translate(
                              -image.naturalWidth * 0.5,
                              -image.naturalHeight * 0.5
                            );
                            if (flip) {
                              if ([-1, -180].indexOf(flip) > -1) {
                                ctx.translate(canvas.width, 0);
                                ctx.scale(-1, 1);
                              } else if ([-90, -270].indexOf(flip) > -1) {
                                ctx.translate(0, canvas.width);
                                ctx.scale(1, -1);
                              }
                            }

                            // draw image and reset transform
                            ctx.drawImage(image, 0, 0);
                            ctx.setTransform(1, 0, 0, 1, 0, 0);

                            node.src = canvas.toDataURL(item.type, 1);

                            delete item.reader.exifOrientation;
                            return;
                          }

                          item.reader.node = node;
                          item.reader.src = node.src;
                          item.reader.width = node.width;
                          item.reader.height = node.height;
                          item.reader.ratio = f._assets.pxToRatio(
                            item.reader.width,
                            item.reader.height
                          );
                          if (src) URL.revokeObjectURL(src);

                          execute_callbacks();

                          if (hasThumb)
                            item.reader = { read: item.reader.read };
                        };
                        node.onerror = function () {
                          execute_callbacks();
                          item.reader = { read: item.reader.read };
                        };
                      };

                    // exif rotation
                    if (n.thumbnails.exif && item.choosed) {
                      f._assets.getExifOrientation(item.file, function (
                        orientation
                      ) {
                        if (orientation) {
                          var device = f._assets.getDevice.init();

                          if (
                            device.browser.name == "Chrome" &&
                            device.browser.version >= 81
                          ) {
                            delete item.reader.exifOrientation;
                          } else if (
                            device.browser.name == "Safari" &&
                            device.os.version >= 13.4
                          ) {
                            delete item.reader.exifOrientation;
                          } else {
                            item.reader.exifOrientation = orientation;
                          }
                        }

                        loadNode();
                      });
                    } else {
                      loadNode();
                    }
                  };
                  reader.onerror = function () {
                    execute_callbacks();
                    item.reader = { read: item.reader.read };
                  };

                  if (
                    !hasThumb &&
                    item.size > f._assets.toBytes(n.reader.maxSize)
                  )
                    return reader.onerror();

                  if (useFile) {
                    if (
                      n.thumbnails.useObjectUrl &&
                      n.thumbnails.canvasImage &&
                      URL
                    )
                      reader.onload({
                        target: {
                          result: (src = URL.createObjectURL(item.file)),
                        },
                      });
                    else reader.readAsDataURL(item.file);
                  } else {
                    reader.onload({
                      target: {
                        result: hasThumb ? item.data.thumbnail : item.file,
                      },
                    });
                  }
                } else if (item.format == "video" || item.format == "audio") {
                  var node = document.createElement(item.format),
                    canPlay = node.canPlayType(item.type),
                    src;

                  reader.onerror = function () {
                    item.reader.node = null;
                    execute_callbacks();
                    item.reader = { read: item.reader.read };
                  };

                  if (URL && canPlay !== "") {
                    if (isThumb && !n.thumbnails.videoThumbnail) {
                      item.reader.node = node;
                      execute_callbacks();
                      item.reader = { read: item.reader.read };
                      return;
                    }
                    src = useFile ? URL.createObjectURL(item.file) : item.file;
                    node.onloadedmetadata = function () {
                      item.reader.node = node;
                      item.reader.src = node.src;
                      item.reader.duration = node.duration;
                      item.reader.duration2 = f._assets.secondsToText(
                        node.duration
                      );

                      if (item.format == "video") {
                        item.reader.width = node.videoWidth;
                        item.reader.height = node.videoHeight;
                        item.reader.ratio = f._assets.pxToRatio(
                          item.reader.width,
                          item.reader.height
                        );
                      }
                    };
                    node.onerror = function () {
                      execute_callbacks();
                      item.reader = { read: item.reader.read };
                    };
                    node.onloadeddata = function () {
                      if (item.format == "video") {
                        setTimeout(function () {
                          var canvas = document.createElement("canvas"),
                            context = canvas.getContext("2d");

                          canvas.width = node.videoWidth;
                          canvas.height = node.videoHeight;
                          context.drawImage(
                            node,
                            0,
                            0,
                            canvas.width,
                            canvas.height
                          );
                          item.reader.frame = !f._assets.isBlankCanvas(canvas)
                            ? canvas.toDataURL()
                            : null;

                          canvas = context = null;
                          execute_callbacks();
                        }, 300);
                      } else {
                        execute_callbacks();
                      }
                    };

                    // dirty fix
                    setTimeout(function () {
                      if (item.data && item.data.readerCrossOrigin)
                        node.setAttribute(
                          "crossOrigin",
                          item.data.readerCrossOrigin
                        );
                      node.src = src + "#t=1";
                    }, 100);
                  } else {
                    reader.onerror();
                  }
                } else if (
                  item.type == "application/pdf" &&
                  n.thumbnails.pdf &&
                  !type
                ) {
                  var node = document.createElement("iframe"),
                    src = useFile ? URL.createObjectURL(item.file) : item.file;

                  if (n.thumbnails.pdf.viewer || f._assets.hasPlugin("pdf")) {
                    node.src = (n.thumbnails.pdf.viewer || "") + src;
                    item.reader.node = node;
                    item.reader.src = src;
                    execute_callbacks();
                  } else {
                    execute_callbacks();
                  }
                } else {
                  reader.onload = function (e) {
                    item.reader.src = e.target.result;
                    item.reader.length = e.target.result.length;

                    execute_callbacks();
                  };
                  reader.onerror = function (e) {
                    execute_callbacks();
                    item.reader = { read: item.reader.read };
                  };
                  useFile
                    ? reader[type || "readAsBinaryString"](item.file)
                    : execute_callbacks();
                }

                item.reader._timer = setTimeout(
                  reader.onerror,
                  isThumb ? n.reader.thumbnailTimeout : n.reader.timeout
                );
              } else {
                if (callback) callback(item, l, p, o, s);
              }

              return null;
            },
            /**
             * list
             * generate a list of files
             *
             * @namespace files
             * @param {bool} toJSON - generate a JSON list
             * @param {String} customKey - use a custom item attribute by generating
             * @param {Boolean} triggered - function was triggered from the API
             * @param {String} additional - additional settings
             * @return {String|Object}
             */
            list: function (toJson, customKey, triggered, additional) {
              var files = [];

              // save sorter
              if (
                n.sorter &&
                !triggered &&
                (!additional || additional != "ignoreSorter")
              )
                f.sorter.save(true);

              $.each(f._itFl, function (i, a) {
                var file = a;

                if (file.upload && !file.uploaded) return true;

                if (customKey || toJson)
                  file =
                    (file.choosed && !file.uploaded ? "0:/" : "") +
                    (customKey && f.files.getItemAttr(a, customKey) !== null
                      ? f.files.getItemAttr(file, customKey)
                      : file.local ||
                        file[typeof file.file == "string" ? "file" : "name"]);

                if (toJson) {
                  file = { file: file };

                  // editor properties
                  // add only if file was cropped or rotated
                  if (a.editor && (a.editor.crop || a.editor.rotation)) {
                    file.editor = {};
                    if (a.editor.rotation)
                      file.editor.rotation = a.editor.rotation;
                    if (a.editor.crop) file.editor.crop = a.editor.crop;
                  }

                  // sorting property
                  if (typeof a.index !== "undefined") {
                    file.index = a.index;
                  }

                  // custom properties
                  if (a.data && a.data.listProps) {
                    for (var key in a.data.listProps) {
                      file[key] = a.data.listProps[key];
                    }
                  }
                }

                files.push(file);
              });

              files =
                n.onListInput && $.isFunction(n.onListInput)
                  ? n.onListInput(files, f._itFl, n.listInput, l, p, o, s)
                  : files;

              return !toJson ? files : JSON.stringify(files);
            },
            /**
             * check
             * check the files
             *
             * @namespace files
             * @param {Object} item
             * @param {Array} files
             * @param {bool} fullCheck - check some parameters that should be checked only once
             * @return {bool|Array} r
             */
            check: function (item, files, fullCheck) {
              var r = ["warning", null, false, false];
              if (
                n.limit != null &&
                fullCheck &&
                files.length + f._itFl.length - 1 > n.limit
              ) {
                r[1] = f._assets.textParse(n.captions.errors.filesLimit);
                r[3] = true;
                return r;
              }
              if (n.maxSize != null && fullCheck) {
                var g = 0;
                $.each(f._itFl, function (i, a) {
                  g += a.size;
                });
                g -= item.size;
                $.each(files, function (i, a) {
                  g += a.size;
                });

                if (g > f._assets.toBytes(n.maxSize)) {
                  r[1] = f._assets.textParse(n.captions.errors.filesSizeAll);
                  r[3] = true;
                  return r;
                }
              }
              if (
                n.onFilesCheck != null &&
                $.isFunction(n.onFilesCheck) &&
                fullCheck
              ) {
                var onFilesCheck = n.onFilesCheck(files, n, l, p, o, s);
                if (onFilesCheck === false) {
                  r[3] = true;
                  return r;
                }
              }
              if (
                n.extensions != null &&
                $.inArray(item.extension, n.extensions) == -1 &&
                !n.extensions.filter(function (val) {
                  return (
                    item.type.length &&
                    (val.indexOf(item.type) > -1 ||
                      val.indexOf(item.format + "/*") > -1)
                  );
                }).length
              ) {
                r[1] = f._assets.textParse(n.captions.errors.filesType, item);
                return r;
              }
              if (
                n.disallowedExtensions != null &&
                ($.inArray(item.extension, n.disallowedExtensions) > -1 ||
                  n.disallowedExtensions.filter(function (val) {
                    return (
                      !item.type.length ||
                      val.indexOf(item.type) > -1 ||
                      val.indexOf(item.format + "/*") > -1
                    );
                  }).length)
              ) {
                r[1] = f._assets.textParse(n.captions.errors.filesType, item);
                return r;
              }
              if (
                n.fileMaxSize != null &&
                item.size > f._assets.toBytes(n.fileMaxSize)
              ) {
                r[1] = f._assets.textParse(n.captions.errors.fileSize, item);
                return r;
              }
              if (item.size == 0 && item.type == "") {
                r[1] = f._assets.textParse(n.captions.errors.remoteFile, item);
                return r;
              }
              if ((item.size == 4096 || item.size == 64) && item.type == "") {
                r[1] = f._assets.textParse(
                  n.captions.errors.folderUpload,
                  item
                );
                return r;
              }
              if (!n.skipFileNameCheck) {
                var g = false;

                $.each(f._itFl, function (i, a) {
                  if (
                    a != item &&
                    a.choosed == true &&
                    a.file &&
                    a.name == item.name
                  ) {
                    g = true;

                    if (
                      a.file.size == item.size &&
                      a.file.type == item.type &&
                      (item.file.lastModified && a.file.lastModified
                        ? a.file.lastModified == item.file.lastModified
                        : true) &&
                      files.length > 1
                    ) {
                      r[2] = true;
                    } else {
                      r[1] = f._assets.textParse(
                        n.captions.errors.fileName,
                        item
                      );
                      r[2] = false;
                    }

                    return false;
                  }
                });

                if (g) {
                  return r;
                }
              }

              return true;
            },
            /**
             * append
             * check the files
             *
             * @namespace files
             * @param {Array} files
             * @return {bool|Object}
             */
            append: function (files) {
              files = $.isArray(files) ? files : [files];
              if (files.length) {
                var item;
                for (var i = 0; i < files.length; i++) {
                  // if (!f._assets.keyCompare(files[i], ['name', 'file', 'size', 'type'])) {
                  //     continue;
                  // }

                  item = f._itFl[f.files.add(files[i], "appended")];

                  n.thumbnails ? f.thumbnails.item(item) : null;
                }

                // set feedback caption
                f.set("feedback", null);

                // set listInput value
                f.set("listInput", null);

                // afterSelect callback
                n.afterSelect && $.isFunction(n.afterSelect)
                  ? n.afterSelect(l, p, o, s)
                  : null;

                return files.length == 1 ? item : true;
              }
            },
            /**
             * update
             * update an item using new information
             *
             * @namespace files
             * @param {Object} item
             * @param {Object} data
             * @return void
             */
            update: function (item, data) {
              if (
                f._itFl.indexOf(item) == -1 ||
                (item.upload && item.upload.$ajax)
              )
                return;

              var oldItem = item,
                index = f.files.add($.extend(item, data), "updated"),
                item = f._itFl[index];

              if (item.popup && item.popup.close) item.popup.close();

              if (n.thumbnails && oldItem.html)
                f.thumbnails.item(item, oldItem.html);

              f.set("listInput", null);
            },
            /**
             * find
             * find an item in memory using html element
             *
             * @namespace files
             * @param {jQuery Object} html
             * @return {null,Object}
             */
            find: function (html) {
              var item = null;

              $.each(f._itFl, function (i, a) {
                if (a.html && a.html.is(html)) {
                  item = a;
                  return false;
                }
              });

              return item;
            },
            /**
             * remove
             * remove an item from memory and html
             *
             * @namespace files
             * @param {Object} item
             * @param {bool} isFromCheck - if removing function was triggered by checking a file
             * @return {null,Object}
             */
            remove: function (item, isFromCheck) {
              // onRemove callback
              if (
                !isFromCheck &&
                n.onRemove &&
                $.isFunction(n.onRemove) &&
                n.onRemove(item, l, p, o, s) === false
              )
                return;

              // thumbnails.onItemRemove callback
              if (item.html)
                n.thumbnails.onItemRemove &&
                $.isFunction(n.thumbnails.onItemRemove) &&
                !isFromCheck
                  ? n.thumbnails.onItemRemove(item.html, l, p, o, s)
                  : item.html.remove();

              // cancel file upload
              if (item.upload && item.upload.$ajax && item.upload.cancel)
                item.upload.cancel(true);

              // remove popup
              if (item.popup && item.popup.close) {
                item.popup.node = null;
                item.popup.close();
              }

              // remove filereader
              if (item.reader.src) {
                item.reader.node = null;
                URL.revokeObjectURL(item.reader.src);
              }

              // check if any file is in the same input like item.input
              if (item.input) {
                var g = true;
                $.each(f._itFl, function (i, a) {
                  if (
                    item != a &&
                    (item.input == a.input ||
                      (isFromCheck && item.input.get(0).files.length > 1))
                  ) {
                    g = false;
                    return false;
                  }
                });
                if (g) {
                  if (f.isAddMoreMode() && sl.length > 1) {
                    f.set("nextInput");
                    sl.splice(sl.indexOf(item.input), 1);
                    item.input.remove();
                  } else {
                    f.set("input", "");
                  }
                }
              }

              // remove data from memory
              f._pfrL.indexOf(item) > -1
                ? f._pfrL.splice(f._pfrL.indexOf(item), 1)
                : null;
              f._pfuL.indexOf(item) > -1
                ? f._pfuL.splice(f._pfuL.indexOf(item), 1)
                : null;
              f._itFl.indexOf(item) > -1
                ? f._itFl.splice(f._itFl.indexOf(item), 1)
                : null;
              item = null;

              // reset the plugin if there are no any files in the memory
              f._itFl.length == 0 ? f.reset() : null;

              // set feedback caption
              f.set("feedback", null);

              // set listInput value
              f.set("listInput", null);
            },
            /**
             * getItemAttr
             * get an attribute from item or item.data
             *
             * @namespace files
             * @param {Object} item
             * @param {String} attr - attribute key
             * @return {null,String}
             */
            getItemAttr: function (item, attr) {
              var result = null;

              if (item) {
                if (typeof item[attr] != "undefined") {
                  result = item[attr];
                } else if (item.data && typeof item.data[attr] != "undefined") {
                  result = item.data[attr];
                }
              }

              return result;
            },
            /**
             * clear
             * clear files from the memory
             * delete also item.html and item.upload data
             *
             * @namespace files
             * @param {bool} all - delete also appended files?
             * @void
             */
            clear: function (all) {
              var i = 0;

              while (i < f._itFl.length) {
                var a = f._itFl[i];

                if (!all && a.appended) {
                  i++;
                  continue;
                }

                if (a.html) a.html ? f._itFl[i].html.remove() : null;

                if (a.upload && a.upload.$ajax) f.upload.cancel(a);

                f._itFl.splice(i, 1);
              }

              // set feedback caption
              f.set("feedback", null);

              // set listInput value
              f.set("listInput", null);

              // onEmpty callback
              f._itFl.length == 0 && n.onEmpty && $.isFunction(n.onEmpty)
                ? n.onEmpty(l, p, o, s)
                : null;
            },
          },

          /**
           * reset
           * reset the plugin
           *
           * @param {bool} all - remove also appended files?
           * @void
           */
          reset: function (all) {
            if (all) {
              if (f.clipboard._timer) f.clipboard.clean();

              $.each(sl, function (i, a) {
                if (!a.is(s)) a.remove();
              });
              sl = [];
              f.set("input", "");
            }

            f._itRl = [];
            f._pfuL = [];
            f._pfrL = [];
            f.files.clear(all);
          },
          /**
           * destroy
           * destroy the plugin
           *
           * @void
           */
          destroy: function () {
            f.reset(true);
            f.bindUnbindEvents(false);
            s.closest("form").off("reset", f.reset);
            s.removeAttr("style");
            p.before(s);
            delete s.get(0).FileUploader;
            p.remove();
            p = o = l = null;
          },

          /**
           * @namespace _assets
           */
          _assets: {
            toBytes: function (mb) {
              return parseInt(mb) * 1048576;
            },
            bytesToText: function (bytes) {
              if (bytes == 0) return "0 Byte";
              var k = 1024,
                sizes = [
                  "Bytes",
                  "KB",
                  "MB",
                  "GB",
                  "TB",
                  "PB",
                  "EB",
                  "ZB",
                  "YB",
                ],
                i = Math.floor(Math.log(bytes) / Math.log(k)),
                r = bytes / Math.pow(k, i),
                t = false;

              if (r > 1000 && i < 8) {
                i = i + 1;
                r = bytes / Math.pow(k, i);
                t = true;
              }

              return r.toPrecision(t ? 2 : 3) + " " + sizes[i];
            },
            escape: function (str) {
              return ("" + str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
            },
            secondsToText: function (seconds, textFormat) {
              seconds = parseInt(Math.round(seconds), 10);

              var hours = Math.floor(seconds / 3600),
                minutes = Math.floor((seconds - hours * 3600) / 60),
                seconds = seconds - hours * 3600 - minutes * 60,
                result = "";

              if (hours > 0 || !textFormat) {
                result +=
                  (hours < 10 ? "0" : "") + hours + (textFormat ? "h " : ":");
              }
              if (minutes > 0 || !textFormat) {
                result +=
                  (minutes < 10 && !textFormat ? "0" : "") +
                  minutes +
                  (textFormat ? "m " : ":");
              }

              result +=
                (seconds < 10 && !textFormat ? "0" : "") +
                seconds +
                (textFormat ? "s" : "");

              return result;
            },
            pxToRatio: function (width, height) {
              var gcd = function (a, b) {
                  return b == 0 ? a : gcd(b, a % b);
                },
                r = gcd(width, height);

              return [width / r, height / r];
            },
            ratioToPx: function (width, height, ratio) {
              ratio = (ratio + "").split(":");

              if (ratio.length < 2) return null;

              var rWidth = (height / ratio[1]) * ratio[0],
                rHeight = (width / ratio[0]) * ratio[1];

              return [rWidth, rHeight, ratio[0], ratio[1]];
            },
            hasAttr: function (attr, el) {
              var el = !el ? s : el,
                a = el.attr(attr);

              if (!a || typeof a == "undefined") {
                return false;
              } else {
                return true;
              }
            },
            copyAllAttributes: function (newEl, oldEl) {
              $.each(oldEl.get(0).attributes, function () {
                if (
                  this.name == "required" ||
                  this.name == "type" ||
                  this.name == "id"
                )
                  return;

                newEl.attr(this.name, this.value);
              });

              if (oldEl.get(0).FileUploader)
                newEl.get(0).FileUploader = oldEl.get(0).FileUploader;

              return newEl;
            },
            isIntoView: function (el) {
              var windowTop = $(window).scrollTop(),
                windowBottom = windowTop + window.innerHeight,
                elTop = el.offset().top,
                elBottom = elTop + el.outerHeight();

              return windowTop < elTop && windowBottom > elBottom;
            },
            isBlankCanvas: function (canvas) {
              var blank = document.createElement("canvas"),
                result = false;

              blank.width = canvas.width;
              blank.height = canvas.height;
              try {
                result = canvas.toDataURL() == blank.toDataURL();
              } catch (e) {}
              blank = null;

              return result;
            },
            generateFileName: function (extension, prefix) {
              var date = new Date(),
                addZero = function (x) {
                  if (x < 10) x = "0" + x;

                  return x;
                },
                prefix = prefix ? prefix : "",
                extension = extension ? "." + extension : "";

              return (
                prefix +
                date.getFullYear() +
                "-" +
                addZero(date.getMonth() + 1) +
                "-" +
                addZero(date.getDate()) +
                " " +
                addZero(date.getHours()) +
                "-" +
                addZero(date.getMinutes()) +
                "-" +
                addZero(date.getSeconds()) +
                extension
              );
            },
            arrayBufferToBase64: function (buffer) {
              var binary = "",
                bytes = new Uint8Array(buffer);

              for (var i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }

              return window.btoa(binary);
            },
            dataURItoBlob: function (dataURI, type) {
              var byteString = atob(dataURI.split(",")[1]),
                mimeType = dataURI.split(",")[0].split(":")[1].split(";")[0],
                arrayBuffer = new ArrayBuffer(byteString.length),
                _ia = new Uint8Array(arrayBuffer);

              for (var i = 0; i < byteString.length; i++) {
                _ia[i] = byteString.charCodeAt(i);
              }

              var dataView = new DataView(arrayBuffer),
                blob = new Blob([dataView.buffer], { type: type || mimeType });

              return blob;
            },
            getExifOrientation: function (file, callback) {
              var reader = new FileReader(),
                rotation = {
                  1: 0,
                  2: -1,
                  3: 180,
                  4: -180,
                  5: -90,
                  6: 90,
                  7: -270,
                  8: 270,
                };

              reader.onload = function (e) {
                var scanner = new DataView(e.target.result),
                  val = 1;

                if (
                  scanner.byteLength &&
                  scanner.getUint16(0, false) == 0xffd8
                ) {
                  var length = scanner.byteLength,
                    offset = 2;

                  while (offset < length) {
                    if (scanner.getUint16(offset + 2, false) <= 8) break;

                    var uint16 = scanner.getUint16(offset, false);
                    offset += 2;

                    if (uint16 == 0xffe1) {
                      if (scanner.getUint32((offset += 2), false) != 0x45786966)
                        break;

                      var little =
                          scanner.getUint16((offset += 6), false) == 0x4949,
                        tags;

                      offset += scanner.getUint32(offset + 4, little);
                      tags = scanner.getUint16(offset, little);
                      offset += 2;

                      for (var i = 0; i < tags; i++) {
                        if (
                          scanner.getUint16(offset + i * 12, little) == 0x0112
                        ) {
                          val = scanner.getUint16(offset + i * 12 + 8, little);
                          length = 0;
                          break;
                        }
                      }
                    } else if ((uint16 & 0xff00) != 0xff00) {
                      break;
                    } else {
                      offset += scanner.getUint16(offset, false);
                    }
                  }
                }

                callback ? callback(rotation[val] || 0) : null;
              };
              reader.onerror = function () {
                callback ? callback("") : null;
              };
              reader.readAsArrayBuffer(file);
            },
            textParse: function (text, opts, noOptions) {
              opts = noOptions
                ? opts || {}
                : $.extend(
                    {},
                    {
                      limit: n.limit,
                      maxSize: n.maxSize,
                      fileMaxSize: n.fileMaxSize,
                      extensions: n.extensions ? n.extensions.join(", ") : null,
                      captions: n.captions,
                    },
                    opts
                  );

              switch (typeof text) {
                case "string":
                  for (var key in opts) {
                    if (["name", "file", "type", "size"].indexOf(key) > -1)
                      opts[key] = f._assets.escape(opts[key]);
                  }

                  text = text.replace(/\$\{(.*?)\}/g, function (match, a) {
                    var a = a.replace(/ /g, ""),
                      r =
                        typeof opts[a] != "undefined" && opts[a] != null
                          ? opts[a]
                          : "";

                    if (["reader.node"].indexOf(a) > -1) return match;

                    if (a.indexOf(".") > -1 || a.indexOf("[]") > -1) {
                      var x = a.substr(
                          0,
                          a.indexOf(".") > -1
                            ? a.indexOf(".")
                            : a.indexOf("[") > -1
                            ? a.indexOf("[")
                            : a.length
                        ),
                        y = a.substring(x.length);

                      if (opts[x]) {
                        try {
                          r = eval('opts["' + x + '"]' + y);
                        } catch (e) {
                          r = "";
                        }
                      }
                    }

                    r = $.isFunction(r) ? f._assets.textParse(r) : r;

                    return r || "";
                  });
                  break;
                case "function":
                  text = f._assets.textParse(
                    text(opts, l, p, o, s, f._assets.textParse),
                    opts,
                    noOptions
                  );
                  break;
              }

              opts = null;
              return text;
            },
            textToColor: function (str) {
              if (!str || str.length == 0) return false;

              for (
                var i = 0, hash = 0;
                i < str.length;
                hash = str.charCodeAt(i++) + ((hash << 5) - hash)
              );
              for (
                var i = 0, colour = "#";
                i < 3;
                colour += (
                  "00" + ((hash >> (i++ * 2)) & 0xff).toString(16)
                ).slice(-2)
              );
              return colour;
            },
            isBrightColor: function (color) {
              var getRGB = function (b) {
                  var a;
                  if (b && b.constructor == Array && b.length == 3) return b;
                  if (
                    (a = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(
                      b
                    ))
                  )
                    return [parseInt(a[1]), parseInt(a[2]), parseInt(a[3])];
                  if (
                    (a = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(
                      b
                    ))
                  )
                    return [
                      parseFloat(a[1]) * 2.55,
                      parseFloat(a[2]) * 2.55,
                      parseFloat(a[3]) * 2.55,
                    ];
                  if (
                    (a = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(
                      b
                    ))
                  )
                    return [
                      parseInt(a[1], 16),
                      parseInt(a[2], 16),
                      parseInt(a[3], 16),
                    ];
                  if ((a = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(b)))
                    return [
                      parseInt(a[1] + a[1], 16),
                      parseInt(a[2] + a[2], 16),
                      parseInt(a[3] + a[3], 16),
                    ];
                  return typeof colors != "undefined"
                    ? colors[$.trim(b).toLowerCase()]
                    : null;
                },
                luminance_get = function (color) {
                  var rgb = getRGB(color);
                  if (!rgb) return null;
                  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
                };

              return luminance_get(color) > 194;
            },
            keyCompare: function (obj, structure) {
              for (var i = 0; i < structure.length; i++) {
                if (
                  !$.isPlainObject(obj) ||
                  !obj.hasOwnProperty(structure[i])
                ) {
                  throw new Error(
                    'Could not find valid *strict* attribute "' +
                      structure[i] +
                      '" in ' +
                      JSON.stringify(obj, null, 4)
                  );
                }
              }

              return true;
            },
            dialogs: {
              alert: n.dialogs.alert,
              confirm: n.dialogs.confirm,
            },
            hasPlugin: function (name) {
              if (navigator.plugins && navigator.plugins.length)
                for (var key in navigator.plugins) {
                  if (
                    navigator.plugins[key].name &&
                    navigator.plugins[key].name.toLowerCase().indexOf(name) > -1
                  )
                    return true;
                }

              return false;
            },
            isIE: function () {
              return (
                navigator.userAgent.indexOf("MSIE ") > -1 ||
                navigator.userAgent.indexOf("Trident/") > -1 ||
                navigator.userAgent.indexOf("Edge") > -1
              );
            },
            isMobile: function () {
              return (
                typeof window.orientation !== "undefined" ||
                navigator.userAgent.indexOf("IEMobile") !== -1
              );
            },
            getDevice: {
              options: [],
              header: [
                navigator.platform,
                navigator.userAgent,
                navigator.appVersion,
                navigator.vendor,
                window.opera,
              ],
              dataos: [
                {
                  name: "Windows Phone",
                  value: "Windows Phone",
                  version: "OS",
                },
                { name: "Windows", value: "Win", version: "NT" },
                { name: "iPhone", value: "iPhone", version: "OS" },
                { name: "iPad", value: "iPad", version: "OS" },
                { name: "Kindle", value: "Silk", version: "Silk" },
                { name: "Android", value: "Android", version: "Android" },
                { name: "PlayBook", value: "PlayBook", version: "OS" },
                { name: "BlackBerry", value: "BlackBerry", version: "/" },
                { name: "Macintosh", value: "Mac", version: "OS X" },
                { name: "Linux", value: "Linux", version: "rv" },
                { name: "Palm", value: "Palm", version: "PalmOS" },
              ],
              databrowser: [
                { name: "Chrome", value: "Chrome", version: "Chrome" },
                { name: "Firefox", value: "Firefox", version: "Firefox" },
                { name: "Safari", value: "Safari", version: "Version" },
                { name: "Internet Explorer", value: "MSIE", version: "MSIE" },
                { name: "Opera", value: "Opera", version: "Opera" },
                { name: "BlackBerry", value: "CLDC", version: "CLDC" },
                { name: "Mozilla", value: "Mozilla", version: "Mozilla" },
              ],
              init: function () {
                var agent = this.header.join(" "),
                  os = this.matchItem(agent, this.dataos),
                  browser = this.matchItem(agent, this.databrowser);

                return { os: os, browser: browser };
              },
              matchItem: function (string, data) {
                var i = 0,
                  j = 0,
                  html = "",
                  regex,
                  regexv,
                  match,
                  matches,
                  version;

                for (i = 0; i < data.length; i += 1) {
                  regex = new RegExp(data[i].value, "i");
                  match = regex.test(string);
                  if (match) {
                    regexv = new RegExp(
                      data[i].version + "[- /:;]([\\d._]+)",
                      "i"
                    );
                    matches = string.match(regexv);
                    version = "";
                    if (matches) {
                      if (matches[1]) {
                        matches = matches[1];
                      }
                    }
                    if (matches) {
                      matches = matches.split(/[._]+/);
                      for (j = 0; j < matches.length; j += 1) {
                        if (j === 0) {
                          version += matches[j] + ".";
                        } else {
                          version += matches[j];
                        }
                      }
                    } else {
                      version = "0";
                    }
                    return {
                      name: data[i].name,
                      version: parseFloat(version),
                    };
                  }
                }
                return { name: "unknown", version: 0 };
              },
            },
          },

          isSupported: function () {
            return s && s.get(0).files;
          },
          isFileReaderSupported: function () {
            return window.File && window.FileList && window.FileReader;
          },
          isDefaultMode: function () {
            return !n.upload && (!n.addMore || n.limit == 1);
          },
          isAddMoreMode: function () {
            return !n.upload && n.addMore && n.limit != 1;
          },
          isUploadMode: function () {
            return n.upload;
          },

          // fileuploader file list
          _itFl: [],

          // fileuploader file upload pending list
          _pfuL: [],

          // fileuploader file render pending list
          _pfrL: [],

          // disabled
          disabled: false,

          // locked
          locked: false,

          // rendered
          rendered: false,
        };

      // set FileUploader property to the input
      if (n.enableApi) {
        s.get(0).FileUploader = {
          open: function () {
            s.trigger("click");
          },
          getOptions: function () {
            return n;
          },
          getParentEl: function () {
            return p;
          },
          getInputEl: function () {
            return s;
          },
          getNewInputEl: function () {
            return o;
          },
          getListEl: function () {
            return l;
          },
          getListInputEl: function () {
            return n.listInput;
          },
          getFiles: function () {
            return f._itFl;
          },
          getChoosedFiles: function () {
            return f._itFl.filter(function (a) {
              return a.choosed;
            });
          },
          getAppendedFiles: function () {
            return f._itFl.filter(function (a) {
              return a.appended;
            });
          },
          getUploadedFiles: function () {
            return f._itFl.filter(function (a) {
              return a.uploaded;
            });
          },
          getFileList: function (toJson, customKey) {
            return f.files.list(toJson, customKey, true);
          },
          updateFileList: function () {
            f.set("listInput", null);

            return true;
          },
          setOption: function (option, value) {
            n[option] = value;

            return true;
          },
          findFile: function (html) {
            return f.files.find(html);
          },
          add: function (data, type, name) {
            if (!f.isUploadMode()) return false;

            var blob;
            if (data instanceof Blob) {
              blob = data;
            } else {
              var dataURI = /data:[a-z]+\/[a-z]+\;base64\,/.test(data)
                ? data
                : "data:" + type + ";base64," + btoa(data);

              blob = f._assets.dataURItoBlob(dataURI, type);
            }
            blob._name =
              name ||
              f._assets.generateFileName(
                blob.type.indexOf("/") != -1
                  ? blob.type.split("/")[1].toString().toLowerCase()
                  : "File "
              );

            f.onChange(null, [blob]);

            return true;
          },
          append: function (files) {
            return f.files.append(files);
          },
          update: function (item, data) {
            return f.files.update(item, data);
          },
          remove: function (item) {
            item = item.jquery ? f.files.find(item) : item;

            if (f._itFl.indexOf(item) > -1) {
              f.files.remove(item);
              return true;
            }

            return false;
          },
          uploadStart: function () {
            var choosedFiles = this.getChoosedFiles() || [];

            if (
              f.isUploadMode() &&
              choosedFiles.length > 0 &&
              !choosedFiles[0].uploaded
            ) {
              for (var i = 0; i < choosedFiles.length; i++) {
                f.upload.send(choosedFiles[i]);
              }
            }
          },
          reset: function () {
            f.reset(true);
            return true;
          },
          disable: function (lock) {
            f.set("disabled", true);
            if (lock) f.locked = true;
            return true;
          },
          enable: function () {
            f.set("disabled", false);
            f.locked = false;
            return true;
          },
          destroy: function () {
            f.destroy();
            return true;
          },
          isEmpty: function () {
            return f._itFl.length == 0;
          },
          isDisabled: function () {
            return f.disabled;
          },
          isRendered: function () {
            return f.rendered;
          },
          assets: f._assets,
          getPluginMode: function () {
            if (f.isDefaultMode()) return "default";

            if (f.isAddMoreMode()) return "addMore";

            if (f.isUploadMode()) return "upload";
          },
        };
      }

      // initialize the plugin
      f.init();

      return this;
    });
  };

  $.fileuploader = {
    getInstance: function (input) {
      var $input = input.prop ? input : $(input);
      return $input.length ? $input.get(0).FileUploader : null;
    },
  };

  $.fn.fileuploader.languages = {
    cz: {
      button: function (options) {
        return "Procházet " + (options.limit == 1 ? "soubor" : "soubory");
      },
      feedback: function (options) {
        return (
          "Vyberte " +
          (options.limit == 1 ? "soubor" : "soubory") +
          ", který chcete nahrát"
        );
      },
      feedback2: function (options) {
        return (
          options.length +
          " " +
          (options.length > 1 ? "vybráno souborů" : "vybrán soubor")
        );
      },
      confirm: "Potvrdit",
      cancel: "Zrušeni",
      name: "Jméno",
      type: "Format",
      size: "Velikost",
      dimensions: "Rozměry",
      duration: "Trvání",
      crop: "Oříznout",
      rotate: "Otočit",
      sort: "Roztřídit",
      open: "Otevřít",
      download: "Stáhnout",
      remove: "Odstranit",
      drop: "Pro nahrání přetahněte soubor sem",
      paste:
        '<div class="fileuploader-pending-loader"></div> Vkládání souboru, klikněte zde pro zrušeni',
      removeConfirmation: "Jste si jisti, že chcete odstranit tento soubor?",
      errors: {
        filesLimit: function (options) {
          return (
            "Pouze ${limit} " +
            (options.limit == 1
              ? "soubor může být nahrán"
              : "soubory mohou byt nahrané") +
            "."
          );
        },
        filesType: "Pouze ${extensions} soubory mohou byt nahrané.",
        fileSize:
          "${name} příliš velký! Prosím, vyberte soubor do velikosti ${fileMaxSize} MB.",
        filesSizeAll:
          "Vybraný soubor je příliš velký! Prosím, vyberte soubor do velikosti ${maxSize} MB.",
        fileName: "Soubor s tímto názvem  ${name} byl už vybran.",
        remoteFile: "Vzdálené soubory nejsou povoleny.",
        folderUpload: "Složky nejsou povolené.",
      },
    },
    de: {
      button: function (options) {
        return (options.limit == 1 ? "Datei" : "Dateien") + " durchsuchen";
      },
      feedback: function (options) {
        return (
          (options.limit == 1 ? "Datei" : "Dateien") +
          " zum Hochladen auswählen"
        );
      },
      feedback2: function (options) {
        return (
          options.length +
          " " +
          (options.length == 1 ? "Datei" : "Dateien") +
          " ausgewählt"
        );
      },
      confirm: "Speichern",
      cancel: "Schließen",
      name: "Name",
      type: "Typ",
      size: "Größe",
      dimensions: "Format",
      duration: "Länge",
      crop: "Crop",
      rotate: "Rotieren",
      sort: "Sortieren",
      open: "Öffnen",
      download: "Herunterladen",
      remove: "Löschen",
      drop: "Die Dateien hierher ziehen, um sie hochzuladen",
      paste:
        '<div class="fileuploader-pending-loader"></div> Eine Datei wird eingefügt. Klicken Sie hier zum abzubrechen',
      removeConfirmation: "Möchten Sie diese Datei wirklich löschen?",
      errors: {
        filesLimit: function (options) {
          return (
            "Nur ${limit} " +
            (options.limit == 1 ? "Datei darf" : "Dateien dürfen") +
            " hochgeladen werden."
          );
        },
        filesType: "Nur ${extensions} Dateien dürfen hochgeladen werden.",
        fileSize:
          "${name} ist zu groß! Bitte wählen Sie eine Datei bis zu ${fileMaxSize} MB.",
        filesSizeAll:
          "Die ausgewählten Dateien sind zu groß! Bitte wählen Sie Dateien bis zu ${maxSize} MB.",
        fileName:
          "Eine Datei mit demselben Namen ${name} ist bereits ausgewählt.",
        remoteFile: "Remote-Dateien sind nicht zulässig.",
        folderUpload: "Ordner sind nicht erlaubt.",
      },
    },
    dk: {
      button: function (options) {
        return "Gennemse " + (options.limit == 1 ? "fil" : "filer");
      },
      feedback: function (options) {
        return "Vælg " + (options.limit == 1 ? "fil" : "filer") + " til upload";
      },
      feedback2: function (options) {
        return (
          options.length +
          " " +
          (options.length == 1 ? "fil" : "filer") +
          " er valgt"
        );
      },
      confirm: "Bekræft",
      cancel: "Fortrydl",
      name: "Navn",
      type: "Type",
      size: "Størrelse",
      dimensions: "Dimensioner",
      duration: "Varighed’",
      crop: "Tilpas",
      rotate: "Rotér",
      sort: "Sorter",
      open: "Åben",
      download: "Hent",
      remove: "Slet",
      drop: "Drop filer her til upload",
      paste: "Overfør fil, klik her for at afbryde",
      removeConfirmation: "Er du sikker på, du ønsker at slette denne fil?",
      errors: {
        filesLimit: function (options) {
          return (
            "Du kan kun uploade ${limit} " +
            (options.limit == 1 ? "fil" : "filer") +
            " ad gangen."
          );
        },
        filesType: "Det er kun tilladt at uploade ${extensions} filer.",
        fileSize:
          "${name} er for stor! Vælg venligst en fil på højst ${fileMaxSize} MB.",
        filesSizeAll:
          "De valgte filer er for store! Vælg venligst filer op til ${maxSize} MB ialt.",
        fileName: "Du har allerede valgt en fil med navnet ${name}.",
        remoteFile: "Fremmede filer er ikke tilladt.",
        folderUpload: "Mapper er ikke tilladt.",
      },
    },
    en: {
      button: function (options) {
        return "Browse " + (options.limit == 1 ? "file" : "files");
      },
      feedback: function (options) {
        return (
          "Choose " + (options.limit == 1 ? "file" : "files") + " to upload"
        );
      },
      feedback2: function (options) {
        return (
          options.length +
          " " +
          (options.length > 1 ? " files were" : " file was") +
          " chosen"
        );
      },
      confirm: "Confirm",
      cancel: "Cancel",
      name: "Name",
      type: "Type",
      size: "Size",
      dimensions: "Dimensions",
      duration: "Duration",
      crop: "Crop",
      rotate: "Rotate",
      sort: "Sort",
      open: "Open",
      download: "Download",
      remove: "Delete",
      drop: "Drop the files here to upload",
      paste:
        '<div class="fileuploader-pending-loader"></div> Pasting a file, click here to cancel',
      removeConfirmation: "Are you sure to delete this file ?",
      errors: {
        filesLimit: function (options) {
          return (
            "Only ${limit} " +
            (options.limit == 1 ? "file" : "files") +
            " can be uploaded."
          );
        },
        filesType: "Only ${extensions} files are allowed to be uploaded.",
        fileSize:
          "${name} is too large! Please choose a file up to ${fileMaxSize} MB.",
        filesSizeAll:
          "The chosen files are too large! Please select files up to ${maxSize} MB.",
        fileName: "A file with the same name ${name} is already selected.",
        remoteFile: "Remote files are not allowed.",
        folderUpload: "Folders are not allowed.",
      },
    },
    es: {
      button: function (options) {
        return "Examinar " + (options.limit == 1 ? "archivo" : "archivos");
      },
      feedback: function (options) {
        return (
          "Selecciona " +
          (options.limit == 1 ? "archivos" : "archivos") +
          " para subir"
        );
      },
      feedback2: function (options) {
        return (
          options.length +
          " " +
          (options.length > 1
            ? "archivos seleccionados"
            : "archivo seleccionado")
        );
      },
      confirm: "Guardar",
      cancel: "Anular",
      name: "Nombre",
      type: "Tipo",
      size: "Tamaño",
      dimensions: "Dimensiones",
      duration: "Duracion",
      crop: "Corta",
      rotate: "Rotar",
      sort: "Ordenar",
      open: "Abierto",
      download: "Descargar",
      remove: "Eliminar",
      drop: "Suelta los archivos aquí para subirlos",
      paste:
        '<div class="fileuploader-pending-loader"></div> Pegar un archivo, haga clic aquí para cancelar',
      removeConfirmation: "¿Estás seguro de que deseas eliminar este archivo?",
      errors: {
        filesLimit: function (options) {
          return (
            "Solo se pueden seleccionar ${limit} " +
            (options.limit == 1 ? "archivo" : "archivos") +
            "."
          );
        },
        filesType: "Solo se pueden seleccionar archivos ${extensions}.",
        fileSize:
          "${name} es demasiado grande! Por favor, seleccione un archivo hasta ${fileMaxSize} MB.",
        filesSizeAll:
          "¡Los archivos seleccionados son demasiado grandes! Por favor seleccione archivos de hasta ${maxSize} MB.",
        fileName:
          "Un archivo con el mismo nombre ${name} ya está seleccionado.",
        remoteFile: "Los archivos remotos no están permitidos.",
        folderUpload: "No se permiten carpetas.",
      },
    },
    fr: {
      button: function (options) {
        return (
          "Parcourir " + (options.limit == 1 ? "le fichier" : "les fichiers")
        );
      },
      feedback: function (options) {
        return (
          "Choisir " +
          (options.limit == 1 ? "le fichier " : "les fichiers") +
          " à télécharger"
        );
      },
      feedback2: function (options) {
        return (
          options.length +
          " " +
          (options.length > 1
            ? "fichiers ont été choisis"
            : "fichier a été choisi")
        );
      },
      confirm: "Confirmer",
      cancel: "Annuler",
      name: "Nom",
      type: "Type",
      size: "Taille",
      dimensions: "Dimensions",
      duration: "Durée",
      crop: "Recadrer",
      rotate: "Pivoter",
      sort: "Trier",
      download: "Télécharger",
      remove: "Supprimer",
      drop: "Déposez les fichiers ici pour les télécharger",
      paste:
        '<div class="fileuploader-pending-loader"></div> Collant un fichier, cliquez ici pour annuler.',
      removeConfirmation: "Êtes-vous sûr de vouloir supprimer ce fichier ?",
      errors: {
        filesLimit: "Seuls les fichiers ${limit} peuvent être téléchargés.",
        filesType: "Seuls les fichiers ${extensions} peuvent être téléchargés.",
        fileSize: "${name} est trop lourd, la limite est de ${fileMaxSize} MB.",
        filesSizeAll:
          "Les fichiers que vous avez choisis sont trop lourd, la limite totale est de ${maxSize} MB.",
        fileName: "Le fichier portant le nom ${name} est déjà sélectionné.",
        folderUpload: "Vous n'êtes pas autorisé à télécharger des dossiers.",
      },
    },
    it: {
      button: function (options) {
        return "Sfoglia" + (options.limit == 1 ? "il file" : "i file");
      },
      feedback: function (options) {
        return (
          "Seleziona " +
          (options.limit == 1 ? "file" : "i file") +
          " per caricare"
        );
      },
      feedback2: function (options) {
        return (
          options.length +
          " " +
          (options.length > 1 ? "i file sono scelti" : "il file è scelto")
        );
      },
      confirm: "Conferma",
      cancel: "Cancella",
      name: "Nome",
      type: "Tipo file",
      size: "Dimensione file",
      dimensions: "Dimensioni",
      duration: "Durata",
      crop: "Taglia",
      rotate: "Ruota",
      sort: "Ordina",
      open: "Apri",
      download: "Scarica",
      remove: "Elimina",
      drop: "Posiziona il file qui per caricare",
      paste:
        '<div class="fileuploader-pending-loader"></div> Incolla file, clicca qui per cancellare',
      removeConfirmation: "Sei sicuro di voler eliminare il file?",
      errors: {
        filesLimit: "Solo ${limit} file possono essere caricati.",
        filesType: "Solo ${extensions} file possono essere caricati.",
        fileSize:
          "${name} è troppo grande! Scegli un file fino a ${fileMaxSize} MB.",
        filesSizeAll:
          "I file selezioni sono troppo grandi! Scegli un file fino a ${maxSize} MB.",
        fileName: "Un file con lo stesso nome ${name} è già selezionato.",
        remoteFile: "I file remoti non sono consentiti.",
        folderUpload: "Le cartelle non sono consentite.",
      },
    },
    lv: {
      button: function (options) {
        return "Izvēlieties " + (options.limit == 1 ? "fails" : "faili");
      },
      feedback: function (options) {
        return (
          "Izvēliejaties " +
          (options.limit == 1 ? "fails" : "faili") +
          " lejupielādēt"
        );
      },
      feedback2: function (options) {
        return (
          options.length +
          " " +
          (options.length > 1 ? "failus izvelēts" : "fails izvēlēts")
        );
      },
      confirm: "Saglabāt",
      cancel: "Atcelt",
      name: "Vārds",
      type: "Formāts",
      size: "Izmērs",
      dimensions: "Izmēri",
      duration: "Ilgums",
      crop: "Nogriezt",
      rotate: "Pagriezt",
      sort: "Kārtot",
      open: "Atvērt",
      download: "Lejupielādēt",
      remove: "Dzēst",
      drop: "Lai augšupielādētu, velciet failus šeit",
      paste:
        '<div class="fileuploader-pending-loader"></div> Ievietojiet failu, noklikšķiniet šeit, lai atceltu',
      removeConfirmation: "Vai tiešām vēlaties izdzēst šo failu?",
      errors: {
        filesLimit: function (options) {
          return (
            "Tikai ${limit} " +
            (options.limit == 1
              ? "failu var augšupielādēt"
              : "failus var augšupielādēt") +
            "."
          );
        },
        filesType: "Tikai ${extensions} failus var augšupielādēt.",
        fileSize:
          "${name} ir par lielu! Lūdzu, atlasiet failu līdz ${fileMaxSize} MB.",
        filesSizeAll:
          "Atlasītie faili ir pārāk lieli! Lūdzu, atlasiet failus līdz ${maxSize} MB.",
        fileName: "Fails ar tādu pašu nosaukumu ${name} jau ir atlasīts.",
        remoteFile: "Attālie faili nav atļauti.",
        folderUpload: "Mapes nav atļautas.",
      },
    },
    nl: {
      button: function (options) {
        return (options.limit == 1 ? "Bestand" : "Bestanden") + " kiezen";
      },
      feedback: function (options) {
        return (
          "Kies " +
          (options.limit == 1 ? "een bestand" : "bestanden") +
          " om te uploaden"
        );
      },
      feedback2: function (options) {
        return (
          options.length +
          " " +
          (options.length > 1 ? "bestanden" : "bestand") +
          " gekozen"
        );
      },
      confirm: "Opslaan",
      cancel: "Annuleren",
      name: "Naam",
      type: "Type",
      size: "Grootte",
      dimensions: "Afmetingen",
      duration: "Duur",
      crop: "Uitsnijden",
      rotate: "Draaien",
      sort: "Sorteren",
      open: "Open",
      download: " Downloaden",
      remove: "Verwijderen",
      drop: "Laat de bestanden hier vallen om te uploaden",
      paste:
        '<div class="fileuploader-pending-loader"></div> Een bestand wordt geplakt, klik hier om te annuleren',
      removeConfirmation: "Weet u zeker dat u dit bestand wilt verwijderen?",
      errors: {
        filesLimit: function (options) {
          return (
            "Er " +
            (options.limit == 1 ? "mag" : "mogen") +
            " slechts ${limit} " +
            (options.limit == 1 ? "bestand" : "bestanden") +
            " worden geüpload."
          );
        },
        filesType: "Alleen ${extensions} mogen worden geüpload.",
        fileSize:
          "${name} is te groot! Kies een bestand tot ${fileMaxSize} MB.",
        filesSizeAll:
          "De gekozen bestanden zijn te groot! Kies bestanden tot ${maxSize} MB.",
        fileName: "Een bestand met dezelfde naam ${name} is al gekozen.",
        remoteFile: "Externe bestanden zijn niet toegestaan.",
        folderUpload: "Mappen zijn niet toegestaan.",
      },
    },
    pl: {
      button: function (options) {
        return "Wybierz " + (options.limit == 1 ? "plik" : "pliki");
      },
      feedback: function (options) {
        return (
          "Wybierz " +
          (options.limit == 1 ? "plik" : "pliki") +
          " do przesłania"
        );
      },
      feedback2: function (options) {
        return (
          options.length +
          " " +
          (options.length > 1 ? "pliki zostały wybrane" : "plik został wybrany")
        );
      },
      confirm: "Potwierdź",
      cancel: "Anuluj",
      name: "Nazwa",
      type: "Typ",
      size: "Rozmiar",
      dimensions: "Wymiary",
      duration: "Czas trwania",
      crop: "Przytnij",
      rotate: "Obróć",
      sort: "Sortuj",
      open: "Otwórz",
      download: "Pobierz",
      remove: "Usuń",
      drop: "Upuść pliki tutaj do przesłania",
      paste:
        '<div class="fileuploader-pending-loader"></div> Wklejając plik, kliknij tutaj, aby anulować',
      removeConfirmation: "Czy jesteś pewien, że chcesz usunąć ten plik?",
      errors: {
        filesLimit: function (options) {
          return (
            "Tylko ${limit} " +
            (options.limit == 1 ? "plik" : "pliki") +
            " można wybrać."
          );
        },
        filesType: "Tylko pliki ${extensions} mogą zostać pobrane.",
        fileSize:
          "Plik ${name} jest za duży! Proszę wybrać plik do ${fileMaxSize} MB.",
        filesSizeAll:
          "Wybrane pliki są za duże! Proszę wybrać pliki do  ${maxSize} MB.",
        fileName: ", Plik o tej samej nazwie ${name} już został wybrany.",
        remoteFile: "Zdalne pliki nie są dozwolone.",
        folderUpload: "Foldery nie są dozwolone.",
      },
    },
    pt: {
      button: function (options) {
        return "Escolher " + (options.limit == 1 ? "arquivo" : "arquivos");
      },
      feedback: function (options) {
        return (
          "Escolha " +
          (options.limit == 1 ? "arquivo" : "arquivos") +
          " a carregar"
        );
      },
      feedback2: function (options) {
        return (
          options.length +
          " " +
          (options.length > 1
            ? "arquivos foram escolhidos"
            : "arquivo foi escolhido")
        );
      },
      confirm: "Confirmar",
      cancel: "Cancelar",
      name: "Nome",
      type: "Tipo",
      size: "Tamanho",
      dimensions: "Dimensões",
      duration: "Duração",
      crop: "Recorte",
      rotate: "Girar",
      sort: "Ordenar",
      open: "Abrir",
      download: "Baixar",
      remove: "Excluir",
      drop: "Solte os arquivos aqui para fazer o upload",
      paste:
        '<div class="fileuploader-pending-loader"></div> Colando um arquivo, clique aqui para cancelar',
      removeConfirmation: "Tem certeza de que deseja excluir este arquivo?",
      errors: {
        filesLimit: function (options) {
          return (
            "Apenas ${limit} " +
            (options.limit == 1
              ? "arquivo a ser carregado"
              : "arquivos a serem carregados") +
            "."
          );
        },
        filesType: "Somente arquivos ${extensions} podem ser carregados.",
        fileSize:
          "${name} é muito grande! Selecione um arquivo de até ${fileMaxSize} MB.",
        filesSizeAll:
          "Os arquivos selecionados são muito grandes! Selecione arquivos de até ${maxSize} MB.",
        fileName: "Um arquivo com o mesmo nome ${name} já está selecionado.",
        remoteFile: "Arquivos remotos não são permitidos.",
        folderUpload: "Pastas não são permitidas.",
      },
    },
    ro: {
      button: function (options) {
        return "Atașează " + (options.limit == 1 ? "fișier" : "fișiere");
      },
      feedback: function (options) {
        return (
          "Selectează " +
          (options.limit == 1 ? "fișier" : "fișiere") +
          " pentru încărcare"
        );
      },
      feedback2: function (options) {
        return (
          options.length +
          " " +
          (options.length > 1 ? " fișiere" : " fișier") +
          " selectate"
        );
      },
      confirm: "Confirmă",
      cancel: "Anulează",
      name: "Nume",
      type: "Tip",
      size: "Mărimea",
      dimensions: "Dimensiunea",
      duration: "Durata",
      crop: "Crop",
      rotate: "Rotire",
      sort: "Sortare",
      open: "Deschide",
      download: "Download",
      remove: "Șterge",
      drop: "Aruncați fișierele aici pentru a le încărca",
      paste:
        '<div class="fileuploader-pending-loader"></div> Se atașează fișier, faceți click aici pentru anulare',
      removeConfirmation: "Sigur doriți să ștergeți acest fișier?",
      errors: {
        filesLimit: function (options) {
          return (
            "Doar ${limit} " +
            (options.limit == 1
              ? "fișier poate fi selectat"
              : "fișiere pot fi selectat") +
            "."
          );
        },
        filesType: "Doar fișierele ${extensions} pot fi încărcate.",
        fileSize:
          "${name} este prea mare! Vă rugăm să selectați un fișier până la ${fileMaxSize} MB.",
        filesSizeAll:
          "Fișierele selectate sunt prea mari! Vă rugăm să selectați fișiere până la ${maxSize} MB.",
        fileName: "Fișierul cu același numele ${nume} a fost deja selectat.",
        remoteFile: "Fișierele remote nu sunt permise.",
        folderUpload: "Folderele nu sunt permise.",
      },
    },
    ru: {
      button: function (options) {
        return "Выбрать " + (options.limit == 1 ? "файл" : "файлы");
      },
      feedback: function (options) {
        return (
          "Выберите " +
          (options.limit == 1 ? "файл" : "файлы") +
          " для загрузки"
        );
      },
      feedback2: function (options) {
        return (
          options.length +
          " " +
          (options.length > 1 ? "файлов выбрано" : "файл выбран")
        );
      },
      confirm: "Сохранить",
      cancel: "Отмена",
      name: "Имя",
      type: "Формат",
      size: "Размер",
      dimensions: "Размеры",
      duration: "Длительность",
      crop: "Обрезать",
      rotate: "Повернуть",
      sort: "Сортировть",
      open: "Открыть",
      download: "Скачать",
      remove: "Удалить",
      drop: "Перетащите файлы сюда для загрузки",
      paste:
        '<div class="fileuploader-pending-loader"></div> Вставка файла, нажмите здесь, чтобы отменить',
      removeConfirmation: "Вы уверены, что хотите удалить этот файл?",
      errors: {
        filesLimit: function (options) {
          return (
            "Только ${limit} " +
            (options.limit == 1
              ? "файл может быть загружен"
              : "файлов могут быть загружены") +
            "."
          );
        },
        filesType: "Только ${extensions} файлы могут быть загружены.",
        fileSize:
          "${name} слишком большой! Пожалуйста, выберите файл до ${fileMaxSize} МБ.",
        filesSizeAll:
          "Выбранные файлы слишком большие! Пожалуйста, выберите файлы до ${maxSize} МБ.",
        fileName: "Файл с таким именем ${name} уже выбран.",
        remoteFile: "Удаленные файлы не допускаются.",
        folderUpload: "Папки не допускаются.",
      },
    },
    tr: {
      button: function (options) {
        return (options.limit == 1 ? "Dosya" : "Dosyaları") + " seç";
      },
      feedback: function (options) {
        return (
          "Yüklemek istediğiniz " +
          (options.limit == 1 ? "dosyayı" : "dosyaları") +
          " seçin."
        );
      },
      feedback2: function (options) {
        return (
          options.length +
          " " +
          (options.length > 1 ? "dosyalar" : "dosya") +
          " seçildi."
        );
      },
      confirm: "Onayla",
      cancel: "İptal",
      name: "İsim",
      type: "Tip",
      size: "Boyut",
      dimensions: "Boyutlar",
      duration: "Süre",
      crop: "Kırp",
      rotate: "Döndür",
      sort: "Sırala",
      open: "Aç",
      download: "İndir",
      remove: "Sil",
      drop: "Yüklemek için dosyaları buraya bırakın",
      paste:
        '<div class="fileuploader-pending-loader"></div> Bir dosyayı yapıştırmak veya iptal etmek için buraya tıklayın',
      removeConfirmation: "Bu dosyayı silmek istediğinizden emin misiniz?",
      errors: {
        filesLimit: function (options) {
          return (
            "Sadece ${limit} " +
            (options.limit == 1 ? "dosya" : "dosyalar") +
            " yüklenmesine izin verilir."
          );
        },
        filesType: "Sadece ${extensions} dosyaların yüklenmesine izin verilir.",
        fileSize:
          "${name} çok büyük! Lütfen ${fileMaxSize} MB'a kadar bir dosya seçin.",
        filesSizeAll:
          "Seçilen dosyalar çok büyük! Lütfen ${maxSize} MB'a kadar dosyaları seçin",
        fileName: "Aynı ada sahip bir dosya ${name} zaten seçilmiştir.",
        remoteFile: "Uzak dosyalara izin verilmez.",
        folderUpload: "Klasörlere izin verilmez.",
      },
    },
  };

  $.fn.fileuploader.defaults = {
    limit: null,
    maxSize: null,
    fileMaxSize: null,
    extensions: null,
    disallowedExtensions: null,
    changeInput: true,
    inputNameBrackets: true,
    theme: "default",
    thumbnails: {
      box:
        '<div class="fileuploader-items">' +
        '<ul class="fileuploader-items-list"></ul>' +
        "</div>",
      boxAppendTo: null,
      item:
        '<li class="fileuploader-item">' +
        '<div class="columns">' +
        '<div class="column-thumbnail">${image}<span class="fileuploader-action-popup"></span></div>' +
        '<div class="column-title">' +
        '<div title="${name}">${name}</div>' +
        // '<span>${size2}</span>' +
        "</div>" +
        '<div class="column-actions">' +
        '<a href="${url}" class="mr-1" title="${captions.download}" download><button type="button" class="btn  btn-primary"><i class="fileuploader-icon-download"></i></button></a>' +
        '<button type="button" class="btn btn-danger btn-remove" title="${captions.remove}"><i class="fileuploader-icon-trash" style="margin-right: unset !important;"></i></i></button>' +
        "</div>" +
        "</div>" +
        '<div class="progress-bar2">${progressBar}<span></span></div>' +
        "</li>",
      item2:
        '<li class="fileuploader-item">' +
        '<div class="columns">' +
        '<div class="column-thumbnail">${image}<span class="fileuploader-action-popup"></span></div>' +
        '<div class="column-title">' +
        '<a href="${file}" target="_blank">' +
        '<div title="${name}">${name}</div>' +
        // '<span>${size2}</span>' +
        "</a>" +
        "</div>" +
        '<div class="column-actions">' +
        '<a href="${data.url}" class="mr-1" title="${captions.download}" download><button type="button" class="btn  btn-primary"><i class="fileuploader-icon-download"></i></button></a>' +
        '<button type="button" class="btn btn-danger btn-remove" title="${captions.remove}"><i class="fileuploader-icon-trash" style="margin-right: unset !important;"></i></button>' +
        "</div>" +
        "</div>" +
        "</li>",

      popup: {
        container: "body",
        loop: true,
        arrows: true,
        zoomer: true,
        template: function (data) {
          if (data.data.url) {
            data.url = data.data.url;
          }
          return (
            '<div class="fileuploader-popup-preview">' +
            '<button type="button" class="fileuploader-popup-move" data-action="prev"><i class="fileuploader-icon-arrow-left"></i></button>' +
            '<div class="fileuploader-popup-node node-${format}">' +
            "${reader.node}" +
            "</div>" +
            '<div class="fileuploader-popup-content">' +
            '<div class="fileuploader-popup-footer" style="padding: 1rem;">' +
            '<ul class="fileuploader-popup-tools">' +
            (data.format == "image" && data.reader.node && data.editor
              ? (data.editor.cropper
                  ? "<li>" +
                    '<button type="button" data-action="crop">' +
                    '<i class="fileuploader-icon-crop"></i> ${captions.crop}' +
                    "</button>" +
                    "</li>"
                  : "") +
                (data.editor.rotate
                  ? "<li>" +
                    '<button type="button" data-action="rotate-cw">' +
                    '<i class="fileuploader-icon-rotate"></i> ${captions.rotate}' +
                    "</button>" +
                    "</li>"
                  : "")
              : "") +
            // (data.format == 'image' ?
            //     '<li class="fileuploader-popup-zoomer">' +
            //     '<button type="button" data-action="zoom-out">&minus;</button>' +
            //     '<input type="range" min="0" max="100">' +
            //     '<button type="button" data-action="zoom-in">&plus;</button>' +
            //     '<span></span> ' +
            //     '</li>' : ''
            // ) +
            (data.url
              ? "<li>" +
                // '<a href="' + data.url + '" data-action="open" target="_blank">' +
                // '<i class="fileuploader-icon-external"></i> ${captions.open}' +
                // '</a>' +
                '<a href="' +
                data.url +
                '" class="mr-1" title="Download" download=""><button type="button" class="btn btn-primary"><i class="fileuploader-icon-download"></i></button></a>' +
                "</li>"
              : "") +
            // '<li style="margin-left: unset !important;">' +
            // '<button type="button" data-action="remove" title="Remove" class="btn  btn-danger btn-remove" style="padding: 0.25rem 0.5rem !important;">' +
            // '<i class="fileuploader-icon-trash" style="margin-right: unset !important;"></i>' +
            // "</button>" +
            // "</li>" +
            "</ul>" +
            "</div>" +
            '<div class="fileuploader-popup-header">' +
            '<ul class="fileuploader-popup-meta">' +
            "<li>" +
            "<span>${captions.name}:</span>" +
            "<h5>${name}</h5>" +
            "</li>" +
            "<li>" +
            "<span>${captions.type}:</span>" +
            "<h5>${extension.toUpperCase()}</h5>" +
            "</li>" +
            "<li>" +
            // '<span>${captions.size}:</span>' +
            // '<h5>${size2}</h5>' +
            "</li>" +
            (data.reader && data.reader.width
              ? "<li>" +
                "<span>${captions.dimensions}:</span>" +
                "<h5>${reader.width}x${reader.height}px</h5>" +
                "</li>"
              : "") +
            (data.reader && data.reader.duration
              ? "<li>" +
                "<span>${captions.duration}:</span>" +
                "<h5>${reader.duration2}</h5>" +
                "</li>"
              : "") +
            "</ul>" +
            '<div class="fileuploader-popup-info"></div>' +
            '<ul class="fileuploader-popup-buttons">' +
            '<li><button type="button" class="fileuploader-popup-button" data-action="cancel">${captions.cancel}</a></li>' +
            (data.editor
              ? '<li><button type="button" class="fileuploader-popup-button button-success" data-action="save">${captions.confirm}</button></li>'
              : "") +
            "</ul>" +
            "</div>" +
            "</div>" +
            '<button type="button" class="fileuploader-popup-move" data-action="next"><i class="fileuploader-icon-arrow-right"></i></button>' +
            "</div>"
          );
        },
        onShow: function (item) {
          item.popup.html
            .on("click", '[data-action="remove"]', function (e) {
              item.popup.close();
              item.remove();
            })
            .on("click", '[data-action="cancel"]', function (e) {
              item.popup.close();
            })
            .on("click", '[data-action="save"]', function (e) {
              if (item.editor) item.editor.save();
              if (item.popup.close) item.popup.close();
            });
        },
        onHide: null,
      },
      itemPrepend: false,
      removeConfirmation: true,
      startImageRenderer: true,
      synchronImages: true,
      useObjectUrl: false,
      canvasImage: true,
      videoThumbnail: true,
      pdf: true,
      exif: true,
      touchDelay: 0,
      _selectors: {
        list: ".fileuploader-items-list",
        item: ".fileuploader-item",
        start: ".fileuploader-action-start",
        retry: ".fileuploader-action-retry",
        remove: ".btn-remove",
        sorter: ".fileuploader-action-sort",
        rotate: ".fileuploader-action-rotate",
        popup: ".fileuploader-popup-preview",
        popup_open: ".column-title",
      },
      beforeShow: null,
      onItemShow: null,
      onItemRemove: function (html) {
        html.children().animate({ opacity: 0 }, 200, function () {
          setTimeout(function () {
            html.slideUp(200, function () {
              html.remove();
            });
          }, 100);
        });
      },
      onImageLoaded: null,
    },
    editor: false,
    sorter: false,
    reader: {
      thumbnailTimeout: 5000,
      timeout: 12000,
      maxSize: 20,
    },
    files: null,
    upload: {
      // upload URL {String}
      url: "upload.php",

      // upload data {null, Object}
      // you can also change this Object in beforeSend callback
      // example: { option_1: '1', option_2: '2' }
      data: null,

      // upload type {String}
      // for more details http://api.jquery.com/jquery.ajax/
      type: "POST",

      // upload enctype {String}
      // for more details http://api.jquery.com/jquery.ajax/
      enctype: "multipart/form-data",

      // auto-start file upload {Boolean}
      // if false, you can use the API methods - item.upload.send() to trigger upload for each file
      // if false, you can use the upload button - check custom file name example
      start: true,

      // upload the files synchron {Boolean}
      synchron: true,

      // upload large files in chunks {false, Number}
      // set file chunk size in MB as Number (ex: 4)
      chunk: false,

      // Callback fired before uploading a file
      // by returning false, you can prevent the upload
      beforeSend: function (item, listEl, parentEl, newInputEl, inputEl) {
        // example:
        // here you can extend the upload data
        item.upload.data.new_data_attribute = "new_data_value";

        // example:
        // here you can create upload headers
        item.upload.headers = {
          Authorization: "Basic " + btoa(username + ":" + password),
        };

        return true;
      },

      // Callback fired if the upload succeeds
      // we will add by default a success icon and fadeOut the progressbar
      onSuccess: function (
        data,
        item,
        listEl,
        parentEl,
        newInputEl,
        inputEl,
        textStatus,
        jqXHR
      ) {
        item.html
          .find(".fileuploader-action-remove")
          .addClass("fileuploader-action-success");
        setTimeout(function () {
          item.html.find(".progress-bar2").fadeOut(400);
        }, 400);
      },

      // Callback fired if the upload failed
      // we will set by default the progressbar to 0% and if it wasn't cancelled, we will add a retry button
      onError: function (
        item,
        listEl,
        parentEl,
        newInputEl,
        inputEl,
        jqXHR,
        textStatus,
        errorThrown
      ) {
        var progressBar = item.html.find(".progress-bar2");

        if (progressBar.length > 0) {
          progressBar.find("span").html(0 + "%");
          progressBar.find(".fileuploader-progressbar .bar").width(0 + "%");
          item.html.find(".progress-bar2").fadeOut(400);
        }

        item.upload.status != "cancelled" &&
        item.html.find(".fileuploader-action-retry").length == 0
          ? item.html
              .find(".column-actions")
              .prepend(
                '<a class="fileuploader-action fileuploader-action-retry" title="Retry"><i></i></a>'
              )
          : null;
      },

      // Callback fired while upload the file
      // we will set by default the progressbar width and percentage
      /* data = {
                loaded: ...,
                loadedInFormat: ...,
                total: ...,
                totalInFormat: ...,
                percentage: ...,
                secondsElapsed: ...,
                secondsElapsedInFormat:...,
                bytesPerSecond: ...,
                bytesPerSecondInFormat: ...,
                remainingBytes: ...,
                remainingBytesInFormat: ...,
                secondsRemaining: ...,
                secondsRemainingInFormat: ...
            } */
      onProgress: function (data, item, listEl, parentEl, newInputEl, inputEl) {
        var progressBar = item.html.find(".progress-bar2");

        if (progressBar.length > 0) {
          progressBar.show();
          progressBar.find("span").html(data.percentage + "%");
          progressBar
            .find(".fileuploader-progressbar .bar")
            .width(data.percentage + "%");
        }
      },

      // Callback fired after all files were uploaded
      onComplete: function (
        listEl,
        parentEl,
        newInputEl,
        inputEl,
        jqXHR,
        textStatus
      ) {
        // callback will go here
      },
    },
    c: true,
    addMore: true,
    skipFileNameCheck: true,
    clipboardPaste: true,
    listInput: true,
    enableApi: false,
    listeners: null,
    onSupportError: null,
    beforeRender: null,
    afterRender: null,
    beforeSelect: null,
    onFilesCheck: null,
    onFileRead: null,
    onSelect: null,
    afterSelect: null,
    onListInput: null,
    onRemove: null,
    onEmpty: null,
    dialogs: {
      alert: function (text) {
        return SwAlert.Info("Information", text);
      },
      confirm: function (text, callback) {
        SwAlert.Confirm("Confirmation", text, function () {
          callback();
          swal.close();
        });
        // confirm(text) ? callback() : null;
      },
    },
    captions: $.fn.fileuploader.languages.en,
  };
});
