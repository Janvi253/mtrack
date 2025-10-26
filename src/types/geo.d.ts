declare module 'world-atlas/countries-110m.json' {
  const value: any;
  export default value;
}

declare module 'topojson-client' {
  export function feature(topo: any, object: any): any;
}

declare module 'd3-geo' {
  export function geoMercator(): any;
  export function geoPath(projection?: any): any;
}

declare module 'd3-scale' {
  export function scaleLinear<T>(): { domain: (d: any)=>any; range: (r: T[])=>any; (v: number): T } & any;
}
