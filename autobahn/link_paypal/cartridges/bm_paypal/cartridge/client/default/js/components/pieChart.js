'use strict';

const PI = Math.PI;
const namespaceURI = 'http://www.w3.org/2000/svg';

/**
 * Creates a new Pie Chart
 * @class
 */
class PieChart {
    /**
     * @param {SVGElement} element - SVG element
     * @param {Array} data - Chart data (value, color, legend label)
     */
    constructor(element, data) {
        this.data = data;
        this.svg = element;

        this.offset = 7;
        this.rectSize = 15;
    }

    /**
     * Render chart
     */
    render() {
        if (!this.svg || !this.data.length) {
            return;
        }

        this.chartPosition();

        this.addArcs();
        this.addLegend();
    }

    /**
     * Calculate chart position
     */
    chartPosition() {
        this.svg.innerHTML = '';

        this.width = parseInt(this.svg.getAttribute('width'));
        this.height = parseInt(this.svg.getAttribute('height'));

        const legendHeight = this.data.length * (this.rectSize + this.offset) - this.offset;

        if (legendHeight > this.height) {
            this.svg.setAttribute('height', legendHeight);
            this.height = legendHeight;
        }

        this.radius = Math.round(Math.min(this.width / 2, this.height) / 2.25);
        this.centerX = this.radius;
        this.centerY = this.height / 2;

        this.chartGroup = document.createElementNS(namespaceURI, 'g');

        this.chartGroup.setAttribute('transform', `translate(${this.centerX},${this.centerY})`);

        this.svg.appendChild(this.chartGroup);
    }

    /**
     * Add a sector to a chart
     */
    addArcs() {
        let startAngle = 0;

        const radius = this.radius;

        if (this.data.length === 1) {
            const circle = document.createElementNS(namespaceURI, 'circle');

            circle.setAttribute('cx', 0);
            circle.setAttribute('cy', 0);
            circle.setAttribute('r', radius);
            circle.setAttribute('fill', this.data[0].color);

            this.chartGroup.appendChild(circle);

            return;
        }

        this.data.forEach(item => {
            const endAngle = startAngle + (item.count / this.data.reduce((total, d) => total + d.count, 0) * 360);

            const startX = radius * Math.cos((startAngle - 90) * (PI / 180));
            const startY = radius * Math.sin((startAngle - 90) * (PI / 180));
            const endX = radius * Math.cos((endAngle - 90) * (PI / 180));
            const endY = radius * Math.sin((endAngle - 90) * (PI / 180));

            const path = document.createElementNS(namespaceURI, 'path');

            const pathValue = `M ${startX},${startY} A ${radius},${radius} 0 ${(endAngle - startAngle > 180) ? 1 : 0},1 ${endX},${endY} L 0,0 Z`;

            path.setAttribute('d', pathValue);
            path.setAttribute('fill', item.color);

            this.chartGroup.appendChild(path);

            startAngle = endAngle;
        });
    }

    /**
     * Add legend
     */
    addLegend() {
        const textSpaceY = 12;
        const offset = this.rectSize + this.offset;
        const legendX = this.centerX + this.radius + this.rectSize;

        let legendY = (this.height - this.data.length * offset) / 2;

        if (legendY < 0) {
            legendY = 0;
        }

        this.data.forEach(item => {
            const legendRect = document.createElementNS(namespaceURI, 'rect');

            legendRect.setAttribute('x', legendX);
            legendRect.setAttribute('y', legendY);
            legendRect.setAttribute('width', this.rectSize);
            legendRect.setAttribute('height', this.rectSize);
            legendRect.setAttribute('fill', item.color);

            const legendText = document.createElementNS(namespaceURI, 'text');

            legendText.setAttribute('x', legendX + offset);
            legendText.setAttribute('y', legendY + textSpaceY);
            legendText.setAttribute('font-weight', '400');
            legendText.textContent = `${item.label} (${item.count})`;

            if (item.textColor) {
                legendText.setAttribute('fill', item.textColor);
            }

            this.svg.appendChild(legendRect);
            this.svg.appendChild(legendText);

            legendY += offset;
        });
    }

    /**
     * Get chart data from element
     * @param {SVGAElement} element - SVG DOM element
     * @param {Object} colors - Colors data
     * @returns {Array} - Chart data (value, color, legend label)
     */
    static #getChartData(element, colors) {
        const stats = JSON.parse(element.dataset.stats);

        return Object.values(stats)
            .reduce((accum, item) => {
                accum.push(Object.assign(item, colors[item.value]));

                return accum;
            }, [])
            .sort((prev, next) => prev.label > next.label ? 1 : -1);
    }

    /**
     * Init Pie Chart
     * @param {SVGElement} element - SVG element
     * @param {Array} colors - Colors, format example { key: { color: '#d46a6a' }, ... }
     */
    static init(element, colors) {
        if (!(element && element instanceof SVGElement)) {
            return;
        }

        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-stats') {
                    new PieChart(mutation.target, this.#getChartData(mutation.target, colors)).render();
                }
            });
        });

        new PieChart(element, this.#getChartData(element, colors)).render();

        observer.observe(element, { attributes: true });
    }
}

module.exports = PieChart;
