function addListeners(tabManager) {
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
    // If the manager tab is the last tab in all windows, close
    if (tabManager.windows.length == 1 && tabManager.windows[0].tabs.length <= 2 && tabManager.windows[0].tabs[0].id === tabManager.managerTab.id) {
      tabManager.close();
    }
    // Add the closed tab to closed tab list
    for (tab of tabManager.openTabs) {
      if (tab.id == tabID) {
        tabManager.tryAddToClosedElements(tab);
      }
    }
    tabManager.reloadPage();
  });

  // Add listner for creating tabs
  chrome.tabs.onCreated.addListener((tab) => {
    if (tab.url.startsWith("chrome-extension://") && tab.url.endsWith("/tabPage.html")) {
      chrome.tabs.remove(tabManager.managerTab.id);
    }
    tabManager.reloadPage();
  });

  // Add listener for window closing
  chrome.windows.onRemoved.addListener(() => {
    tabManager.reloadPage();
  });

  // Add listener for undo button
  $("#undo-btn").on('click', () => {
    tabManager.reopenLastClosed();
  });

  // Add listener for settings button
  $('#settings-icon').on('click', () => {
    let settingsWidth = "192px";
    if ($('.settings').css('width') != settingsWidth) {
      $('.main-content').css({'margin-left': settingsWidth});
      $('.settings').css({'width': settingsWidth});
    } else {
      $('.main-content').css({'margin-left': '0px'});
      $('.settings').css({'width': '0px'});
    }
    $("#slider-value").html($sliderMaxTabsPerGroup.prop("valueAsNumber"));
  });

  // Add listener for tab count settings
  let $tabCount = $("#toggle-tab-count-settings");
  $tabCount.on('click', () => {
    chrome.storage.local.set({
      'tabCount': $tabCount.prop("checked")
    });
    tabManager.reloadPage();
  });

  // Add listener for manager display settings
  let $toggleManager = $("#toggle-manager-display-settings");
  $toggleManager.on('click', () => {
    chrome.storage.local.set({
      'includeManager': $toggleManager.prop("checked")
    });
    tabManager.reloadPage();
  });

  // Add listener for limit tabGroup size settings
  let $toggleLimitTabGroupSize = $("#toggle-limit-tab-group-size");
  $toggleLimitTabGroupSize.on('click', () => {
    chrome.storage.local.set({
      'limitTabGroupSize': $toggleLimitTabGroupSize.prop("checked")
    });
    tabManager.reloadPage();
  });

  // Add listener for limit tabGroup size slider
  let $sliderMaxTabsPerGroup = $("#max-tabs-per-group");
  $sliderMaxTabsPerGroup.on('input', () => {
    $("#slider-value").html($sliderMaxTabsPerGroup.prop("valueAsNumber"));
    chrome.storage.local.set({
      'maxTabsPerGroup': $sliderMaxTabsPerGroup.prop("valueAsNumber")
    });
    tabManager.reloadPage();
  });

  // Add listener for close on click setting
  let $toggleCloseOnClickTab = $("#toggle-close-manager-on-click-tab");
  $toggleCloseOnClickTab.on('click', () => {
    chrome.storage.local.set({
      'closeManagerWhenTabSelected': $toggleCloseOnClickTab.prop("checked")
    });
    tabManager.reloadPage();
  });

  // Add listener for layout options
  $(".layout-option").each(function() {
    $(this).on('click', function(e) {
      // Remove active class from all buttons
      $(".layout-option-active").each(function() {
        $(this).toggleClass('layout-option-active layout-option');
      });
      // Add active class to the button that was pressed
      $(this).toggleClass('layout-option-active layout-option');
      chrome.storage.local.set({
        'col': 12 / e.target.id
      });
      tabManager.reloadPage();
    });
  });

  // Add listener for sort options
  $(".sort-option").each(function() {
    $(this).on('click', () => {
      chrome.storage.local.set({
        'sortMethod': $(this).attr('id')
      });
      tabManager.reloadPage();
    });
  });

  // Add listener for search options
  $(".search-option").each(function() {
    $(this).on('click', () => {
      chrome.storage.local.set({
        'searchScope': $(this).attr('id')
      });
      tabManager.reloadPage();
    });
  });

  // Add listener for arrange tabs button
  $("#arrange-tabs-btn").on('click', () => {
    chrome.windows.getCurrent({
      populate: true
    }, (win) => {
      arrangeWindowTabs(win);
    });
  });

  // Add listener for restore defaults button
  $("#restore-Btn").on('click', () => {
    chrome.storage.local.set({
      'closeManagerWhenTabSelected' : true,
      'col': 3,
      'winSrc': 'all',
      'tabCount': true,
      'includeManager': false,
      'limitTabGroupSize': true,
      'sortMethod': 'alphabetically',
      'searchScope': 'both'
    });
    tabManager.reloadPage();
  });
}

function addTabListeners(tab, tabManager) {
  // Add event listener to tab
  $('#' + tab.id + ' .tab').on('click', () => {
    chrome.windows.update(tab.windowId, {
      focused: true
    });
    chrome.tabs.update(tab.id, {
      highlighted: true
    });

    tabManager.onTabClicked();

  });

  // Add event listener for close button
  $('#' + tab.id + ' .close-tab-btn').on('click', () => {
    // Close the selected tab
    chrome.tabs.remove(tab.id);
  });
}

function addTabGroupListeners(tabGroup, tabManager) {
  $('#' + tabGroup.id + ' .closeGroupBtn').on('click', () => {
    for (let i = 0; i < tabGroup.tabs.length; i++) {
      chrome.tabs.remove(tabGroup.tabs[i].id);
    }
    $(tabGroup.hostname).remove();
    tabManager.closedElements = _.difference(tabManager.closedElements, tabGroup.tabs);
    tabManager.closedElements.push(tabGroup);
  });
}

function addWinListeners(win, tabManager) {
  $('#windowWithTabGroups-' + win.id + ' .closeWindowBtn').on('click', () => {
    tabManager.closedElements = _.difference(tabManager.closedElements, win.tabs);
    tabManager.closedElements.push(win);
    chrome.windows.remove(win.id);
  });
}

function addTabManagerListeners(tabManager) {
  // Prevent duplicate listeners
  $('#win-btn-all').off();
  // Add listeners for window select buttons
  for ($winBtn of $(".win-btn")) {
    let btnID = $winBtn.id.split('-')[2];
    $('#win-btn-' + btnID).on('click', () => {
      if (tabManager.settings['classicMode']) {
        chrome.storage.local.set({
          'winSrc': btnID
        });
        $("#search-input").val('');
        tabManager.reloadPage();
      } else {
        location.hash = "#windowWithTabGroups-" + tabManager.windows[btnID-1].id;
        location.hash = "";
      }
    });
  }

  // Add listeners for windows
  tabManager.windows.forEach((win)=>{
    addWinListeners(win, tabManager);
  });

  // Add listeners for tabGroups and tabs
  for (tabGroup of tabManager.tabGroups) {
    addTabGroupListeners(tabGroup, tabManager);
    tabGroup.tabs.forEach((tab) => addTabListeners(tab, tabManager));
  }

  // Add listener for seach bar
  $("#search-input").off();
  $("#search-input").keyup(function() {
    if ($("#search-input").val() == '') {
      tabManager.reloadPage();
    } else {
      tabManager.renderHTMLContent();
    }
  });
}
