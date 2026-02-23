"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { City } from '@/app/types';

interface MapProps {
  cities: City[];
}

const SA_REGIONS = [
  { id: 'SA01', name: 'Ar Riyad' },
  { id: 'SA02', name: 'Makkah' },
  { id: 'SA03', name: 'Al Madinah' },
  { id: 'SA04', name: 'Ash Sharqiyah' },
  { id: 'SA05', name: 'Al Quassim' },
  { id: 'SA06', name: 'Ha\'il' },
  { id: 'SA07', name: 'Tabuk' },
  { id: 'SA08', name: 'Al Hudud ash Shamaliyah' },
  { id: 'SA09', name: 'Jizan' },
  { id: 'SA10', name: 'Najran' },
  { id: 'SA11', name: 'Al Bahah' },
  { id: 'SA12', name: 'Al Jawf' },
  { id: 'SA14', name: '`Asir' },
] as const;

const RISK_COLORS: Record<string, string> = {
  none: 'rgba(77, 214, 82, 0.75)',
  low: 'rgba(252, 196, 29, 0.78)',
  medium: 'rgba(255, 152, 0, 0.78)',
  high: 'rgba(243, 57, 44, 0.8)',
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[`']/g, '')
    .replace(/[^a-z0-9]/g, '');

const REGION_ALIASES: Record<string, string> = {
  arriyad: 'riyadh',
  ashsharqiyah: 'eastern',
  almadinah: 'medina',
  albahah: 'baha',
  asir: 'asir',
};

export const Map = ({ cities }: MapProps) => {
  const router = useRouter();
  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const selectedRegionIdRef = useRef<string | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [svgMarkup, setSvgMarkup] = useState('');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1024px)');
    const update = () => setIsSmallScreen(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isSmallScreen) {
      setSvgMarkup('');
      return;
    }

    let isMounted = true;
    fetch('/sa.svg')
      .then((response) => response.text())
      .then((text) => {
        if (isMounted) setSvgMarkup(text);
      })
      .catch(() => {
        if (isMounted) setSvgMarkup('');
      });

    return () => {
      isMounted = false;
    };
  }, [isSmallScreen]);

  const regionMetaById = useMemo(() => {
    const findCityForRegion = (regionName: string) => {
      const normalizedRegion = normalize(regionName);
      const direct =
        cities.find((city) => normalize(city.region) === normalizedRegion) ||
        cities.find((city) => normalize(city.name) === normalizedRegion);
      if (direct) return direct;

      const alias = REGION_ALIASES[normalizedRegion];
      if (!alias) return undefined;

      return (
        cities.find((city) => normalize(city.region) === alias) ||
        cities.find((city) => normalize(city.name) === alias)
      );
    };

    const entries = SA_REGIONS.map((region) => {
      const city = findCityForRegion(region.name);
      const risk = city?.floodData.floodRisk ?? 'none';
      return [
        region.id,
        {
          ...region,
          city,
          risk,
          color: RISK_COLORS[risk] ?? RISK_COLORS.none,
        },
      ] as const;
    });

    return Object.fromEntries(entries);
  }, [cities]);

  useEffect(() => {
    if (!svgMarkup || isSmallScreen || !svgContainerRef.current) {
      // Clear SVG when on small screen
      if (svgContainerRef.current && isSmallScreen) {
        svgContainerRef.current.innerHTML = '';
      }
      return;
    }

    const wrapper = svgContainerRef.current;
    wrapper.innerHTML = svgMarkup;
    const svg = wrapper.querySelector('svg');
    if (!svg) return;

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.display = 'block';

    const allPaths = Array.from(svg.querySelectorAll<SVGPathElement>('path[id^="SA"]'));

    const applyPathStyle = (path: SVGPathElement, isHovered = false) => {
      const regionId = path.id;
      const regionMeta = regionMetaById[regionId];
      if (!regionMeta) return;

      path.style.fill = regionMeta.color;
      path.style.stroke = selectedRegionIdRef.current === regionId ? 'rgba(230,238,248,0.95)' : 'rgba(5,5,6,0.85)';
      path.style.strokeWidth = selectedRegionIdRef.current === regionId ? '2.2' : '1';
      path.style.opacity = isHovered ? '0.95' : '0.82';
      path.style.transition = 'fill 0.18s, opacity 0.18s, stroke-width 0.18s, stroke 0.18s';
      path.style.cursor = regionMeta.city ? 'pointer' : 'default';
    };

    allPaths.forEach((path) => applyPathStyle(path, false));

    const listeners: Array<{ path: SVGPathElement; type: string; handler: EventListener }> = [];

    allPaths.forEach((path) => {
      const regionId = path.id;
      const regionMeta = regionMetaById[regionId];
      if (!regionMeta) return;

      const handleMouseEnter = () => {
        applyPathStyle(path, true);
      };

      const handleMouseMove = (event: Event) => {
        const mouseEvent = event as MouseEvent;
        const rect = wrapper.getBoundingClientRect();
        setTooltip({
          x: mouseEvent.clientX - rect.left + 10,
          y: mouseEvent.clientY - rect.top + 10,
          label: `${regionMeta.name} • ${regionMeta.risk.toUpperCase()}`,
        });
      };

      const handleMouseLeave = () => {
        applyPathStyle(path, false);
        setTooltip(null);
      };

      const handleClick = () => {
        selectedRegionIdRef.current = regionId;
        allPaths.forEach((mapPath) => applyPathStyle(mapPath, false));
        if (regionMeta.city) {
          router.push(`/city/${regionMeta.city.id}`);
        }
      };

      path.addEventListener('mouseenter', handleMouseEnter);
      path.addEventListener('mousemove', handleMouseMove);
      path.addEventListener('mouseleave', handleMouseLeave);
      path.addEventListener('click', handleClick);

      listeners.push(
        { path, type: 'mouseenter', handler: handleMouseEnter },
        { path, type: 'mousemove', handler: handleMouseMove },
        { path, type: 'mouseleave', handler: handleMouseLeave },
        { path, type: 'click', handler: handleClick },
      );
    });

    return () => {
      listeners.forEach(({ path, type, handler }) => {
        path.removeEventListener(type, handler);
      });
    };
  }, [svgMarkup, isSmallScreen, regionMetaById, router]);

  const regionList = useMemo(
    () => SA_REGIONS.map((region) => regionMetaById[region.id]).filter(Boolean),
    [regionMetaById],
  );

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 18px 45px rgba(15,23,42,0.65)',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: isSmallScreen ? 'stretch' : 'center',
        justifyContent: isSmallScreen ? 'stretch' : 'center',
      }}
    >
      {isSmallScreen ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            padding: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
            alignContent: 'start',
          }}
        >
          {regionList.map((region) => (
            <button
              key={region.id}
              type="button"
              onClick={() => region.city && router.push(`/city/${region.city.id}`)}
              style={{
                background: 'var(--panel-2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: 16,
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: 'white',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (region.city) {
                  e.currentTarget.style.background = 'var(--panel-3)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--panel-2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>{region.name}</h4>
                <span
                  style={{
                    background: region.color + '26',
                    color: region.color,
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    textTransform: 'capitalize',
                  }}
                >
                  {region.risk}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div
            ref={svgContainerRef}
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
            }}
          />

          {!svgMarkup && (
            <div className="muted" style={{ position: 'absolute' }}>
              Loading interactive map...
            </div>
          )}

          {tooltip && (
            <div
              style={{
                position: 'absolute',
                left: tooltip.x,
                top: tooltip.y,
                background: 'rgba(10,12,15,0.92)',
                color: 'rgba(230,238,248,0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '6px 10px',
                pointerEvents: 'none',
                fontSize: 12,
                zIndex: 20,
                whiteSpace: 'nowrap',
              }}
            >
              {tooltip.label}
            </div>
          )}
        </>
      )}
    </div>
  );
};
