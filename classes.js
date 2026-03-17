class Scene {
    constructor() {
        this.sprites = [];
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

    draw(time) {
        const sprites = [];

        for (const sprite of this.sprites) {
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

            for (const key in sprite.initialProperties) {
                properties[key] = sprite.initialProperties[key];
            }

            const sortedEvents = sprite.events.toSorted((a, b) => a.startTime - b.startTime);

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

            sprites.push({
                name: sprite.name,
                properties
            });
        }

        return sprites;
    }
}