import { join } from 'path';
import { writeFile, exists, readFile } from 'hexo-fs';
import type Hexo from './index';
import type Promise from 'bluebird';

export = (ctx: Hexo): Promise<void> => {
  const pkgPath = join(ctx.base_dir, 'package.json');

  return readPkg(pkgPath).then(pkg => {
    if (!pkg) return;

    ctx.env.init = true;

    if (pkg.hexo.version === ctx.version) return;

    pkg.hexo.version = ctx.version;

    ctx.log.debug('Updating package.json');
    return writeFile(pkgPath, JSON.stringify(pkg, null, '  '));
  });
};

/**
 * Lee y valida el contenido de un archivo package.json.
 *
 * Este método verifica la existencia de un archivo package.json en la ruta especificada.
 * Si el archivo existe, lo lee y convierte su contenido desde formato JSON a un objeto.
 * Además, valida si el objeto contiene una propiedad 'hexo' de tipo objeto,
 * lo que indica que es un archivo de configuración válido para Hexo.
 *
 * @param {string} path - La ruta completa del archivo package.json que se va a leer.
 *
 * @returns {Promise<any>} Una promesa que resuelve con el contenido del archivo
 * package.json como un objeto, o `undefined` si el archivo no existe o no contiene
 * una configuración válida de Hexo.
 *
 * @throws {Error} Si ocurre un error al leer o parsear el archivo JSON.
 */
function readPkg(path: string): Promise<any> {
  return exists(path).then(exist => {
    if (!exist) return;

    return readFile(path).then(content => {
      const pkg = JSON.parse(content);
      if (typeof pkg.hexo !== 'object') return;

      return pkg;
    });
  });
}
