chrome.browserAction.onClicked.addListener(() => {
  chrome.windows.getLastFocused({populate: true}, window => {
    chrome.tabs.create({url: 'tabPage.html', windowId: window.id});
  });
});
