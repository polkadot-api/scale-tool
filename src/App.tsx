import { useEffect, useMemo, useRef, useState } from "react";
import { textToMetadata } from "./textToMetadata";
import { V15 } from "@polkadot-api/substrate-bindings";
import {
  CodecComponentType,
  CodecComponentValue,
} from "@polkadot-api/react-builder";
import { BinaryDisplay } from "./codec-components/LookupTypeEdit";
import {
  getDynamicBuilder,
  getLookupFn,
  MetadataLookup,
} from "@polkadot-api/metadata-builders";
import { EditCodec } from "./codec-components/EditCodec";

const initialValue = `compact`;
const initialComponentValue: CodecComponentValue = {
  type: CodecComponentType.Initial,
  value: "",
};

function App() {
  const [value, setValue] = useState(initialValue);
  const [lookup, setLookup] = useState<MetadataLookup | null>(null);
  const [error, setError] = useState("");

  const lastDecodedValue = useRef<any>(null);
  const [componentValue, setComponentValue] = useState<CodecComponentValue>(
    initialComponentValue
  );

  useEffect(() => {
    if (componentValue.type === "Updated" && !componentValue.value.empty) {
      lastDecodedValue.current = componentValue.value.decoded;
    }
  }, [componentValue]);

  useEffect(() => {
    try {
      const lookup = getLookupFn(textToMetadata(value));
      setLookup(() => lookup);
      setError("");

      const codec = getDynamicBuilder(lookup).buildDefinition(0);
      try {
        setComponentValue({
          type: "Initial",
          value: codec.enc(lastDecodedValue.current),
        });
        return;
      } catch (ex) {
        console.log(lastDecodedValue.current, ex);
        setComponentValue(initialComponentValue);
      }
    } catch (ex: any) {
      setError(ex.message);
      console.error(ex);
    }
  }, [value]);

  const dynamicBuilder = useMemo(
    () => (lookup ? getDynamicBuilder(lookup) : null),
    [lookup]
  );

  return (
    <>
      <textarea
        className="border rounded p-2 w-full"
        value={value}
        onChange={(evt) => setValue(evt.target.value)}
      />
      {error ? <div className="text-destructive">{error}</div> : null}

      {lookup ? (
        <div>
          <BinaryDisplay
            metadata={lookup.metadata}
            codec={dynamicBuilder!.buildDefinition(0)}
            codecType={0}
            value={componentValue}
            onUpdate={(value) =>
              setComponentValue({ type: CodecComponentType.Updated, value })
            }
          />
          <EditCodec
            metadata={lookup.metadata}
            codecType={0}
            value={componentValue}
            onUpdate={(value) =>
              setComponentValue({ type: CodecComponentType.Updated, value })
            }
          />
        </div>
      ) : null}
    </>
  );
}

export default App;
