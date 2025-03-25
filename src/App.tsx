import { useEffect, useState } from "react";
import { textToMetadata } from "./textToMetadata";

const initialValue = `compact`;

function App() {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    try {
      console.log(textToMetadata(value));
    } catch (ex) {
      console.error(ex);
    }
  }, [value]);

  return (
    <>
      <textarea value={value} onChange={(evt) => setValue(evt.target.value)} />
    </>
  );
}

export default App;
