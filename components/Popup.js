const e = React.createElement;

class Popup extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      gotMidiAccess: null,
      inputs: [{}], // @todo rename to midiInputs
      selectedInputId: null // @todo rename to selectedMidiInput
    };

    this.handleInputChange = this.handleInputChange.bind(this);

    storage
      .get([ 'gotMidiAccess', 'inputs', 'selectedInputId' ])
      .then(({ gotMidiAccess, inputs, selectedInputId }) => {
        console.log('Got MIDI access:', gotMidiAccess);

        inputs.unshift({});

        this.setState({
          gotMidiAccess,
          inputs,
          selectedInputId
        });
      });
  }

  handleInputChange(event) {
    const selectedInputId = event.target.value;

    storage
      .set({ selectedInputId })
      .then(() => this.setState({ selectedInputId }));
  }

  render() {
    return e(
      'div',
      null,
      [
        e(
          'h1',
          { id: 'celestial' },
          'Celestial'
        ),
        e(
          'div',
          { id: 'settings' },
          [
            e(
              'label',
              { for: 'midi-input' },
              'MIDI Input'
            ),
            e(
              'select',
              {
                id: 'midi-input',
                value: this.state.selectedInputId,
                onChange: this.handleInputChange
              },
              this.state.inputs.map(({ id, name, manufacturer }) => e(
                'option',
                { value: id },
                id ? `${name} by ${manufacturer}` : 'None'
              ))
            )
          ]
        ),
        // e(
        //   'div',
        //   { id: 'status' },
        //   [
        //     e(
        //       'canvas',
        //       { id: 'midi-events' }
        //     )
        //   ]
        // )
      ]
    );
  }
}
