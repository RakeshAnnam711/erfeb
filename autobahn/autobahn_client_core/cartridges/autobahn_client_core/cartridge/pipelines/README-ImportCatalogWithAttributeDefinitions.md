# Catalog import with product attribute definitions

`ImportCatalogWithAttributeDefinitions-Start` wraps the platform
`ImportCatalog` pipelet with:

```js
{ importAttributeDefinitions: true }
```

The pipeline deliberately does not hardcode a feed filename. Configure the
calling Business Manager pipeline job step with these pipeline dictionary
values:

- `ImportFile`: path relative to the instance's `IMPEX/src` directory, for
  example `catalog/TestCatalog_ProductAttributeDefinition_0729.xml`
- `ImportMode`: one of `MERGE`, `UPDATE`, `REPLACE`, or `DELETE`

Upload the feed beneath `IMPEX/src`, then run the job. Do not use the regular
Business Manager catalog import screen for this feed, because that importer
does not enable product attribute definition imports.

The pipelet writes its result to `ImportStatus`. A post-import status script
logs data-error and data-warning counts with the detailed import-log filename,
then maps the result to the job framework's `ExitStatus`. Imports containing
data errors or warnings finish with the `WARN` status code. The pipelet's error
connector uses the same status handler before ending the pipeline.
