function renderTabGroup(tabGroup, className, favIconUrl) {
  return `
      <div id="${tabGroup.id}" class="tab-group ${className}">
      <h1 class="tab-title">${tabGroup.title}
      <img class="icon" src=${favIconUrl} />
      </h1>
      <div class="closeGroupBtn">X</div>
      </div>
    `;
}

function renderTab(tab) {
  return `
      <div id=${tab.id} class="tabContainer">
      <div class="tab" title=${tab.title}>
      <p class="tabDescription">${tab.title}</p>
      </div>
      <div class="closeBtn">X</div>
      </div>
    `;
}

function renderBtn(id) {
  return `<button id="win-btn-${id}" class="window-select-btn win-btn generated-win-btn" type="button">${id}</button>`;
}

function generateTabGroups(tabGroups, className, tabCount) {
  let $tabGroupContainer = $('.tabgroup-container');
  $tabGroupContainer.empty();
  for (let tabGroup of tabGroups) {
    $tabGroupContainer.append(renderTabGroup(tabGroup, className, tabGroup.tabs[0].favIconUrl));
  }
}

function generateTabs(tabGroups) {
  for (let tabGroup of tabGroups) {
    for (let tab of tabGroup.tabs) {
      $('#' + tabGroup.id).append(renderTab(tab));
    }
  }
}

function generateWinSelectBtns(windows, btnName) {
  let $winSection = $(".window-selection");

  $(".generated-win-btn").remove();
  $("#win-btn-all").removeClass('window-select-active').addClass('window-select-btn');

  for (let i = 1; i <= windows.length; i++) {
    $winSection.append($(renderBtn(i)));

    let top = isOverflown($winSection) ? '-3.6rem' : '-2.4rem';
    $winSection.css({
      'top': top
    });
  }

  $("#win-btn-" + btnName).toggleClass('window-select-btn window-select-active');
}
