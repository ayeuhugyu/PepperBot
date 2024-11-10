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
        toggleSidebarButton.style.right = '5px';
    } else {
        sidebarIsShowing = true;
        sidebarContainer.style.display = 'flex';
        toggleSidebarButton.style.right = '147px';
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
createSidebarButton('/pepperbot', '/pepperbot');
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

function checkMobileMode() {
    if (window.innerWidth < 768) {
        if (sidebarIsShowing) {
            toggleSidebar();
        }
    }
}

checkMobileMode();
window.addEventListener("resize", checkMobileMode);