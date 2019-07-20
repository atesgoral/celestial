class Popup extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      gotMidiAccess: null,
      inputs: [{ id: '' }], // @todo rename to midiInputs
      selectedInputId: '', // @todo rename to midiInputId,
      channels: Array(16).fill().map((_, idx) => ({
        id: idx.toString(),
        number: idx + 1,
        ledPort: `midi-channel-${idx}-activity`
      })),
      activeChannelId: '0'
    };

    this.channelTabs = React.createRef();

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleActiveChannelTabChange = this.handleActiveChannelTabChange.bind(this);

    storage
      .get([ 'gotMidiAccess', 'inputs', 'selectedInputId', 'activeChannelId' ])
      .then(({ gotMidiAccess, inputs, selectedInputId, activeChannelId }) => {
        console.log('Got MIDI access:', gotMidiAccess);

        inputs.unshift({ id: '' });

        this.setState({
          gotMidiAccess,
          inputs,
          selectedInputId,
          activeChannelId
        });

        this.channelTabs.current.setActiveTabId(activeChannelId);
      });

    chrome.runtime.onMessage.addListener((message) => {
      switch (message.type) {
      case 'midi':
        const { channel, timeStamp } = message.data;

        Led.ports.write(
          `midi-channel-${channel}-activity`,
          { color: Led.colors.green, ts: performance.now() }
        );
        break;
      }
    });
  }

  handleInputChange(event) {
    const selectedInputId = event.target.value;

    storage
      .set({ selectedInputId })
      .then(() => this.setState({ selectedInputId }));
  }

  handleActiveChannelTabChange(activeChannelId) {
    storage
      .set({ activeChannelId })
      .then(() => this.setState({ activeChannelId }));
  }

  render() {
    const e = React.createElement;

    return e(
      'div',
      null,
      [
        e(
          'h1',
          { key: 'celestial-title' },
          'Celestial'
        ),
        e(
          'form',
          { key: 'settings' },
          [
            e(
              'label',
              {
                key: 'midi-input-label',
                htmlFor: 'midi-input'
              },
              'MIDI Input'
            ),
            e(
              'select',
              {
                key: 'midi-input',
                id: 'midi-input',
                value: this.state.selectedInputId,
                onChange: this.handleInputChange
              },
              this.state.inputs.map(({ id, name, manufacturer }) => e(
                'option',
                {
                  value: id,
                  key: id
                },
                id ? `${name} by ${manufacturer}` : 'None'
              ))
            )
          ]
        ),
        e(
          'div',
          {
            key: 'channels',
            className: 'card'
          },
          [
            e(
              'h2',
              { key: 'channels-title' },
              'Channels'
            ),
            e(
              Tabs,
              {
                key: 'channel-tabs',
                ref: this.channelTabs,
                tabs: this.state.channels.map(({ id, number, ledPort }) => ({
                  id,
                  title: number,
                  ledPort
                })),
                activeTabId: this.state.activeChannelId,
                onActiveTabChange: this.handleActiveChannelTabChange
              }
            ),
            e(
              'div',
              {
                key: 'channel-tab',
                className: 'tab-content'
              },
              [
                e(
                  'form',
                  { key: 'channel-settings' },
                  [
                    e(
                      'h3',
                      { key: 'channel-title' },
                      `Channel ${this.state.channels[this.state.activeChannelId].number}`
                    )
                  ]
                )
              ]
            )
          ]
        )
      ]
    );
  }
}
