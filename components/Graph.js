class Graph extends React.Component {
  constructor(props) {
    super(props);

    this.canvas = React.createRef();
  }

  componentDidMount() {
    const canvas = this.canvas.current;
    const dpr = window.devicePixelRatio;

    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;

    const ctx = canvas.getContext('2d');

    ctx.scale(canvas.height, canvas.height / -2);
    ctx.translate(0, -1);
    ctx.lineWidth = 1 / canvas.height;

    const draw = (t) => {
      const canvas = this.canvas.current;

      if (canvas === null) {
        return;
      }

      requestAnimationFrame(draw);

      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, -1, canvas.width / canvas.height, 2);

      ctx.strokeStyle = '#ccc';

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvas.width / canvas.height, 0);
      ctx.stroke();

      const SUBDIVISIONS = 100;

      const series = this.props.series[0];

      ctx.strokeStyle = '#fff';
      ctx.beginPath();

      for (let i = 0; i <= SUBDIVISIONS; i++) {
        const x = i / SUBDIVISIONS;
        const y = series.fn(x);
        ctx.lineTo(x * canvas.width / canvas.height, y * 0.8);
      }

      ctx.stroke();
    };

    requestAnimationFrame(draw);
  }

  render() {
    const e = React.createElement;

    return e(
      'canvas',
      {
        ref: this.canvas,
        className: 'graph'
      }
    );
  }
}
