const sprites = [];
let printedText = "";

class Sprite {
    constructor(imageName) {
        this.name = imageName;
        this.events = [];
        sprites.push(this);
    }

    _set(type, startTime, targetValue, duration = 0, easing = "linear") {
        this.events.push({ type, startTime, targetValue, duration, easing });
    }

    moveX(startTime, targetValue, duration = 0, easing = "linear") {
        this._set("x", startTime, targetValue, duration, easing);
    }

    moveY(startTime, targetValue, duration = 0, easing = "linear") {
        this._set("y", startTime, targetValue, duration, easing);
    }

    scale(startTime, targetValue, duration = 0, easing = "linear") {
        this._set("size", startTime, targetValue, duration, easing);
    }

    rotate(startTime, targetValue, duration = 0, easing = "linear") {
        this._set("angle", startTime, targetValue, duration, easing);
    }

    alpha(startTime, targetValue, duration = 0, easing = "linear") {
        this._set("alpha", startTime, targetValue, duration, easing);
    }

    additive(startTime, targetValue) {
        this._set("additive", startTime, targetValue, 0, "linear");
    }
}

onmessage = (e) => {
    sprites.length = 0;
    printedText = "";
    const code = e.data.code;

    function print(text) {
        printedText += text + "\n";
    }

    const fn = new Function("Sprite", "print", code);
    
    try {
        fn(Sprite, print);

        postMessage({
            type: "success",
            sprites,
            printedText
        });
    } catch (e) {
        postMessage({
            type: "error",
            message: e.message
        });
    }
};