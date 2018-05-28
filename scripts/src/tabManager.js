class TabManager {
  constructor() {
    this.managerTab = null;
    this.tabGroups = [];
    this.openTabs = [];
    this.closedElements = [];
    this.windows = [];
    this.currentWin = {};
    this.settings = {};
    this.settingsIds = ['closeManagerWhenTabSelected', 'limitTabGroupSize', 'maxTabsPerGroup', 'sortMethod', 'searchScope', 'winSrc', 'tabCount', 'includeManager', 'col'];
  }

  reloadPage() {
    this.loadBrowserData(function(tabManager) {
      tabManager.getTabGroups();
      tabManager.sortTabGroups();
      // Sort the tabs in each tabGroup
      for (let tabGroup of tabManager.tabGroups) {
        tabGroup.sortTabs("alphabetically");
      }
      tabManager.renderHTMLContent();
      addTabManagerListeners(tabManager);
    });
  }

  getTabGroups() {
    this.tabGroups = [];
    // let tabGroupIDs = [];
    for (let tab of this.openTabs) {
      if (tab.url !== this.managerTab.url || this.settings['includeManager']) {
        tab.url = strToURL(tab.url);

        let tabInGroup = false;
        let urlHostnameTabGroups = this.tabGroups.filter((tg) => tg.hostname == tab.url.hostname);

        for (let tabGroup of urlHostnameTabGroups) {
          if (tabGroup.hostname == tab.url.hostname) {
            if (this.settings.limitTabGroupSize && tabGroup.nTabs >= this.settings.maxTabsPerGroup) {
              continue;
            } else {
              tabGroup.addTab(tab);
              tabInGroup = true;
              break
            }
          }
        }

        if (!tabInGroup) {
          let tabGroup = new TabGroup(tab.url.hostname, this.settings['tabCount'], [tab]);
          this.tabGroups.push(tabGroup);
        }
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

  sortTabGroups() {
    let method = this.settings['sortMethod'];
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

  storeSettings() {
    for (let setting of this.settingsIds) {
      let $settingSelector = $("#" + setting);
      let type = $settingSelector.prop("type");
      let property = getSettingProperty(type);
      let onEvent = type === "range" ? 'input' : 'click';
      var that = this;

      $settingSelector.on(onEvent, () => {
        // TODO don't use #slider-value ID
        if (type === "range")
          $("#slider-value").html($settingSelector.prop(property));

        chrome.storage.local.set({
          [setting]: $settingSelector.prop(property)
        });
        that.reloadPage();
      });
    }
  }

  loadSettings(callback) {
    var that = this;
    chrome.storage.local.get(this.settingsIds, function(settings) {
      that.initSettings(settings);
      callback(that);
    });
  }

  loadBrowserData(callback) {
    chrome.windows.getAll({
      populate: true
    }, (windows) => {
      chrome.windows.getCurrent((current) => {
        this.windows = windows;
        this.currentWin = current;
        this.loadSettings((that) => {
          chrome.tabs.query(that.settings['querySettings'], (tabs) => {
            chrome.tabs.getCurrent((managerTab) => {
              that.openTabs = tabs;
              that.managerTab = managerTab;
              callback(that);
            });
          });
        });
      });
    });
  }

  /*
   * Adds the tab to the closedElements if it is not in a closed tab group
   */
  tryAddToClosedElements(tab) {
    const last = _.last(this.closedElements);
    if (last instanceof TabGroup) {
      if (_.contains(last.tabs, tab))
        return
    }
    this.closedElements.push(tab);
  }

  reopenTab(tab) {
    let winExists = false;
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

  reopenTabGroup(tabGroup) {
    for (let tab of tabGroup.tabs) {
      this.reopenTab(tab);
    }
  }

  /*
   * Reopens the most recently closed element.
   */
  reopenLastClosed() {
    let element = this.closedElements.pop();
    if (element === undefined) {
      // TODO: give feedback: the stack is empty
      return;
    } else if (element instanceof TabGroup) {
      this.reopenTabGroup(element);
    } else { // isTab
      this.reopenTab(element);
    }
  }

  onTabClicked() {
    if (this.settings.closeManagerWhenTabSelected) {
      this.close()
    }
  }

  /*
   * Close the tab manager tab
   */
  close() {
    chrome.tabs.remove(this.managerTab.id);
  }

  updateHtmlValues() {
    for (let setting of this.settingsIds) {
      let $settingSelector = $("#" + setting);
      let type = $settingSelector.prop("type");
      let property = getSettingProperty(type);
      $settingSelector.prop(property, this.settings[setting]);
      // TODO don't use #slider-value ID
      if (type === "range")
        $("#slider-value").html($settingSelector.prop(property));
    }

    // Set the starting active button for column layout settings
    let colNum = 12 / this.settings.col;
    let layoutOptions = document.getElementsByClassName("layout-option");
    for (let layoutOption of layoutOptions) {
      if (layoutOption.id == colNum) {
        layoutOption.setAttribute('class', 'layout-option-active');
      }
    }
  }

  setDefaultSettings(settings) {
    this.settings.searchScope = this.settings.searchScope || defaultSettings.searchScope;
    this.settings.sortMethod = this.settings.sortMethod || defaultSettings.sortMethod;
    this.settings.winSrc = this.settings.winSrc || defaultSettings.winSrc;;
    this.settings.includeManager = this.settings.includeManager || defaultSettings.includeManager;
    this.settings.col = this.settings.col || defaultSettings.col;
  }

  initSettings(settings) {
    _.extend(this.settings, settings);
    this.setDefaultSettings();
    this.updateHtmlValues();

    let querySettings = {
      'currentWindow': true
    };
    if (this.settings.winSrc === 'all') {
      querySettings = {};
    }
    // Default to the current window
    else if (this.settings.winSrc === 'first') {
      for (var i = 0; i < this.windows.length; i++) {
        if (this.windows[i].id === this.currentWin.id) {
          this.settings.winSrc = i + 1;
          chrome.storage.local.set({
            'winSrc': this.settings.winSrc
          });
        }
      }
    } else {
      let winSource = parseInt(this.settings.winSrc);
      querySettings = {
        'windowId': this.windows[winSource - 1].id
      };
    }

    _.extend(this.settings, {
      'querySettings': querySettings
    });
  }
}

function isOverflown(element) {
  return element.prop('scrollWidth') > element.width();
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

var defaultSettings = {
  searchScope: "both",
  sortMethod: "alphabetically",
  winSrc: 'first',
  includeManager: false,
  col: 3,
  closeManagerWhenTabSelected: true,
  tabCount: true,
  limitTabGroupSize: true
};
