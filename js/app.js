var app = (function(fabric, window, document, Image, setTimeout, clearTimeout) {
    'use strict';
    //declare variables used across function to check image and whether inverted options are selected
    var image, invert;

    //function that checks the size of the image and whether it's bigger than the window
    function checkSize(image) {
        //window/image objects
        var win = {};
        var img = {};
        //window height/width are 100 pixels smaller than window, leaving some space
        win.height = window.innerHeight - 100;
        //if viewport < 600px, window is 100% of viewport
        win.width = (window.innerWidth <= 600) ? 600 : window.innerWidth - 100;
        img.height = image.getHeight();
        img.width = image.getWidth();
        // convenience variables to reference height/width percentage between image/window
        var wPct = +(win.width / img.width).toFixed(2);
        var hPct = +(win.height / img.height).toFixed(2);
        // see if window is smaller than image and set a percentage scale value if so
        var pct = (win.width >= img.width) ?
            (win.height >= img.height) ? 1 : hPct : (win.height >= img.height || win.height >= (wPct * img.height)) ? wPct : hPct;

        //show image-related functionality
        if (pct === 1 && !document.querySelector('.save-checkbox-row').classList.contains('hidden')) {
            document.querySelector('.save-checkbox-row').classList.add('hidden');
        }
        //show image-related functionality
        if (pct < 1 && document.querySelector('.save-checkbox-row').classList.contains('hidden')) {
            document.querySelector('.save-checkbox-row').classList.remove('hidden');
        }

        //return object to calculate stuff
        return {
            pct: pct,
            height: (img.height * pct),
            width: (img.width * pct)
        };
    }

    //function for the 'image loaded' message that lets users know an image was uploaded
    function imageLoadedMessage() {
        var el = document.createElement('div');
        el.classList.add('load-msg');
        el.appendChild(document.createTextNode('image loaded'));

        if (document.querySelector('.mirrors').classList.contains('img-loaded')) {
            document.querySelector('.mirrors').classList.remove('img-loaded');
        }
        //unbind img load events to prevent users from firing event several times
        document.getElementById('urlfield').removeEventListener('change', getFile);
        document.getElementById('fileupload').removeEventListener('change', getFile);
        document.getElementById('demo').removeEventListener('click', getFile);

        document.querySelector('.mirror-controller-panel').insertBefore(el, document.querySelector('.mirrors'));
        //reinstate events and remove message
        setTimeout(function() {
            document.querySelector('.mirror-controller-panel').removeChild(document.querySelector('.load-msg'));
            document.getElementById('urlfield').addEventListener('change', getFile);
            document.getElementById('fileupload').addEventListener('change', getFile);
            document.getElementById('demo').addEventListener('click', getFile);
            document.querySelector('.mirrors').classList.add('img-loaded');
        }, 2000);

    }

    //function for generating the canvas and base image
    function generateCanvas(img) {
        //check if canvas exists
        var el = (document.getElementById('canvas') === null) ? document.createElement('canvas') : document.getElementById('canvas');
        if (!el.id) {
            el.id = 'canvas';
            el.classList.add('canvas');
        }
        //append canvas if nonexistent
        if (document.getElementById('canvas-wrapper').children.length === 0) {
            document.getElementById('canvas-wrapper').appendChild(el);
            el = document.getElementById('canvas');
        }
        //check if canvas is fabric object and instantiate a canvas if not
        var canvas = !document.querySelector('.canvas-container') ? new fabric.Canvas('canvas', {
            hasBorders: false,
            centeredScaling: true,
            originX: 'left',
            originY: 'top'
        }) : el.fabric;
        //prevent whitespace from loading
        document.querySelector('.canvas-container').style.display = 'none';
        image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');

        //remove canvas attributes
        if (el.hasAttribute('data-filled')) {
            el.removeAttribute('data-filled');
            document.querySelector('.save-options').classList.remove('active-image');
        }
        if (el.hasAttribute('data-mtype')) {
            el.removeAttribute('data-mtype');
        }
        image.src = img;
        image.id = 'image';
        image.onload = function() {
            //remove canvas object
            if (canvas._objects[0]) {
                canvas.remove(canvas._objects[0]);
            }

            //declare image as fabric canvas
            image = new fabric.Image(image, {
                hasBorders: false,
                originX: 'left',
                originY: 'top'
            });
            imageLoadedMessage();

            //remove active styling from mirror button if one is active
            if (document.querySelector('.active') !== null) {
                document.querySelector('.active').classList.remove('active');
            }

            //set values for sizing canvas and image
            var imgObj = checkSize(image);
            document.getElementById('canvas').setAttribute('data-pct', imgObj.pct);
            canvas.setHeight(imgObj.height);
            canvas.setWidth(imgObj.width);
            document.getElementById('canvas').fabric = canvas; //set fabric object as a value on the DOM node, so it's acccessible outside of function
            return image;
        };
        return image;
    }

    //function for building a 'simulated canvas' in the event the user selects to have an export at original dimensions
    function simulateCanvas(img) {
        var canvas = document.createElement('canvas'),
            el = canvas;
        el.id = 'simcanvas';
        el.classList.add('simcanvas');
        document.getElementById('canvas-wrapper').appendChild(el);
        canvas = new fabric.Canvas('simcanvas');
        canvas.setWidth(img.width);
        canvas.setHeight(img.height);
        el.setAttribute('data-mtype', document.getElementById('canvas').getAttribute('data-mtype'));
        el.fabric = canvas;
        return canvas;
    }

    //function for getting the file from 'select file source' options
    function getFile(event) {
        //conditional for url form
        if (event.target.id === 'urlfield') {
            //check if value is an image
            var exp = new RegExp(/^http(s)?:\/\/.+((\.)(bmp|svg|jpg|gif|png))$/);
            //if so do ajax request
            if (event.target.value !== '' & exp.test(event.target.value) === true) {
                var request = new XMLHttpRequest();
                request.open('GET', event.target.value, true);
                request.onload = function() {
                    if (this.status >= 200 && this.status < 400) {
                        //set image to return of canvas gen function w/ value of form if request successful
                        image = generateCanvas(event.target.value);
                    } else {
                        alert('Your URL did not load. Please try a different URL.');
                        return false;
                    }
                };
                //if url not valid return error
                request.onerror = function() {
                    alert('It appears you used a server that does not have cross-origin resource sharing (CORS) enabled. Please enable CORS on your server, or try a different URL.');
                    return false;
                };

                request.send();

            } else {
                alert('Please enter a valid image URL.');
            }

        }
        //conditional for file button using file reader
        if (event.target.id === 'fileupload') {
            var input = document.getElementById('fileupload');
            var file = input.files[0];
            var reader = new FileReader();
            reader.addEventListener("load", function(evt) {
                var imgUpload = reader.result;
                //set image to return of canvas gen function w/ value of form upload succcesful
                image = generateCanvas(imgUpload);
            }, false);

            if (file) {
                reader.readAsDataURL(file);
            }
        }
        //conditional for demo
        if (event.target.id === 'demo') {
            image = generateCanvas('./assets/2.jpg');
        }

    }

    //convenience function for crop rectangle gen
    function getRect(x, y, width, height) {
        return new fabric.Rect({
            hasBorders: false,
            strokeWidth: 0,
            left: x,
            top: y,
            width: width,
            height: height
        });
    }

    //function for switch cases for mirror generated
    function genMirrors(canvas, canMeas, type, mirSrc, group, scale) {
        //variables for clones of original image and rectangle
        var rect, mir2, mir3, mir4;
        mirSrc.set({
            //method for clipping image to path of rectangle
            clipTo: function(ctx) {
                return rect.render(ctx);
            }
        });
        switch (type) {
            case "left":
                // 1. declaration of rectangle
                // 2. set flip/positioning properties of mirror src image
                // 3. clone images and set properties accordingly
                // 4. add mirror source and clones to group
                rect = getRect(-canMeas.hWidth, -canMeas.hHeight, canMeas.hWidth, canMeas.tHeight);
                mirSrc.set({
                    flipX: (invert === 'x' || invert === 'xy') ? true : false,
                    flipY: (invert === 'y' || invert === 'xy') ? true : false,
                    left: (invert === 'x' || invert === 'xy') ? -canMeas.hWidth : 0
                });
                mir2 = fabric.util.object.clone(mirSrc);
                mir2.set({
                    flipX: (invert === 'x' || invert === 'xy') ? false : true,
                    flipY: (invert === 'y' || invert === 'xy') ? true : false,
                    left: (invert === 'x' || invert === 'xy') ? canMeas.hWidth : 0
                });
                group.add(mirSrc, mir2);
                break;
            case "right":
                rect = getRect(0, -canMeas.hHeight, canMeas.hWidth, canMeas.tHeight);
                mirSrc.set({
                    flipX: (invert === 'x' || invert === 'xy') ? true : false,
                    flipY: (invert === 'y' || invert === 'xy') ? true : false,
                    left: (invert === 'x' || invert === 'xy') ? canMeas.hWidth : 0
                });
                mir2 = fabric.util.object.clone(mirSrc);
                mir2.set({
                    flipX: (invert === 'x' || invert === 'xy') ? false : true,
                    flipY: (invert === 'y' || invert === 'xy') ? true : false,
                    left: (invert === 'x' || invert === 'xy') ? -canMeas.hWidth : 0
                });
                group.add(mirSrc, mir2);
                break;
            case "top":
                rect = getRect(-canMeas.hWidth, -canMeas.hHeight, canMeas.tWidth, canMeas.hHeight);
                mirSrc.set({
                    flipX: (invert === 'x' || invert === 'xy') ? true : false,
                    flipY: (invert === 'y' || invert === 'xy') ? true : false,
                    top: (invert === 'y' || invert === 'xy') ? -canMeas.hHeight : 0
                });
                mir2 = fabric.util.object.clone(mirSrc);
                mir2.set({
                    flipX: (invert === 'x' || invert === 'xy') ? true : false,
                    flipY: (invert === 'y' || invert === 'xy') ? false : true,
                    top: (invert === 'y' || invert === 'xy') ? canMeas.hHeight : 0
                });

                group.add(mirSrc, mir2);
                break;
            case "bottom":
                rect = getRect(-canMeas.hWidth, 0, canMeas.tWidth, canMeas.hHeight);
                mirSrc.set({
                    flipX: (invert === 'x' || invert === 'xy') ? true : false,
                    flipY: (invert === 'y' || invert === 'xy') ? true : false,
                    top: (invert === 'y' || invert === 'xy') ? canMeas.hHeight : 0
                });
                mir2 = fabric.util.object.clone(mirSrc);
                mir2.set({
                    flipX: (invert === 'x' || invert === 'xy') ? true : false,
                    flipY: (invert === 'y' || invert === 'xy') ? false : true,
                    top: (invert === 'y' || invert === 'xy') ? -canMeas.hHeight : 0
                });
                group.add(mirSrc, mir2);
                break;
            case "top left":
                rect = getRect(-canMeas.hWidth, -canMeas.hHeight, canMeas.hWidth, canMeas.hHeight);
                mirSrc.set({
                    flipX: (invert === 'x' || invert === 'xy') ? true : false,
                    flipY: (invert === 'y' || invert === 'xy') ? true : false,
                    top: (invert === 'y' || invert === 'xy') ? -canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? -canMeas.hWidth : 0
                });
                mir2 = fabric.util.object.clone(mirSrc);
                mir2.set({
                    flipX: (invert === 'x' || invert === 'xy') ? false : true,
                    flipY: (invert === 'y' || invert === 'xy') ? true : false,
                    top: (invert === 'y' || invert === 'xy') ? -canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? canMeas.hWidth : 0
                });
                mir3 = fabric.util.object.clone(mir2);
                mir3.set({
                    flipX: (invert === 'x' || invert === 'xy') ? true : true,
                    flipY: (invert === 'y' || invert === 'xy') ? false : true,
                    top: (invert === 'y' || invert === 'xy') ? canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? -canMeas.hWidth : 0
                });
                mir4 = fabric.util.object.clone(mir3);
                mir4.set({
                    flipX: (invert === 'x' || invert === 'xy') ? false : false,
                    flipY: (invert === 'y' || invert === 'xy') ? false : true,
                    top: (invert === 'y' || invert === 'xy') ? canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? canMeas.hWidth : 0
                });
                group.add(mirSrc, mir2, mir3, mir4);
                break;
            case "top right":
                rect = getRect(0, -canMeas.hHeight, canMeas.hWidth, canMeas.hHeight);
                mirSrc.set({
                    flipX: (invert === 'x' || invert === 'xy') ? true : false,
                    flipY: (invert === 'y' || invert === 'xy') ? true : false,
                    top: (invert === 'y' || invert === 'xy') ? -canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? canMeas.hWidth : 0
                });
                mir2 = fabric.util.object.clone(mirSrc);
                mir2.set({
                    flipX: (invert === 'x' || invert === 'xy') ? false : true,
                    flipY: (invert === 'y' || invert === 'xy') ? true : false,
                    top: (invert === 'y' || invert === 'xy') ? -canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? -canMeas.hWidth : 0
                });
                mir3 = fabric.util.object.clone(mir2);
                mir3.set({
                    flipX: (invert === 'x' || invert === 'xy') ? true : true,
                    flipY: (invert === 'y' || invert === 'xy') ? false : true,
                    top: (invert === 'y' || invert === 'xy') ? canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? canMeas.hWidth : 0
                });
                mir4 = fabric.util.object.clone(mir3);
                mir4.set({
                    flipX: (invert === 'x' || invert === 'xy') ? false : false,
                    flipY: (invert === 'y' || invert === 'xy') ? false : true,
                    top: (invert === 'y' || invert === 'xy') ? canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? -canMeas.hWidth : 0
                });
                group.add(mirSrc, mir2, mir3, mir4);
                break;
            case "bottom left":
                rect = getRect(-canMeas.hWidth, 0, canMeas.hWidth, canMeas.hHeight);
                mirSrc.set({
                    flipX: (invert === 'x' || invert === 'xy') ? true : false,
                    flipY: (invert === 'y' || invert === 'xy') ? true : false,
                    top: (invert === 'y' || invert === 'xy') ? canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? -canMeas.hWidth : 0
                });
                mir2 = fabric.util.object.clone(mirSrc);
                mir2.set({
                    flipX: (invert === 'x' || invert === 'xy') ? false : true,
                    flipY: (invert === 'y' || invert === 'xy') ? true : false,
                    top: (invert === 'y' || invert === 'xy') ? canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? canMeas.hWidth : 0
                });
                mir3 = fabric.util.object.clone(mir2);
                mir3.set({
                    flipX: (invert === 'x' || invert === 'xy') ? true : true,
                    flipY: (invert === 'y' || invert === 'xy') ? false : true,
                    top: (invert === 'y' || invert === 'xy') ? -canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? -canMeas.hWidth : 0
                });
                mir4 = fabric.util.object.clone(mir3);
                mir4.set({
                    flipX: (invert === 'x' || invert === 'xy') ? false : false,
                    flipY: (invert === 'y' || invert === 'xy') ? false : true,
                    top: (invert === 'y' || invert === 'xy') ? -canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? canMeas.hWidth : 0
                });
                group.add(mirSrc, mir2, mir3, mir4);
                break;
            case "bottom right":
                rect = getRect(0, 0, canMeas.hWidth, canMeas.hHeight);
                mirSrc.set({
                    flipX: (invert === 'x' || invert === 'xy') ? true : false,
                    flipY: (invert === 'y' || invert === 'xy') ? true : false,
                    top: (invert === 'y' || invert === 'xy') ? canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? canMeas.hWidth : 0
                });
                mir2 = fabric.util.object.clone(mirSrc);
                mir2.set({
                    flipX: (invert === 'x' || invert === 'xy') ? false : true,
                    flipY: (invert === 'y' || invert === 'xy') ? true : false,
                    top: (invert === 'y' || invert === 'xy') ? canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? -canMeas.hWidth : 0
                });
                mir3 = fabric.util.object.clone(mir2);
                mir3.set({
                    flipX: (invert === 'x' || invert === 'xy') ? false : true,
                    flipY: (invert === 'y' || invert === 'xy') ? false : true,
                    top: (invert === 'y' || invert === 'xy') ? -canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? -canMeas.hWidth : 0
                });
                mir4 = fabric.util.object.clone(mir3);
                mir4.set({
                    flipX: (invert === 'x' || invert === 'xy') ? true : false,
                    flipY: (invert === 'y' || invert === 'xy') ? false : true,
                    top: (invert === 'y' || invert === 'xy') ? -canMeas.hHeight : 0,
                    left: (invert === 'x' || invert === 'xy') ? canMeas.hWidth : 0
                });
                group.add(mirSrc, mir2, mir3, mir4);
                break;
        }
        //add group to canvas and render
        canvas.add(group);
        canvas.renderAll();
    }

    //function for getting the mirror value
    function getMirror(type, simulated) {
        var el = !simulated ? document.getElementById("canvas") : document.getElementById("simcanvas"),
            canvas = el.fabric,
            mirSrc = fabric.util.object.clone(image),
            group = new fabric.Group(),
            scale = !simulated ? +el.getAttribute('data-pct') : 1,
            can = {}; //canvas object to get values
        //remove anything on canvas
        if (el.hasAttribute('data-filled')) {
            canvas.remove(canvas._objects[0]);
        }
        //set vals for group and mirror source image
        group.set({
            strokeWidth: 0,
            originX: 'left',
            originY: 'top',
            scale: scale,
            hasborders: false
        });
        mirSrc.set({
            strokeWidth: 0,
            width: mirSrc.getWidth() * scale,
            height: mirSrc.getHeight() * scale,
            originX: 'left',
            originY: 'top',
            scale: scale,
            hasborders: false
        });

        can = {
            tWidth: canvas.getWidth(),
            tHeight: canvas.getHeight(),
            hHeight: canvas.getHeight() / 2,
            hWidth: canvas.getWidth() / 2
        };
        // add data props if not declared
        if (!el.hasAttribute('data-filled')) {
            el.setAttribute('data-filled', true);
            document.querySelector('.save-options').classList.add('active-image');
            document.querySelector('.canvas-container').style.display = 'block';
        }

        //set attribute for mirror type for invert function to use
        el.setAttribute('data-mtype', type);

        //call mirror generator
        genMirrors(canvas, can, type, mirSrc, group, scale);

    }

    //function for mirror buttons
    function mirrorBtnFunc(event) {
        //return false if no image
        if (image === undefined) {
            return false;
        }
        // add/remove active button styling
        if (document.querySelector('.active') !== null) {
            document.querySelector('.active').classList.remove('active');
        }
        event.target.classList.add('active');
        getMirror(event.target.value);
    }


    //message for url field
    function urlMessage(event) {
        if (event.target.value.length === 0 && !event.target.hasAttribute('data-message')) {
            alert('For the image to load, make sure you use a server with CORS enabled.');
            event.target.setAttribute('data-message', '1');
        }
    }

    //resize event for functionality canvas
    function resizeEvent() {
        if (document.getElementById('canvas') !== null && document.getElementById('canvas').hasAttribute('data-mtype')) {
            var imgObj = checkSize(image);
            var el = document.getElementById('canvas');
            var canvas = el.fabric;
            el.setAttribute('data-pct', imgObj.pct);
            canvas.setHeight(imgObj.height);
            canvas.setWidth(imgObj.width);
            getMirror(document.getElementById('canvas').getAttribute('data-mtype'), false);
        }
    }


    //event for save button
    function saveBtnFunc(event) {
        var el = document.getElementById('canvas');
        var canvas = el.fabric;
        var check = (el.getAttribute('data-pct') < 1) ? document.getElementById('preserve').checked : null;
        if (check === true) {
            canvas = simulateCanvas(image);
            el = document.getElementById('simcanvas');
            getMirror(el.getAttribute('data-mtype'), true);
        }
        var url = canvas.toDataURL('image/png');
        window.open(url);
        if (el.id === 'simcanvas') {
            document.getElementById('canvas-wrapper').removeChild(document.getElementById('simcanvas').parentNode);
        }
    }

    //function for pseudo-checkbox btns
    function fakeChk(el) {
        el.setAttribute('data-checked', !JSON.parse(el.getAttribute('data-checked')));
        el.checked = (el.getAttribute('data-checked') === 'true') ? true : false;
        el.previousElementSibling.classList.toggle('checked');
    }

    //event function for 'invert' pseudo-checkbox buttons
    function invertChkFunc(event) {
        var tgt = event.target;
        var sibling = tgt.id === 'invert_x' ? document.getElementById('invert_y') : document.getElementById('invert_x');
        fakeChk(tgt);
        invert = tgt.checked ? (sibling.checked ? 'xy' : tgt.value) : (sibling.checked ? sibling.value : null);
        if (document.querySelector('.active') !== null) {
            getMirror(document.getElementById('canvas').getAttribute('data-mtype'), false);
        }

    }

    //event function for 'preserve' pseudo-checkbox button
    function preserveChkFunc(event) {
        var tgt = event.target;
        fakeChk(tgt);
    }


    //'Debounce' function to reduce # of events fired upon resize. By David Walsh http://davidwalsh.name/javascript-debounce-function
    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this,
                args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    function addListeners() {
        //event listener for resize w/ debounce
        window.addEventListener('resize', debounce(function() {
            resizeEvent();
        }, 250));

        //event listeners
        document.getElementById('urlfield').addEventListener('focus', urlMessage);
        document.getElementById('urlfield').addEventListener('change', getFile);
        document.getElementById('fileupload').addEventListener('change', getFile);
        document.getElementById('demo').addEventListener('click', getFile);
        document.getElementById('invert_x').addEventListener('click', invertChkFunc);
        document.getElementById('invert_y').addEventListener('click', invertChkFunc);
        document.getElementById('preserve').addEventListener('click', preserveChkFunc);
        document.getElementById('savebtnpng').addEventListener('click', saveBtnFunc);

        //event listener loop
        for (var j = 0; j < document.querySelectorAll('.mirror-btns button').length; j++) {
            document.querySelectorAll('.mirror-block-btn')[j].addEventListener('click', mirrorBtnFunc);
        }
    }

    window.onload = addListeners;

}(fabric, window, document, Image, setTimeout, clearTimeout));

module.exports = app;
