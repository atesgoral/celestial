class Tabs extends React.Component {
  constructor(props) {
    super(props);

    const { activeTabId } = this.props;

    this.handleClick = this.handleClick.bind(this);

    this.state = { activeTabId };
  }

  handleClick(event) {
    const activeTabId = event.target.dataset.id;

    this.setState({ activeTabId });

    if (this.props.onActiveTabChange) {
      this.props.onActiveTabChange(activeTabId);
    }
  }

  setActiveTabId(activeTabId) {
    this.setState({ activeTabId });
  }

  render() {
    const e = React.createElement;

    return e(
      'div',
      { className: 'tabs' },
      this.props.tabs.map(({ id, title }) => e(
        'button',
        {
          type: 'button',
          key: id,
          'data-id': id,
          'data-active': id === this.state.activeTabId,
          onClick: this.handleClick
        },
        title
      ))
    );
  }
}
