import { Observable, of, throwError } from 'rxjs';
import * as path from 'path';
import { merge } from 'lodash';
import { writeFileSync } from 'fs';
import { ensureDirectoryExists } from '../utils/ensure-directory-exists';
import { GlobCopyResult } from '../utils/glob-copy';

interface CustomSchema {
  originalSchemaPath: string;
  schemaExtensionPaths: string[];
  newSchemaPath: string;
}

export function generateSchemas(source: string, folder: string, destination: string): Observable<GlobCopyResult> {
  if (!source || !destination) {
    return throwError('Params source and destination required.');
  }

  const folderPath = path.join(source, 'src', folder, 'schemes.ext.ts');
  const customSchemas: CustomSchema[] = require(folderPath);
  customSchemas.forEach(customSchema => {
    const originalSchema = require(path.join(customSchema.originalSchemaPath));
    const schemaExtensions = customSchema.schemaExtensionPaths
      .map((p: string) => require(path.join(source, 'src', folder, p)));
    const newSchema = schemaExtensions.reduce(
      (extendedSchema: any, currentExtension: any) => merge(extendedSchema, currentExtension),
      originalSchema
    );
    const destinationPath = path.join(destination, folder);
    ensureDirectoryExists(path.join(destinationPath, customSchema.newSchemaPath));
    writeFileSync(path.join(destinationPath, customSchema.newSchemaPath), JSON.stringify(newSchema, null, 2), 'utf-8');
  });

  const res: GlobCopyResult = {
    source,
    patterns: [folderPath],
    destination,
    numberOfFiles: customSchemas.length
  };

  return of(res);
}
