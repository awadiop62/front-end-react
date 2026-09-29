import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function ProjectVotesBarChart({ data = [] }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const parentWidth = containerRef.current?.clientWidth || 500;
    const margin = { top: 20, right: 60, bottom: 20, left: 140 };
    const width = Math.max(300, parentWidth) - margin.left - margin.right;
    const barHeight = 36;
    const height = data.length * (barHeight + 14) + margin.top + margin.bottom;

    svg.attr('width', parentWidth).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const maxVoix = d3.max(data, (d) => d.voix) || 1;

    const x = d3.scaleLinear().domain([0, maxVoix * 1.15]).range([0, width]);

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.nom))
      .range([0, data.length * (barHeight + 14)])
      .padding(0.25);

    // Color gradient
    const defs = svg.append('defs');
    data.forEach((d, i) => {
      const grad = defs
        .append('linearGradient')
        .attr('id', `bar-grad-${i}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');

      grad.append('stop').attr('offset', '0%').attr('stop-color', '#00A0E8');
      grad.append('stop').attr('offset', '100%').attr('stop-color', '#10B981');
    });

    // Background track bars
    g.selectAll('.track-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'track-bar')
      .attr('y', (d) => y(d.nom))
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('width', width)
      .attr('rx', 6)
      .attr('fill', 'var(--bg-subtle)')
      .attr('stroke', 'var(--border)')
      .attr('stroke-width', 1);

    // Animated Value bars
    g.selectAll('.value-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'value-bar')
      .attr('y', (d) => y(d.nom))
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('rx', 6)
      .attr('fill', (_d, i) => `url(#bar-grad-${i})`)
      .attr('width', 0)
      .transition()
      .duration(900)
      .delay((_d, i) => i * 100)
      .ease(d3.easeCubicOut)
      .attr('width', (d) => Math.max(8, x(d.voix)));

    // Project Name Labels (Y axis)
    g.selectAll('.project-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'project-label')
      .attr('x', -12)
      .attr('y', (d) => (y(d.nom) || 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', '13px')
      .attr('font-weight', '600')
      .attr('font-family', 'var(--font-sans)')
      .attr('fill', 'var(--ink)')
      .text((d) => {
        const str = d.nom || '';
        return str.length > 16 ? str.substring(0, 15) + '…' : str;
      });

    // Votes & Percentage Labels (End of bars)
    g.selectAll('.score-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'score-label')
      .attr('x', (d) => Math.min(width + 8, Math.max(16, x(d.voix) + 8)))
      .attr('y', (d) => (y(d.nom) || 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .attr('font-weight', '700')
      .attr('font-family', 'var(--font-mono)')
      .attr('fill', 'var(--ink)')
      .text((d) => `${d.voix} voix (${d.pourcentage}%)`);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-muted)' }}>
        Aucun vote enregistré pour le moment.
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', overflowX: 'auto' }}>
      <svg ref={svgRef} style={{ display: 'block', maxWidth: '100%' }} />
    </div>
  );
}
