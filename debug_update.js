/**
 * Debug version of updateRecord with extensive logging
 * Temporary - para diagnosticar el problema
 */
function debugUpdateRecord() {
    Logger.clear();

    // Simular una actualización de Aaron Gomez (ID=4)
    const testId = 4;
    const testRecord = {
        'NOMBRE': 'Aaron Gomez Debug',
        'ESTADO': 'TRUE',
        'RAZON SOCIAL': 'Paola Barrios',
        'CUIT': '262632652',
        'TELEFONO': '1516516516'
    };

    Logger.log('=== DEBUG UPDATE RECORD ===');
    Logger.log('ID: ' + testId);
    Logger.log('Input record (sin ID): ' + JSON.stringify(testRecord));

    // Get template
    const template = Formats.getFormatTemplate('CLIENTES');
    Logger.log('Headers from template: ' + JSON.stringify(template.headers));

    // Add ID to record
    testRecord['ID'] = testId;
    Logger.log('Record after adding ID: ' + JSON.stringify(testRecord));

    // Build row values
    const rowValues = template.headers.map(function (h) {
        const val = testRecord[h] != null ? testRecord[h] : '';
        Logger.log('Header: ' + h + ' -> Value: ' + val);
        return val;
    });

    Logger.log('Final row values: ' + JSON.stringify(rowValues));
    Logger.log('First value (should be ID): ' + rowValues[0]);

    if (rowValues[0] != testId) {
        Logger.log('❌ ERROR: ID not in first position!');
    } else {
        Logger.log('✅ ID correctly in first position');
    }
}
