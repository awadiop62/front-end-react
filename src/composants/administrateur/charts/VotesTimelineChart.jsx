import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function VotesTimelineChart({ data = [] }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const parentWidth = containerRef.current?.clientWidth || 550;
    const margin = { top: 20, right: 30, bottom: 40, left: 45 };
    const width = Math.max(300, parentWidth) - margin.left - margin.right;
    const height = 220 - margin.top - margin.bottom;

    svg.attr('width', parentWidth).attr('height', 220);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Parse dates
    const parsedData = data.map((d) => ({
      date: new Date(d.time),
      count: d.count,
      cumulative: d.cumulative,
    }));

    const x = d3
      .scaleTime()
      .domain(d3.extent(parsedData, (d) => d.date) || [new Date(), new Date()])
      .range([0, width]);

    const maxCumulative = d3.max(parsedData, (d) => d.cumulative) || 1;
    const y = d3.scaleLinear().domain([0, maxCumulative * 1.15]).range([height, 0]);

    // Area Gradient
    const defs = svg.append('defs');
    const areaGrad = defs
      .append('linearGradient')
      .attr('id', 'timeline-area-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGrad.append('stop').attr('offset', '0%').attr('stop-color', '#00A0E8').attr('stop-opacity', 0.4);
    areaGrad.append('stop').attr('offset', '100%').attr('stop-color', '#00A0E8').attr('stop-opacity', 0.02);

    // X Axis
    const xAxis = d3
      .axisBottom(x)
      .ticks(Math.min(6, parsedData.length))
      .tickFormat((d) => d3.timeFormat('%H:%M')(new Date(d)));

    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)
      .attr('color', 'var(--ink-muted)')
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('font-family', 'var(--font-mono)');

    // Y Axis
    const yAxis = d3.axisLeft(y).ticks(4).tickFormat(d3.format('d'));
    g.append('g')
      .call(yAxis)
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
          .ticks(4)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .attr('stroke', 'var(--border)')
      .attr('stroke-opacity', 0.4)
      .select('.domain')
      .remove();

    // Area generator
    const area = d3
      .area()
      .curve(d3.curveMonotoneX)
      .x((d) => x(d.date))
      .y0(height)
      .y1((d) => y(d.cumulative));

    g.append('path')
      .datum(parsedData)
      .attr('fill', 'url(#timeline-area-grad)')
      .attr('d', area);

    // Line generator
    const line = d3
      .line()
      .curve(d3.curveMonotoneX)
      .x((d) => x(d.date))
      .y((d) => y(d.cumulative));

    const path = g
      .append('path')
      .datum(parsedData)
      .attr('fill', 'none')
      .attr('stroke', '#00A0E8')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Animate line draw
    const node = path.node();
    const totalLength = node ? node.getTotalLength() : 300;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Data points circles
    g.selectAll('.timeline-dot')
      .data(parsedData)
      .enter()
      .append('circle')
      .attr('class', 'timeline-dot')
      .attr('cx', (d) => x(d.date))
      .attr('cy', (d) => y(d.cumulative))
      .attr('r', 4)
      .attr('fill', '#FFFFFF')
      .attr('stroke', '#00A0E8')
      .attr('stroke-width', 2);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-muted)' }}>
        Aucune activité enregistrée sur l'urne pour le moment.
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', overflowX: 'auto' }}>
      <svg ref={svgRef} style={{ display: 'block', maxWidth: '100%' }} />
    </div>
  );
}
