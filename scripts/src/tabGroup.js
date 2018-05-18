String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

/*
* @class A group of tabs which has hold the tabs and has a name.
* @param {string} hostname
*   The name of the TabGroup.
*
* @param {array} tabs
*   List of tabs to be held by the TabGroup.
*/
class TabGroup {
  constructor(hostname, tabs=[]) {
    this.hostname = hostname;
    this.title = hostname.capitalize();
    this.id = hostname.split('.').join("");
    this.tabs = tabs;
  }

  /*
  * Sorts tabs based on the given method.
  *
  * @param {string} method
  *   The method to sort the tabs. Options: "alphabetically". Default: "alphabetically".
  */
  sortTabs(method="alphabetically"){
    switch (method){
      case "alphabetically":
        return this.tabs.sort((a, b) => a.title.localeCompare(b.title, {sensitivity: 'base'}));
    }
  }

  /*
  * Add a tab to TabGroup.tabs
  *
  * @param {chrome.tab} tab
  *   The tab to add to TabGroup.tabs.
  */
  addTab(tab){
    this.tabs.push(tab);
  }

  /*
  * Remove a tab from TabGroup.tabs
  *
  * @param {chrome.tab} tab
  *   The tab to remove from TabGroup.tabs.
  */
  removeTab(tab){
    let index = this.tabs.indexOf(tab);
    if (index > -1)
      this.tabs.splice(index, 1);
  }
}
