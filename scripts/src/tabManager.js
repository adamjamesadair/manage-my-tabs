String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

/*
* Checks if a DOM element is overflown
*
* @param element
*   The element to check for overflow.
*
* @return {boolean}
*   True if the element is overflown.
*/
function isOverflown(element) {
    return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}

class TabManager {
  constructor() {
    this.managerTab = null;
    this.openTabs = [];
    this.closedTabs = [];
  }

  /*
  * Groups tabs into TabGroups.
  *
  * @param {array} tabs
  *   List of chrome.tabs to be grouped.
  *
  * @param {chrome.tab} extensionTab
  *   The tab manager extention tab.
  *
  * @param {boolean} IncludeExtensionTab
  *   True if the extension tab should be included in the tabs.
  *
  * @return {array}
  *   List of TabGroup objects.
  */
  getTabGroups(tabs, extensionTab, includeExtensionTab) {
    let tabGroups = [];
    for (let tab of tabs) {
      if (tab.url !== extensionTab.url || includeExtensionTab) {
        tab.url = new URL(tab.url);
        tab.url.hostname = tab.url.hostname.replace(/^www\./,'');
        let added = false;
        for (let tabGroup of tabGroups){
          if (tabGroup.hostname == tab.url.hostname){
            tabGroup.addTab(tab);
            added = true;
          }
        }
        if (!added)
          tabGroups.push(new TabGroup(tab.url.hostname, [tab]));
      }
    }
    return tabGroups;
  }

