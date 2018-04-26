document.addEventListener("DOMContentLoaded", function(e) {
  let tabManager = new TabManager();

  // ----- Add listeners -----

  // Add listener for commands
  chrome.commands.onCommand.addListener(() => {
    tabManager.reopenLastClosed();
  });

  // Add listener for updating tabs
  chrome.tabs.onUpdated.addListener(() => {
    tabManager.reloadPage();
  });

  // Add listner for tabs being removed
  chrome.tabs.onRemoved.addListener((tabID, removedInfo) => {
    for (tab of tabManager.openTabs) {
      if (tab.id == tabID){
        tabManager.closedTabs.push(tab);
      }
    }
    tabManager.reloadPage();
  });

  // Add listner for creating tabs
  chrome.tabs.onCreated.addListener(() => {
    tabManager.reloadPage();
  });

  // Add listener for changing tab focus
  chrome.tabs.onActivated.addListener((activeInfo) => {
    if (tabManager.managerTab.windowId == activeInfo.windowId) {
      chrome.tabs.remove(tabManager.managerTab.id);
    } else {
      tabManager.reloadPage();
    }
  });

  // Add listener for window closing
  chrome.windows.onRemoved.addListener(()=>{
    tabManager.reloadPage();
  });

  // Add listener for undo button
  let undoBtn = document.getElementById("undo-btn");
  undoBtn.addEventListener('click', () => {
    tabManager.reopenLastClosed();
  });

  // Add listener for settings button
  let searchIcon = document.getElementById('settings-icon');
  searchIcon.addEventListener('click', () => {
    let body = document.getElementsByClassName('main-content')[0];
    let settings = document.getElementsByClassName("settings")[0];
    if (settings.style.width != "12rem") {
      body.style.marginLeft = "12rem";
      settings.style.width = "12rem";
    }else {
      body.style.marginLeft = "0rem";
      settings.style.width = "0rem";
    }
  });

  // Add listener for the window settings
  let togglewin = document.getElementById("toggle-window-settings");
  togglewin.addEventListener('click', () => {
    let winSrc = togglewin.checked ? 'all' : 0;
    chrome.storage.local.set({'winSrc':winSrc});
    tabManager.reloadPage();
  });

  // Add listener for tab count settings
  let toggleTabCount = document.getElementById("toggle-tab-count-settings");
  toggleTabCount.addEventListener('click', () => {
    chrome.storage.local.set({'tabCount':toggleTabCount.checked});
    tabManager.reloadPage();
  });

  // Add listener for manager display settings
  let toggleManagerDisplay = document.getElementById("toggle-manager-display-settings");
  toggleManagerDisplay.addEventListener('click', () => {
    chrome.storage.local.set({'includeManager':toggleManagerDisplay.checked});
    tabManager.reloadPage();
  });

  // Add listener for layout options
  let layoutOptions = document.getElementsByClassName("layout-option");
  for(layoutOption of layoutOptions){
    layoutOption.addEventListener('click', (e) => {
      let col = 12/e.target.id;
      chrome.storage.local.set({'col':col});
      tabManager.reloadPage();
    });
  }

  // Add listener for sort options
  let sortOptions = document.getElementsByClassName("sort-option");
  for (let sortOption of sortOptions) {
    sortOption.addEventListener('click', () => {
      chrome.storage.local.set({'sortMethod': sortOption.id});
      tabManager.reloadPage();
    });
  }

  // Add listener for search options
  let searchOptions = document.getElementsByClassName("search-option");
  for (let searchOption of searchOptions){
    searchOption.addEventListener('click', () => {
      chrome.storage.local.set({'searchScope': searchOption.id});
      tabManager.reloadPage();
    });
  }

  // Add listener for restore defaults button
  let restoreBtn = document.getElementById("restore-Btn");
  restoreBtn.addEventListener('click', () => {
    chrome.storage.local.set({'col':3,
                              'winSrc':false,
                              'tabCount':true,
                              'includeManager':false,
                              'sortMethod': 'alphabetically',
                              'searchScope': 'both'});
    tabManager.reloadPage();
  });
});
