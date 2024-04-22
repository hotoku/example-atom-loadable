import { Suspense, useEffect } from "react";
import { getRoot } from "./model2";
import { rootAtom } from "./atoms";
import { useAtom, useAtomValue } from "jotai";
import { Loadable } from "./loadable";
import { sleep } from "./api";

function Root(): JSX.Element {
  const root = useAtomValue(rootAtom)?.getOrThrow();
  return <div>Root</div>;
}

export function App(): JSX.Element {
  const [root, setRoot] = useAtom(rootAtom);
  useEffect(() => {
    sleep(1).then(() => setRoot(new Loadable(getRoot())));
  }, [setRoot]);

  return (
    <>
      <h1>todree</h1>
      {root ? (
        <Suspense fallback={<div>loading</div>}>
          <Root />
        </Suspense>
      ) : (
        <div>before loading</div>
      )}
    </>
  );
}

export default App;
