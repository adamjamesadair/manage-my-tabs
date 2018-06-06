function renderWindow(windowId) {
  return `
    <div id="windowWithTabGroups-${windowId}" class="row container window">
    </div>
  `;
}

function renderWindowTitle(wid, customTitle="") {
  let title = customTitle || "Window " + wid;
  return `<h2 class="window-title">${title}</h2>`;
}

function renderTabGroup(tabGroup, className, favIconUrl) {
  return `
      <div id="${tabGroup.id}" class="tab-group ${className}">
      <h1 class="tab-title">${tabGroup.title}
      <img class="icon" src=${favIconUrl} />
      </h1>
      <div class="closeGroupBtn close-btn">X</div>
      </div>
    `;
}

function renderTab(tab) {
  return `
      <div id=${tab.id} class="tabContainer">
      <div class="tab" title=${tab.title}>
      <p class="tabDescription">${tab.title}</p>
      </div>
      <div class="close-tab-btn close-btn">X</div>
      </div>
    `;
}

function renderCloseWinBtn() {
  return `<div class="closeWindowBtn close-btn">X</div>`;
}

function renderBtn(id) {
  return `<button id="win-btn-${id}" class="window-select-btn win-btn generated-win-btn" type="button">${id}</button>`;
}

function renderNoSearchResultsText(){
  return `<h3 id="no-match-search">No matches for your search term :(</h3>`;
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
    for (let value of tabGroupsByWindow[tgs]) {
      $element.append(renderTabGroup(value, className, value.tabs[0].favIconUrl));
    }
  }
}

function generateTabGroups(tabGroups, className, tabCount, winSrc, empty = true) {
  let $windowContainer = $('.window-container');
  if (empty) $windowContainer.empty();
  $windowContainer.append(renderNoSearchResultsText());
  $windowContainer.append(renderWindow(winSrc));
  $tabGroupContainer = $('#windowWithTabGroups-' + winSrc);
  let title = winSrc == 'all' ? 'All tabs': "Window " + winSrc;
  $tabGroupContainer.append(renderWindowTitle(0, customTitle=title));
  for (let tabGroup of tabGroups) {
    $tabGroupContainer.append(renderTabGroup(tabGroup, className, tabGroup.tabs[0].favIconUrl));
  }
}

function generateTabs(tabGroups) {
  for (let tabGroup of tabGroups) {
    for (let tab of tabGroup.tabs) {
      $('#' + tabGroup.id).append(renderTab(tab));
    }
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
