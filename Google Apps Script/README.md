En google forms se pide el certificado como un párrafo. Se puede poner un regex para revisar que el certificado haya sido copiado y pegado correctamente:

```
^\s*###\n\{"roles":\{.*\},"id_votación":"quesadilla".*\}\n-----BEGIN SIGNATURE-----\n\S{684}\n-----END SIGNATURE-----\n###\s*$
```

Esto verifica que el token empieza y termina con "###" y que el ID de votación es "quesadilla". Si alteras tu token de cualquier forma tu voto será anulado.

IMPORTANTE: La pregunta del certificado debe ser la última en el formulario para que aparezca en la última columna y el script de análisis funcione.

Para validar los resultados, dentro del Sheet de resultados hay que entrar a Tools->ScriptEditor y agregar los archivos
```
verifica.gs
jsrsasign-all-min.js (agregué dos líneas al inicio para poderlo usar en appsscript)
appsscript.json (tal vez opcional) Para mostrarlo ir a settings y poner "Show appsscript.json" manifest in file editor
```
Es importante revisar que la llave pública en verifica.gs coincida con la que se usó para generar los certificados.

El script en `verifica.gs` agrega un menú `Verificador` al sheets para poder validar los resultados.

También hay un `key_test.gs` que sirve para probar que la verificación funcione pero éste no se necesita para usar este sistema.
