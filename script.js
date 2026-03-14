const btnNew = document.getElementById("btnNew");
const btnOpen = document.getElementById("btnOpen");
const btnSave = document.getElementById("btnSave");
const btnRender = document.getElementById("btnRender");
const btnHelp = document.getElementById("btnHelp");
const inputEditor = document.getElementById("inputEditor");
const splitCode = document.getElementById("splitCode");
const panelStatus = document.getElementById("panelStatus");
const splitColumn = document.getElementById("splitColumn");
const panelContainer = document.getElementById("panelContainer");
const canvasRender = document.getElementById("canvasRender");
const audMusic = document.getElementById("audMusic");
const splitRow = document.getElementById("splitRow");
const btnMusic = document.getElementById("btnMusic");
const btnNewSprite = document.getElementById("btnNewSprite");
const panelSprites = document.getElementById("panelSprites");
const sandbox = new Worker("sandbox.js");
const ctx = canvasRender.getContext("2d");
const buffer = document.createElement("canvas");
const bufferCtx = buffer.getContext("2d");
const imageCache = new Map();

const data = {
    music: null,
    sprites: [],
    scene: new Scene()
};

const highlight = editor => {
    editor.innerHTML = Prism.highlight(editor.textContent, Prism.languages.javascript, 'javascript')
}

const jar = new codejarCompat.CodeJar(inputEditor, highlight, { tab: "    " });
inputEditor.style.whiteSpace = "pre";
inputEditor.style.resize = "none";
buffer.width = 1280;
buffer.height = 720;

jar.onUpdate(code => {
    sandbox.postMessage({ code });
});

jar.updateCode(/*js*/`print("Hello, world!");`);
sandbox.postMessage({ code: jar.toString() });

sandbox.onmessage = (e) => {
    if (e.data.type == "error") {
        panelStatus.textContent = e.data.message;
        panelStatus.style.color = "#f55";
        return;
    }

    panelStatus.textContent = e.data.printedText;
    panelStatus.style.color = "#aaa";
    panelStatus.scrollTop = panelStatus.scrollHeight;
    data.scene.sprites = e.data.sprites;
    requestAnimationFrame(renderFrame);
}

Split({
    columnGutters: [
        {
            track: 1,
            element: splitColumn
        }
    ],
    rowGutters: [
        {
            track: 1,
            element: splitCode
        },
        {
            track: 1,
            element: splitRow
        }
    ],
    onDrag: resizeCanvas
});

resizeCanvas();

function resizeCanvas() {
    const scale = Math.min(panelContainer.offsetWidth / 16, panelContainer.offsetHeight / 9);
    canvasRender.width = 16 * scale * 0.9;
    canvasRender.height = 9 * scale * 0.9;
}

function update() {
    audMusic.src = data.music;
    panelSprites.innerHTML = "";

    for (const sprite of data.sprites) {
        panelSprites.innerHTML += /*html*/`
            <div style="
                display: grid;
                grid-template-columns: max-content 1fr max-content;
                border-bottom: 1px solid #555;">
                <div>
                    <img style="
                        width: 3rem;
                        height: 3rem;
                        object-fit: contain;"
                        src="${sprite.data}">
                </div>
                <div style="
                    display: flex;
                    align-items: center;
                    padding: 1rem;">
                    <input value="${sprite.name}"
                        data-index="${data.sprites.indexOf(sprite)}"
                        onchange="updateSprite(this)">
                </div>
                <div style="
                    display: flex;
                    align-items: center;
                    padding: 1rem;"
                    data-index="${data.sprites.indexOf(sprite)}"
                    onclick="deleteSprite(this)">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M280-120q-33 0-56.5-23.5T200-200v-520q-17 0-28.5-11.5T160-760q0-17 11.5-28.5T200-800h160q0-17 11.5-28.5T400-840h160q17 0 28.5 11.5T600-800h160q17 0 28.5 11.5T800-760q0 17-11.5 28.5T760-720v520q0 33-23.5 56.5T680-120H280Zm148.5-171.5Q440-303 440-320v-280q0-17-11.5-28.5T400-640q-17 0-28.5 11.5T360-600v280q0 17 11.5 28.5T400-280q17 0 28.5-11.5Zm160 0Q600-303 600-320v-280q0-17-11.5-28.5T560-640q-17 0-28.5 11.5T520-600v280q0 17 11.5 28.5T560-280q17 0 28.5-11.5Z"/></svg>
                </div>
            </div>
        `;
    }

    requestAnimationFrame(renderFrame);
}

function updateSprite(element) {
    const index = element.dataset.index;
    data.sprites[index].name = element.value;
    update();
}

function deleteSprite(element) {
    const index = element.dataset.index;
    const name = data.sprites[index].name;
    if (confirm(`Delete ${name}?`) == false) return;
    data.sprites.splice(index, 1);
    update();
}

