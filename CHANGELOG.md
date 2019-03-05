# Changelog
All changes between releases of this project will be documented here.

## [0.4.0](https://github.com/adamjamesadair/manage-my-tabs/releases/tag/v0.4.0) - 2019-03-05
### Added
- An option to view and restore tabs closed during the current session.

### Modified
- Focus is set to the search bar when opening Manage My Tabs.
- The shortcut to open MMT has been changed from Ctrl + space to Alt + M to avoid conflicts
- Change in the default settings:
    - Include manager tab default set to true
    - Close manager on click default set to false



## [0.3.1](https://github.com/adamjamesadair/manage-my-tabs/releases/tag/v0.3.1) - 2018-06-13
### Fixed
- Page reloading too often causing slow load times and closing of tab groups.
- Typing in the search bar triggering shortcuts.
- Visibility of 'No search results' text.

## [0.3.0](https://github.com/adamjamesadair/manage-my-tabs/releases/tag/v0.3.0) - 2018-06-13
### Added
- Option to copy the URL of a tab. Found in the tab options dropdown.
- Option to Merge tab, tab group or window with another window or send to a new window. Found in the options dropdown.
- Reload option for tabs, tab groups and windows. Found in the options dropdown.
- A button in the 'All' section to close all windows. Confirmation is required to prevent accidents.
- Shortcuts for navigation and major functions. A list of available shortcuts can be seen in settings -> View Shortcuts.

### Fixed
- Page reloading when a tab title is changed. Only the HTML element is updated now.

## [0.2.1](https://github.com/adamjamesadair/manage-my-tabs/releases/tag/v0.2.1) - 2018-06-08
### Fixed
- Search results not updating when deleting part of the search query.
- Multiple instances of Manage My Tabs opening in Firefox.
- Undo for closed windows not working in Firefox.


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
