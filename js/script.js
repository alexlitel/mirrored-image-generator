(function() {
    'use strict';
    var image;

    function checkSize(image) {
        var win = {};
        var img = {};
        win.height = window.innerHeight - 100;
        win.width = window.innerWidth - 100;
        img.height = image.height;
        img.width = image.width;
        var wPct = +(win.width / img.width).toFixed(2);
        var hPct = +(win.height / img.height).toFixed(2);
        var pct = (win.width >= img.width) ?
            (win.height >= img.height) ? 1 : hPct : (win.height >= img.height || win.height >= (wPct * img.height)) ? wPct : hPct;
        if (pct === 1 && !document.querySelector('.save-checkbox-row').classList.contains('hidden')) {
            document.querySelector('.save-checkbox-row').classList.add('hidden');
        }
        if (pct < 1 && document.querySelector('.save-checkbox-row').classList.contains('hidden')) {
            document.querySelector('.save-checkbox-row').classList.remove('hidden');
        }
        return {
            pct: pct,
            height: (img.height * pct),
            width: (img.width * pct)
        };
    }

    function imageLoadedMessage() {
        var el = document.createElement('div');
        el.classList.add('load-msg');
        el.innerText = 'image loaded';

        if (document.querySelector('.mirrors').classList.contains('img-loaded')) {
            document.querySelector('.mirrors').classList.remove('img-loaded');
        }

        document.getElementById('urlfield').removeEventListener('change', getFile);
        document.getElementById('fileupload').removeEventListener('change', getFile);
        document.getElementById('demo').removeEventListener('click', getFile);

        document.querySelector('.mirror-controller-panel').insertBefore(el, document.querySelector('.mirrors'));

        setTimeout(function() {
            document.querySelector('.mirror-controller-panel').removeChild(document.querySelector('.load-msg'));
            document.getElementById('urlfield').addEventListener('change', getFile);
            document.getElementById('fileupload').addEventListener('change', getFile);
            document.getElementById('demo').addEventListener('click', getFile);
            document.querySelector('.mirrors').classList.add('img-loaded');
        }, 2000);

    }


    function generateCanvas(img) {
        var canvas = (document.getElementById('canvas') === null) ? document.createElement('canvas') : document.getElementById('canvas');
        image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');
        if (canvas.hasAttribute('data-filled')) {
            canvas.removeAttribute('data-filled');
            document.querySelector('.save-options').classList.remove('active-image');
        }
        if (canvas.hasAttribute('data-mtype')) {
            canvas.removeAttribute('data-mtype');
        }
        image.src = img;
        canvas.id = 'canvas';
        canvas.classList.add(canvas.id);
        image.onload = function() {
            imageLoadedMessage();
            if (document.getElementById('canvas-wrapper').children.length === 0) {
                document.getElementById('canvas-wrapper').appendChild(canvas);
            }
            if (document.querySelector('.active') !== null) {
                document.querySelector('.active').classList.remove('active');
            }
            var imgObj = checkSize(image);
            canvas.setAttribute('data-pct', imgObj.pct);

            canvas.height = imgObj.height;
            canvas.width = imgObj.width;
            return image;
        };
        return image;
    }

    function simulateCanvas(img) {
        var canvas = document.createElement('canvas');
        canvas.id = 'simcanvas';
        canvas.classList.add(canvas.id);
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.setAttribute('data-mtype', document.getElementById('canvas').getAttribute('data-mtype'));
        document.getElementById('canvas-wrapper').appendChild(canvas);
        return canvas;
    }

    function getFile(event) {
        if (event.target.id === 'urlfield') {
            var exp = new RegExp(/^http(s)?:\/\/.+((\.)(bmp|svg|jpg|gif|png))$/);
            if (exp.test(event.target.value) === true) {
                image = generateCanvas(event.target.value);
            } else {
                alert('Please enter a valid image URL.');
            }

        }
        if (event.target.id === 'fileupload') {
            var input = document.getElementById('fileupload');
            var file = input.files[0];
            var reader = new FileReader();
            reader.addEventListener("load", function(evt) {
                var imgUpload = reader.result;
                image = generateCanvas(imgUpload);
            }, false);

            if (file) {
                reader.readAsDataURL(file);
            }
        }
        if (event.target.id === 'demo') {
            image = generateCanvas('./assets/2.jpg');
        }

    }

    function getMirror(type, simulated) {
        var canvas = !simulated ? document.getElementById("canvas") : document.getElementById('simcanvas');
        var ctx = canvas.getContext('2d');
        var img = {
            tWidth: image.width,
            tHeight: image.height,
            hHeight: image.height / 2,
            hWidth: image.width / 2
        };
        var can = {
            tWidth: canvas.width,
            tHeight: canvas.height,
            hHeight: canvas.height / 2,
            hWidth: canvas.width / 2
        };
        if (canvas.hasAttribute('data-filled')) {
            ctx.clearRect(0, 0, can.tWidth, can.tHeight);
        } else {
            canvas.setAttribute('data-filled', true);
            document.querySelector('.save-options').classList.add('active-image');
        }
        switch (type) {
            case "left":
                canvas.setAttribute('data-mtype', 'left');
                ctx.drawImage(image, 0, 0, img.hWidth, img.tHeight, 0, 0, can.hWidth, can.tHeight);
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(image, 0, 0, img.hWidth, img.tHeight, -can.tWidth, 0, can.hWidth, can.tHeight);
                ctx.scale(1, 1);
                ctx.restore();
                break;
            case "right":
                canvas.setAttribute('data-mtype', 'right');
                ctx.drawImage(image, img.hWidth, 0, img.hWidth, img.tHeight, can.hWidth, 0, can.hWidth, can.tHeight);
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(image, img.hWidth, 0, img.tWidth, img.tHeight, -can.hWidth, 0, can.tWidth, can.tHeight);
                ctx.restore();
                break;
            case "top":
                canvas.setAttribute('data-mtype', 'top');
                ctx.drawImage(image, 0, 0, img.tWidth, img.hHeight, 0, 0, can.tWidth, can.hHeight);
                ctx.save();
                ctx.scale(1, -1);
                ctx.drawImage(image, 0, 0, img.tWidth, img.hHeight, 0, -can.hHeight, can.tWidth, -can.hHeight);
                ctx.restore();
                break;
            case "bottom":
                canvas.setAttribute('data-mtype', 'bottom');
                ctx.drawImage(image, 0, img.hHeight, img.tWidth, img.tHeight, 0, can.hHeight, can.tWidth, can.tHeight);
                ctx.save();
                ctx.scale(1, -1);
                ctx.drawImage(image, 0, img.hHeight, img.tWidth, img.tHeight, 0, -can.hHeight, can.tWidth, can.tHeight);
                ctx.restore();
                break;
            case "top left":
                canvas.setAttribute('data-mtype', 'top left');
                ctx.drawImage(image, 0, 0, img.hWidth, img.hHeight, 0, 0, can.hWidth, can.hHeight);
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(image, 0, 0, img.hWidth, img.hHeight, -can.tWidth, 0, can.hWidth, can.hHeight);
                ctx.scale(1, -1);
                ctx.drawImage(image, 0, 0, img.hWidth, img.hHeight, -can.tWidth, -can.hHeight, can.hWidth, -can.hHeight);
                ctx.scale(-1, 1);
                ctx.drawImage(image, 0, 0, img.hWidth, img.hHeight, 0, -can.hHeight, can.hWidth, -can.hHeight);
                ctx.restore();
                break;
            case "top right":
                canvas.setAttribute('data-mtype', 'top right');
                ctx.drawImage(image, img.hWidth, 0, img.tWidth, img.hHeight, can.hWidth, 0, can.tWidth, can.hHeight);
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(image, img.hWidth, 0, img.tWidth, img.hHeight, -can.hWidth, 0, can.tWidth, can.hHeight);
                ctx.scale(1, -1);
                ctx.drawImage(image, img.hWidth, 0, img.tWidth, img.hHeight, can.hWidth, -can.hHeight, -can.tWidth, -can.hHeight);
                ctx.scale(-1, 1);
                ctx.drawImage(image, img.hWidth, 0, img.tWidth, img.hHeight, can.hWidth, -can.hHeight, can.tWidth, -can.hHeight);
                ctx.restore();
                break;
            case "bottom left":
                canvas.setAttribute('data-mtype', 'bottom left');
                ctx.drawImage(image, 0, img.hHeight, img.hWidth, img.tHeight, 0, can.hHeight, can.hWidth, can.tHeight);
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(image, 0, img.hHeight, img.hWidth, img.tHeight, -can.hWidth, can.hHeight, -can.hWidth, can.tHeight);
                ctx.scale(1, -1);
                ctx.drawImage(image, 0, img.hHeight, img.hWidth, img.tHeight, -can.hWidth, -can.hHeight, -can.hWidth, can.tHeight);
                ctx.scale(-1, 1);
                ctx.drawImage(image, 0, img.hHeight, img.hWidth, img.tHeight, 0, -can.hHeight, can.hWidth, can.tHeight);
                ctx.restore();
                break;
            case "bottom right":
                canvas.setAttribute('data-mtype', 'bottom right');
                ctx.drawImage(image, img.hWidth, img.hHeight, img.tWidth, img.tHeight, can.hWidth, can.hHeight, can.tWidth, can.tHeight);
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(image, img.hWidth, img.hHeight, img.tWidth, img.tHeight, can.hWidth, can.hHeight, -can.tWidth, can.tHeight);
                ctx.scale(1, -1);
                ctx.drawImage(image, img.hWidth, img.hHeight, img.tWidth, img.tHeight, can.hWidth, can.hHeight, -can.tWidth, -can.tHeight);
                ctx.scale(-1, 1);
                ctx.drawImage(image, img.hWidth, img.hHeight, img.tWidth, img.tHeight, can.hWidth, can.hHeight, can.tWidth, -can.tHeight);
                ctx.restore();
                break;
        }
    }


    function mirrorBtnFunc(event) {
        if (image === undefined) {
            return false;
        }

        if (document.querySelector('.active') !== null) {
            document.querySelector('.active').classList.remove('active');
        }
        event.target.classList.add('active');
        getMirror(event.target.innerText.toLowerCase().replace(/\n/, ' '), false);
    }


    function resizeEvent() {
        if (document.getElementById('canvas') !== null && document.getElementById('canvas').hasAttribute('data-mtype')) {
            var imgObj = checkSize(image);
            canvas.setAttribute('data-pct', imgObj.pct);
            canvas.height = imgObj.height;
            canvas.width = imgObj.width;
            getMirror(document.getElementById('canvas').getAttribute('data-mtype'), false);
        }
    }

    function saveBtnFunc(event) {
        var canvas = document.getElementById('canvas');
        var check = (canvas.getAttribute('data-pct') < 1) ? document.getElementById('preserve').checked : null;
        var type = (type === 'svg') ? event.target.value + '+xml' : event.target.value;
        if (check === true) {
            canvas = simulateCanvas(image);
            getMirror(canvas.getAttribute('data-mtype'), true);
        }
        var url = canvas.toDataURL('image/' + type);
        window.open(url);

        if (canvas.id === 'simcanvas') {
            document.getElementById('canvas-wrapper').removeChild(canvas);
        }

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


    window.addEventListener('resize', debounce(function() {
        resizeEvent();
    }, 250));

    document.getElementById('urlfield').addEventListener('change', getFile);
    document.getElementById('fileupload').addEventListener('change', getFile);
    document.getElementById('demo').addEventListener('click', getFile);

    for (var i = 0; i < document.querySelectorAll('.savebtn').length; i++) {
        document.querySelectorAll('.savebtn')[i].addEventListener('click', saveBtnFunc);
    }

    for (var j = 0; j < document.querySelectorAll('.mirrors button').length; j++) {
        document.querySelectorAll('.mirror-block-btn')[j].addEventListener('click', mirrorBtnFunc);
    }

}());
