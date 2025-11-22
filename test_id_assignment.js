/**
 * Test script para verificar que saveRecord asigna IDs correctamente
 * Ejecutar desde Apps Script Editor
 */

function testSaveRecordWithId() {
    Logger.clear();

    // Test 1: Crear cliente de prueba
    const testRecord = {
        'NOMBRE': 'Test ID Auto',
        'ESTADO': 'Activo',
        'RAZON SOCIAL': 'Test SA',
        'CUIT': '12345678901',
        'ENCARGADO': 'Test Manager',
        'TELEFONO': '123456789',
        'DIRECCION': 'Test Address',
        'CORREO ADMINISTRACION': 'admin@test.com',
        'CORREO FACTURACION': 'factura@test.com',
        'FECHA CONTRATO': '2025-01-01',
        'VALOR DE HORA': '100',
        'LUNES HS': '8',
        'MARTES HS': '8',
        'MIERCOLES HS': '8',
        'JUEVES HS': '8',
        'VIERNES HS': '8',
        'SABADO HS': '0',
        'DOMINGO HS': '0'
    };

    try {
        Logger.log('=== Testing saveRecord con ID ===');
        const newId = RecordController.saveRecord('CLIENTES', testRecord);
        Logger.log('✅ Record saved with ID: ' + newId);

        // Verificar que se guardó correctamente
        const sheet = DatabaseService.getDbSheetForFormat('CLIENTES');
        const lastRow = sheet.getLastRow();
        const lastRowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

        Logger.log('ID in sheet: ' + lastRowData[0]);
        Logger.log('NOMBRE in sheet: ' + lastRowData[1]);

        if (lastRowData[0] == newId) {
            Logger.log('✅ ID CORRECTLY ASSIGNED!');
        } else {
            Logger.log('❌ ID MISMATCH! Expected: ' + newId + ', Got: ' + lastRowData[0]);
        }

    } catch (error) {
        Logger.log('❌ Error: ' + error.message);
        Logger.log(error.stack);
    }
}
