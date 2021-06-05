var pubkey_pem = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAzlFznojCzNlfIG+gDEg4
NiVGQe7BFe3Z9oB2yUPDTOThbMw02/N2au+M5NFPgztdL5zjTstLIbxUZfPd+oAe
W2gQZTsNRPAUKi/kucdNAELmOD9C3fb5o261iEawkdCOaZg7kVwpxTdOEW4AnZSh
J5CgTFINecwGHf1sSlB6TJEd11I1SP1xKleQwY4G0lM6M/C/yY2lFLvAASJXAM7e
AClsENDHiWPX+BvnSCmSxLqx7kaYrxB765fn8Wpw+wr98rr2RjoTO/eRuz7RI5or
M7CVUXwM5FWuKP6tPkw3k9I2D0D0NyP0OwOpaDCLwEElyZ1ZpT2XY0zpdJdzrfFy
y4BFQBR7aM/3Z95XX0zEPwAuZ+9oaRZchd9xaqFhdHe3ZkZ2fkgMFsfrHVAD/qVp
rFLva9sJHtUicqXbzUUhuL7f+BXWeS5JJC3/PqjF+Vaj9lHXmbcynp0XPE4wFooe
lELVom0ogmy4TfqkY5F1mJC0ofivhAhEqi504GJbUvMH4Oji6U3f8+fzOvTiERba
BWhtut2iztz6ATPzQjXMXdSE7Ln5xDN+dMexnS1llelNctk8mZAafF81qbGXf3mp
i48jTksvmwdHRdEH3SBPBB/LQP4JrInEhcRo3pWSul9tlDZ1f2tS0mz+JO8KE7BN
N3gt2DSMEnLJ6Fj2D+3ccbkCAwEAAQ==
-----END PUBLIC KEY-----`;

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  // Or DocumentApp or FormApp.
  ui.createMenu('Verificador')
      .addItem('Verificar Certificados', 'verificarCertificados')
      .addToUi();
}

function verificarCertificados() {

  // Ejemplo de https://kjur.github.io/jsrsasign/sample/sample-rsasign.html
  var pubKey = KEYUTIL.getKey(pubkey_pem);

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Borrar una hoja llamada "_Resultados_Verificados_" si existe
  var sheet = spreadsheet.getSheetByName("_Resultados_Verificados_");
  if ( sheet != null) {
    spreadsheet.deleteSheet(sheet);
  }

  // Obtener la primera hoja y copiarla para no modificar la hoja de resultados
  var results = spreadsheet.getSheets()[0];
  var verified_results = results.copyTo(spreadsheet);
  verified_results.setName("_Resultados_Verificados_");

  var cert_col_idx =  verified_results.getLastColumn()-1;

  // Poner encabezados
  verified_results.getRange(1,cert_col_idx+2).setValue("id_cert");
  verified_results.getRange(1,cert_col_idx+3).setValue("id_votación")
  verified_results.getRange(1,cert_col_idx+4).setValue("firma válida");
  verified_results.getRange(1,cert_col_idx+5).setValue("primer uso válido");
  verified_results.getRange(1,cert_col_idx+6).setValue("Estudiante");
  verified_results.getRange(1,cert_col_idx+7).setValue("Profesor");
  verified_results.getRange(1,cert_col_idx+8).setValue("Ayudante");

  var used_certs = [];


  var data = verified_results.getDataRange().getValues();
  for (var i=1; i < data.length; i++) {
    var cert = data[i][cert_col_idx].toString();
    cert = cert.replace(/(^\s+|\s+$)/g,''); // remove leading and trailing whitespace
    var parts = cert.split("\n");
    var message = parts[1];
    var signature = parts[3];

    contents = jsonParse(message)
    
    var id_cert = contents['id_certificado'];
    var id_votacion = contents['id_votación'];
    var roles = contents['roles'];

    // Agregar id_cert
    verified_results.getRange(i+1,cert_col_idx+2).setValue(id_cert);

    // Agregar id_votacion
    verified_results.getRange(i+1,cert_col_idx+3).setValue(id_votacion);

    // Verificar firma
    var valid_sign = pubKey.verify(message, b64tohex(signature));
    if(valid_sign) {
      verified_results.getRange(i+1,cert_col_idx+4).setValue(1);
    } else {
      verified_results.getRange(i+1,cert_col_idx+4).setValue(0);
    }

    // Revisar que sea la primera vez que se usa el certificado
    if(used_certs.indexOf(id_cert)<0 && valid_sign) {
      verified_results.getRange(i+1,cert_col_idx+5).setValue(1);
      used_certs.push(id_cert);
    } else {
      verified_results.getRange(i+1,cert_col_idx+5).setValue(0);
    }

    // Agregar roles de votante
    if('estudiante' in roles) {
      verified_results.getRange(i+1,cert_col_idx+6).setValue(roles['estudiante']);
    }
    if('profesor' in roles) {
      verified_results.getRange(i+1,cert_col_idx+7).setValue(roles['profesor']); 
    }
    if('ayudante' in roles) {
      verified_results.getRange(i+1,cert_col_idx+8).setValue(roles['ayudante']);
    }
    

  }

}
