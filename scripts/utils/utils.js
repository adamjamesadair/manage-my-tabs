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


function getSettingProperty(type) {
  switch (type) {
    case "checkbox":
      return "checked";
    case "range":
      return "valueAsNumber";
      break;
  }
}

function groupTabs(tabs) {
  let tabGroups = [];
  // let tabGroupIDs = [];
  for (let tab of tabs) {
    tab.url = strToURL(tab.url);
    let tabInGroup = false;
    let filteredTabGroups = tabGroups.filter((tg) => tg.hostname == tab.url.hostname);
    for (let tabGroup of filteredTabGroups) {
      if (tabGroup.hostname == tab.url.hostname) {
        tabGroup.addTab(tab);
        tabInGroup = true;
        break
      }
    }

    if (!tabInGroup) {
      let tabGroup = new TabGroup(tab.url.hostname, false, [tab], tab.windowId);
      tabGroups.push(tabGroup);
    }
  }
  return tabGroups;
}

// Credit: Uli Köhler https://techoverflow.net/2018/03/30/copying-strings-to-the-clipboard-using-pure-javascript/
function copyStringToClipboard(str) {
  // Create new element
  var el = document.createElement('textarea');
  // Set value (string to be copied)
  el.value = str;
  // Set non-editable to avoid focus and move outside of view
  el.setAttribute('readonly', '');
  el.style = {
    position: 'absolute',
    left: '-9999px'
  };
  document.body.appendChild(el);
  // Select text inside element
  el.select();
  // Copy text to clipboard
  document.execCommand('copy');
  // Remove temporary element
  document.body.removeChild(el);
}
