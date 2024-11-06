const tvFxContainer = document.createElement('div');
tvFxContainer.className = 'tvFxContainer';
document.body.insertBefore(tvFxContainer, document.body.firstChild);

const horizontal = document.createElement('img');
horizontal.className = 'tvLine horizontal';
horizontal.src = '/images/line.svg';
horizontal.alt = 'TV FX';
tvFxContainer.appendChild(horizontal);

const vertical = document.createElement('img');
vertical.className = 'tvLine vertical';
vertical.src = '/images/vline.svg';
vertical.alt = 'TV FX';
tvFxContainer.appendChild(vertical);

const scanlines = document.createElement('img');
scanlines.className = 'tvScanlines';
scanlines.src = 'https://photoshopcafe.com/wp-content/uploads/2011/04/scanlines08.jpg';
scanlines.alt = 'TV SCANLINES';

const static = document.createElement('img');
static.className = 'tvStatic';
static.src = 'https://upload.wikimedia.org/wikipedia/commons/0/02/Television_static.gif';
static.alt = 'TV Static';
tvFxContainer.appendChild(static);

function turnOnTVAnimation() {
    setTimeout(() => {
        horizontal.style.height = '50px'
        setTimeout(() => {
            horizontal.style.height = '300vh';
            horizontal.style.width = '300vw';
            vertical.style.width = '300vw';
            vertical.style.height = '300vh';
            setTimeout(() => {
                horizontal.remove();
                vertical.style.opacity = 0;
                tvFxContainer.appendChild(scanlines);
                setTimeout(() => {
                    vertical.remove();
                    scanlines.style.opacity = 0.15;
                }, 500)
            }, 400);
        }, 750);
    }, 10)
}

function tvStaticAnimation() {
    static.style.transition = '';
    static.style.opacity = 1;
    static.style.transition = 'opacity 0.5s';
    setTimeout(() => {
        static.style.opacity = 0;
    }, 15);
}

function playTVStartAnimation() {
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (!hasVisited) {
        turnOnTVAnimation();
        sessionStorage.setItem('hasVisited', true);
    } else {
        tvStaticAnimation();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    playTVStartAnimation();
});