import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function ParticipationGaugeChart({
  taux = 0,
  votants = 0,
  total = 0,
  size = 200,
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = size;
    const height = size;
    const margin = 10;
    const radius = Math.min(width, height) / 2 - margin;
    const thickness = 18;

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Gradient definitions
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'gauge-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10B981');

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#00A0E8');

    // Background arc (full 240 degrees: from -120 deg to +120 deg)
    const startAngle = -Math.PI * 0.75;
    const endAngle = Math.PI * 0.75;
    const totalAngle = endAngle - startAngle;

    const backgroundArc = d3
      .arc()
      .innerRadius(radius - thickness)
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .cornerRadius(thickness / 2);

    g.append('path')
      .attr('d', backgroundArc)
      .attr('fill', 'var(--border)')
      .attr('opacity', 0.5);

    // Value arc
    const clampedTaux = Math.max(0, Math.min(100, taux));
    const valueAngle = startAngle + (clampedTaux / 100) * totalAngle;

    const valueArc = d3
      .arc()
      .innerRadius(radius - thickness)
      .outerRadius(radius)
      .startAngle(startAngle)
      .cornerRadius(thickness / 2);

    const foreground = g
      .append('path')
      .datum({ endAngle: startAngle })
      .attr('fill', 'url(#gauge-gradient)');

    foreground
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attrTween('d', (d) => {
        const interpolate = d3.interpolate(d.endAngle, valueAngle);
        return (t) => {
          d.endAngle = interpolate(t);
          return valueArc(d);
        };
      });

    // Center Percentage Text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.05em')
      .attr('font-size', `${size * 0.2}px`)
      .attr('font-weight', '800')
      .attr('font-family', 'var(--font-display)')
      .attr('fill', 'var(--ink)')
      .text(`${clampedTaux}%`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.4em')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('font-family', 'var(--font-sans)')
      .attr('fill', 'var(--ink-muted)')
      .text('PARTICIPATION');

    // Counts text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '2.8em')
      .attr('font-size', '11px')
      .attr('font-family', 'var(--font-mono)')
      .attr('fill', 'var(--accent)')
      .text(`${votants} / ${total} votants`);
  }, [taux, votants, total, size]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        style={{ overflow: 'visible', maxWidth: '100%' }}
        aria-label={`Jauge de participation à ${taux}%`}
      />
    </div>
  );
}
