function renderWindow(windowId) {
  return `
    <div id="windowWithTabGroups-${windowId}" class="row container window"></div>
  `;
}

function renderWindowTitle(wid, customTitle = "") {
  let title = customTitle || "Window " + wid;
  return `<h2 class="window-title">${title}</h2>`;
}

function renderTabGroup(tabGroup, className, favIconUrl) {
  return `
      <div id="tg-${tabGroup.id}" class="tab-group ${className}">
        <h1 class="tab-title">${tabGroup.title}
        <img class="icon" src=${favIconUrl} />
        </h1>
        <div class="closeGroupBtn close-btn">X</div>
      </div>
    `;
}

function renderTab(tab) {
  return `
      <div id="t-${tab.id}" class="tabContainer">
        <div class="tab" title=${tab.title}>
          <p class="tabDescription">${tab.title}</p>
        </div>
        <div class="close-tab-btn close-btn">X</div>
        <div class="tab-options-btn">
          <i class="fas fa-ellipsis-h"></i>
          <div class="dropdown-content">
          <ul class="nav flex-column">
            <li id="reload" class="nav-item">
              <a class="nav-link tab-option" href="#">Reload</a>
            </li>
            <li id="suspend" class="nav-item">
              <a class="nav-link tab-option" href="#">Suspend</a>
            </li>
            <li id="send" class="nav-item">
              <a class="nav-link tab-option" href="#">Send to Window</a>
            </li>
          </ul>
          </div>
        </div>
      </div>
    `;
}

function renderCloseWinBtn() {
  return `<div class="closeWindowBtn close-btn">X</div>`;
}

function renderBtn(id) {
  return `<button id="win-btn-${id}" class="window-select-btn win-btn generated-win-btn" type="button">${id}</button>`;
}

function renderNoSearchResultsText() {
  return `<h3 id="no-match-search">No matches for your search term :(</h3>`;
}

function renderCloseAllBtn() {
  return `<div class="closeAllBtn close-btn">X</div>`;
}

function generateWindows(tabGroups) {
  let $windowContainer = $('.window-container');
  $windowContainer.empty();

  let windowIds = _.keys(_.groupBy(tabGroups, (tg) => tg.windowId));

  $windowContainer.append(renderNoSearchResultsText());
  for (let wid of windowIds) {
    $windowContainer.append(renderWindow(wid));
  }
}

function generateTabGroupsByWindow(windows, tabGroups, className, tabCount) {
  let windowIds = [];
  windows.forEach(function(win) {
    windowIds.push(win.id);
  });

  let $tabGroupContainer = $('.window');
  $tabGroupContainer.empty();

  let tabGroupsByWindow = _.groupBy(tabGroups, (tg) => tg.windowId);

  for (let tgs in tabGroupsByWindow) {
    $element = $('#windowWithTabGroups-' + tgs);
    $element.empty();

    $element.append(renderWindowTitle(windowIds.indexOf(parseInt(tgs)) + 1));
    $element.append(renderCloseWinBtn());

    function renderThisTabGroup(tg) {
      return new Promise(function(resolve, reject) {
        if (!$element.length) {
          reject();
        }
        $element.append(renderTabGroup(tg, className, tg.tabs[0].favIconUrl));
        resolve();
      });
    }

    let promisesTabGroups = [];
    for (let tg of tabGroupsByWindow[tgs]) {
      promisesTabGroups.push(renderThisTabGroup(tg));
    }

    Promise.all(promisesTabGroups).then(function() {
      // console.log('All tab groups have been rendered!');
    }).catch(function() {
      console.log('Oh no, epic failure!');
    });
  }
}

function generateTabGroups(tabGroups, className, tabCount, winSrc, addCloseBtn = false, empty = true) {
  let $windowContainer = $('.window-container');
  if (empty) $windowContainer.empty();
  $windowContainer.append(renderNoSearchResultsText());
  $windowContainer.append(renderWindow(winSrc));
  $tabGroupContainer = $('#windowWithTabGroups-' + winSrc);
  if (addCloseBtn) $tabGroupContainer.append(renderCloseAllBtn());
  let title = winSrc == 'all' ? 'All tabs' : "Window " + winSrc;
  $tabGroupContainer.append(renderWindowTitle(0, customTitle = title));
  for (let tabGroup of tabGroups) {
    $tabGroupContainer.append(renderTabGroup(tabGroup, className, tabGroup.tabs[0].favIconUrl));
  }
}

function generateTabs(tabGroups) {
  for (let tabGroup of tabGroups) {
    function renderThisTab(t) {
      return new Promise(function(resolve, reject) {
        let $selector = $('#tg-' + tabGroup.id);
        if (!$selector.length) {
          reject();
        }
        $selector.append(renderTab(t));
        resolve();
      });
    }

    let promisesTabs = [];
    for (let tab of tabGroup.tabs) {
      promisesTabs.push(renderThisTab(tab));
    }

    Promise.all(promisesTabs).then(function() {
      // console.log('All tabs have been rendered!');
    }).catch(function() {
      console.log('Oh no, epic failure!');
    });
  }
}

function generateWinSelectBtns(windows, btnName) {
  let $winSection = $(".window-selection");

  $(".generated-win-btn").remove();
  $("#win-btn-all").removeClass('window-select-active').addClass('window-select-btn');

  for (let i = 1; i <= windows.length; i++) {
    $winSection.append($(renderBtn(i)));

    let top = isOverflown($winSection) ? '-3.6rem' : '-2.4rem';
    $winSection.css({
      'top': top
    });
  }

  $("#win-btn-" + btnName).toggleClass('window-select-btn window-select-active');
}
