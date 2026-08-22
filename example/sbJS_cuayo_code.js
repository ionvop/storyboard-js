let t = 1.3;
let b = 60/175;

function mulberry32(a) {
    return function() {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

let rng = mulberry32(1);

function squish(sprite, t, l=1, m=0.1) {
    let s = sprite.sample(t);
    sprite.scaleX(t, s.sizeH+m, b*0.5*l, "o");
    sprite.scaleY(t, s.sizeV-m, b*0.5*l, "o");
    sprite.scaleX(t + b*0.5, s.sizeH, b*1.5*l, "i");
    sprite.scaleY(t + b*0.5, s.sizeV, b*1.5*l, "i");
}

function conveyor(t, n) {
    for (let i = 0; i < n; i++) {
        let cuayo = new Sprite("normal", {y: -0.6, size: 0.5});
        cuayo.moveY(t, 0.5, b, "o");
        squish(cuayo, t, 0.25, -0.5);
        squish(cuayo, t+b);
        cuayo.moveX(t+b, 0, b, "o");
        cuayo.moveX(t+b*3, -0.5, b, "o");
        t += b*2;
    }
}

function scene1(t) {
    let cuayo = new Sprite("normal", {size: 0.5, alpha: 0});
    cuayo.fade(t, 1);
    cuayo.scale(t, 0.6, b*2, "o");
    cuayo.rotate(t, -0.1, b*2, "o");
    squish(cuayo, t);
    t += b*2;
    cuayo.scale(t, 0.7, b*2, "o");
    cuayo.rotate(t, 0.1, b*2, "o");
    squish(cuayo, t);
    t += b*2;
    cuayo.scale(t, 0, b*4, "i");
    cuayo.rotate(t, 0, b*4, "i");
}

function scene2(t) {
    let cuayo = new Sprite("cry", {x: 0.1, y: 0.3, size: 0});
    cuayo.scale(t, 0.3, b, "o");
    cuayo.moveX(t, 0.2, b*2, "o");
    cuayo.scale(t+b, 0, b*4, "i");
    t += b*1.5;
    cuayo = new Sprite("cry", {x: 0.9, y: 0.3, size: 0, sizeH: -1});
    cuayo.scale(t, 0.3, b, "o");
    cuayo.moveX(t, 0.8, b*2, "o");
    cuayo.scale(t+b, 0, b*4, "i");
    t += b*1.5;
    cuayo = new Sprite("cry", {x: 0.4, y: 0.7, size: 0});
    cuayo.scale(t, 0.5, b, "o");
    cuayo.moveX(t, 0.5, b, "o");
    cuayo.moveY(t, 0.5, b, "o");
    cuayo.fade(t+b, 0);
}

function scene3(t) {
    cuayo = new Sprite("cry", {size: 0});
    cuayo.scale(t, 0.7, b, "o");
    cuayo.scale(t+b, 0, b*3, "i");
    squish(cuayo, t, 1, 0.5);
    t += b*2;
    cuayo = new Sprite("smile", {y: 2});
    cuayo.moveY(t, 0.5, b, "o");
    cuayo.scale(t, 0.5, b*2, "i");
    cuayo.fade(t+b*2, 0);
}

function scene4(t) {
    for (let x of [0.2, 0.4, 0.6, 0.8]) {
        cuayo = new Sprite("normal", {x: x, y: 1.3, size: 0.2});
        cuayo.moveY(t, 0.7, b, "o");
        cuayo.moveY(t+b, 1.3, b, "i");
        t += b/2;
    }

    cuayo = new Sprite("smile", {y: 1.6, size: 0.3});
    cuayo.moveY(t, 0.5, b, "o");
    cuayo.scale(t+b, 0.5, b, "o");
    cuayo.fade(t+b*2, 0);
}

function scene5(t) {
    let cuayo = new Sprite("normal", {size: 0, angle: -0.5});
    cuayo.rotate(t, 0.5, b*14);
    let t2 = t;
    
    for (let i = 0; i < 14*4; i++) {
        let s = cuayo.sample(t);
        let cuayo2 = new Sprite(["normal", "smile", "cry"][i % 3], {size: 0, angle: s.angle, sizeH: i % 2 == 0 ? 1 : -1});
        cuayo2.scale(t, 0.5, 0.1, "o");
        cuayo2.scale(t+0.1, 2, b*4-0.1, "i");
        cuayo2.fade(t2+b*15, 0);
        t += b*0.25;
    }
    
    cuayo = new Sprite("smile", {size: 0});
    cuayo.scale(t, 1, b*0.1, "o");
    cuayo.scale(t+b*0.1, 2, b*0.9, "io");
    cuayo.scale(t+b, 0, b, "i");
}

function scene6(t) {
    let cuayo = new Sprite("normal", {size: 0, angle: 0.5});
    cuayo.rotate(t, -0.5, b*14);
    let t2 = t;
    
    for (let i = 0; i < 14*4; i++) {
        let s = cuayo.sample(t);
        let cuayo2 = new Sprite(["normal", "smile", "cry"][i % 3], {size: 0, angle: s.angle, sizeH: i % 2 == 0 ? -1 : 1});
        cuayo2.scale(t, 0.5, 0.1, "o");
        cuayo2.scale(t+0.1, 2, b*4-0.1, "i");
        cuayo2.fade(t2+b*15, 0);
        t += b*0.25;
    }
    
    cuayo = new Sprite("smile", {size: 0, sizeH: -1});
    cuayo.scale(t, 1, b*0.1, "o");
    cuayo.scale(t+b, 2, b*0.25, "o");
    cuayo.scale(t+b*2.25, 0, b*0.5, "o");
}

function scene7(t) {
    let cuayo = new Sprite("normal", {size: 0, angle: -0.5});
    cuayo.rotate(t, 0.5, b*14);
    let t2 = t;
    
    for (let i = 0; i < 14*4; i++) {
        let s = cuayo.sample(t);
        let cuayo2 = new Sprite(["normal", "smile", "cry"][i % 3], {x: 0.35+rng()*0.3, y: 0.35+rng()*0.3, size: 0, angle: s.angle, sizeH: i % 2 == 0 ? 1 : -1});
        cuayo2.scale(t, 0.5, 0.1, "o");
        cuayo2.scale(t+0.1, 2, b*4-0.1, "i");
        cuayo2.fade(t2+b*15, 0);
        t += b*0.25;
    }
    
    cuayo = new Sprite("cry", {size: 0});
    cuayo.scale(t, 2, b, "o");
    cuayo.scale(t+b, 0, b*3, "i");
}

function scene8(t) {
    let t2 = t;
    
    for (let i = 0; i < 16*4; i++) {
        let cuayo = new Sprite(["normal", "smile", "cry"][i % 3], {size: 0, sizeH: i % 2 == 0 ? 1 : -1});
        cuayo.scale(t, 0.5, 0.1, "o");
        cuayo.scale(t+0.1, 2, b*4-0.1, "i");
        cuayo.moveY(t2+b*14, 3, b*2, "i");
        t += b*0.25;
    }
}

function scene9(t) {
    conveyor(t, 5);
    t += b*10;
    
    let cuayo = new Sprite("normal", {y: -0.6, size: 0.5});
    cuayo.moveY(t, 0.5, b, "o");
    squish(cuayo, t, 0.25, -0.5);
    cuayo.fade(t+b*2, 0);
    t += b*2;
    cuayo = new Sprite("cry", {size: 0.5, alpha: 0});
    cuayo.fade(t, 1);
    cuayo.rotate(t, -0.1, b, "o");
    cuayo.scale(t, 0.7, b, "o");
    t += b*1.5;
    cuayo.rotate(t, 0.1, b, "o");
    cuayo.scale(t, 1, b, "o");
    t += b*1.5;
    cuayo.rotate(t, -Math.PI*2, b*1.5, "o");
    cuayo.scale(t, 0.5, b, "o");
    t -= b;
    cuayo.moveX(t+b, 0, b, "o");
    cuayo.moveX(t+b*3, -0.5, b, "o");
}

function scene10(t) {
    conveyor(t, 6);
    t += b*12;
    scene4(t);
    t += b*4;
    let cuayo = new Sprite("smile", {size: 0.5, alpha: 0});
    cuayo.fade(t, 1);
    cuayo.moveY(t, 2, b, "i");
    cuayo.scaleX(t, 2, b, "i");
}

function scene11(t) {
    let t2 = t;
    
    for (let i = 0; i < 6; i++) {
        let cuayo = new Sprite("normal", {y: -0.5, size: 0.5});
        squish(cuayo, t-b, 1, -0.5);
        cuayo.moveY(t-b, 0, b, "o");
        cuayo.moveY(t, 0.5, b, "i");
        cuayo.moveY(t+b, 0.9, b, "o");
        cuayo.moveY(t+b*2, 1.5, b*3, "o");
        t += b*2;
    }
    
    t = t2;
    let cuayo = new Sprite("normal", {size: 0});
    cuayo.moveY(t, 0.1, b*4, "o");
    t += b*4;
    cuayo.moveY(t, 0.9, b*8, "io");
    t += b*8;
    cuayo.moveY(t, 0.5, b*4, "i");
    t = t2;
    let cuayo2 = new Sprite("normal", {y: 0.1, size: 0});
    cuayo2.moveY(t, 0.9, b*8, "io");
    t += b*8;
    cuayo2.moveY(t, 0.1, b*8, "io");
    t = t2;
    
    for (let i = 0; i < 12*4; i++) {
        let s = cuayo.sample(t);
        let s2 = cuayo2.sample(t);
        let oy = rng();
        oy -= 0.5;
        let cuayo3 = new Sprite("normal", {x: -0.2, y: s.y+oy, size: 0.2});
        cuayo3.moveX(t, 1.2, b);
        oy = rng();
        oy -= 0.5;
        cuayo3.moveY(t, s2.y+oy, b);
        t += b*0.25;
    }
    
    cuayo = new Sprite("normal", {y: -0.5, size: 0.5});
    squish(cuayo, t-b, 1, -0.5);
    cuayo.moveY(t-b, 0, b, "o");
    cuayo.moveY(t, 0.5, b, "i");
    cuayo.moveY(t+b, 0.9, b, "o");
    cuayo.scale(t+b*2, 0.9, b, "o");
    cuayo.moveY(t+b*2, 0.8, b, "o");
    cuayo.moveX(t+b*2, 0.4, b, "o");
    cuayo.scale(t+b*3, 2, b, "o");
    cuayo.moveX(t+b*3, 0.2, b, "o");
    cuayo.fade(t+b*4, 0);
    t += b*4;
    cuayo = new Sprite("smile", {x: 0.2, y: 0.8, size: 2.1, alpha: 0});
    cuayo.fade(t, 1);
    cuayo.fade(t, 0, b*16, "i");
}

function sequence1(t) {
    for (let scene of [scene1, scene2, scene1, scene3]) {
        scene(t);
        t += b*4;
    }
}

function sequence2(t) {
    for (let scene of [scene1, scene2, scene1, scene4]) {
        scene(t);
        t += b*4;
    }
}

function sequence3(t) {
    for (let scene of [scene1, scene1, scene1, scene4]) {
        scene(t);
        t += b*4;
    }
}

function sequence4(t) {
    scene5(t);
    t += b*16;
    scene6(t);
    t += b*16;
    scene7(t);
    t += b*16;
    scene8(t);
}

function sequence5(t) {
    scene9(t);
    t += b*16;
    scene10(t);
    t += b*16;
    scene9(t);
    t += b*16;
    scene11(t);
}

function bgScene1(t) {
    for (let i = 0; i < 32; i++) {
        let magenta = new Sprite("magenta", {size: 0});
        magenta.scale(t, 2, b*2, "o");
        let white = new Sprite("white", {size: 0});
        white.scale(t+b*0.25, 2, b*2, "o");
        t += b;
    }
}

function bgScene2(t) {
    let t2 = t;
    
    let cuayo = new Sprite("normal", {y: 0.1, size: 0});
    cuayo.moveY(t, 0.1, b*8, "io");
    t += b*8;
    cuayo.moveY(t, 0.9, b*8, "io");
    t = t2;
    
    let cuayo2 = new Sprite("normal", {size: 0});
    cuayo2.moveY(t, 0.9, b*4, "o");
    t += b*4;
    cuayo2.moveY(t, 0.1, b*8, "io");
    t += b*8;
    cuayo2.moveY(t, 0.5, b*4, "i");
    t = t2;
    
    for (let i = 0; i < 12*4; i++) {
        let s = cuayo.sample(t);
        let s2 = cuayo2.sample(t);
        let oy = rng();
        oy -= 0.5;
        let cuayo3 = new Sprite("normal", {x: 1.2, y: s.y+oy/2, size: 0.1, sizeH: -1});
        cuayo3.moveX(t, -0.2, b*2);
        oy = rng();
        oy -= 0.5;
        cuayo3.moveY(t, s2.y+oy/2, b*2);
        t += b*0.25;
    }
}

function bg(t) {
    t += b*32;
    bgScene1(t);
    t = b*180;
    bgScene2(t);
}

function mg(t) {
    let cuayo = new Sprite("normal", {size: 3, alpha: 0});
    cuayo.fade(0, 1, t);
    cuayo.scale(0, 0.5, t, "i");
    cuayo.fade(t, 0);
    sequence1(t);
    t += b*16;
    sequence2(t);
    t += b*16;
    sequence1(t);
    t += b*16;
    sequence3(t);
    t += b*16;
    sequence4(t);
    t += b*64;
    sequence5(t);
}

bg(t);
mg(t);