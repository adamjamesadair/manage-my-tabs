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
      chrome.tabs.remove(tabManager.managerTab.id);
    }
    // Add the closed tab to closed tab list
    for (tab of tabManager.openTabs) {
      if (tab.id == tabID) {
        tabManager.closedTabs.push(tab);
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
      'col': 3,
      'winSrc': 'all',
      'tabCount': true,
      'includeManager': false,
      'sortMethod': 'alphabetically',
      'searchScope': 'both'
    });
    tabManager.reloadPage();
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

function addTabGroupListeners(tabGroup) {
  $('#' + tabGroup.id + ' .closeGroupBtn').on('click', () => {
    for (let i = 0; i < tabGroup.tabs.length; i++) {
      chrome.tabs.remove(tabGroup.tabs[i].id);
    }
    $(tabGroup.hostname).remove();
  });
}

function addTabManagerListeners(tabManager) {
  // Prevent duplicate listeners
  $('#win-btn-all').off();
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
  for (tabGroup of tabManager.tabGroups) {
    addTabGroupListeners(tabGroup);
    tabGroup.tabs.forEach(addTabListeners);
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