function getImage(dataUrl) {
    if (!imageCache.has(dataUrl)) {
        const img = new Image();
        img.src = dataUrl;
        imageCache.set(dataUrl, img);
    }

    return imageCache.get(dataUrl);
}

function renderFrame() {
    const render = data.scene.draw(audMusic.currentTime);
    bufferCtx.clearRect(0, 0, buffer.width, buffer.height);

    for (const sprite of render) {
        const spriteData = data.sprites.find((s) => s.name == sprite.name).data;

        const item = {
            img: getImage(spriteData),
            x: sprite.properties.x,
            y: sprite.properties.y,
            size: sprite.properties.size,
            angle: sprite.properties.angle,
            alpha: sprite.properties.alpha
        }
        
        renderSprite(bufferCtx, buffer, item);
    }

    ctx.clearRect(0, 0, canvasRender.width, canvasRender.height);
    ctx.drawImage(buffer, 0, 0, canvasRender.width, canvasRender.height);
}

function renderSprite(ctx, canvas, item) {
    const img = item.img;
    const cx = item.x * canvas.width;
    const cy = item.y * canvas.height;
    const w = img.width * item.size;
    const h = img.height * item.size;
    ctx.save();
    ctx.globalAlpha = item.alpha;
    if (item.additive == 1) ctx.globalCompositeOperation = "lighter";
    ctx.translate(cx, cy);
    ctx.rotate(item.angle);
    ctx.drawImage(img, -w/2, -h/2, w, h);
    ctx.restore();
}

btnNew.onclick = () => {
    if (confirm("New project? All unsaved changes will be lost") == false) return;
    data.music = null;
    data.sprites = [];
    data.scene = new Scene();
    update();
    jar.updateCode(/*js*/`print("Hello, world!");`);
    sandbox.postMessage({ code: /*js*/`print("Hello, world!");` });
}

btnOpen.onclick = () => {
    if (confirm("Open project? All unsaved changes will be lost") == false) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".dat";

    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = () => {
            const encodedData = reader.result;
            const loadData = JSON.parse(atob(encodedData));
            data.music = loadData.music;
            data.sprites = loadData.sprites;
            jar.updateCode(loadData.code);
            sandbox.postMessage({ code: loadData.code });
            update();
        }

        reader.readAsText(file);
    }

    input.click();
}

btnSave.onclick = () => {
    const saveData = {
        music: data.music,
        sprites: data.sprites,
        code: jar.toString()
    }

    const encodedData = btoa(JSON.stringify(saveData));
    const blob = new Blob([encodedData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = "sbJS_Project_" + new Date().toISOString() + ".dat";
    a.href = url;
    a.click();
}

btnRender.onclick = async () => {
    btnRender.style.pointerEvents = "none";
    btnRender.textContent = "Rendering...";
    btnRender.style.color = "#aaa";
    await new Promise((resolve) => setTimeout(resolve, 100));
    const frameCount = Math.floor(audMusic.duration * 60);

    const video = {
        frames: [],
        audio: data.music
    }

    for (let i = 0; i < frameCount; i++) {
        btnRender.textContent = `Rendering... ${i}/${frameCount}`;
        audMusic.currentTime = i / 60;
        renderFrame();
        await new Promise(requestAnimationFrame);
        video.frames.push(buffer.toDataURL("image/png"));
    }

    const encodedData = btoa(JSON.stringify(video));
    const blob = new Blob([encodedData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = "sbJS_Video_" + new Date().toISOString() + ".dat";
    a.href = url;
    a.click();
    btnRender.style.pointerEvents = "";
    btnRender.textContent = "Render";
    btnRender.style.color = "#fff";
}

btnHelp.onclick = () => {
    window.open("help.html", "_blank");
}

audMusic.onplay = () => {
    const frame = () => {
        console.log(audMusic.currentTime);
        requestAnimationFrame(renderFrame);
        
        if (audMusic.paused == false) {
            requestAnimationFrame(frame);
        }
    }

    requestAnimationFrame(frame);
}

audMusic.onseeking = () => {
    if (data.scene == null) return;
    requestAnimationFrame(renderFrame);
}

btnMusic.onclick = () => {
    if (data.music != null && confirm("Replace music?") == false) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";

    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = () => {
            data.music = reader.result;
            update();
        }

        reader.readAsDataURL(file);
    }

    input.click();
}

btnNewSprite.onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = () => {
            let name = "New sprite";
            let suffix = 2;

            while (data.sprites.findIndex((sprite) => sprite.name == name) != -1) {
                name = `New sprite (${suffix})`;
                suffix++;
            }

            data.sprites.push({
                name: name,
                data: reader.result
            });

            update();
        }

        reader.readAsDataURL(file);
    }

    input.click();
}