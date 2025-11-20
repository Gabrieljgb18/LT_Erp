function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('Sidebar')  // o el nombre de tu HTML
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}