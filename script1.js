window.onload = function () {
    var ctx = canvas.getContext('2d');
    var dragging = false;
    var canvasX = canvas.offsetLeft;
    var canvasY = canvas.offsetTop;
    var fontSize = parseInt(ctx.font.match(/\d+/), 10);
    var lineHeight = fontSize * 1;
    var text = 'Canvas text clip outline aaaaaaaaaaaaaaaaaand another additional very looooooooooooong or not so much long text';
    var maxStringWidth = 30;
    var padding = 8;
    var textArr = text.split(' ');
    var verticalHeight = 0;
    var verticalHalfHeight;

    for (var i = 0, current, next, str; i < textArr.length; i++) {
        next = textArr[i + 1];

        if (next) {
            current = textArr[i];
            str = current + ' ' + next;

            if (ctx.measureText(str).width <= maxStringWidth) {
                textArr[i] = str;
                textArr.splice(i + 1, 1);
                i--;
            }
        }
    }

    (function () {
        for (var i = 0, imax = textArr.length; i < imax; i++) {
            verticalHeight += lineHeight;
        }
    })();

    verticalHalfHeight = verticalHeight / 2;

    reset();

    document.onmousedown = function (e) {
        if (e.which === 1) {
            dragging = true;
            document.onmousemove(e);
        } else if (e.which === 2) {
            reset();

            return false;
        }
    };

    document.onmousemove = function (e) {
        if (e.which === 1) {
            if (dragging) {
                draw(e.pageX - canvasX, e.pageY - canvasY);
            }
        }
    };

    document.onmouseup = function (e) {
        if (e.which === 1) {
            dragging = false;
        }
    };

    function draw (px, py) {
        var x1 = canvas.width / 2;
        var y1 = canvas.height / 2;
        var x2 = px === undefined ? canvas.width / 2 : px;
        var y2 = py === undefined ? canvas.height / 2 : py;
        var xc = x1 + (x2 - x1) / 2;
        var yc = y1 + (y2 - y1) / 2;

        var outlineRects = getOutlineRects(xc, yc);

        drawBackgound();

        // drawOutline(outlineRects);

        ctx.save();

        // drawClipSectors(outlineRects);
        clipOutline(outlineRects);

        darawLine(x1, y1, x2, y2);

        ctx.restore();

        drawText(xc, yc);
    }

    function reset () {
        draw();
    }

    function getOutlineRects (cx, cy) {
        var textWidth;
        var rects = [];
        var currentRect, prevRect;

        function checkOverPosition () {
            var overPositionDiff = prevRect ? prevRect.y + prevRect.h - currentRect.y : 0;

            if (overPositionDiff > 0) {
                if (prevRect.w > currentRect.w) {
                    currentRect.y += overPositionDiff;
                    currentRect.h -= overPositionDiff;
                } else {
                    prevRect.h -= overPositionDiff;

                    if (prevRect.h <= 0) {
                        rects.pop();

                        prevRect = rects[rects.length - 1];

                        checkOverPosition();
                    }
                }
            }
        }

        for (var i = 0, imax = textArr.length; i < imax; i++) {
            textWidth = ctx.measureText(textArr[i]).width;

            prevRect = currentRect;
            currentRect = {};

            currentRect.w = textWidth + padding * 2;
            currentRect.h = lineHeight + padding * 2;
            currentRect.x = cx - currentRect.w / 2;
            currentRect.y = cy + lineHeight * i - padding - verticalHalfHeight;

            checkOverPosition();

            if (currentRect.h > 0) {
                rects.push(currentRect);
            }
        }

        var oneRect = {
            y: rects[0].y,
            h: rects[rects.length - 1].y - rects[0].y + rects[rects.length - 1].h
        };

        for (var j = 0, jmax = rects.length; j < jmax; j++) {
            if (oneRect.x === undefined || rects[j].x < oneRect.x) {
                oneRect.x = rects[j].x;
                oneRect.w = rects[j].w;
            }
        }

        return rects;
    }

    function drawText (cx, cy) {
        var lineHeightOffset = (lineHeight - fontSize) / 2;

        ctx.beginPath();
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (var i = 0, imax = textArr.length; i < imax; i++) {
            ctx.fillText(textArr[i], cx, cy + lineHeight * i - verticalHalfHeight + lineHeightOffset);
        }
    }

    function darawLine (x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.strokeStyle = '#000';
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    function drawOutline (outlineRects) {
        ctx.beginPath();
        ctx.fillStyle = 'pink';

        for (var i = 0, imax = outlineRects.length; i < imax; i++) {
            ctx.fillRect(outlineRects[i].x, outlineRects[i].y, outlineRects[i].w, outlineRects[i].h);
        }
    }

    function drawBackgound () {
        ctx.beginPath();
        ctx.fillStyle = '#ccc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.strokeStyle = '#9e9e9e';
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);

        ctx.moveTo(canvas.width / 4, 0);
        ctx.lineTo(canvas.width / 4, canvas.height);
        ctx.moveTo(0, canvas.height / 4);
        ctx.lineTo(canvas.width, canvas.height / 4);

        ctx.moveTo((canvas.width / 4) * 3, 0);
        ctx.lineTo((canvas.width / 4) * 3, canvas.height);
        ctx.moveTo(0, (canvas.height / 4) * 3);
        ctx.lineTo(canvas.width, (canvas.height / 4) * 3);

        ctx.stroke();
    }

    function drawClipSectors (outlineRects) {
        var colors = [
            'blue',
            'green',
            'purple',
            'orange',
            'aqua',
            'indianred',
        ];
        var colorIndex = 0;
        var firstRect = outlineRects[0];
        var lastRect = outlineRects[outlineRects.length - 1];
        var rect;

        ctx.beginPath();

        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, canvas.width, firstRect.y);

        for (var i = 0, imax = outlineRects.length; i < imax; i++) {
            if (!colors[colorIndex]) {
                colorIndex = 0;
            }

            rect = outlineRects[i];

            ctx.fillStyle = colors[colorIndex];
            ctx.fillRect(0, rect.y, rect.x, rect.h);

            ctx.fillStyle = colors[colorIndex + 1];
            ctx.fillRect(rect.x + rect.w, rect.y, canvas.width - rect.x - rect.w, rect.h);

            colorIndex += 2;
        }

        ctx.fillStyle = 'yellow';
        ctx.fillRect(0, lastRect.y + lastRect.h, canvas.width, canvas.height - lastRect.y + lastRect.h);
    }

    function clipOutline (outlineRects) {
        var firstRect = outlineRects[0];
        var lastRect = outlineRects[outlineRects.length - 1];
        var rect;

        ctx.beginPath();

        ctx.rect(0, 0, canvas.width, firstRect.y);

        for (var i = 0, imax = outlineRects.length; i < imax; i++) {
            rect = outlineRects[i];

            ctx.rect(0, rect.y, rect.x, rect.h);
            ctx.rect(rect.x + rect.w, rect.y, canvas.width - rect.x - rect.w, rect.h);
        }

        ctx.rect(0, lastRect.y + lastRect.h, canvas.width, canvas.height - lastRect.y + lastRect.h);

        ctx.clip();
    }
};