# Reto 10 · El catálogo de trámites como dato abierto

**Institución:** Secretaría Nacional de Ciencia y Tecnología
**Fuente:** Catálogo Nacional de Trámites y Portal Nacional de Datos Abiertos
**El cambio que buscamos:** de páginas web sueltas a datos que cualquiera pueda usar

## El reto en una frase

Cualquier persona o programa puede consultar los trámites del catálogo desde una interfaz abierta, con búsqueda y con la atribución a la fuente incluida.

## Estado actual: hay datos publicados, pero son una foto vieja

El Portal Nacional de Datos Abiertos **sí publica** un conjunto llamado "Catálogo de Trámites de Instituciones del Gobierno", en CSV y con **licencia Creative Commons Atribución**. El portal corre sobre CKAN, que trae API propia.

El problema es cuál archivo es. Se llama **"Catalogo de Tramites al 15 dic 2023"**, se subió en enero de 2024, y esa sigue siendo su última actualización. Lleva más de dos años congelado.

Mientras tanto, el catálogo vivo sigue publicándose ficha por ficha en páginas web, sin forma de consultarlo con un programa.

> ### Nota sobre el alcance
> La ficha del primer día decía que no hay archivo descargable ni forma de consultar los trámites con un programa. **La primera mitad ya no es exacta**: el archivo existe. La segunda sigue siendo cierta. El alcance se ajusta: el reto ya no es publicar datos que nadie ha publicado, sino **cerrar la brecha entre el catálogo vivo y el dato publicado**, y medir la calidad de lo que hay.

## Quién lo vive y por qué importa

Le sirve a quien quiere construir herramientas ciudadanas, a periodistas de datos, a organizaciones, y a las propias instituciones que necesitan saber qué publicaron.

Importa porque hoy cada quien que necesite esos datos tiene que extraerlos otra vez, y porque quien confíe en el archivo publicado estará trabajando con información de hace más de dos años sin saberlo.

## Cómo se ve cuando funciona

Existe una interfaz abierta que devuelve los trámites del catálogo vivo, con búsqueda por institución y por palabra clave, y con la atribución a la fuente incluida en cada respuesta.

Junto a eso hay un reporte de calidad: qué campos están vacíos, qué enlaces no llevan a ningún lado, qué descripciones se repiten entre trámites distintos, y en qué instituciones se concentra cada problema.

## Mapeá la fuente antes de diseñar

Empiecen descargando el CSV publicado y contando qué trae. Después comparen contra el catálogo vivo. La diferencia entre los dos es el corazón de este reto.

Al revisar fichas van a encontrar cosas concretas: campos de tiempo de respuesta con unidades distintas entre sí, minutos en una ficha y semanas en otra; campos de costo que muestran el máximo de un rango como si fuera la tarifa; enlaces de "ir al trámite en línea" que no llevan a ningún lado; descripciones copiadas de otro trámite; y fichas duplicadas que se contradicen entre sí. Documenten cada caso con su ficha y su institución.

Tres cosas para averiguar en la fuente: cómo se enumeran los trámites de cada institución, qué campos tiene cada ficha, y qué información está incompleta y en cuáles instituciones.

## Escalera de profundización

**Punto de partida.** Una interfaz abierta consulta los trámites del catálogo, con búsqueda y atribución. Funcionando y publicada.

**N1. Documentada y usable por otros.** Que cualquier persona pueda entender cómo consultarla sin preguntarles a ustedes.

**N2. Reporte de calidad medible.** Que produzca números, no impresiones: cuántos campos vacíos, cuántos enlaces rotos, cuántas descripciones duplicadas, por institución.

**N3. La brecha visible.** Que compare el catálogo vivo contra la foto publicada en diciembre de 2023 y muestre qué cambió, qué desapareció y qué nunca se actualizó.

## Qué no incluye este reto

El prototipo no corrige los datos del catálogo. No permite escribir ni modificar registros. No reemplaza al catálogo oficial.

## Fuentes

- Catálogo Nacional de Trámites, Comisión Presidencial de Gobierno Abierto y Electrónico
- Portal Nacional de Datos Abiertos de Guatemala, SENACYT
- Licencia Creative Commons Atribución 4.0, indicada al pie de cada ficha del catálogo
