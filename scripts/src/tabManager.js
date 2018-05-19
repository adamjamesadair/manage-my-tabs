function isOverflown(element) {
  return element.prop('scrollWidth') > element.width();
}

class TabManager {
  constructor() {
    this.managerTab = null;
    this.tabGroups = [];
    this.openTabs = [];
    this.closedTabs = [];
    this.windows = [];
    this.currentWin = {};
    this.settings = {};
    chrome.storage.local.set({
      'winSrc': 'first'
    });
  }

  getTabGroups() {
    this.tabGroups = [];
    let tabGroupIDs = [];
    for (let tab of this.openTabs) {
      if (tab.url !== this.managerTab.url || this.settings['includeManagerTab']) {
        tab.url = strToURL(tab.url);

        for (let tabGroup of this.tabGroups) {
          if (tabGroup.hostname == tab.url.hostname)
            tabGroup.addTab(tab);
        }
        let tabGroup = new TabGroup(tab.url.hostname, this.settings['tabCount'], [tab]);
        this.tabGroups.forEach((tabGroup)=>{tabGroupIDs.push(tabGroup.id)});
        if (!tabGroupIDs.includes(tabGroup.id))
          this.tabGroups.push(tabGroup);
      }
    }
  }

  renderHTMLContent() {
    let tabGroups = this.searchTabGroups($("#search-input").val(), this.settings['searchScope']);

    generateWinSelectBtns(this.windows, this.settings['winSrc']);
    generateTabGroups(tabGroups, 'col-' + this.settings['col'], this.settings['tabCount']);
    generateTabs(tabGroups);
  }

  /*
   * Searches the given tab groups and/or tabs for the search term.
   *
   * @param {array} tabGroups
   *   List of TabGroup objects to search through.
   *
   * @param {string} term
   *   The term to search for in the tabs and TabGroups.
   *
   * @param {string} scope
   *   Scope to search. Options: "url", "tabs" or "both"
   *
   * @return {array}
   *   List of TabGroups that match match the search.
   */
  searchTabGroups(term, scope = "both") {
    let newTabGroups = [];
    let newTabGroupTabs = [];
    for (let tabGroup of this.tabGroups) {
      // If website name matches search, add it to results
      if (tabGroup.hostname.toLowerCase().includes(term.toLowerCase()) && scope != "tabs") {
        newTabGroups.push(tabGroup);
      } else if (scope != "url") {
        // Else, check if any tabs match search. If so, add them.
        newTabGroupTabs = [];
        for (let tab of tabGroup.tabs) {
          // If tab matches search, add it to results
          if (tab.title.toLowerCase().includes(term.toLowerCase()))
            newTabGroupTabs.push(tab);
        }
        // If at least 1 tab matches the results, add tabGroup to results
        if (newTabGroupTabs.length > 0) {
          let newTabGroup = tabGroup;
          newTabGroup.tabs = newTabGroupTabs;
          newTabGroups.push(newTabGroup);
        }
      }
    }
    return newTabGroups;
  }

  /*
   * Sorts a given list of TabGroups using the indicated method.
   *
   * @param {array} tabGroups
   *   List of TabGroup objects to be sorted.
   *
   * @param {string} method
   *   Method for sorting. Options: "alphabetically", "leastTabs", "mostTabs". Default: "alphabetically".
   */
  sortTabGroups(method = "alphabetically") {
    switch (method) {
      case "alphabetically":
        this.tabGroups.sort((a, b) => a.hostname.localeCompare(b.hostname, {
          sensitivity: 'base'
        }));
        break;
      case "leastTabs":
        this.tabGroups.sort((a, b) => a.tabs.length - b.tabs.length);
        break;
      case "mostTabs":
        this.tabGroups.sort((a, b) => b.tabs.length - a.tabs.length);
    }
  }


  reloadPage() {
    chrome.windows.getAll({
      populate: true
    }, (windows) => {
      chrome.windows.getCurrent((current) => {
        this.windows = windows;
        this.currentWin = current;
        chrome.storage.local.get(['sortMethod', 'searchScope', 'winSrc', 'tabCount', 'includeManager', 'col'], (settings) => {
          let [searchScope, sortMethod, winSrc, tabCount, includeManager, col, querySettings] = initSettings(this, settings);

          chrome.tabs.query(querySettings, (tabs) => {
            chrome.tabs.getCurrent((managerTab) => {

              this.openTabs = tabs;
              this.managerTab = managerTab;

              // Array holding the tabGroups
              this.getTabGroups();

              // If the manager tab is the last tab in all windows, close
              if (windows.length == 1 && windows[0].tabs.length == 1 && windows[0].tabs[0].id === this.managerTab.id)
                chrome.tabs.remove(this.managerTab.id);

              this.sortTabGroups(sortMethod);

              // Sort the tabs in each tabGroup
              for (let tabGroup of this.tabGroups) {
                tabGroup.sortTabs("alphabetically");
              }
              this.renderHTMLContent();
              addListeners(this);
            });
          });
        });
      });
    });
  }

  /*
   * Reopens the most recently closed tab.
   */
  reopenLastClosed() {
    let winExists = false;
    if (this.closedTabs.length > 0) {
      tab = this.closedTabs.pop();
      // Check if the window the tab came from exsits
      for (let win of this.windows) {
        if (win.id === tab.windowId)
          winExists = true;
      }
      // If the window no longer exists, make a new window with that tab
      if (!winExists) {
        chrome.windows.create({
          url: tab.url.href,
          focused: true
        });
      } else {
        // else make the tab in its original window
        chrome.tabs.create({
          windowId: tab.windowId,
          url: tab.url.href,
          active: false
        });
      }
    }
  }
}

