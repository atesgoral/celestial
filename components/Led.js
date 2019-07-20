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
      const canvas = this.canvas.current;

      if (canvas === null) {
        return;
      }

      requestAnimationFrame(draw);

      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = Math.random() < 0.5 ? 'red' : 'green';
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
        className: 'led',
        id: this.props.id
      }
    );
  }
}
