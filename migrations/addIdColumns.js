/**
 * Migration Script - Add ID Column to All Sheets
 * Adds auto-incremental ID column as first column to all database sheets
 * Run once to migrate existing data
 */

function migrateAddIdColumns() {
    const DB_SPREADSHEET_ID = '1qgza62aFhIF4SWn7_S-AJLpIx3P7tz3_08N1JMeDQiY';

    const SHEETS_TO_MIGRATE = [
        'CLIENTES_DB',
        'EMPLEADOS_DB',
        'FACTURACION_DB',
        'PAGOS_DB',
        'ASISTENCIA_DB',
        'ASISTENCIA_PLAN_DB'
    ];

    const ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID);
    const results = [];

    SHEETS_TO_MIGRATE.forEach(function (sheetName) {
        const sheet = ss.getSheetByName(sheetName);

        if (!sheet) {
            results.push(sheetName + ': Sheet not found - skipped');
            return;
        }

        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();

        if (lastRow === 0) {
            results.push(sheetName + ': Empty sheet - skipped');
            return;
        }

        // Check if ID column already exists
        const firstHeader = sheet.getRange(1, 1).getValue();
        if (firstHeader === 'ID') {
            results.push(sheetName + ': ID column already exists - skipped');
            return;
        }

        // Insert new column at position 1
        sheet.insertColumnBefore(1);

        // Set header
        sheet.getRange(1, 1).setValue('ID');

        // Generate IDs for existing rows (starting from row 2)
        if (lastRow > 1) {
            const ids = [];
            for (let i = 1; i <= lastRow - 1; i++) {
                ids.push([i]);
            }
            sheet.getRange(2, 1, lastRow - 1, 1).setValues(ids);
        }

        results.push(sheetName + ': ✅ Migrated - ' + (lastRow - 1) + ' records assigned IDs');
    });

    // Log results
    Logger.log('=== MIGRATION RESULTS ===');
    results.forEach(function (result) {
        Logger.log(result);
    });

    return results;
}

/**
 * Gets the next available ID for a sheet
 * @param {Sheet} sheet - The sheet to get next ID for
 * @returns {number} Next available ID
 */
function getNextId(sheet) {
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
        // No data rows, start with ID 1
        return 1;
    }

    // Get all IDs in column 1 (excluding header)
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

    // Find maximum ID
    let maxId = 0;
    ids.forEach(function (row) {
        const id = Number(row[0]);
        if (!isNaN(id) && id > maxId) {
            maxId = id;
        }
    });

    return maxId + 1;
}

/**
 * Test function - Run this to verify migration
 */
function testMigration() {
    const results = migrateAddIdColumns();

    // Display results in a dialog (if running from UI)
    const ui = SpreadsheetApp.getUi();
    ui.alert('Migration Complete', results.join('\n'), ui.ButtonSet.OK);
}
