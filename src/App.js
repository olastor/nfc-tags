import { useState, useCallback } from 'react'
import './App.css';

const FORMAT_VERSION = 'v1'
const COLORS = [
  '#cc3300',
  '#ff9966',
  '#ffcc00',
  '#99cc33',
  '#339900',
  '#BFD7EA'
]

const formatNote = (note) => `${FORMAT_VERSION};${note?.color};${note.text}`
const parseNote = rawText => {
  if (rawText.startsWith(FORMAT_VERSION)) {
    const [version, color] = rawText.split(';', 2)
    const text = rawText.slice(version.length + color.length + 2)
    return { color, text }
  }
}



function App() {
  const [notes, setNotes] = useState([])
  const [selectedColor, setSelectedColor] = useState(COLORS[COLORS.length - 1])
  const [chosenText, setChosenText] = useState('')

  const writeTag = useCallback(async () => {
    if (!notes && !notes.length) return
    const ndef = new window.NDEFReader();
    await ndef.write({
      records: notes.map(note => ({
        recordType: 'text',
        data: formatNote(note)
      }))
  })}, [notes,setNotes])

  const addNote = e => {
    if (e) e.preventDefault()
    setNotes([...notes, { color: selectedColor, text: chosenText }])
  }
const readTag = useCallback(async (
) => {
  try {
    const ndef = new window.NDEFReader();
    await ndef.scan();

    setNotes([])

    ndef.addEventListener("readingerror", () => {
      console.log('error')
    });

    ndef.addEventListener("reading", ({ message, serialNumber }) => {
      message.records
        .filter(record => record.recordType === 'text')
        .forEach(record => {
          const textDecoder = new TextDecoder(record.encoding);
          alert(JSON.stringify(parseNote(textDecoder.decode(record.data))))
          setNotes([...notes, parseNote(textDecoder.decode(record.data))])
        })
    });
  } catch (error) {
    alert(error.message)
  }
}, [notes, setNotes])

  return (
    <div className="App">
      <button onClick={() => readTag()}>Read</button>
      <button onClick={() => writeTag()}>Write</button>
      <form onSubmit={addNote}>
        {COLORS.map(color => <div onClick={() => setSelectedColor(color)} style={{ backgroundColor: color }} className={`predefined-color${color === selectedColor ? ' selected-color' : ''}`}></div>)}
        <input type="text" onChange={e => setChosenText(e.target.value)} />
        <button type="submit">add note</button>
      </form>
      {notes && notes.map((note, i) => <div key={`note-display-${i}`}>
        <div style={{ backgroundColor: note?.color }} className='note-color'></div>
        <div>{note?.text}</div>
      </div>)}
    </div>
  );
}

export default App;
