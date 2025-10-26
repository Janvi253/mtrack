"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { scaleLinear } from 'd3-scale';
import { feature } from 'topojson-client';

interface RequestItem { authority?: { displayLocation?: string; location?: string }; }
type CountryFeature = any; // simplified feature typing

// Lazy load world atlas data (kept small using 110m resolution)
async function loadWorld(): Promise<CountryFeature[]> {
    const mod: any = await import('world-atlas/countries-110m.json');
    const fc = feature(mod, (mod as any).objects.countries) as any;
    return fc.features as CountryFeature[];
}

const COUNTRY_NAME_FALLBACKS: Record<string, string> = {
    'United States': 'United States of America',
    'USA': 'United States of America',
    'UK': 'United Kingdom',
    'UAE': 'United Arab Emirates',
    'South Korea': 'Korea, Republic of',
    'Russia': 'Russian Federation'
};

function normalizeCountry(raw?: string): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const direct = COUNTRY_NAME_FALLBACKS[trimmed];
    return direct || trimmed;
}

const RequestsByCountryMap: React.FC = () => {
    const [world, setWorld] = useState<CountryFeature[] | null>(null);
    const [data, setData] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const [wRes, reqRes] = await Promise.all([
                    loadWorld(),
                    fetch('/api/requests', { credentials: 'include' })
                ]);
                if (!reqRes.ok) throw new Error('Failed to load requests');
                const reqs: RequestItem[] = await reqRes.json();
                const counts: Record<string, number> = {};
                for (const r of reqs) {
                    const loc = normalizeCountry(r.authority?.displayLocation || r.authority?.location);
                    if (!loc) continue;
                    counts[loc] = (counts[loc] || 0) + 1;
                }
                setWorld(wRes);
                setData(counts);
            } catch (e: any) {
                setError(e.message || 'Failed to load map');
            } finally { setLoading(false); }
        })();
    }, []);

    const max = useMemo(() => Object.values(data).reduce((m, v) => v > m ? v : m, 0), [data]);
    const colorScale = useMemo(() => scaleLinear<string>().domain([1, max || 1]).range(['#fde68a', '#15803d']), [max]);

    const projection = useMemo(() => geoMercator().scale(100).translate([480 / 2, 250 / 2]), []);
    const pathGen = useMemo(() => geoPath(projection), [projection]);

    if (loading) return <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading map...</div>;
    if (error) return <div className="h-full flex items-center justify-center text-xs text-red-500">{error}</div>;
    if (!world) return <div className="h-full flex items-center justify-center text-xs text-gray-400">No map data</div>;

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 min-h-0 relative">
                <svg viewBox="0 0 480 250" className="w-full h-full">
                    <g>
                        {world.map((f: any, i: number) => {
                            const name = (f && f.properties && f.properties.name) ? String(f.properties.name) : '';
                            const count = data[name];
                            const fill = count ? colorScale(count) : '#e5e7eb';
                            return (
                                <path
                                    key={i}
                                    d={pathGen(f) || ''}
                                    fill={fill}
                                    stroke="#ffffff"
                                    strokeWidth={0.5}
                                >
                                    {/* no text inside path; accessible title below */}
                                </path>
                            );
                        })}
                    </g>
                </svg>
                {/* Simple hover tooltip via map overlay with pointer-events none using data attributes could be added later */}
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
                {max > 0 && (
                    <div className="flex items-center gap-1">
                        <span className="text-gray-500">1</span>
                        <div className="h-2 w-24 bg-gradient-to-r from-amber-200 to-green-700 rounded" />
                        <span className="text-gray-500">{max}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestsByCountryMap;
