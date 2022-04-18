import { flatMap } from 'lodash';
import { ZodObject, ZodSchema, ZodType } from 'zod';

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

/**
 * TODO: Should the headers really be an array. Is it array of strings
 * TODO: Should the query/params be narrowed down to ZodObject :thinking:
 */
export interface RouteConfig {
  summary: string;
  description: string;
  method: Method;
  path: string;
  request?: {
    params?: ZodObject<any>;
    query?: ZodObject<any>;
    body?: ZodType<unknown>;
    headers?: ZodType<unknown>[];
  };
  response: ZodType<unknown>;
  errors?: any[];
}

export type OpenAPIDefinitions =
  | { type: 'schema'; schema: ZodSchema<any> }
  | { type: 'parameter'; schema: ZodSchema<any> }
  | { type: 'route'; route: RouteConfig };

export class OpenAPIRegistry {
  private _definitions: OpenAPIDefinitions[] = [];

  constructor(private parents?: OpenAPIRegistry[]) {}

  get definitions(): OpenAPIDefinitions[] {
    const parentDefinitions = flatMap(
      this.parents?.map((par) => par.definitions)
    );

    return [...parentDefinitions, ...this._definitions];
  }

  /**
   * Registers a new component schema under /components/schemas/${name}
   */
  register<T extends ZodSchema<any>>(refId: string, zodSchema: T) {
    const currentMetadata = zodSchema._def.openapi;
    const schemaWithMetadata = zodSchema.openapi({
      ...currentMetadata,
      refId,
    });

    this._definitions.push({ type: 'schema', schema: schemaWithMetadata });

    return schemaWithMetadata;
  }

  /**
   * Registers a new parameter schema under /components/parameters/${name}
   */
  registerParameter<T extends ZodSchema<any>>(refId: string, zodSchema: T) {
    const currentMetadata = zodSchema._def.openapi;
    const schemaWithMetadata = zodSchema.openapi({
      ...currentMetadata,
      name: currentMetadata?.name ?? refId,
      refId,
    });

    this._definitions.push({
      type: 'parameter',
      schema: schemaWithMetadata,
    });

    return schemaWithMetadata;
  }

  /**
   * Registers a new path that would be generated under paths:
   */
  registerPath(route: RouteConfig) {
    // const { path } = config;

    // TODO: Is this for here. Maybe not
    // const parsedPath = path.replace(/:/g, '{').replace(/{[a-zA-Z]+/g, '$&}');

    this._definitions.push({
      type: 'route',
      route,
    });
  }
}
