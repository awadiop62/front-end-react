import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function ClassParticipationChart({ data = [] }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const parentWidth = containerRef.current?.clientWidth || 500;
    const margin = { top: 25, right: 20, bottom: 45, left: 45 };
    const width = Math.max(300, parentWidth) - margin.left - margin.right;
    const height = 230 - margin.top - margin.bottom;

    svg.attr('width', parentWidth).attr('height', 230);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.classe))
      .range([0, width])
      .padding(0.35);

    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    // X Axis
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .attr('color', 'var(--ink-muted)')
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('font-family', 'var(--font-sans)');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}%`))
      .attr('color', 'var(--ink-muted)')
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('font-family', 'var(--font-mono)');

    // Gridlines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .attr('stroke', 'var(--border)')
      .attr('stroke-opacity', 0.4)
      .select('.domain')
      .remove();

    // Bars with gradient
    const defs = svg.append('defs');
    const barGrad = defs
      .append('linearGradient')
      .attr('id', 'class-bar-grad')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    barGrad.append('stop').attr('offset', '0%').attr('stop-color', '#0077B0');
    barGrad.append('stop').attr('offset', '100%').attr('stop-color', '#10B981');

    g.selectAll('.class-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'class-bar')
      .attr('x', (d) => x(d.classe) || 0)
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('rx', 4)
      .attr('fill', 'url(#class-bar-grad)')
      .transition()
      .duration(800)
      .delay((_d, i) => i * 80)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => y(d.taux))
      .attr('height', (d) => height - y(d.taux));

    // Value Labels on top of bars
    g.selectAll('.class-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'class-label')
      .attr('x', (d) => (x(d.classe) || 0) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.taux) - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('font-family', 'var(--font-mono)')
      .attr('fill', 'var(--ink)')
      .text((d) => `${d.taux}%`);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-muted)' }}>
        Aucune donnée de classe disponible.
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', overflowX: 'auto' }}>
      <svg ref={svgRef} style={{ display: 'block', maxWidth: '100%' }} />
    </div>
  );
}
