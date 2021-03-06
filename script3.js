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
        var x2 = px === undefined ? canvas.width : px;
        var y2 = py === undefined ? canvas.height / 2 : py;
        var xc = x1 + (x2 - x1) / 2;
        var yc = y1 + (y2 - y1) / 2;

        var outlineRects = getOutlineRects(xc, yc);
        var restrictedRects = getRestrictedRects();

        drawBackgound();

        // drawOffsetProjections({ xc, yc, x1, y1, x2, y2 }, outlineRects, restrictedRects);

        var offset = getOutlineRectsOffset({ xc, yc, x1, y1, x2, y2 }, outlineRects, restrictedRects);

        if (offset) {
            setOutlineRectsOffset(outlineRects, offset);

            xc += offset.x;
            yc += offset.y;
        }

        drawRestrictedAreas(restrictedRects, outlineRects);

        drawOutline(outlineRects, restrictedRects);

        drawRectsIntersectionAreas(restrictedRects, outlineRects);

        drawLine({ x1, y1, x2, y2 }, outlineRects);

        drawTextPoint(xc, yc);

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

        return [getOneOutlineRect(rects)];
    }

    function getOneOutlineRect (rects) {
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

        return oneRect;
    }

    function getRestrictedRects () {
        return [{
            x: 250,
            y: 150,
            w: 300,
            h: 200,
            c: 'deepskyblue'
        }/* , {
            x: 575,
            y: 100,
            w: 80,
            h: 300,
            c: 'lightgreen'
        }, {
            x: 250,
            y: 80,
            w: 150,
            h: 80,
            c: 'orange'
        } */];
    }

    function drawRestrictedAreas (restrictedRects, outlineRects) {
        var rRect;

        ctx.beginPath();

        for (var i = 0, imax = restrictedRects.length; i < imax; i++) {
            rRect = restrictedRects[i];

            ctx.fillStyle = (function () {
                for (var i = 0, imax = outlineRects.length; i < imax; i++) {
                    if (checkRectsIntersection(rRect, outlineRects[i])) {
                        return true;
                    }
                }

                return false;
            })() ? 'red' : rRect.c;

            ctx.fillRect(rRect.x, rRect.y, rRect.w, rRect.h);
        }
    }

    function checkRectsIntersection (r1, r2) {
        var onRight = r2.x > (r1.x + r1.w);
        var onLeft = r1.x > (r2.x + r2.w);
        var below = r2.y > (r1.y + r1.h);
        var above = r1.y > (r2.y + r2.h);
        var isIntersect = !(onRight || onLeft || below || above);

        return isIntersect;
    }

    function drawRectsIntersectionAreas (restrictedRects, outlineRects) {
        var rRect;
        var oRect;
        var iRect;

        ctx.beginPath();

        ctx.fillStyle = 'aqua';

        for (var i = 0, imax = restrictedRects.length; i < imax; i++) {
            rRect = restrictedRects[i];

            for (var j = 0, jmax = outlineRects.length; j < jmax; j++) {
                oRect = outlineRects[j];

                iRect = getRectsIntersectionArea(rRect, oRect);

                if (iRect) {
                    ctx.fillRect(iRect.x, iRect.y, iRect.w, iRect.h);
                }
            }
        }
    }

    function getRectsIntersectionArea (r1, r2) {
        var x1 = Math.max(r1.x, r2.x);
        var x2 = Math.min(r1.x + r1.w, r2.x + r2.w);
        var y1 = Math.max(r1.y, r2.y);
        var y2 = Math.min(r1.y + r1.h, r2.y + r2.h);

        if (x2 >= x1 && y2 >= y1) {
            return {
                x: x1,
                y: y1,
                w: x2 - x1,
                h: y2 - y1
            };
        }

        return null;
    }

    function setOutlineRectsOffset (outlineRects, offset) {
        for (var i = 0, imax = outlineRects.length; i < imax; i++) {
            outlineRects[i].x += offset.x;
            outlineRects[i].y += offset.y;
        }
    }

    function getOutlineRectsOffset (points, outlineRects, restrictedRects) {
        var oRect = getOneOutlineRect(outlineRects);
        var rRect;
        var iRect;

        for (var j = 0, jmax = restrictedRects.length; j < jmax; j++) {
            rRect = restrictedRects[j];

            iRect = getRectsIntersectionArea(rRect, oRect);

            if (iRect) {
                var isPoitiveY = points.y1 <= points.y2;
                var isPoitiveX = points.x1 <= points.x2;
                var intersection;
                var newCenterX, newCenterY;
                var resultX1, resultY1, resultSum1;
                var resultX2, resultY2, resultSum2;
                var offsetX = isPoitiveX ?
                        iRect.w + Math.max(rRect.x + rRect.w - oRect.x - oRect.w, 0) :
                        -iRect.w - Math.max(oRect.x - rRect.x, 0);
                var offsetY = isPoitiveY ?
                        iRect.h + Math.max(rRect.y + rRect.h - oRect.y - oRect.h, 0):
                        -iRect.h - Math.max(oRect.y - rRect.y, 0);

                intersection = getLinesIntersection({
                    x: points.x1,
                    y: points.y1,
                }, {
                    x: points.x2,
                    y: points.y2,
                }, {
                    x: points.xc,
                    y: points.yc + offsetY,
                }, {
                    x: canvas.width,
                    y: points.yc + offsetY,
                });

                newCenterX = intersection ? intersection.x : points.xc + offsetX;
                newCenterY = intersection ? intersection.y : points.yc;

                resultX1 = newCenterX - points.xc;
                resultY1 = newCenterY - points.yc;
                resultSum1 = Math.abs(resultX1) + Math.abs(resultY1);

                intersection = getLinesIntersection({
                    x: points.x1,
                    y: points.y1,
                }, {
                    x: points.x2,
                    y: points.y2,
                }, {
                    x: points.xc + offsetX,
                    y: points.yc,
                }, {
                    x: points.xc + offsetX,
                    y: canvas.height,
                });

                newCenterX = intersection ? intersection.x : points.xc + offsetX;
                newCenterY = intersection ? intersection.y : points.yc + iRect.h;

                resultX2 = newCenterX - points.xc;
                resultY2 = newCenterY - points.yc;
                resultSum2 = Math.abs(resultX2) + Math.abs(resultY2);

                return resultSum1 < resultSum2 ? {
                    x: resultX1,
                    y: resultY1
                } : {
                    x: resultX2,
                    y: resultY2
                };
            }
        }

        return null;
    }

    function drawOffsetProjections (points, outlineRects, restrictedRects) {
        var rRect;
        var iRect;
        var oRect = getOneOutlineRect(outlineRects);

        for (var j = 0, jmax = restrictedRects.length; j < jmax; j++) {
            rRect = restrictedRects[j];

            iRect = getRectsIntersectionArea(rRect, oRect);

            if (iRect) {
                var isPoitiveY = points.y1 <= points.y2;
                var isPoitiveX = points.x1 <= points.x2;
                var intersection;
                var pxc, pyc;
                var oxc, oyc;
                var xOffset = isPoitiveX ?
                              iRect.w + Math.max(rRect.x + rRect.w - oRect.x - oRect.w, 0) :
                              -iRect.w - Math.max(oRect.x - rRect.x, 0);
                var yOffset = isPoitiveY ?
                              iRect.h + Math.max(rRect.y + rRect.h - oRect.y - oRect.h, 0):
                              -iRect.h - Math.max(oRect.y - rRect.y, 0);

                ctx.fillStyle = '#fff';

                ctx.beginPath();
                ctx.strokeStyle = 'green';

                ctx.moveTo(points.xc, points.yc);
                ctx.lineTo(points.xc, points.yc + yOffset);

                intersection = getLinesIntersection({
                    x: points.x1,
                    y: points.y1,
                }, {
                    x: points.x2,
                    y: points.y2,
                }, {
                    x: points.xc,
                    y: points.yc + yOffset,
                }, {
                    x: canvas.width,
                    y: points.yc + yOffset,
                });

                if (intersection) {
                    pxc = intersection.x;
                    pyc = intersection.y;
                } else {
                    pxc = points.xc + xOffset;
                    pyc = points.yc;
                }

                oxc = pxc - points.xc;
                oyc = pyc - points.yc;

                ctx.lineTo(pxc, pyc);
                ctx.arc(pxc, pyc, 3, 0, Math.PI * 2);
                ctx.rect(oRect.x + oxc, oRect.y + oyc, oRect.w, oRect.h);

                ctx.stroke();

                ctx.beginPath();

                ctx.arc(pxc, pyc, 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.strokeStyle = 'purple';

                ctx.moveTo(points.xc, points.yc);
                ctx.lineTo(points.xc + xOffset, points.yc);

                intersection = getLinesIntersection({
                    x: points.x1,
                    y: points.y1,
                }, {
                    x: points.x2,
                    y: points.y2,
                }, {
                    x: points.xc + xOffset,
                    y: points.yc,
                }, {
                    x: points.xc + xOffset,
                    y: canvas.height,
                });

                if (intersection) {
                    pxc = intersection.x;
                    pyc = intersection.y;
                } else {
                    pxc = points.xc + xOffset;
                    pyc = points.yc + iRect.h;
                }

                oxc = pxc - points.xc;
                oyc = pyc - points.yc;

                ctx.lineTo(pxc, pyc);
                ctx.arc(pxc, pyc, 3, 0, Math.PI * 2);
                ctx.rect(oRect.x + oxc, oRect.y + oyc, oRect.w, oRect.h);

                ctx.stroke();

                ctx.beginPath();

                ctx.arc(pxc, pyc, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
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

    function drawLine (points) {
        ctx.beginPath();
        ctx.moveTo(points.x1, points.y1);
        ctx.strokeStyle = '#000';
        ctx.lineTo(points.x2, points.y2);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = '#000';
        ctx.arc(points.x1, points.y1, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(points.x2, points.y2, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawOutline (outlineRects, restrictedRects) {
        ctx.beginPath();
        ctx.fillStyle = 'pink';

        for (var i = 0, imax = outlineRects.length; i < imax; i++) {
            ctx.fillRect(outlineRects[i].x, outlineRects[i].y, outlineRects[i].w, outlineRects[i].h);
        }
    }

    function drawTextPoint (xc, yc) {
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.strokeWidth = 1;

        ctx.arc(xc, yc, 3, 0, Math.PI * 2);

        ctx.fill();
        ctx.stroke();
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

    function getLinesIntersection (ps1, pe1, ps2, pe2) {
        var a1 = pe1.y - ps1.y;
        var b1 = ps1.x - pe1.x;
        var a2 = pe2.y - ps2.y;
        var b2 = ps2.x - pe2.x;
        var delta = a1 * b2 - a2 * b1;

        if (delta === 0) return null;

        var c2 = a2 * ps2.x + b2 * ps2.y;
        var c1 = a1 * ps1.x + b1 * ps1.y;
        var invdelta = 1 / delta;

        return {
            x: (b2 * c1 - b1 * c2) * invdelta,
            y: (a1 * c2 - a2 * c1) * invdelta
        };
    }
};