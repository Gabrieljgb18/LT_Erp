const LayoutService = (function () {

  function applyFormatToSheet(tipoFormato, sheet) {
    const template = Formats.getFormatTemplate(tipoFormato);
    if (!template) {
      throw new Error('Formato no encontrado: ' + tipoFormato);
    }

    // Limpia contenido pero deja cosas como protección, etc.
    sheet.clear({ contentsOnly: true });

    const headers = template.headers;
    const numColumns = headers.length;

    // Escribir encabezados
    const headerRange = sheet.getRange(1, 1, 1, numColumns);
    headerRange.setValues([headers]);

    // Congelar fila de encabezado
    if (template.freezeRows) {
      sheet.setFrozenRows(template.freezeRows);
    }

    // Ajustar anchos de columnas
    if (template.columnWidths && template.columnWidths.length === numColumns) {
      template.columnWidths.forEach((width, index) => {
        sheet.setColumnWidth(index + 1, width);
      });
    } else {
      // fallback: auto-ajustar si no definimos widths
      sheet.autoResizeColumns(1, numColumns);
    }

    // Estilos básicos encabezado
    headerRange
      .setFontWeight('bold')
      .setBackground('#eeeeee')
      .setHorizontalAlignment('center');

    // Opcional: limpiar formato del resto de la hoja
    const lastRow = sheet.getMaxRows();
    const lastCol = sheet.getMaxColumns();
    if (lastRow > 1 || lastCol > numColumns) {
      const bodyRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
      bodyRange.clearFormat();
    }
  }

  return {
    applyFormatToSheet: applyFormatToSheet
  };

})();
