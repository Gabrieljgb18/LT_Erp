function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('frontederp')  // HTML principal para la Web App
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
