function doGet() {
  const output = HtmlService
    .createTemplateFromFile('FrontedErp')
    .evaluate(); // permite usar includes de parciales

  return output.addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Helper para incluir parciales desde las plantillas
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
