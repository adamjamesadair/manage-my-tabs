function addListeners(tabManager) {
  // Add listener for commands
  chrome.commands.onCommand.addListener((command) => {
    let next = 1;
    switch (command) {
      case 'undo':
        tabManager.reopenLastClosed();
        break;
      case 'toggleSettings':
        toggleSettings();
        break;
      case 'arrangeTabs':
        arrangeTabs();
        break;
      case 'selectWindowPrev':
        next -= 2; // Wow, very hack
      case 'selectWindowNext':
        let currentWindowNumber = $('.window-select-active')[0].id.replace('win-btn-', '');
        currentWindowNumber = parseInt(currentWindowNumber);
        let targetWindow = currentWindowNumber + next;
        $('#win-btn-' + targetWindow).click();
        break;
      case 'selectWindowAll':
        $('#win-btn-all').click();
        break;
      case 'selectWindow1':
        $('#win-btn-1').click();
        break;
      case 'selectWindow2':
        $('#win-btn-2').click();
        break;
      case 'selectWindow3':
        $('#win-btn-3').click();
        break;
      case 'selectWindow4':
        $('#win-btn-4').click();
        break;
      case 'selectWindow5':
        $('#win-btn-5').click();
        break;
      case 'selectWindow6':
        $('#win-btn-6').click();
        break;
      case 'selectWindow7':
        $('#win-btn-7').click();
        break;
      case 'selectWindow8':
        $('#win-btn-8').click();
        break;
      case 'selectWindow9':
        $('#win-btn-9').click();
        break;
    }
  });

  // Add listener for updating tabs
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabManager.managerTab) {
      if (tabManager.managerTab.url == tab.url) {
        chrome.tabs.remove(tabManager.managerTab.id);
      }
    }
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
    toggleSettings();
  });

  // Add listener for tab count settings

  tabManager.addGenericSettingsCallbacks();

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
    arrangeTabs();
  });

  // Add listener for restore defaults button
  $("#restore-Btn").on('click', () => {
    chrome.storage.local.set(defaultSettings);
    tabManager.reloadPage();
  });
}

function addTabListeners(tab, tabManager) {
  // Add event listener to tab
  $('#t-' + tab.id + ' .tab').on('click', () => {
    chrome.windows.update(tab.windowId, {
      focused: true
    });

    let updateProperties;
    if (platform.name == "Firefox") {
      updateProperties = {
        active: true
      };
    } else {
      updateProperties = {
        highlighted: true
      };
    }

    chrome.tabs.update(tab.id, updateProperties);
    tabManager.onTabClicked();

  });

  // Add event listener for close button
  $('#t-' + tab.id + ' .close-tab-btn').on('click', () => {
    // Close the selected tab
    chrome.tabs.remove(tab.id);
  });
}

function addTabGroupListeners(tabGroup, tabManager) {
  $('#tg-' + tabGroup.id + ' .closeGroupBtn').on('click', () => {
    for (let i = 0; i < tabGroup.tabs.length; i++) {
      tabGroup.tabs[i].groupID = tabGroup.id;
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
      chrome.storage.local.set({
        'winSrc': btnID
      });
      if (tabManager.settings['classicMode']) {
        $("#search-input").val('');
        tabManager.reloadPage();
      } else {
        tabManager.settings['winSrc'] = btnID;
        tabManager.getSortedTabGroups();
        tabManager.renderHTMLContent();
        addTabManagerListeners(tabManager);
        if (btnID == 'all') {
          $('.window-overflow-container').animate({
            scrollTop: 0
          }, 0);
        } else {
          document.querySelector("#windowWithTabGroups-" + tabManager.windows[btnID - 1].id).scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          let $targetWindow = $('#windowWithTabGroups-' + tabManager.windows[btnID - 1].id);
          $targetWindow
            .addClass('selected-window', 250)
            .delay(350)
            .removeClass('selected-window', 500);
        }
      }
    });
  }

  // Add listeners for windows
  tabManager.windows.forEach((win) => {
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
    tabManager.getSortedTabGroups();
    tabManager.renderHTMLContent();
    addTabManagerListeners(tabManager);
  });

  // Add listener for scrolling
  $(".window-overflow-container").on("scroll", function(event) {
    if (tabManager.settings['winSrc'] != 'all') {
      var scrollPos = $(".window-overflow-container").offset().top;
      let i = 1;
      for ($win of $(".window")) {
        var currLink = $('#win-btn-' + i);
        var refElement = $('#' + $win.id);
        if (refElement.offset().top <= scrollPos + 10 && refElement.offset().top + refElement.height() > scrollPos - 100) {
          $('.win-btn').removeClass("window-select-active");
          currLink.addClass("window-select-active");
          chrome.storage.local.set({
            'winSrc': i
          });
        } else {
          currLink.removeClass("window-select-active");
          currLink.addClass("window-select-btn");
        }
        i++;
      }
    }
  });
}

function arrangeTabs() {
  tabManager.windows.forEach((win) => {
    arrangeWindowTabs(win);
  });
}

function toggleSettings() {
  let settingsWidth = "192px";
  if ($('.settings').css('width') != settingsWidth) {
    $('.main-content').css({
      'margin-left': settingsWidth
    });
    $('.settings').css({
      'width': settingsWidth
    });
  } else {
    $('.main-content').css({
      'margin-left': '0px'
    });
    $('.settings').css({
      'width': '0px'
    });
  }
  // $("#slider-value").html($sliderMaxTabsPerGroup.prop("valueAsNumber"));
}