function renderTabGroup(tabGroup, className, favIconUrl) {
  return `
      <div id="${tabGroup.id}" class="tab-group ${className}">
      <h1 class="tab-title">${tabGroup.title}
      <img class="icon" src=${favIconUrl} />
      </h1>
      <div class="closeGroupBtn">X</div>
      </div>
    `;
}

function renderTab(tab) {
  return `
      <div id=${tab.id} class="tabContainer">
      <div class="tab" title=${tab.title}>
      <p class="tabDescription">${tab.title}</p>
      </div>
      <div class="closeBtn">X</div>
      </div>
    `;
}

function renderBtn(id){
  return `<button id="win-btn-${id}" class="window-select-btn win-btn generated-win-btn" type="button">${id}</button>`;
}

function generateTabGroups(tabGroups, className, tabCount) {
  let $tabGroupContainer = $('.tabgroup-container');
  $tabGroupContainer.empty();
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

function generateWinSelectBtns(windows, btnName){
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

function addTabGroupListeners(tabGroup) {
  $('#' + tabGroup.id + ' .closeGroupBtn').on('click', () => {
    for (let i = 0; i < tabGroup.tabs.length; i++) {
      chrome.tabs.remove(tabGroup.tabs[i].id);
    }
    $(tabGroup.hostname).remove();
  });
}

function addTabListeners(tab) {
  // Add event listener to tab
  $('#' + tab.id + ' .tab').on('click', () => {
    chrome.windows.update(tab.windowId, {
      focused: true
    });
    chrome.tabs.update(tab.id, {
      highlighted: true
    });
  });

  // Add event listener for close button
  $('#' + tab.id + ' .closeBtn').on('click', () => {
    // Close the selected tab
    chrome.tabs.remove(tab.id);
  });
}

function addListeners(tabManager) {
  // Add listeners for window select buttons
  for ($winBtn of $(".win-btn")) {
    let btnID = $winBtn.id.split('-')[2];
    $('#win-btn-' + btnID).on('click', () => {
      chrome.storage.local.set({
        'winSrc': btnID
      });
      $("#search-input").val('');
      tabManager.reloadPage();
    });
  }

  // Add listeners for tabGroups and tabs
  for(tabGroup of tabManager.tabGroups){
    addTabGroupListeners(tabGroup);
    tabGroup.tabs.forEach(addTabListeners);
  }

  // Add listener for seach bar
  $("#search-input").keyup(function() {
    if($("#search-input").val() == ''){
      tabManager.reloadPage();
    }else {
      tabManager.renderHTMLContent();
    }
  });
}

/*
 * Sorts and arranges the tabs of a given window.
 *
 * @param {chrome.window} win
 *  The window to arrange.
 */
function arrangeWindowTabs(win) {
  let tabs = win.tabs;
  for (let tab of tabs) {
    tab.url = strToURL(tab.url);
  }
  // Sort the tabs alphabetically
  tabs.sort((a, b) => a.url.hostname.localeCompare(b.url.hostname, {
    sensitivity: 'base'
  }));

  // Move the tabs to their proper locations
  for (let i in tabs) {
    chrome.tabs.move(tabs[i].id, {
      index: parseInt(i)
    });
  }
}

/*
 * Converts the string of a url to URL type.
 *
 * @param {string} str
 *   The string to convert.
 *
 * @param {bool} hostname
 *   true to remove the 'www.' from the url's hostname. Default: true.
 *
 * @return {URL} url
 *  The converted URL.
 */
function strToURL(str, hostname = true) {
  let url = new URL(str);
  if (hostname) {
    if (url.hostname.includes('.')) {
      url.hostname = url.hostname.replace(/^www\./, '');
    }
  }
  return (url);
}

function initSettings(tabManager, settings){
  let searchScope = settings['searchScope'] ? settings['searchScope'] : "both";
  let sortMethod = settings['sortMethod'] ? settings['sortMethod'] : "alphabetically";
  let winSrc = settings['winSrc'];
  let tabCount = settings['tabCount'];
  let includeManager = settings['includeManager'];
  let col = settings['col'] ? settings['col'] : 3;

  document.getElementById(searchScope).checked = true;
  document.getElementById(sortMethod).checked = true;
  document.getElementById("toggle-tab-count-settings").checked = tabCount === true;
  document.getElementById("toggle-manager-display-settings").checked = includeManager === true;

  // Set the starting active button for column layout settings
  let colNum = 12/settings['col'];
  let layoutOptions = document.getElementsByClassName("layout-option");
  for(layoutOption of layoutOptions){
    if (layoutOption.id == colNum) {
      layoutOption.setAttribute('class', 'layout-option-active');
    }
  }

  let querySettings = {
    'currentWindow': true
  };
  if (winSrc === 'all') {
    querySettings = {};
  }
  // Default to the current window
  else if (winSrc === 'first') {
    for (var i = 0; i < tabManager.windows.length; i++) {
      if (tabManager.windows[i].id === tabManager.currentWin.id) {
        winSrc = i + 1;
        chrome.storage.local.set({
          'winSrc': winSrc
        });
      }
    }
  } else {
    let winSource = parseInt(winSrc);
    querySettings = {
      'windowId': tabManager.windows[winSource - 1].id
    };
  }
  tabManager.settings = {
    'searchScope': searchScope,
    'sortMethod': sortMethod,
    'winSrc': winSrc,
    'tabCount': tabCount,
    'includeManager': includeManager,
    'col': col
  };

  return [searchScope, sortMethod, winSrc, tabCount, includeManager, col, querySettings];
}
