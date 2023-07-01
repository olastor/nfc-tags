import './App.css';

const FORMAT_VERSION = 'v1'

const COLORS = [
  '#cc3300',
  '#ff9966',
  '#ffcc00',
  '#99cc33',
  '#339900'
]

const readTag = async (
  onData,
  onError
) => {
  try {
    const ndef = new window.NDEFReader();
    await ndef.scan();

    ndef.addEventListener("readingerror", () => {
      console.log('error')
    });

    ndef.addEventListener("reading", ({ message, serialNumber }) => {
      message.records
        .filter(record => record.recordType === 'text')
        .forEach(record => {
          const textDecoder = new TextDecoder(record.encoding);
          alert(`Text: ${textDecoder.decode(record.data)} (${record.lang})`);
        })
    });
  } catch (error) {
    alert(error.message)
  }
}




function App() {

  const writeTag = async () => {
    const ndef = new window.NDEFReader();
    await ndef.write({
    records: [
      {
        recordType: "text", data: "Testing123"
      }
    ]
  });
  }
  return (
    <div className="App">
      <button onClick={() => readTag()}>Read</button>
      <button onClick={() => writeTag()}>Write</button>
    </div>
  );
}

export default App;
