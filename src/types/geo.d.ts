declare module 'world-atlas/countries-110m.json' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: any;
  export default value;
}

declare module 'topojson-client' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function feature(topo: any, object: any): any;
}

declare module 'd3-geo' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function geoMercator(): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function geoPath(projection?: any): any;
}

declare module 'd3-scale' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function scaleLinear<T>(): { domain: (d: any)=>any; range: (r: T[])=>any; (v: number): T } & any;
}
