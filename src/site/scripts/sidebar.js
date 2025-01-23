
let buttonPositionOffsets = {
    open: 0,
    closed: 0
}
let verticalButtonPosition = {
    open: '50vh',
    closed: '50vh'
}

const sidebarContainer = document.createElement('div');
sidebarContainer.id = 'sidebarContainer';
sidebarContainer.className = 'sidebarContainer outlined';
sidebarContainer.ariaHidden = 'true';
sidebarContainer.style.display = 'flex'
document.body.insertBefore(sidebarContainer, document.body.firstChild);

const sidebarTitle = document.createElement('span');
sidebarTitle.id = 'sidebarTitle';
sidebarTitle.className = 'sidebarTitle';
sidebarTitle.innerHTML = 'NAVIGATION';
sidebarTitle.style.fontSize = '1.25em';
sidebarTitle.style.marginBottom = '0'
sidebarTitle.style.color = "var(--highlighted-text-color-light)"
sidebarContainer.appendChild(sidebarTitle);

const sidebarTitleSeperator = document.createElement('div');
sidebarTitleSeperator.id = 'sidebarTitleSeperator';
sidebarTitleSeperator.className = 'sidebarTitleSeperator';
sidebarTitleSeperator.ariaHidden = 'true';
sidebarContainer.appendChild(sidebarTitleSeperator);

let sidebarIsShowing = true;
const boundFunctions = [];

function toggleSidebar() {
    if (sidebarIsShowing) {
        sidebarIsShowing = false;
        sidebarContainer.style.display = 'none';
        toggleSidebarButton.style.top = verticalButtonPosition.closed;
        toggleSidebarButton.style.right = `calc(5px + ${typeof buttonPositionOffsets.closed === "number" ? `${buttonPositionOffsets.closed}px` : buttonPositionOffsets.closed})`;
    } else {
        sidebarIsShowing = true;
        sidebarContainer.style.display = 'flex';
        toggleSidebarButton.style.top = verticalButtonPosition.open;
        toggleSidebarButton.style.right = `calc(147px + ${typeof buttonPositionOffsets.open === "number" ? `${buttonPositionOffsets.open}px` : buttonPositionOffsets.open})`;
    }
    boundFunctions.forEach(fn => fn(sidebarIsShowing));
}

function bindToSidebarToggle(fn) {
    boundFunctions.push(fn);
    fn(sidebarIsShowing);
}

const toggleSidebarButton = document.createElement('button');
toggleSidebarButton.id = 'toggleSidebarButton';
toggleSidebarButton.className = 'toggleSidebarButton';
toggleSidebarButton.innerHTML = '☰';
toggleSidebarButton.onclick = toggleSidebar;
document.body.insertBefore(toggleSidebarButton, document.body.firstChild);

function createSidebarButton(text, href) {
    const sidebarButton = document.createElement('a');
    sidebarButton.id = 'sidebarButton';
    sidebarButton.className = 'sidebarButton';
    if (window.location.pathname == href) sidebarButton.className = 'activatedSidebarButton'
    sidebarButton.href = href;
    sidebarButton.innerHTML = text;
    sidebarContainer.appendChild(sidebarButton);
    return sidebarButton;
}

function createSourceCodeButton() {
    const sidebarButton = createSidebarButton("/source", "https://github.com/ayeuhugyu/pepperbot")
    sidebarButton.className = 'sidebarButton sourceCodeButton'
}

createSidebarButton('/home', '/');
createSidebarButton('/guide', '/guide');
createSidebarButton('/config', '/config');
createSidebarButton('/statistics', '/statistics');
createSidebarButton('/logs', '/logs');
createSidebarButton('/chat', '/chat');
createSidebarButton('/credits', '/credits');
createSidebarButton('/contact', '/contact');
createSidebarButton('/shame', '/shame');
createSidebarButton('/coolsites', '/coolsites');
createSidebarButton('/simulations', '/simulations');
createSidebarButton('/todo', '/todo');
createSidebarButton('/updates', '/updates');
createSourceCodeButton();

document.addEventListener("keydown", (event) => {
    if (event.key === "k" && event.target.tagName !== "INPUT" && event.target.tagName !== "TEXTAREA") {
        toggleSidebar();
    }
});

function setButtonPositionOffset(value, toggledState) {
    if (toggledState) {
        buttonPositionOffsets.open = value;
        if (sidebarIsShowing) {
            toggleSidebarButton.style.right = `calc(147px + ${typeof buttonPositionOffsets.open === "number" ? `${buttonPositionOffsets.open}px` : buttonPositionOffsets.open})`;
        }
    } else {
        buttonPositionOffsets.closed = value;
        if (!sidebarIsShowing) {
            toggleSidebarButton.style.right = `calc(5px + ${typeof buttonPositionOffsets.closed === "number" ? `${buttonPositionOffsets.closed}px` : buttonPositionOffsets.closed})`;
        }
    }
    return buttonPositionOffsets;
}

function setVerticalButtonPosition(value, toggledState) {
    if (toggledState) {
        verticalButtonPosition.open = value;
        if (sidebarIsShowing) {
            toggleSidebarButton.style.top = value
        }
    } else {
        verticalButtonPosition.closed = value;
        if (!sidebarIsShowing) {
            toggleSidebarButton.style.top = value
        }
    }
}

function checkMobileMode() {
    if (window.innerWidth < 768) {
        if (sidebarIsShowing) {
            toggleSidebar();
        }
    }
}

checkMobileMode();
window.addEventListener("resize", checkMobileMode);