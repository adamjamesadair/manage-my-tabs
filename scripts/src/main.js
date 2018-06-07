document.addEventListener("DOMContentLoaded", function() {
  tabManager = new TabManager();
  addListeners(tabManager);
  tabManager.reloadPage();
});
