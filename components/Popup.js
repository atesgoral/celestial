const EVENT_DECAY = 1000;

class Popup extends React.Component {
  // @todo cleanup on component unmount?
  // probably not needed since page gets destroyed

  constructor(props) {
    super(props);

    this.state = {
      gotMidiAccess: null,
      inputs: [], // @todo rename to midiInputs
      selectedInputId: '', // @todo rename to midiInputId,
      channels: Array(16).fill().map((_, idx) => ({
        id: idx.toString(),
        number: idx + 1,
        ledPort: `midi-channel-${idx}-activity`
      })),
      activeChannelId: '0'
    };

    this.midiNotes = [];
    this.lastMidiEventTimeStampDelta = null;

    this.channelTabs = React.createRef();

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleActiveChannelTabChange = this.handleActiveChannelTabChange.bind(this);

    storage
      .get([ 'gotMidiAccess', 'inputs', 'selectedInputId', 'activeChannelId' ])
      .then(({ gotMidiAccess, inputs, selectedInputId, activeChannelId }) => {
        console.log('Got MIDI access:', gotMidiAccess);

        this.setState({
          gotMidiAccess,
          inputs,
          selectedInputId,
          activeChannelId
        });

        this.channelTabs.current.setActiveTabId(activeChannelId);
      });

    storage.subscribe(({ inputs }) => {
      if (inputs) {
        this.setState({
          inputs: inputs.newValue
        });
      }
    });

    const port = chrome.runtime.connect({ name: 'midi-activity' });

    port.onMessage.addListener((message) => {
      switch (message.type) {
      case 'notes':
        const {midiNotes, lastMidiEventTimeStamp} = message.data;
        this.midiNotes = midiNotes;
        this.lastMidiEventTimeStampDelta = performance.now() - lastMidiEventTimeStamp;
        break;
      case 'midi':
        const { channel, timeStamp } = message.data;

        Led.ports.write(
          `midi-channel-${channel}-activity`,
          { color: Led.colors.green, ts: performance.now() } // @todo use timeStamp
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

    const midiInputOptions = this.state.inputs.map(({ id, name, manufacturer }) => e(
      'option',
      {
        value: id,
        key: id
      },
      `${name} by ${manufacturer}`
    ));

    midiInputOptions.unshift(e(
      'option',
      {
        value: '',
        key: ''
      },
      'None'
    ));

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
              midiInputOptions
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
                    ),
                    e(
                      Graph,
                      {
                        key: 'sin-graph',
                        series: [{
                          fn: (x) => {
                            //return Math.sin(x * Math.PI * 2);
                            const note = this.midiNotes[x * 128 | 0];

                            if (!note) {
                              return 0;
                            }

                            if (note.isOn) {
                              return note.onVelocity / 128;
                            } else {
                              if (note.onVelocity) {
                                const offAge = performance.now() - this.lastMidiEventTimeStampDelta - note.offTimeStamp;
                                const multiplier = 1 - Math.min(EVENT_DECAY, offAge) / EVENT_DECAY;
                                return note.onVelocity / 128 * multiplier;
                              } else {
                                return 0;
                              }
                            }
                            // const velocity = note.velocity / 128;

                            // if (note.offTimeStamp) {
                            //   const NOTE_DECAY = 10000;

                            //   const note_age = performance.now() - this.lastMidiEventTimeStampDelta - note.offTimeStamp;
                            //   const multiplier = 1 - Math.min(NOTE_DECAY, note_age) / NOTE_DECAY;
                            //   return velocity * multiplier;
                            // } else {
                            //   return velocity;
                            // }
                          }
                        }]
                      }
                    ),
                    e(
                      Graph,
                      {
                        key: 'cos-graph',
                        series: [{
                          fn: (x) => Math.cos(x * Math.PI * 2)
                        }]
                      }
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
