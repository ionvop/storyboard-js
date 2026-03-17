const sprites = [];
let printedText = "";

class Sprite {
    constructor(imageName, initialProperties = {}) {
        this.name = imageName;
        this.events = [];
        this.initialProperties = initialProperties;
        sprites.push(this);
    }

    _set(type, startTime, targetValue, duration = 0, easing = "linear") {
        this.events.push({ type, startTime, targetValue, duration, easing });
    }

    _lerp(a, b, t) {
        return a + (b - a) * t;
    }

    _ease(t, type) {
        switch (type) {
            case "easeIn":
            case "i":
                return t * t;
            case "easeOut":
            case "o":
                return 1 - (1 - t) * (1 - t);
            case "easeInOut":
            case "io":
                return t < 0.5
                    ? 2 * t * t
                    : 1 - Math.pow(-2 * t + 2, 2) / 2;
            default: return t;
        }
    }

    sample(time) {
        const properties = {
            x: 0.5,
            y: 0.5,
            size: 1,
            angle: 0,
            alpha: 1,
            additive: 0,
            sizeH: 1,
            sizeV: 1
        };

        for (const key in this.initialProperties) {
            properties[key] = this.initialProperties[key];
        }

        const sortedEvents = this.events.toSorted((a, b) => a.startTime - b.startTime);

        for (const key in properties) {
            const events = sortedEvents.filter(e => e.type == key);

            for (const event of events) {
                if (event.startTime > time) break;

                if (event.startTime + event.duration > time) {
                    if (event.duration == 0) {
                        properties[key] = event.targetValue;
                        continue;
                    }

                    const t = (time - event.startTime) / event.duration;
                    const eased = this._ease(t, event.easing);
                    properties[key] = this._lerp(properties[key], event.targetValue, eased);
                    continue;
                }

                properties[key] = event.targetValue;
            }
        }

        return properties;
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

    fade(startTime, targetValue, duration = 0, easing = "linear") {
        this._set("alpha", startTime, targetValue, duration, easing);
    }

    additive(startTime, targetValue) {
        this._set("additive", startTime, targetValue, 0, "linear");
    }

    scaleX(startTime, targetValue, duration = 0, easing = "linear") {
        this._set("sizeH", startTime, targetValue, duration, easing);
    }

    scaleY(startTime, targetValue, duration = 0, easing = "linear") {
        this._set("sizeV", startTime, targetValue, duration, easing);
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