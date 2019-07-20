const signals = {};

const ports = {
  write(port, signal) {
    signals[port] = signal;
  },
  read(port) {
    return signals[port];
  }
};

class Led extends React.Component {
  constructor(props) {
    super(props);

    this.canvas = React.createRef();
  }

  componentDidMount() {
    const canvas = this.canvas.current;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const draw = (t) => {
      const MAX_SIGNAL_AGE = 1000;
      const canvas = this.canvas.current;

      if (canvas === null) {
        return;
      }

      requestAnimationFrame(draw);

      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const signal = ports.read(this.props.port);

      if (!signal) {
        return;
      }

      // @todo make signal interpreation customizable?

      const signalAge = performance.now() - signal.ts;
      const opacity = 1 - Math.min(signalAge, MAX_SIGNAL_AGE) / MAX_SIGNAL_AGE;

      ctx.fillStyle = `rgba(${signal.color},${opacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    requestAnimationFrame(draw);
  }

  render() {
    const e = React.createElement;

    return e(
      'canvas',
      {
        ref: this.canvas,
        className: 'led'
      }
    );
  }
}

Led.ports = ports;

Led.colors = {
  green: [153, 255, 51]
};
