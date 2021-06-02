var pubkey_pem = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAy7AdT4z5z7tMQjr7BJ9v
D4uZGashsevc0RTrCbghYw3i8R3BAihwsHlKKuEyoSZXvPlnNsJgWWsxrP1AC/ih
XyUp5ptzwJMoY/YR41YsNBaYpJOS62sMaWp0em4PGev/CEIDKCCjeuVjSgOEn2jz
FOsibWKT3dFgy/h31v5T0ZtM2TK7YxI3rTb+jjkPCLapDyeE27JnuYgtXBCv9p+c
rVVKXY/GEhO14w2NzwGKldj8FZk4QDHsBJBg5JppdI3JMGOs9YEnT+BDpABZ01oX
lrTUHGiVa/0IjcEV4rptcHixtwsZKL7XdBpNgw9XZAi+D3D8Eci7+cGkOhUIoDMd
+gyu2cTAzONsybqLm0GDW1rZw9WVJzTfA8qEzu9fmkIu4x17j9CoyK6dGYimoO3F
SvUjBz+eDZPLMfyW/jLf6I27cvD2j37TnFcnOihsKhwDC/rwuwrQ4ZZgaclnlKQz
Dylp7DBga/Qcs4eFp2ARpe/poqPdOtqVN6XQxF3gS1CJhYVk5T8RMIS94fe6Jp/X
VQJ5X29mUS0HI7FF0ZpdIsuQ96MILNiUsuV9worZ81P0M0h+m+K+Ags9qMD+WEeD
o8RSDr6mH2t3f/0w+QNQ14QPMVcVpkj1Ho6hAKSaedgyJjvHsWTPx7316Il8XTvY
COhvOoviz9lc8iCv8HA9QO8CAwEAAQ==
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
