function renderWindow(windowId) {
  return `
    <div id="windowWithTabGroups-${windowId}" class="row container window"></div>
  `;
}

function renderWindowTitle(wid, customTitle = "") {
  let title = customTitle || "Window " + wid;
  return `<h2 class="window-title">${title}</h2>`;
}

function renderTabGroup(tabGroup, className) {
  let favIconUrl = tabGroup.tabs[0].favIconUrl;
  let options = [{
    id: 'tg-reload',
    text: 'Reload'
  }, {
    id: 'merge',
    text: 'Merge with Window'
  }];
  return `
      <div id="tg-${tabGroup.id}" class="tab-group ${className}">
        <h1 class="tab-title">${tabGroup.title}
        <img class="icon" src=${favIconUrl} />
        </h1>
        <div class="closeGroupBtn close-btn">X</div>`.concat(renderDropdownOptions('tab-group-options-btn', options))
    .concat(`</div>`);
}

function renderTab(tab) {

  return `<div id="t-${tab.id}" class="tabContainer">`.concat(renderTabContent(tab))
    .concat(`</div>`);
}

function renderTabContent(tab) {
  options = [{
    id: 't-reload',
    text: 'Reload'
  }, {
    id: 'copy',
    text: 'Copy URL'
  }, {
    id: 'merge',
    text: 'Merge with Window'
  }];
  return `<div class="tab" title=${tab.title}>
            <p class="tabDescription">${tab.title}</p>
          </div>
          <div class="close-tab-btn close-btn">X</div>`
    .concat(renderDropdownOptions('tab-options-btn', options));
}

function renderDropdownOptions(className, options) {

  result = `<div class="${className}">
              <i class="fas fa-ellipsis-h"></i>
              <div class="dropdown-content">
                <ul class="nav flex-column">`;
  for (let option of options) {
    result = result.concat(`<li id="${option['id']}" class="nav-item">
      <a class="nav-link tab-option" href="#">${option['text']}</a>
    </li>`);
  }
  result = result.concat(`</ul></div></div>`);
  return result;
}

function renderWinBtns() {
  options = [{
    id: 'w-reload',
    text: 'Reload'
  }, {
    id: 'merge',
    text: 'Merge with Window'
  }];
  return `<div class="closeWindowBtn close-btn">X</div>`.concat(renderDropdownOptions('win-options-btn', options));
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

function renderShortcutModal() {
  let shortcuts = [{
    shortcut: 'U',
    description: 'Undo.'
  }, {
    shortcut: 'S',
    description: 'Toggle settings.'
  }, {
    shortcut: 'A',
    description: 'Arrange tabs.'
  }, {
    shortcut: 'Up Arrow',
    description: 'Select previous window.'
  }, {
    shortcut: 'Down Arrow',
    description: 'Select next window.'
  }, {
    shortcut: '0',
    description: 'View all windows.'
  }];

  let result = `<span id="modal-close" class="close">&times;</span>
                <div class="shortcut-content container">
                  <h1>Shortcuts</h1>
                  <table class="table table-striped">
                    <thead>
                      <tr>
                        <th>Shortcut</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>`;
  for (let shortcut of shortcuts) {
    result = result.concat(`<tr>
                              <td>${shortcut['shortcut']}</td>
                              <td>${shortcut['description']}</td>
                            </tr>`);
  }
  result = result.concat(`</tbody></table></div>`);
  return result;
}

function renderSendTabModal(windows) {
  let result = `<span id="modal-close" class="close">&times;</span>
                <h1>Merge with</h1><div class="select-win-dest-content">
                <ul class="nav flex-column">`;
  let i = 1;

  for (let win of windows) {
    result = result.concat(`<li id="st-${win.id}" class="nav-item">
                    <a class="nav-link tab-option" href="#">Window ${i}</a>
                   </li>`);
    i++;
  }
  result = result.concat(`<li id="st-new" class="nav-item">
                  <a class="nav-link tab-option" href="#">New Window</a>
                 </li>`);
  result = result.concat(`</ul></div>`);
  return result;
}

function renderRestoreTabModal(closedElements) {
  let result = `<span id="modal-close" class="close">&times;</span>
                <div class="restore-container">`;
  if (closedElements.length == 0){
    result = result.concat(`<h1 id="no-closed-elements">No recently closed elements</h1>`);
  } else {
    result = result.concat(`<h1>Click to restore</h1>`);
  }

  for (let element of closedElements) {
    if (element instanceof TabGroup) {
      result = result.concat(renderClosedTabGroup(element));
    } else if (element.type !== undefined) { //isWindow
      result = result.concat(renderClosedWin(element));
    } else { // isTab
      let tg = new TabGroup(element.url.hostname, 1, [element], element.windowId);
      result = result.concat(renderClosedTabGroup(tg, false, true));
    }
  }
  result = result.concat(`</div>`);
  return result;
}

function renderClosedWin(win) {
  let result = `<div id="cwindowWithTabGroups-${win.id}" class="row container window closed-win">`;
  let tabGroups = groupTabs(win.tabs);
  for (let tabGroup of tabGroups) {
    result = result.concat(renderClosedTabGroup(tabGroup, false));
  }
  result = result.concat(`</div>`);
  return result;
}

function renderClosedTabGroup(tg, closed = true, clickTab = false) {
  let closedClass = "";
  if (closed)
    closedClass = " closed-tg";
  let result = `<div id="ctg-${tg.id}" class="tab-group${closedClass} col-4">
    <h1 class="tab-title">${tg.title}
    <img class="icon" src=${tg.tabs[0].favIconUrl} />
    </h1>`;
  for (let tab of tg.tabs) {
    result = result.concat(renderClosedTab(tab, clickTab));
  }
  result = result.concat(`</div>`);
  return result;
}

function renderClosedTab(tab, closed = true) {
  let closedClass = "s";
  if (closed)
    closedClass = " closed-t";
  return `<div id="ct-${tab.id}" class="tabContainer${closedClass}">
                          <div class="tab" title=${tab.title}>
                            <p class="tabDescription">${tab.title}</p>
                          </div></div>`;
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
    $element.append(renderWinBtns());

    function renderThisTabGroup(tg) {
      return new Promise(function(resolve, reject) {
        if (!$element.length) {
          reject();
        }
        $element.append(renderTabGroup(tg, className));
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
    $tabGroupContainer.append(renderTabGroup(tabGroup, className));
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
