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
