const tvFxContainer = document.createElement('div');
tvFxContainer.className = 'tvFxContainer';
tvFxContainer.ariaHidden = true;
document.body.insertBefore(tvFxContainer, document.body.firstChild);

const scanlines = document.createElement('div');
scanlines.className = 'tvScanline';
scanlines.ariaHidden = true;
document.body.appendChild(scanlines);

const staticImage = document.createElement('img');
staticImage.className = 'tvStatic';
staticImage.src = 'https://upload.wikimedia.org/wikipedia/commons/0/02/Television_static.gif';
staticImage.alt = 'TV Static';
staticImage.ariaHidden = true;
tvFxContainer.appendChild(staticImage);

function tvStaticAnimation() {
    staticImage.style.height = '100vh'
    staticImage.style.transition = '';
    staticImage.style.transition = 'opacity 0.5s';
    setTimeout(() => {
        staticImage.style.opacity = 0;
        setTimeout(() => {
            staticImage.style.height = '0';
            staticImage.style.opacity = 1;
            staticImage.style.transition = 'opacity 0.00001s';
        }, 500);
    }, 15);
}