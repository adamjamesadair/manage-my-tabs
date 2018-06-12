function addListeners(tabManager) {
  // shortcuts
  $(document).bind('keyup', function(e) {
    var key = e.which || e.keyCode;
    key = String.fromCharCode(key);
    let shortcuts = {
      'U': 'undo',
      'S': 'toggleSettings',
      'A': 'arrangeTabs',
      '&': 'selectWindowPrev',
      '(': 'selectWindowNext',
      '0': 'selectWindowAll'
    };

    let next = 1;
    let command = parseInt(key) || shortcuts[key];
    if (typeof command == 'number') {
      $('#win-btn-' + command).click();
    } else {
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
      }
    }
  });

  // Add listener for updating tabs
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabManager.managerTab) {
      if (tabManager.managerTab.url == tab.url && Object.keys(changeInfo).length > 1 && changeInfo['status'] == 'loading') {
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

  $('#shortcut-btn').on('click', () => {
    $('.modal-bg').empty();
    $('.modal-bg').append(`<div class="shortcut-settings-modal"></div>`);
    $('.shortcut-settings-modal').append(renderShortcutModal());
    $('.modal-bg').show();
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

  addTabOptionListeners(tab, tabManager);
  // Add event listener for close button
  $('#t-' + tab.id + ' .close-tab-btn').on('click', () => {
    // Close the selected tab
    chrome.tabs.remove(tab.id);
  });
}

function addTabOptionListeners(tab, tabManager) {
  // Add event listener for tab options button
  $('#t-' + tab.id + ' .tab-options-btn').on('click', () => {
    $('#t-' + tab.id + ' .dropdown-content').addClass('active');
  });

  // Close dropdown on mouse leave
  $('#t-' + tab.id + ' .dropdown-content').on('mouseleave', () => {
    $('#t-' + tab.id + ' .dropdown-content').removeClass('active');
  });

  // Add event listener for reload button
  $('#t-' + tab.id + ' #reload').on('click', () => {
    chrome.tabs.reload(tab.id);
  });

  // Add event listener for copy url button
  $('#t-' + tab.id + ' #copy').on('click', () => {
    copyStringToClipboard(tab.url.href);
  });

  // Add event listener for merge to window button
  $('#t-' + tab.id + ' #merge').on('click', () => {
    $('.modal-bg').empty();
    $('.modal-bg').append(`<div class="select-win-dest"></div>`);
    $('.select-win-dest').append(renderSendTabModal(tabManager.windows));
    addSendTabModalListeners(tab, tabManager.windows);
    $('.modal-bg').show();
  });
}

function addTabGroupOptionListeners(tabGroup, tabManager) {
  // Add event listener for tab options button
  $('#tg-' + tabGroup.id + ' .tab-group-options-btn').on('click', () => {
    $('#tg-' + tabGroup.id + ' .dropdown-content').addClass('active');
  });

  // Close dropdown on mouse leave
  $('#tg-' + tabGroup.id + ' .dropdown-content').on('mouseleave', () => {
    $('#tg-' + tabGroup.id + ' .dropdown-content').removeClass('active');
  });

  // Add event listener for reload button
  $('#tg-' + tabGroup.id + ' #reload').on('click', () => {
    for (tab of tabGroup.tabs) {
      chrome.tabs.reload(tab.id);
    }
  });

  // Add event listener for merge to window button
  $('#tg-' + tabGroup.id + ' #merge').on('click', () => {
    $('.modal-bg').empty();
    $('.modal-bg').append(`<div class="select-win-dest"></div>`);
    $('.select-win-dest').append(renderSendTabModal(tabManager.windows));
    $('.modal-bg').show();

    addSendTabModalListeners(tabGroup, tabManager.windows);
  });
}

function addWindowOptionListeners(win, tabManager) {
  // Add event listener for tab options button
  $('#windowWithTabGroups-' + win.id + ' .win-options-btn').on('click', () => {
    $('#windowWithTabGroups-' + win.id + ' .dropdown-content').addClass('active');
  });

  // Close dropdown on mouse leave
  $('#windowWithTabGroups-' + win.id + ' .dropdown-content').on('mouseleave', () => {
    $('#windowWithTabGroups-' + win.id + ' .dropdown-content').removeClass('active');
  });

  // Add event listener for reload button
  $('#windowWithTabGroups-' + win.id + ' #reload').on('click', () => {
    for (tabGroup of win.tabGroups) {
      for (tab of tabGroup.tabs) {
        chrome.tabs.reload(tab.id);
      }
    }
  });

  // Add event listener for merge to window button
  $('#windowWithTabGroups-' + win.id + ' #merge').on('click', () => {
    $('.modal-bg').empty();
    $('.modal-bg').append(`<div class="select-win-dest"></div>`);
    $('.select-win-dest').append(renderSendTabModal(tabManager.windows));
    $('.modal-bg').show();

    addSendTabModalListeners(win, tabManager.windows);
  });
}

function moveTabGroupNewWin(tabGroup) {

}

function addSendTabModalListeners(element, windows) {

  $('#st-new').off();
  $('#st-new').on('click', () => {

    if (element instanceof TabGroup || windows.includes(element)) {
      chrome.windows.create({
        tabId: element.tabs[0].id
      }, (win) => {
        for (tab of element.tabs) {
          if (tab != element.tabs[0]) {
            chrome.tabs.move(tab.id, {
              windowId: parseInt(win.id),
              index: -1
            });
          }
        }
      });
    } else { //is tab
      chrome.windows.create({
        tabId: element.id
      });
    }
  });

  for (win of windows) {
    $('#st-' + win.id).off();
    $('#st-' + win.id).on('click', function() {

      if (element instanceof TabGroup || windows.includes(element)) {
        for (tab of element.tabs) {
          chrome.tabs.move(tab.id, {
            windowId: parseInt(this.id.split('-')[1]),
            index: -1
          });
        }
      } else { //is tab
        chrome.tabs.move(element.id, {
          windowId: parseInt(this.id.split('-')[1]),
          index: -1
        });
      }
    });
  }
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
  addTabGroupOptionListeners(tabGroup, tabManager);
}

function addWinListeners(win, tabManager) {
  $('#windowWithTabGroups-' + win.id + ' .closeWindowBtn').on('click', () => {
    tabManager.closedElements = _.difference(tabManager.closedElements, win.tabs);
    tabManager.closedElements.push(win);
    chrome.windows.remove(win.id);
  });

  $('.closeAllBtn').off();
  $('.closeAllBtn').on('click', function() {
    if (confirm("Are you sure you want to close all windows?")) {
      for (win of tabManager.windows) {
        chrome.windows.remove(win.id);
      }
    }
  });
  addWindowOptionListeners(win, tabManager);
}

function addModalListeners() {
  let selectWinDestBg = $('.modal-bg');
  $('.modal-bg').on('click', function() {
    $('.modal-bg').hide();
  });
  $('#modal-close').on('click', () => {
    $('.modal-bg').hide();
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

  // Add listeners for addModalListeners
  addModalListeners();

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
