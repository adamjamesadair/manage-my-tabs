document.addEventListener("DOMContentLoaded", function() {
  addListeners(new TabManager());
  tabManager = new TabManager();
  addListeners(tabManager);
  tabManager.reloadPage();
});