  createHTMLContent(windows, tabGroups, extensionTab) {
    chrome.storage.local.get(['col', 'tabCount'], (settings) => {

      let col = settings['col'] ? settings['col'] : 3;

      // Generate button for switching windows
      let winSection = document.getElementsByClassName("window-selection")[0];
      winSection.innerHTML = 'Select Window: ';
      for (let i=1; i <= windows.length; i++){
        let winBtn = document.createElement('button');
        winBtn.innerHTML = i;
        winBtn.setAttribute('class', 'window-select-btn');

        // Add event listener
        winBtn.addEventListener('click', () => {
          chrome.storage.local.set({'winSrc':i-1});
          document.getElementById("search-input").value = "";
          this.reloadPage();
        });
        winSection.appendChild(winBtn);
        if (isOverflown(winSection)){
          winSection.style.top = '-3.6rem';
        } else {
          winSection.style.top = '-2.4rem';
        }
      }

      // Generate tabGroups
      document.getElementsByClassName('row')[0].innerHTML = '';
      for (let tabGroup of tabGroups){
        let group = document.createElement('div');
        let title = document.createElement('h1');
        let closeGroupBtn = document.createElement('div');
        closeGroupBtn.appendChild(document.createTextNode('X'));
        closeGroupBtn.setAttribute('class', 'closeGroupBtn');
        group.appendChild(closeGroupBtn);
        let className = 'col-' + col;

        title.setAttribute('class', 'tab-title');
        group.setAttribute('class', 'tab-group ' + className);
        group.setAttribute('id', tabGroup.hostname);

        title.innerText = settings['tabCount'] ? "(" + tabGroup.tabs.length + ")" + tabGroup.hostname.capitalize()
                                   : tabGroup.hostname.capitalize();
        group.appendChild(title);

        let img = document.createElement('IMG');
        img.setAttribute('class', 'icon');
        img.src = tabGroup.tabs[0].favIconUrl;
        title.appendChild(img);

        // Add event listener for closing tab group button
        closeGroupBtn.addEventListener('click', () => {
          for (let i=0; i < tabGroup.tabs.length; i++) {
            chrome.tabs.remove(tabGroup.tabs[i].id);
          }
          group.remove();
        });

        // Generate tabs
        for (let i=0; i < tabGroup.tabs.length; i++) {
          let currentTab = tabGroup.tabs[i];

          let tab = document.createElement('div');
          let tabContainer = document.createElement('div');

          tab.setAttribute('class', 'tab');
          tab.setAttribute('title', currentTab.title);
          tabContainer.setAttribute('class', 'tabContainer');

          let closeBtn = document.createElement('div');
          closeBtn.appendChild(document.createTextNode('X'));
          closeBtn.setAttribute('class', 'closeBtn');

          let tabDescription = document.createElement('p');
          tabDescription.setAttribute('class', 'tabDescription');
          tabDescription.appendChild(document.createTextNode(currentTab.title));
          tab.appendChild(tabDescription);

          tabContainer.appendChild(tab);
          tabContainer.appendChild(closeBtn);
          group.appendChild(tabContainer);

          // Add event listener for tab
          tab.addEventListener('click', () => {
            chrome.windows.update(currentTab.windowId, {focused: true});
            chrome.tabs.update(currentTab.id, {highlighted: true});
            chrome.tabs.remove(extensionTab.id);
          });

          // Add event listener for close button
          closeBtn.addEventListener('click', () => {
            // Close the selected tab
            chrome.tabs.remove(currentTab.id);
          });
        }
        document.getElementsByClassName('row')[0].appendChild(group);
      }
    });
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
  searchTabGroups(tabGroups, term, scope="both") {
    let newTabGroups = [];
    let newTabGroupTabs = [];
    for (let tabGroup of tabGroups){
      // If website name matches search, add it to results
      if(tabGroup.hostname.toLowerCase().includes(term.toLowerCase()) && scope != "tabs"){
        newTabGroups.push(tabGroup);
      } else if (scope != "url") {
        // Else, check if any tabs match search. If so, add them.
        newTabGroupTabs = [];
        for (let tab of tabGroup.tabs){
          // If tab matches search, add it to results
          if(tab.title.toLowerCase().includes(term.toLowerCase()))
            newTabGroupTabs.push(tab);
        }
        // If at least 1 tab matches the results, add tabGroup to results
        if(newTabGroupTabs.length > 0){
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
  sortTabGroups(tabGroups, method="alphabetically"){
    switch (method){
      case "alphabetically":
        tabGroups.sort((a, b) => a.hostname.localeCompare(b.hostname, {sensitivity: 'base'}));
        break;
      case "leastTabs":
        tabGroups.sort((a, b) => a.tabs.length - b.tabs.length);
        break;
      case "mostTabs":
        tabGroups.sort((a, b) => b.tabs.length - a.tabs.length);
    }
  }

  reloadPage() {
    chrome.windows.getAll({populate: true}, (windows) => {
      chrome.storage.local.get(['sortMethod', 'searchScope', 'winSrc', 'tabCount', 'includeManager'], (settings) => {

        let searchScope = settings['searchScope'] ? settings['searchScope'] : "both";
        let sortMethod = settings['sortMethod'] ? settings['sortMethod'] : "alphabetically";
        let winSource = settings['winSrc'];
        let tabCount = settings['tabCount'];
        let includeManager = settings['includeManager'];

        document.getElementById(searchScope).checked = true;
        document.getElementById(sortMethod).checked = true;
        document.getElementById("toggle-tab-count-settings").checked = tabCount === true;
        document.getElementById("toggle-manager-display-settings").checked = includeManager === true;
        document.getElementById("toggle-window-settings").checked = winSource === 'all';
        let querySettings = {'currentWindow': true};
        if (winSource === 'all'){
          querySettings = {};
        }
        else if (typeof winSource === 'number') {
          if(windows.length - 1 >= winSource){
            querySettings = {'windowId': windows[winSource].id};
          }
        }

        chrome.tabs.query(querySettings, (tabs) => {
          chrome.tabs.getCurrent((extensionTab) => {

            this.managerTab = extensionTab;

            // Array holding the tabGroups
            let tabGroups = this.getTabGroups(tabs, extensionTab, includeManager === true);

            // If the manager tab is the last tab in all windows, close
            if (windows.length == 1){
              if (windows[0].tabs.length == 1){
                if (windows[0].tabs[0].id === this.managerTab.id){
                  chrome.tabs.remove(this.managerTab.id);
                }
              }
            }

            // Sort the tabGroups alphabetically
            this.sortTabGroups(tabGroups, sortMethod);

            // Sort the tabs in each tabGroup
            for (let tabGroup of tabGroups) {
              tabGroup.sortTabs("alphabetically");
            }

            // Update open tabs
            this.openTabs = [];
            for (let tabGroup of tabGroups){
              for (let tab of tabGroup.tabs){
                this.openTabs.push(tab);
              }
            }

            // Generate HTML content
            this.createHTMLContent(windows, tabGroups, extensionTab);

            // Add listener for seach bar
            let searchBar = document.getElementById("search-input");
            let upperContext = this;
            searchBar.addEventListener('keyup', function() {
              tabGroups = upperContext.getTabGroups(tabs, extensionTab, includeManager === true);
              // Sort the tabGroups alphabetically
              upperContext.sortTabGroups(tabGroups, sortMethod);
              // Sort the tabs in each tabGroup
              for (let tabGroup of tabGroups) {
                tabGroup.sortTabs("alphabetically");
              }
              upperContext.createHTMLContent(windows, upperContext.searchTabGroups(tabGroups, this.value, searchScope), extensionTab);
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
    if (this.closedTabs.length > 0){
      tab = this.closedTabs.pop();
      chrome.windows.getAll((windows) => {
        // Check if the window the tab came from exsits
        for (let win of windows) {
          if (win.id === tab.windowId)
            winExists = true;
        }
        // If the window no longer exists, make a new window with that tab
        if (!winExists){
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
      });
    }
  }
}
