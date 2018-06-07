# Changelog
All changes between releases of this project will be documented here.

## [0.2.0](https://github.com/adamjamesadair/manage-my-tabs/releases/tag/v0.2.0) - 2018-06-08
### Added
- Firefox support.
- Shortcuts for navigating windows and opening settings.
- New default view where tabs are all displayed on one screen and grouped by window.
- Classic mode which functions as v0.1.0.
- New styles for settings and navigating tabs, tab groups and windows.
- Settings:
  - Max tabs per tab group toggle and slider.
  - Close extension after navigating to a tab.
  - Allow scrolling beyond the end of the last window.
  - Toggle Classic mode.
  
### Changed
- Window select buttons scroll to selected window instead of changing pages.
- Moved search options closer to the search bar.
- Arrange tabs button now arranges the tabs in all windows.

### Fixed
- Tabs being placed in wrong tab groups.
- Undo button causing dulicate tabs to be opened.
- Changing the search settings not refreshing the results.
- Errors when using undo with tab groups

## [0.1.0](https://github.com/adamjamesadair/manage-my-tabs/releases/tag/v0.1.0) - 2018-05-17
### Added
- Button to reorder tabs in current window.
- Tooltip to settings icon.
- Selected window is now highlighted in the 'select window' section.

### Changed
- Restyled the links to tabs.
- Restyled column setting buttons.
- Restyled undo and select window buttons.
- Moved setting for displaying tabs from all tabs to 'All' button in 'select window' section.
- Manage My Tabs remains open when opening a new tab or changing tab focus.

### Fixed
-  Issue with extension tabs showing their id as the title.
