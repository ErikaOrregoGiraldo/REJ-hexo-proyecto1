import { extname } from 'path';
import Promise from 'bluebird';
import { readFile, readFileSync } from 'hexo-fs';
import type Hexo from './index';
import type { Renderer } from '../extend';
import type { StoreFunction, StoreFunctionData, StoreSyncFunction } from '../extend/renderer';
import { NodeJSLikeCallback } from '../types';

const getExtname = (str: string): string => {
  if (typeof str !== 'string') return '';

  const ext = extname(str);
  return ext.startsWith('.') ? ext.slice(1) : ext;
};

const toString = (result: any, options: StoreFunctionData) => {
  if (!Object.prototype.hasOwnProperty.call(options, 'toString') || typeof result === 'string') return result;

  if (typeof options.toString === 'function') {
    return options.toString(result);
  } else if (typeof result === 'object') {
    return JSON.stringify(result);
  } else if (result.toString) {
    return result.toString();
  }

  return result;
};

// Nuevo método para validación extraído
const validateData = (data: StoreFunctionData): void => {
  if (!data) throw new TypeError('No input file or string!');
  if (data.text == null && !data.path) throw new TypeError('No input file or string!');
};

class Render {
  public context: Hexo;
  public renderer: Renderer;

  constructor(ctx: Hexo) {
    this.context = ctx;
    this.renderer = ctx.extend.renderer;
  }

  isRenderable(path: string): boolean {
    return this.renderer.isRenderable(path);
  }

  isRenderableSync(path: string): boolean {
    return this.renderer.isRenderableSync(path);
  }

  getOutput(path: string): string {
    return this.renderer.getOutput(path);
  }

  getRenderer(ext: string, sync?: boolean): StoreSyncFunction | StoreFunction {
    return this.renderer.get(ext, sync);
  }

  getRendererSync(ext: string): StoreSyncFunction | StoreFunction {
    return this.getRenderer(ext, true);
  }

  render(data: StoreFunctionData, options?: any | NodeJSLikeCallback<any>, callback?: NodeJSLikeCallback<any>): Promise<any> {
    // Refactorización para simplificar condicional
    callback = typeof options === 'function' ? options : callback;
    options = typeof options === 'function' ? {} : options;

    const ctx = this.context;
    let ext = '';

    let promise: Promise<string>;

    validateData(data); // Uso del método extraído para validar

    if (data.text != null) {
      promise = Promise.resolve(data.text);
    } else {
      promise = readFile(data.path);
    }

    return promise.then(text => {
      data.text = text;
      ext = data.engine || getExtname(data.path);
      if (!ext || !this.isRenderable(ext)) return text;

      const renderer = this.getRenderer(ext);
      return Reflect.apply(renderer, ctx, [data, options]);
    }).then(result => {
      result = toString(result, data);
      if (data.onRenderEnd) {
        return data.onRenderEnd(result);
      }

      return result;
    }).then(result => {
      const output = this.getOutput(ext) || ext;
      return ctx.execFilter(`after_render:${output}`, result, {
        context: ctx,
        args: [data]
      });
    }).asCallback(callback);
  }

  renderSync(data: StoreFunctionData, options = {}): any {
    validateData(data); // Uso del método extraído para validar

    const ctx = this.context;

    if (data.text == null) {
      data.text = readFileSync(data.path);
    }

    const ext = data.engine || getExtname(data.path);
    let result;

    if (ext && this.isRenderableSync(ext)) {
      const renderer = this.getRendererSync(ext);
      result = Reflect.apply(renderer, ctx, [data, options]);
    } else {
      result = data.text;
    }

    const output = this.getOutput(ext) || ext;
    result = toString(result, data);

    if (data.onRenderEnd) {
      result = data.onRenderEnd(result);
    }

    return ctx.execFilterSync(`after_render:${output}`, result, {
      context: ctx,
      args: [data]
    });
  }
}

export = Render;
